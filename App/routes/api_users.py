from flask import Blueprint, jsonify, request, session

from App.extensions import db
from App.models import AppUser
from App.services.desks import get_allowed_preference_options
from App.services.users import get_effective_user, get_or_create_effective_db_user

api_users_bp = Blueprint("api_users", __name__, url_prefix="/api")
VALID_ANCHOR_DAYS = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"}


@api_users_bp.get("/me")
def me():
    active_user = get_effective_user()
    return jsonify(
        {
            "authenticated": active_user["source"] == "oauth",
            "user": active_user,
        }
    )


@api_users_bp.get("/users")
def users_list():
    users = AppUser.query.order_by(AppUser.full_name).all()
    return jsonify([user.to_api() for user in users])


@api_users_bp.post("/switch-user")
def switch_user():
    payload = request.get_json(silent=True) or {}
    raw_email = payload.get("email")
    email = str(raw_email or "").strip().lower()
    if not email:
        return jsonify({"error": "email is required"}), 400

    user = AppUser.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"error": "Unknown user email"}), 404

    session["user"] = {
        "name": user.full_name,
        "email": user.email,
        "source": "demo-switch",
    }

    return jsonify(
        {
            "ok": True,
            "user": {
                "name": user.full_name,
                "email": user.email,
                "source": "demo-switch",
            },
        }
    )


@api_users_bp.get("/user-settings")
def user_settings_get():
    db_user = get_or_create_effective_db_user(get_effective_user())
    if db_user is None:
        return jsonify({"deskPreferences": [], "preferredUsers": [], "anchorDays": []})

    allowed_preferences = get_allowed_preference_options()
    normalized_prefs = [
        str(entry).strip().lower()
        for entry in (db_user.desk_preferences or [])
        if str(entry).strip().lower() in allowed_preferences
    ]

    return jsonify(
        {
            "deskPreferences": normalized_prefs,
            "preferredUsers": db_user.preferred_users or [],
            "anchorDays": db_user.anchor_days or [],
        }
    )


@api_users_bp.get("/user-settings/options")
def user_settings_options():
    return jsonify({"deskPreferences": sorted(get_allowed_preference_options())})


@api_users_bp.put("/user-settings")
def user_settings_save():
    db_user = get_or_create_effective_db_user(get_effective_user())
    if db_user is None:
        return jsonify({"error": "No active user"}), 400

    payload = request.get_json(silent=True) or {}
    desk_preferences = payload.get("deskPreferences", [])
    preferred_users = payload.get("preferredUsers", [])
    anchor_days = payload.get("anchorDays", [])

    if not isinstance(desk_preferences, list) or not isinstance(preferred_users, list) or not isinstance(anchor_days, list):
        return jsonify({"error": "deskPreferences, preferredUsers, and anchorDays must be arrays"}), 400

    seen_keys = set()
    ordered_entries = []
    for entry in desk_preferences:
        stripped = str(entry).strip()
        if not stripped:
            continue
        key = stripped.lower()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        ordered_entries.append((stripped, key))

    allowed_preferences = get_allowed_preference_options()
    invalid_preferences = [orig for orig, key in ordered_entries if key not in allowed_preferences]
    normalized_prefs = [key for _, key in ordered_entries if key in allowed_preferences]

    normalized_users = [
        entry for entry in dict.fromkeys(
            str(e).strip().lower() for e in preferred_users if str(e).strip()
        )
        if entry != db_user.email
    ]
    normalized_anchor_days = [
        day for day in dict.fromkeys(
            str(day).strip().lower() for day in anchor_days if str(day).strip()
        )
        if day in VALID_ANCHOR_DAYS
    ]

    db_user.desk_preferences = normalized_prefs
    db_user.preferred_users = normalized_users
    db_user.anchor_days = normalized_anchor_days
    db.session.commit()

    return jsonify(
        {
            "ok": True,
            "deskPreferences": db_user.desk_preferences,
            "preferredUsers": db_user.preferred_users,
            "anchorDays": db_user.anchor_days,
            "ignoredPreferences": invalid_preferences,
        }
    )
