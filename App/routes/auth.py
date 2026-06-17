import os
import secrets

from flask import Blueprint, current_app, redirect, request, session

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def _get_auth():
    return current_app.extensions.get("azure_auth")


def _auth_disabled_response():
    return "Azure OAuth is not configured. Set AZURE_* environment variables.", 503


@auth_bp.get("/login")
def auth_login():
    auth = _get_auth()
    if auth is None:
        return _auth_disabled_response()

    state = secrets.token_urlsafe(32)
    session["oauth_state"] = state
    return redirect(auth.create_auth_url(state=state))


@auth_bp.get("/callback")
def auth_callback():
    auth = _get_auth()
    if auth is None:
        return _auth_disabled_response()

    expected_state = session.get("oauth_state")
    incoming_state = request.args.get("state")
    if not expected_state or expected_state != incoming_state:
        return "Invalid OAuth state", 400

    code = request.args.get("code")
    if not code:
        return "Missing authorization code", 400

    token_result = auth.exchange_code_for_token(code)
    session["user"] = auth.get_user_from_token(token_result)
    session.pop("oauth_state", None)
    return redirect("/")


@auth_bp.get("/logout")
def auth_logout():
    auth = _get_auth()
    session.clear()
    if auth is None:
        return redirect("/")

    post_logout_redirect = os.getenv("POST_LOGOUT_REDIRECT_URI", request.url_root.rstrip("/"))
    return redirect(auth.build_logout_url(post_logout_redirect))
