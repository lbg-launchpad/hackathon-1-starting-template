import os
import secrets
from pathlib import Path

DATA_ROOT = Path(__file__).resolve().parent.parent / "data"
DATA_ROOT.mkdir(parents=True, exist_ok=True)

DEFAULT_DESK_DB_URL = f"sqlite:///{(DATA_ROOT / 'desks.db').as_posix()}"
DEFAULT_USER_DB_URL = f"sqlite:///{(DATA_ROOT / 'users.db').as_posix()}"


def _normalize_db_url(url):
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


def build_config():
    desk_url = _normalize_db_url(
        os.getenv("DESK_DATABASE_URL", os.getenv("DATABASE_URL", DEFAULT_DESK_DB_URL))
    )
    user_url = _normalize_db_url(os.getenv("USER_DATABASE_URL", DEFAULT_USER_DB_URL))

    return {
        "SECRET_KEY": os.getenv("FLASK_SECRET_KEY", secrets.token_urlsafe(32)),
        "SQLALCHEMY_DATABASE_URI": desk_url,
        "SQLALCHEMY_BINDS": {"users": user_url},
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    }
