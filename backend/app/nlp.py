# backend/app/nlp.py

import spacy
from spacy.matcher import PhraseMatcher
import logging

# Load spaCy English model with error handling
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logging.error("spaCy model 'en_core_web_sm' not found. Please install it with: python -m spacy download en_core_web_sm")
    # Fallback to basic processing without spaCy
    nlp = None

# Seed list of common symptoms — you can expand this easily
SYMPTOM_LIST = [
    "itching", "skin rash", "nodal skin eruptions", "continuous sneezing", "shivering", "chills",
    "joint pain", "stomach pain", "acidity", "ulcers on tongue", "muscle wasting", "vomiting",
    "burning micturition", "spotting urination", "fatigue", "weight gain", "anxiety",
    "cold hands and feets", "mood swings", "weight loss", "restlessness", "lethargy",
    "patches in throat", "irregular sugar level", "cough", "high fever", "sunken eyes",
    "breathlessness", "sweating", "dehydration", "indigestion", "headache", "yellowish skin",
    "dark urine", "nausea", "loss of appetite", "pain behind the eyes", "back pain",
    "constipation", "abdominal pain", "diarrhoea", "mild fever", "yellow urine",
    "yellowing of eyes", "acute liver failure", "fluid overload", "swelling of stomach",
    "swelled lymph nodes", "malaise", "blurred and distorted vision", "phlegm",
    "throat irritation", "redness of eyes", "sinus pressure", "runny nose", "congestion",
    "chest pain", "weakness in limbs", "fast heart rate", "pain during bowel movements",
    "pain in anal region", "bloody stool", "irritation in anus", "neck pain", "dizziness",
    "cramps", "bruising", "obesity", "swollen legs", "swollen blood vessels",
    "puffy face and eyes", "enlarged thyroid", "brittle nails", "swollen extremeties",
    "excessive hunger", "extra marital contacts", "drying and tingling lips", "slurred speech",
    "knee pain", "hip joint pain", "muscle weakness", "stiff neck", "swelling joints",
    "movement stiffness", "spinning movements", "loss of balance", "unsteadiness",
    "weakness of one body side", "loss of smell", "bladder discomfort",
    "foul smell of urine", "continuous feel of urine", "passage of gases", "internal itching",
    "toxic look (typhos)", "depression", "irritability", "muscle pain", "altered sensorium",
    "red spots over body", "belly pain", "abnormal menstruation", "dischromic patches",
    "watering from eyes", "increased appetite", "polyuria", "family history", "mucoid sputum",
    "rusty sputum", "lack of concentration", "visual disturbances", "receiving blood transfusion",
    "receiving unsterile injections", "coma", "stomach bleeding", "distention of abdomen",
    "history of alcohol consumption", "fluid overload", "blood in sputum",
    "prominent veins on calf", "palpitations", "painful walking", "pus filled pimples",
    "blackheads", "scurring", "skin peeling", "silver like dusting", "small dents in nails",
    "inflammatory nails", "blister", "red sore around nose", "yellow crust ooze", "prognosis"
]

# Create PhraseMatcher for fast lookup
matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
patterns = [nlp.make_doc(symptom) for symptom in SYMPTOM_LIST]
matcher.add("SYMPTOMS", patterns)


def extract_symptoms(text: str):
    """Extracts symptoms using spaCy phrase matcher + fallback keyword search."""
    found = set()
    
    # Fallback keyword matching (simple substring search)
    text_lower = text.lower()
    for symptom in SYMPTOM_LIST:
        if symptom in text_lower:
            found.add(symptom)
    
    entities = {}
    
    # Use spaCy if available
    if nlp is not None:
        try:
            doc = nlp(text)
            
            # spaCy matcher
            matches = matcher(doc)
            spacy_found = set([doc[start:end].text.lower() for match_id, start, end in matches])
            found.update(spacy_found)
            
            # Extract entities
            entities = {ent.label_: ent.text for ent in doc.ents}
        except Exception as e:
            logging.error(f"Error processing text with spaCy: {e}")
    
    # Return standardized structure
    return {
        "symptoms": list(found),
        "entities": entities
    }


# Quick local test (run as script)
# if __name__ == "__main__":
#     sample = "I have a severe headache and stomach pain since morning."
#     print(extract_symptoms(sample))


