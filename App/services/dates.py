from datetime import date

from flask import jsonify


def parse_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def parse_date_arg(value, *, default_today=True, field_name="date"):
    """Parse an ISO date string. Returns (date, error_response).

    Exactly one of the tuple elements is non-None. When `value` is falsy and
    `default_today=True`, today's date is returned. When `value` is falsy and
    `default_today=False`, a JSON 400 response is returned so callers can't
    accidentally filter on `None`. An invalid value also produces a JSON 400.
    """
    if not value:
        if default_today:
            return date.today(), None
        return None, (jsonify({"error": f"{field_name} is required"}), 400)

    parsed = parse_date(value)
    if parsed is None:
        return None, (jsonify({"error": f"Invalid {field_name}"}), 400)
    return parsed, None
