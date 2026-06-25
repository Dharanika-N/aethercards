from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.config import db, settings
from app.models import UserSignup, UserLogin, Token
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=Token)
def signup(user_data: UserSignup):
    email_clean = user_data.email.lower().strip()
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
        
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email_clean,
        "password": hashed,
        "created_at": timedelta(0)  # We can just store a creation timestamp
    }
    
    # Add creation time
    from datetime import datetime
    user_doc["created_at"] = datetime.utcnow()
    
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Generate token
    access_token = create_access_token(data={"sub": user_id, "email": email_clean})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user_data: UserLogin):
    email_clean = user_data.email.lower().strip()
    
    user = db.users.find_one({"email": email_clean})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": str(user["_id"]), "email": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Standard login form flow (for Swagger UI testing compatibility)
@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    email_clean = form_data.username.lower().strip()
    user = db.users.find_one({"email": email_clean})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user["_id"]), "email": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}
