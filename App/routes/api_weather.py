import json
import os
import ssl
from datetime import date
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

import certifi
from flask import Blueprint, current_app, jsonify, request

from App.services.dates import parse_date_arg

api_weather_bp = Blueprint("api_weather", __name__, url_prefix="/api")
WEATHER_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def _build_url(raw_url, booking_date):
    if not raw_url:
        return None
    return f"{raw_url}{booking_date.isoformat()}"


def _fetch_weather(raw_url):
    safe_url = raw_url.replace(" ", "%20")
    with urlopen(safe_url, timeout=10, context=WEATHER_SSL_CONTEXT) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        payload = response.read().decode(charset)
    return json.loads(payload)


def _normalize_current(payload, booking_date):
    location = payload.get("location") or {}
    current = payload.get("current") or {}
    condition = current.get("condition") or {}
    return {
        "date": booking_date.isoformat(),
        "mode": "current",
        "location": location.get("name") or "Office",
        "condition": condition.get("text") or "Unavailable",
        "temperature": current.get("temp_c"),
        "feelsLike": current.get("feelslike_c"),
        "humidity": current.get("humidity"),
        "windKph": current.get("wind_kph"),
        "icon": condition.get("icon"),
    }


def _normalize_short_range(payload, booking_date):
    location = payload.get("location") or {}
    forecast = payload.get("forecast") or {}
    forecast_days = forecast.get("forecastday") or []
    day = next((entry.get("day") or {} for entry in forecast_days if entry.get("date") == booking_date.isoformat()), {})
    condition = day.get("condition") or {}
    return {
        "date": booking_date.isoformat(),
        "mode": "forecast",
        "location": location.get("name") or "Office",
        "condition": condition.get("text") or "Unavailable",
        "temperature": day.get("avgtemp_c"),
        "highTemperature": day.get("maxtemp_c"),
        "lowTemperature": day.get("mintemp_c"),
        "humidity": day.get("avghumidity"),
        "chanceOfRain": day.get("daily_chance_of_rain"),
        "icon": condition.get("icon"),
    }


def _normalize_future(payload, booking_date):
    location = payload.get("location") or {}
    forecast = payload.get("forecast") or {}
    forecast_days = forecast.get("forecastday") or []
    day = forecast_days[0].get("day") if forecast_days else {}
    condition = day.get("condition") or {}
    return {
        "date": booking_date.isoformat(),
        "mode": "future",
        "location": location.get("name") or "Office",
        "condition": condition.get("text") or "Unavailable",
        "temperature": day.get("avgtemp_c"),
        "highTemperature": day.get("maxtemp_c"),
        "lowTemperature": day.get("mintemp_c"),
        "chanceOfRain": day.get("daily_chance_of_rain"),
        "icon": condition.get("icon"),
    }


@api_weather_bp.get("/weather")
def weather():
    booking_date, error = parse_date_arg(request.args.get("date"))
    if error:
        return error

    current_url = os.getenv("current_weather_url")
    short_range_url = os.getenv("short_range_weather_url")
    future_url = os.getenv("future_weather_url")
    days_ahead = (booking_date - date.today()).days

    if days_ahead > 13:
        raw_url = _build_url(future_url, booking_date)
        if not raw_url:
            return jsonify({"error": "Future weather is not configured"}), 500

        try:
            payload = _fetch_weather(raw_url)
        except (HTTPError, URLError, json.JSONDecodeError) as exc:
            current_app.logger.warning("Weather lookup failed for %s: %s", booking_date.isoformat(), exc)
            return jsonify({"error": "Unable to load future weather"}), 502

        return jsonify(_normalize_future(payload, booking_date))

    if days_ahead > 0:
        if not short_range_url:
            return jsonify({"error": "Short-range weather is not configured"}), 500

        try:
            payload = _fetch_weather(short_range_url)
        except (HTTPError, URLError, json.JSONDecodeError) as exc:
            current_app.logger.warning("Weather lookup failed for %s: %s", booking_date.isoformat(), exc)
            return jsonify({"error": "Unable to load short-range weather"}), 502

        return jsonify(_normalize_short_range(payload, booking_date))

    if not current_url:
        return jsonify({"error": "Current weather is not configured"}), 500

    try:
        payload = _fetch_weather(current_url)
    except (HTTPError, URLError, json.JSONDecodeError) as exc:
        current_app.logger.warning("Weather lookup failed for %s: %s", booking_date.isoformat(), exc)
        return jsonify({"error": "Unable to load current weather"}), 502

    return jsonify(_normalize_current(payload, booking_date))