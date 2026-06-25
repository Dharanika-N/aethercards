from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

class DeckCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    notes: str = Field(..., min_length=10)

class DeckResponse(BaseModel):
    id: str
    name: str
    card_count: int
    created_at: datetime

class CardResponse(BaseModel):
    id: str
    deck_id: str
    question: str
    answer: str
    box: int
    next_review_at: datetime
    last_reviewed_at: Optional[datetime] = None

class ReviewSubmit(BaseModel):
    known: bool
    demo_mode: bool = False
