from pathlib import Path

from flask import Blueprint, render_template, send_from_directory

pages_bp = Blueprint("pages", __name__)

_FLOORPLAN_DIR = Path(__file__).resolve().parent.parent.parent / "floorplans"


@pages_bp.get("/")
def home():
    return render_template("index.html", initial_view="bookings")


@pages_bp.get("/settings")
def settings_page():
    return render_template("index.html", initial_view="settings")


@pages_bp.get("/floorplans/<path:filename>")
def floorplan_image(filename):
    return send_from_directory(_FLOORPLAN_DIR, filename)
