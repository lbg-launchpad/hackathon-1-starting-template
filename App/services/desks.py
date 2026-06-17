from App.models import Desk


def get_allowed_preference_options():
    allowed = set()
    has_near_window = False

    # near-team is a dynamic preference based on active same-team bookings.
    allowed.add("near-team")
    # half-day-desks matches desks where exactly one half is already booked.
    allowed.add("half-day-desks")

    for features, near_window in Desk.query.with_entities(Desk.features, Desk.near_window).all():
        if isinstance(features, list):
            allowed.update(
                str(feature).strip().lower()
                for feature in features
                if str(feature).strip()
            )
        if near_window:
            has_near_window = True

    if has_near_window:
        allowed.add("window-seat")

    return allowed
