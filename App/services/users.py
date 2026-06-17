from flask import session
from sqlalchemy.exc import IntegrityError

from App.extensions import db
from App.models import AppUser


def get_effective_user():
    """Return the active user — either the signed-in OAuth user or a demo stand-in."""
    signed_in_user = session.get("user")
    if signed_in_user:
        source = str(signed_in_user.get("source") or "oauth")
        return {
            "name": signed_in_user.get("name") or "Signed-in user",
            "email": signed_in_user.get("email") or "",
            "source": source,
        }

    first_user = AppUser.query.order_by(AppUser.full_name).first()
    if first_user:
        return {
            "name": first_user.full_name or "Demo User",
            "email": first_user.email or "demo@thebank.com",
            "source": "demo",
        }

    return {"name": "Demo User", "email": "demo@thebank.com", "source": "demo"}


def get_or_create_effective_db_user(active_user):
    email = (active_user.get("email") or "").strip().lower()
    if not email:
        return None

    row = AppUser.query.filter_by(email=email).first()
    if row is not None:
        return row

    row = AppUser(
        id=email,
        full_name=active_user.get("name") or "Signed-in user",
        email=email,
        team=None,
        location=None,
        preferred_neighbourhood=None,
        desk_preferences=[],
        preferred_users=[],
        anchor_days=[],
    )
    db.session.add(row)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return AppUser.query.filter_by(email=email).first()
    return row
