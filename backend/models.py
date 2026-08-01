from pydantic import BaseModel, Field, EmailStr, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


# User Models
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    role: str = "customer"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class User(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(UserBase):
    id: str
    created_at: str  # Changed to str to handle ISO format datetime strings

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Product Models
class ProductBase(BaseModel):
    title: str
    description: str
    base_price: float
    category: str
    images: List[str] = []
    is_customizable: bool = False
    customization_options: Optional[Dict[str, Any]] = None
    rating: float = 0.0
    estimated_days: int = 3
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ProductResponse(ProductBase):
    id: str
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}


# Order Models
class ShippingAddress(BaseModel):
    street: str
    city: str
    state: str
    zipcode: str
    phone: str


class PaymentDetails(BaseModel):
    method: str
    status: str = "PENDING"


class OrderItem(BaseModel):
    product_id: str
    title: str
    quantity: int
    price: float
    custom_notes: Optional[str] = None
    custom_image_url: Optional[str] = None


class TrackingDetails(BaseModel):
    courier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    dispatch_date: Optional[datetime] = None


class OrderBase(BaseModel):
    items: List[OrderItem]
    total_amount: float
    shipping_address: ShippingAddress
    payment_method: Optional[str] = "cod"


class OrderCreate(OrderBase):
    pass


class Order(OrderBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    customer_id: str
    order_status: str = "PENDING"
    tracking_details: Optional[TrackingDetails] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class OrderResponse(OrderBase):
    id: str
    customer_id: str
    order_status: str
    tracking_details: Optional[TrackingDetails] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {ObjectId: str}


# Valid order statuses (shared across admin and customer flows)
ORDER_STATUSES = [
    "PENDING",
    "ACCEPTED",
    "IN_PRODUCTION",
    "PACKED",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
]

# Allowed admin status transitions
ORDER_STATUS_TRANSITIONS = {
    "PENDING": ["ACCEPTED", "CANCELLED"],
    "ACCEPTED": ["IN_PRODUCTION", "CANCELLED"],
    "IN_PRODUCTION": ["PACKED", "CANCELLED"],
    "PACKED": ["DISPATCHED", "CANCELLED"],
    "DISPATCHED": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": [],
}


class OrderStatusUpdate(BaseModel):
    order_status: str
    tracking_details: Optional[TrackingDetails] = None


# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    role: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None