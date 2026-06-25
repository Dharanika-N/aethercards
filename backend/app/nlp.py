import re
import nltk
from typing import List, Dict

# Ensure NLTK resources are downloaded
for resource in ['punkt', 'punkt_tab', 'averaged_perceptron_tagger', 'averaged_perceptron_tagger_eng']:
    try:
        nltk.download(resource, quiet=True)
    except Exception as e:
        print(f"Warning: failed to download nltk resource {resource}: {e}")

def generate_flashcards(text: str) -> List[Dict[str, str]]:
    """
    Generates Q&A flashcards from study notes using NLTK:
    1. Regex-based definition extraction (X is Y -> Fill in the blank: [_____] is Y)
    2. POS-based Named Entity (Proper Noun) Cloze deletion
    3. Common Noun Cloze deletion.
    """
    # 1. Split text into sentences
    sentences = nltk.sent_tokenize(text)
    flashcards = []
    seen_questions = set()

    for sent_str in sentences:
        sent_str = sent_str.strip()
        # Skip sentences that are too short to contain meaningful information
        if len(sent_str) < 20:
            continue
        
        card_added = False

        # Strategy 1: Definition Extraction (Copula verbs / defining phrases)
        # Search for: is, are, was, were, refers to, means
        pattern = r'\b(is|are|was|were|refers to|means)\b'
        match = re.search(pattern, sent_str, re.IGNORECASE)
        
        if match:
            verb_phrase = match.group(1)
            subject_part = sent_str[:match.start()].strip()
            definition_part = sent_str[match.end():].strip()
            
            # Count words in subject (we want it to be a clean noun phrase, not a whole clause)
            subject_words = subject_part.split()
            
            if 0 < len(subject_words) <= 5 and len(definition_part) > 10:
                # Basic cleaning of punctuation at the end of definition
                if definition_part.endswith('.'):
                    definition_clean = definition_part[:-1]
                else:
                    definition_clean = definition_part
                    
                q_text = f"Fill in the blank: [_____] {verb_phrase} {definition_clean}."
                a_text = subject_part
                
                # Check for duplication
                if q_text not in seen_questions:
                    flashcards.append({"question": q_text, "answer": a_text})
                    seen_questions.add(q_text)
                    card_added = True

        # Strategy 2: Proper Noun / Named Entity Cloze
        if not card_added:
            try:
                words = nltk.word_tokenize(sent_str)
                tagged = nltk.pos_tag(words)
                
                # Look for proper nouns (NNP / NNPS)
                proper_nouns = []
                temp_nnp = []
                
                for word, tag in tagged:
                    if tag in ('NNP', 'NNPS'):
                        temp_nnp.append(word)
                    else:
                        if temp_nnp:
                            proper_nouns.append(" ".join(temp_nnp))
                            temp_nnp = []
                if temp_nnp:
                    proper_nouns.append(" ".join(temp_nnp))
                
                # Filter proper nouns (ignore single character or punctuation artifacts)
                proper_nouns = [pn for pn in proper_nouns if len(pn) > 1 and re.match(r'^[A-Za-z0-9 ]+$', pn)]
                
                if proper_nouns:
                    # Replace the first proper noun
                    target = proper_nouns[0]
                    # We want to replace it safely respecting word boundaries
                    q_text = re.sub(rf'\b{re.escape(target)}\b', '[_____]', sent_str, count=1)
                    
                    if q_text != sent_str and q_text not in seen_questions:
                        flashcards.append({"question": q_text, "answer": target})
                        seen_questions.add(q_text)
                        card_added = True
            except Exception:
                pass # Fall back to Strategy 3 if POS tagging fails

        # Strategy 3: Common Noun Cloze
        if not card_added:
            try:
                words = nltk.word_tokenize(sent_str)
                tagged = nltk.pos_tag(words)
                
                # Find all common nouns (NN / NNS)
                common_nouns = [word for word, tag in tagged if tag in ('NN', 'NNS') and len(word) > 2]
                
                if common_nouns:
                    # Pick the first common noun
                    target = common_nouns[0]
                    q_text = re.sub(rf'\b{re.escape(target)}\b', '[_____]', sent_str, count=1)
                    
                    if q_text != sent_str and q_text not in seen_questions:
                        flashcards.append({"question": q_text, "answer": target})
                        seen_questions.add(q_text)
                        card_added = True
            except Exception:
                pass

    return flashcards
