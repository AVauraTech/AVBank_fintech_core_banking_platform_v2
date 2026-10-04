from fastapi import APIRouter, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse, TokenRefresh, ChangePassword
from app.api.deps import CurrentUser, DBSession

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: DBSession):
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")

    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: DBSession):
    result = await db.execute(select(User).where(User.username == credentials.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account deactivated")

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: DBSession):
    payload = decode_token(token_data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    access_token = create_access_token(str(user.id))
    new_refresh = create_refresh_token(str(user.id))
    return Token(
        access_token=access_token,
        refresh_token=new_refresh,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return current_user

@router.post("/change-password")
async def change_password(data: ChangePassword, current_user: CurrentUser, db: DBSession):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.add(current_user)
    return {"message": "Password changed successfully"}
