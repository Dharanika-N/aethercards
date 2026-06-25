import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, decks, cards
from app.config import settings

app = FastAPI(
    title="Smart Flashcard Generator API",
    description="Backend service with NLP flashcard generation and Leitner Spaced Repetition",
    version="1.0.0"
)

# CORS configurations to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(decks.router)
app.include_router(cards.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Smart Flashcard Generator API",
        "nlp_status": "Loaded (NLTK)",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
