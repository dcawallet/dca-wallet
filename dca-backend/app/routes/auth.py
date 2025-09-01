from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.models.models import User
from app.core.security import create_access_token, verify_password, get_password_hash
from app.db.connection import db
from bson import ObjectId


auth_router = APIRouter()

# Simulated user database (replace with actual MongoDB interaction later)
users = []

@auth_router.post("/register", response_model=User)
async def register(user: User):
    # Check if user already exists
    existing_user = await db.db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Hash the password
    hashed_password = get_password_hash(user.password)
    user.password = hashed_password

    # Insert the new user into the database
    new_user = await db.db.users.insert_one(user.dict(exclude={'id'}))
    created_user = await db.db.users.find_one({"_id": new_user.inserted_id})

    # Return the created user
    return User(**{"id": str(created_user['_id']), **created_user})


@auth_router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.db.users.find_one({"username": form_data.username})
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    access_token = create_access_token(subject=user["username"])
    return {"access_token": access_token, "token_type": "bearer"}

