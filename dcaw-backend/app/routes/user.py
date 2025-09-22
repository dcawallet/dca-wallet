from fastapi import APIRouter, Depends, HTTPException, status
from app.models.models import User, UserUpdate, UserOut
from app.core.security import get_current_user, create_access_token, get_password_hash
from app.db.connection import db
from bson import ObjectId

user_router = APIRouter()

@user_router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user information",
    description="Retrieve the detailed information of the currently authenticated user, including their token."
)
async def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Retrieves the information of the currently authenticated user.
    Includes the user's access token for frontend storage.
    """
    # Create a new token for the user, to be returned with user info
    # This ensures the token is fresh and can be stored alongside user data
    token = create_access_token(subject=current_user.username)
    
    # Convert User model to dictionary, then update with token
    user_data = current_user.dict()
    user_data["access_token"] = token
    
    return UserOut(**user_data)

@user_router.patch(
    "/me",
    response_model=UserOut,
    summary="Update current user information",
    description="Update editable fields for the currently authenticated user. Returns updated user info and a new token."
)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Updates the profile information for the authenticated user.
    Allowed fields to update: username, email, password, profile_picture, country, full_name, language, currencies.
    Returns the updated user object and a new access token.
    """
    update_data = user_update.dict(exclude_unset=True) # Only include fields that were set in the request

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update"
        )

    # If password is being updated, hash it
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])

    # Update user in database
    updated_user_doc = await db.db.users.find_one_and_update(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data},
        return_document=True # Return the updated document
    )

    if not updated_user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found (should not happen with authenticated user)"
        )
    
    # Convert MongoDB _id to Pydantic id and ensure it matches the UserOut model
    updated_user_doc["id"] = str(updated_user_doc["_id"])
    del updated_user_doc["_id"]

    updated_user = User(**updated_user_doc)
    
    # Create a new token for the updated user
    token = create_access_token(subject=updated_user.username)
    
    # Convert updated User model to UserOut dictionary, then add token
    user_out_data = updated_user.dict()
    user_out_data["access_token"] = token

    return UserOut(**user_out_data)
