import os
import sys
from pathlib import Path

from sqlalchemy import inspect, text

# Allow running this file directly (`python App/app.py`) as well as
# `python -m App.app`. When invoked as a script, the project root is not on
# sys.path, so `from App.X` would fail — add it explicitly.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ModuleNotFoundError:
    pass

from App.config import build_config
from App.extensions import db
from App.routes.api_bookings import api_bookings_bp
from App.routes.api_desks import api_desks_bp
from App.routes.api_weather import api_weather_bp
from App.routes.api_users import api_users_bp
from App.routes.auth import auth_bp
from App.routes.pages import pages_bp


def create_app():
    app = Flask(__name__)
    app.config.update(build_config())
    app.secret_key = app.config["SECRET_KEY"]

    db.init_app(app)
    with app.app_context():
        db.create_all()
        _ensure_users_schema()
        _ensure_bookings_schema()

    _init_azure_auth(app)

    for bp in (pages_bp, auth_bp, api_users_bp, api_desks_bp, api_bookings_bp, api_weather_bp):
        app.register_blueprint(bp)

    return app


def _ensure_users_schema():
    users_engine = db.engines.get("users")
    if users_engine is None:
        return

    columns = {col["name"] for col in inspect(users_engine).get_columns("app_users")}
    if "anchor_days" in columns:
        return

    # Backward-compatible schema patch for existing databases.
    with users_engine.begin() as conn:
        conn.execute(text("ALTER TABLE app_users ADD COLUMN anchor_days JSON"))


def _ensure_bookings_schema():
    engine = db.engine
    inspector = inspect(engine)
    if "bookings" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("bookings")}

    with engine.begin() as conn:
        if "slot" not in columns:
            conn.execute(text(
                "ALTER TABLE bookings ADD COLUMN slot VARCHAR(8) NOT NULL DEFAULT 'full'"
            ))

        # SQLite bakes inline UNIQUE constraints into the CREATE TABLE statement —
        # they can't be dropped via DROP INDEX. Detect the legacy 2-column constraint
        # and rebuild the table without it.
        create_sql = conn.execute(text(
            "SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'"
        )).scalar() or ""
        has_legacy_unique = (
            "UNIQUE (desk_id, date)" in create_sql.replace("\n", " ").replace("\t", " ")
            and "uq_booking_desk_date_slot" not in create_sql
        )
        if has_legacy_unique:
            conn.execute(text("ALTER TABLE bookings RENAME TO bookings_old"))
            conn.execute(text(
                "CREATE TABLE bookings ("
                "id INTEGER NOT NULL PRIMARY KEY, "
                "desk_id VARCHAR(16) NOT NULL, "
                "date DATE NOT NULL, "
                "slot VARCHAR(8) NOT NULL DEFAULT 'full', "
                "user_email VARCHAR(255) NOT NULL, "
                "user_name VARCHAR(255) NOT NULL, "
                "source VARCHAR(32) NOT NULL, "
                "created_at DATETIME NOT NULL, "
                "FOREIGN KEY(desk_id) REFERENCES desks(id)"
                ")"
            ))
            conn.execute(text(
                "INSERT INTO bookings (id, desk_id, date, slot, user_email, user_name, source, created_at) "
                "SELECT id, desk_id, date, slot, user_email, user_name, source, created_at "
                "FROM bookings_old"
            ))
            conn.execute(text("DROP TABLE bookings_old"))
            conn.execute(text("CREATE INDEX ix_bookings_desk_id ON bookings(desk_id)"))
            conn.execute(text("CREATE INDEX ix_bookings_date ON bookings(date)"))
            conn.execute(text("CREATE INDEX ix_bookings_user_email ON bookings(user_email)"))
            conn.execute(text("CREATE INDEX ix_bookings_slot ON bookings(slot)"))

        index_names = {
            r[0] for r in conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='bookings'"
            ))
        }
        if "uq_booking_desk_date" in index_names:
            conn.execute(text("DROP INDEX uq_booking_desk_date"))
        if "uq_booking_desk_date_slot" not in index_names:
            conn.execute(text(
                "CREATE UNIQUE INDEX uq_booking_desk_date_slot "
                "ON bookings(desk_id, date, slot)"
            ))


def _init_azure_auth(app):
    try:
        from App.Auth.Auth import AzureOAuthHelper
        app.extensions["azure_auth"] = AzureOAuthHelper()
    except (ImportError, ValueError) as exc:
        app.logger.warning("Azure OAuth disabled: %s", exc)
        app.extensions["azure_auth"] = None


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5001")),
        debug=os.getenv("FLASK_DEBUG") == "1",
    )
