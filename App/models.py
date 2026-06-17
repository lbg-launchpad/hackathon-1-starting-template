from datetime import datetime

from sqlalchemy import JSON, UniqueConstraint

from App.extensions import db


class Desk(db.Model):
    __tablename__ = "desks"

    id = db.Column(db.String(16), primary_key=True)
    floor = db.Column(db.String(32), nullable=False)
    zone = db.Column(db.String(64), nullable=False)
    x_percent = db.Column(db.Integer, nullable=False)
    y_percent = db.Column(db.Integer, nullable=False)
    near_window = db.Column(db.Boolean, default=False, nullable=False)
    features = db.Column(JSON, nullable=False, default=list)

    def to_api(self):
        return {
            "id": self.id,
            "floor": self.floor,
            "zone": self.zone,
            "x": self.x_percent,
            "y": self.y_percent,
            "features": self.features or [],
            "nearWindow": self.near_window,
        }


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    desk_id = db.Column(db.String(16), db.ForeignKey("desks.id"), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    slot = db.Column(db.String(8), nullable=False, default="full", server_default="full", index=True)
    user_email = db.Column(db.String(255), nullable=False, index=True)
    user_name = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(32), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("desk_id", "date", "slot", name="uq_booking_desk_date_slot"),
    )

    def to_api(self):
        return {
            "name": self.user_name,
            "email": self.user_email,
            "source": self.source,
            "slot": self.slot,
        }


class AppUser(db.Model):
    __tablename__ = "app_users"
    __bind_key__ = "users"

    id = db.Column(db.String(64), primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    team = db.Column(db.String(128), nullable=True)
    location = db.Column(db.String(128), nullable=True)
    preferred_neighbourhood = db.Column(db.String(128), nullable=True)
    desk_preferences = db.Column(JSON, nullable=False, default=list)
    preferred_users = db.Column(JSON, nullable=False, default=list)
    anchor_days = db.Column(JSON, nullable=False, default=list)

    def to_api(self):
        return {
            "id": self.id,
            "fullName": self.full_name,
            "email": self.email,
            "team": self.team,
            "location": self.location,
            "preferredNeighbourhood": self.preferred_neighbourhood,
            "deskPreferences": self.desk_preferences or [],
            "preferredUsers": self.preferred_users or [],
            "anchorDays": self.anchor_days or [],
        }
