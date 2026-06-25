from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from datetime import datetime
from typing import List
from app.config import db
from app.auth import get_current_user
from app.models import DeckCreate, DeckResponse
from app.nlp import generate_flashcards

router = APIRouter(prefix="/api/decks", tags=["decks"])

@router.post("", response_model=DeckResponse)
def create_deck(deck_data: DeckCreate, current_user: dict = Depends(get_current_user)):
    # 1. Run the notes through the NLP flashcard generator
    cards = generate_flashcards(deck_data.notes)
    if not cards:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate any flashcards from the provided notes. Please write more descriptive sentences."
        )
    
    # 2. Save the deck to MongoDB
    deck_doc = {
        "name": deck_data.name,
        "user_id": ObjectId(current_user["id"]),
        "created_at": datetime.utcnow()
    }
    deck_result = db.decks.insert_one(deck_doc)
    deck_id = str(deck_result.inserted_id)
    
    # 3. Save the generated cards linked to the deck and user
    card_docs = []
    for card in cards:
        card_docs.append({
            "deck_id": ObjectId(deck_id),
            "user_id": ObjectId(current_user["id"]),
            "question": card["question"],
            "answer": card["answer"],
            "box": 1,  # Leitner System: Start at Box 1
            "next_review_at": datetime.utcnow(),
            "last_reviewed_at": None
        })
    
    if card_docs:
        db.cards.insert_many(card_docs)
        
    return {
        "id": deck_id,
        "name": deck_doc["name"],
        "card_count": len(cards),
        "created_at": deck_doc["created_at"]
    }

@router.get("", response_model=List[DeckResponse])
def list_decks(current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    decks = list(db.decks.find({"user_id": user_id}))
    
    response = []
    for d in decks:
        # Get count of cards in this deck
        card_count = db.cards.count_documents({"deck_id": d["_id"]})
        response.append({
            "id": str(d["_id"]),
            "name": d["name"],
            "card_count": card_count,
            "created_at": d["created_at"]
        })
    
    # Sort decks by creation date desc
    response.sort(key=lambda x: x["created_at"], reverse=True)
    return response

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deck(deck_id: str, current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    d_id = ObjectId(deck_id)
    
    # Verify deck ownership
    deck = db.decks.find_one({"_id": d_id, "user_id": user_id})
    if not deck:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deck not found or you do not have permission to delete it"
        )
        
    # Delete cards associated with deck
    db.cards.delete_many({"deck_id": d_id})
    
    # Delete deck
    db.decks.delete_one({"_id": d_id})
    return

@router.get("/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = ObjectId(current_user["id"])
    
    # Total decks
    deck_count = db.decks.count_documents({"user_id": user_id})
    
    # Cards count
    card_count = db.cards.count_documents({"user_id": user_id})
    
    # Cards by box distribution
    box_distribution = {}
    for box in range(1, 6):
        box_distribution[f"box_{box}"] = db.cards.count_documents({"user_id": user_id, "box": box})
        
    # Mastered count (cards in Box 5)
    mastered_count = box_distribution["box_5"]
    
    # Due cards count
    now = datetime.utcnow()
    due_count = db.cards.count_documents({
        "user_id": user_id,
        "next_review_at": {"$lte": now}
    })
    
    return {
        "deck_count": deck_count,
        "card_count": card_count,
        "box_distribution": box_distribution,
        "mastered_count": mastered_count,
        "due_count": due_count
    }
