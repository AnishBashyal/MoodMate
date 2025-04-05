import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def save_journal(user_id, text, mood_score, summary):
    journal_data = {
        "text": text,
        "mood_score": mood_score,
        "summary": summary
    }
    journal_ref = db.collection("users").document(user_id).collection("journals").document()
    journal_ref.set(journal_data)
    return True

def get_journals(user_id):
    journal_ref = db.collection("users").document(user_id).collection("journals")
    entries = journal_ref.stream()
    return [entry.to_dict() for entry in entries]
