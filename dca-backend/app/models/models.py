from pydantic import BaseModel, Field
from typing import Optional, List

class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    password: str
    # New optional fields
    profile_picture: Optional[str] = None
    country: Optional[str] = None
    full_name: Optional[str] = None
    language: Optional[str] = None # used in the web app
    # New required field with default
    currencies: List[str] = Field(default_factory=lambda: ["USD", "BRL"])

class UserUpdate(BaseModel):
    # Fields that can be updated - all optional for PATCH
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None # Hashed before saving
    profile_picture: Optional[str] = None
    country: Optional[str] = None
    full_name: Optional[str] = None
    language: Optional[str] = None
    currencies: Optional[List[str]] = None

class UserOut(BaseModel):
    # Fields to be returned in user info endpoint - excluding password
    id: Optional[str] = None
    username: str
    email: str
    profile_picture: Optional[str] = None
    country: Optional[str] = None
    full_name: Optional[str] = None
    language: Optional[str] = None
    currencies: List[str]
    access_token: Optional[str] = None # To be used by frontend if needed
