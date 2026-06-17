from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from App.extensions import db
from App.models import Booking, Desk
from App.services.dates import parse_date_arg
from App.services.users import get_effective_user

api_bookings_bp = Blueprint("api_bookings", __name__, url_prefix="/api/bookings")
VALID_SLOTS = {"full", "am", "pm"}


def _normalize_slot(raw):
    value = str(raw or "full").strip().lower()
    if value not in VALID_SLOTS:
        return None
    return value


@api_bookings_bp.get("")
def bookings_query():
    single = request.args.get("date")
    email = request.args.get("email")

    if single:
        return _bookings_for_single_date(single, email)
    return _bookings_for_range(
        request.args.get("start_date"),
        request.args.get("end_date"),
        email,
    )


def _bookings_for_single_date(raw_date, email):
    single_date, error = parse_date_arg(raw_date, default_today=False)
    if error:
        return error

    q = Booking.query.filter(Booking.date == single_date)
    if email:
        q = q.filter(Booking.user_email == email)

    rows = q.order_by(Booking.desk_id, Booking.slot).all()

    if not email:
        grouped = {}
        for row in rows:
            grouped.setdefault(row.desk_id, []).append(row.to_api())
        return jsonify(
            {
                "date": raw_date,
                "bookings": grouped,
            }
        )

    return jsonify({"bookings": _rows_to_list(rows)})


def _bookings_for_range(start, end, email):
    q = Booking.query

    if start:
        start_date, error = parse_date_arg(start, default_today=False, field_name="start_date")
        if error:
            return error
        q = q.filter(Booking.date >= start_date)

    if end:
        end_date, error = parse_date_arg(end, default_today=False, field_name="end_date")
        if error:
            return error
        q = q.filter(Booking.date <= end_date)

    if email:
        q = q.filter(Booking.user_email == email)

    rows = q.order_by(Booking.date, Booking.desk_id).all()
    return jsonify({"bookings": _rows_to_list(rows)})


def _rows_to_list(rows):
    return [
        {"deskId": row.desk_id, "date": row.date.isoformat(), **row.to_api()}
        for row in rows
    ]


@api_bookings_bp.post("")
def create_booking():
    payload = request.get_json(silent=True) or {}
    desk_id = payload.get("deskId")
    if not desk_id:
        return jsonify({"error": "deskId is required"}), 400

    booking_date, error = parse_date_arg(payload.get("date"))
    if error:
        return error

    slot = _normalize_slot(payload.get("slot"))
    if slot is None:
        return jsonify({"error": "slot must be one of full, am, pm"}), 400

    if db.session.get(Desk, desk_id) is None:
        return jsonify({"error": "Unknown deskId"}), 404

    existing = Booking.query.filter_by(desk_id=desk_id, date=booking_date).all()
    for row in existing:
        if row.slot == "full" or slot == "full" or row.slot == slot:
            return jsonify({"error": "Desk already booked for that slot"}), 409

    user = get_effective_user()
    booking = Booking(
        desk_id=desk_id,
        date=booking_date,
        slot=slot,
        user_email=user["email"],
        user_name=user["name"],
        source=user["source"],
    )
    db.session.add(booking)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Desk already booked for that slot"}), 409

    return jsonify(
        {"ok": True, "deskId": desk_id, "date": booking_date.isoformat(), "slot": slot}
    ), 201


@api_bookings_bp.post("/extend")
def extend_my_half_bookings():
    booking_date, error = parse_date_arg(request.args.get("date"))
    if error:
        return error

    user = get_effective_user()
    email = (user.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "No active user"}), 400

    all_for_date = Booking.query.filter_by(date=booking_date).all()
    my_halves = [
        b for b in all_for_date
        if b.user_email == email and b.slot in ("am", "pm")
    ]

    other_slot = {"am": "pm", "pm": "am"}
    occupied = {(b.desk_id, b.slot) for b in all_for_date}

    extended = []
    for booking in my_halves:
        target_slot = other_slot[booking.slot]
        if (booking.desk_id, target_slot) in occupied:
            continue
        if (booking.desk_id, "full") in occupied:
            continue
        new_row = Booking(
            desk_id=booking.desk_id,
            date=booking_date,
            slot=target_slot,
            user_email=email,
            user_name=user.get("name") or booking.user_name,
            source=user.get("source") or booking.source,
        )
        db.session.add(new_row)
        occupied.add((booking.desk_id, target_slot))
        extended.append({"deskId": booking.desk_id, "slot": target_slot})

    if not extended:
        return jsonify({"ok": True, "extended": [], "count": 0})

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Another booking blocked the extension"}), 409

    return jsonify({"ok": True, "extended": extended, "count": len(extended)})


@api_bookings_bp.delete("/mine")
def release_my_bookings():
    booking_date, error = parse_date_arg(request.args.get("date"))
    if error:
        return error

    user = get_effective_user()
    email = (user.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "No active user"}), 400

    rows = Booking.query.filter_by(date=booking_date, user_email=email).all()
    count = len(rows)
    for row in rows:
        db.session.delete(row)
    db.session.commit()

    return jsonify(
        {"ok": True, "date": booking_date.isoformat(), "released": count}
    )


@api_bookings_bp.delete("/<desk_id>")
def cancel_booking(desk_id):
    booking_date, error = parse_date_arg(request.args.get("date"))
    if error:
        return error

    slot = _normalize_slot(request.args.get("slot"))
    if slot is None:
        return jsonify({"error": "slot must be one of full, am, pm"}), 400

    user = get_effective_user()
    booking = Booking.query.filter_by(
        desk_id=desk_id, date=booking_date, slot=slot
    ).first()
    if booking is None:
        return jsonify({"error": "No booking found for that desk/date/slot"}), 404
    if booking.user_email != user["email"]:
        return jsonify({"error": "You can only cancel your own booking"}), 403

    db.session.delete(booking)
    db.session.commit()
    return jsonify(
        {"ok": True, "deskId": desk_id, "date": booking_date.isoformat(), "slot": slot}
    )
