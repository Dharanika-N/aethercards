import sys
import os

# Add app directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.nlp import generate_flashcards
    print("NLP Library imported successfully!")
except Exception as e:
    print(f"Error importing NLP library: {e}")
    sys.exit(1)

sample_notes = """
Photosynthesis is the process used by plants to convert light energy into chemical energy. 
This chemical energy is stored in carbohydrate molecules. 
The process takes place primarily in leaves. 
Chlorophyll is the green pigment that absorbs light.
Albert Einstein discovered the photoelectric effect in 1921.
Marie Curie founded the Radium Institute in Paris.
"""

print("\n--- Processing Sample Notes ---")
print(sample_notes.strip())
print("\n--- Generating Flashcards ---")

try:
    cards = generate_flashcards(sample_notes)
    print(f"Successfully generated {len(cards)} flashcards:")
    for idx, card in enumerate(cards, 1):
        print(f"\nCard #{idx}:")
        print(f"  Question: {card['question']}")
        print(f"  Answer:   {card['answer']}")
except Exception as e:
    print(f"Error generating flashcards: {e}")
