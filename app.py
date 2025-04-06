from flask import Flask, request, jsonify
from firebase_admin import auth, firestore
from firebase_service import save_journal, get_journals, delete_journal
from summarizer import summarize_mood, get_score
from flask_cors import CORS
import secrets
from functools import wraps
from chatbot import generate_chat_response

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

db = firestore.client()

def verify_firebase_token():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise Exception("Missing or invalid Authorization header")
    id_token = auth_header.split("Bearer ")[-1]
    decoded = auth.verify_id_token(id_token)
    return decoded  # contains 'uid', 'email', etc.

@app.route("/generate", methods=["POST"])
def generate():
    try:
        user = verify_firebase_token()
        text = request.json.get("journal", "")
        firebase_user = auth.get_user(user["uid"])
        if firebase_user.display_name:
            username = firebase_user.display_name
        else:
            username = firebase_user.email.split("@")[0]
            
        mood_score = get_score(text)
        summary = summarize_mood(username, text)

        return jsonify({
            "mood_score": mood_score,
            "summary": summary
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/save", methods=["POST"])
def save():
    try:
        user = verify_firebase_token()
        text = request.json.get("journal", "")
        mood_score = request.json.get("mood_score")
        summary = request.json.get("summary")

        if not all([text, mood_score, summary]):
            return jsonify({"error": "Missing required fields"}), 400

        journal_id = save_journal(user["uid"], text, mood_score, summary)
        return jsonify({
            "id": journal_id,
            "message": "Journal entry saved successfully"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/journals", methods=["GET"])
def journals():
    try:
        user = verify_firebase_token()
        return jsonify(get_journals(user["uid"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/journals/<journal_id>", methods=["DELETE"])
def delete_journal_entry(journal_id):
    try:
        user = verify_firebase_token()
        delete_journal(user["uid"], journal_id)
        return jsonify({"message": "Journal entry deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 401

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_firebase_token()
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": str(e)}), 401
    return decorated_function

@app.route("/chat", methods=["POST"])
@require_auth
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        required_fields = ["message", "entry_id", "entry_content", "entry_summary", "entry_mood", "conversation_history"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        response = generate_chat_response(
            message=data["message"],
            entry_content=data["entry_content"],
            entry_summary=data["entry_summary"],
            entry_mood=float(data["entry_mood"]),
            conversation_history=data["conversation_history"]
        )

        return jsonify({"response": response})

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": "Failed to process chat message"}), 500

if __name__ == "__main__":
    app.run(debug=True)
