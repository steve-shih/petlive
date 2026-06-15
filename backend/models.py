from sqlalchemy import Column, String, Boolean, Enum, ForeignKey, Integer, Float, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import enum
import uuid
from datetime import datetime

# Helper to generate uuid string
def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    SELLER = "SELLER"
    BUYER = "BUYER"
    GUEST = "GUEST"

class ItemTypeEnum(str, enum.Enum):
    LIVESTOCK = "LIVESTOCK"
    PRODUCT = "PRODUCT"

class PaymentStatusEnum(str, enum.Enum):
    UNPAID = "UNPAID"
    DEPOSIT_PAID = "DEPOSIT_PAID"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    role = Column(Enum(RoleEnum), default=RoleEnum.BUYER)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    line_id = Column(String, nullable=True)
    is_verified_seller = Column(Boolean, default=False)
    
    # Relationships
    shop = relationship("Shop", back_populates="owner", uselist=False)
    reservations = relationship("Reservation", back_populates="buyer")

class Shop(Base):
    __tablename__ = "shops"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    license_number = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_live = Column(Boolean, default=False)
    
    # Store media URLs as comma-separated strings or JSON string for MVP
    media_photos = Column(Text, nullable=True, default="[]") 
    media_videos = Column(Text, nullable=True, default="[]")
    likes_count = Column(Integer, default=0)

    # Relationships
    owner = relationship("User", back_populates="shop")
    items = relationship("Item", back_populates="shop")
    live_sessions = relationship("LiveSession", back_populates="shop")

class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    shop_id = Column(String, ForeignKey("shops.id"))
    type = Column(Enum(ItemTypeEnum), default=ItemTypeEnum.LIVESTOCK)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    full_price = Column(Float, nullable=False)
    deposit_price = Column(Float, nullable=False)
    status = Column(String, default="AVAILABLE") # AVAILABLE, RESERVED, SOLD

    # Relationships
    shop = relationship("Shop", back_populates="items")
    reservations = relationship("Reservation", back_populates="item")

class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    shop_id = Column(String, ForeignKey("shops.id"))
    title = Column(String, nullable=False)
    status = Column(String, default="SCHEDULED") # SCHEDULED, LIVE, ENDED
    stream_url = Column(String, nullable=True)
    viewers_count = Column(Integer, default=0)

    # Relationships
    shop = relationship("Shop", back_populates="live_sessions")

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    buyer_id = Column(String, ForeignKey("users.id"))
    item_id = Column(String, ForeignKey("items.id"))
    reservation_time = Column(DateTime, nullable=True)
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.UNPAID)
    ecpay_trade_no = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    buyer = relationship("User", back_populates="reservations")
    item = relationship("Item", back_populates="reservations")
