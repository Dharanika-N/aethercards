from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List
from app.config import db
from app.auth import get_current_user
from app.models import CardResponse, ReviewSubmit

router = APIRouter(prefix="/api/cards", tags=["cards"])

@router.get("/deck/{deck_id}/review", response_model=List[CardResponse])
def get_due_cards(deck_id: str, current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    d_id = ObjectId(deck_id)
    
    # Verify deck ownership
    deck = db.decks.find_one({"_id": d_id, "user_id": user_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
        
    now = datetime.utcnow()
    # Find cards that belong to this deck and are due for review
    due_cards = list(db.cards.find({
        "deck_id": d_id,
        "user_id": user_id,
        "next_review_at": {"$lte": now}
    }))
    
    response = []
    for c in due_cards:
        response.append({
            "id": str(c["_id"]),
            "deck_id": str(c["deck_id"]),
            "question": c["question"],
            "answer": c["answer"],
            "box": c["box"],
            "next_review_at": c["next_review_at"],
            "last_reviewed_at": c.get("last_reviewed_at")
        })
        
    return response

@router.get("/deck/{deck_id}/all", response_model=List[CardResponse])
def get_all_deck_cards(deck_id: str, current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    d_id = ObjectId(deck_id)
    
    # Verify deck ownership
    deck = db.decks.find_one({"_id": d_id, "user_id": user_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found"
        )
        
    cards = list(db.cards.find({
        "deck_id": d_id,
        "user_id": user_id
    }))
    
    response = []
    for c in cards:
        response.append({
            "id": str(c["_id"]),
            "deck_id": str(c["deck_id"]),
            "question": c["question"],
            "answer": c["answer"],
            "box": c["box"],
            "next_review_at": c["next_review_at"],
            "last_reviewed_at": c.get("last_reviewed_at")
        })
        
    return response

@router.post("/{card_id}/review", response_model=CardResponse)
def review_card(card_id: str, review_data: ReviewSubmit, current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    c_id = ObjectId(card_id)
    
    # Find card
    card = db.cards.find_one({"_id": c_id, "user_id": user_id})
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found"
        )
        
    current_box = card["box"]
    now = datetime.utcnow()
    
    if review_data.known:
        # Leitner: Move up 1 box, maximum box is 5
        new_box = min(current_box + 1, 5)
        
        # Calculate next review time
        if review_data.demo_mode:
            # Demo intervals in seconds: Box 1=10s, Box 2=30s, Box 3=60s, Box 4=120s, Box 5=300s
            intervals = {1: 10, 2: 30, 3: 60, 4: 120, 5: 300}
            next_review = now + timedelta(seconds=intervals[new_box])
        else:
            # Real intervals in days: Box 1=1 day, Box 2=2 days, Box 3=4 days, Box 4=8 days, Box 5=16 days
            intervals = {1: 1, 2: 2, 3: 4, 4: 8, 5: 16}
            next_review = now + timedelta(days=intervals[new_box])
    else:
        # Leitner: Reset back to Box 1
        new_box = 1
        
        if review_data.demo_mode:
            # Re-appears in 5 seconds in demo mode
            next_review = now + timedelta(seconds=5)
        else:
            # Re-appears in 1 hour in real mode
            next_review = now + timedelta(hours=1)
            
    # Update card in database
    db.cards.update_one(
        {"_id": c_id},
        {
            "$set": {
                "box": new_box,
                "next_review_at": next_review,
                "last_reviewed_at": now
            }
        }
    )
    
    updated_card = db.cards.find_one({"_id": c_id})
    
    return {
        "id": str(updated_card["_id"]),
        "deck_id": str(updated_card["deck_id"]),
        "question": updated_card["question"],
        "answer": updated_card["answer"],
        "box": updated_card["box"],
        "next_review_at": updated_card["next_review_at"],
        "last_reviewed_at": updated_card.get("last_reviewed_at")
    }
