"""Signup and login endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from app.services import auth_service, user_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(request: SignupRequest):
    import traceback

    try:
        hashed = auth_service.hash_password(request.password)
        user = user_service.create_user(request.username, request.email, hashed)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

    token = auth_service.create_access_token({"sub": user["email"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
    }


@router.post("/login")
async def login(request: LoginRequest):
    user = user_service.get_user_by_email(request.email)

    if user is None or not auth_service.verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_service.create_access_token({"sub": user["email"]})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {"id": current_user["id"], "username": current_user["username"], "email": current_user["email"]}