from flask import Flask, request, session, render_template, jsonify
from firebase_admin import auth, firestore
from firebase_service import save_journal, get_journals
from summarizer import summarize_mood, get_score
import secrets

db = firestore.client()

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

@app.route("/")
def home():
    return render_template("index.html", session=session)

@app.route("/sessionLogin", methods=["POST"])
def session_login():
    id_token = request.json.get("idToken")
    username = request.json.get("username", None)

    try:
        decoded = auth.verify_id_token(id_token)
        uid = decoded["uid"]

        if username:
            db.collection("users").document(uid).set({
                "email": decoded.get("email", ""),
                "username": username
            })

        user_doc = db.collection("users").document(uid).get()
        user_data = user_doc.to_dict() if user_doc.exists else {}

        session["user_id"] = uid
        session["user_email"] = decoded.get("email", "Unknown")
        session["user_name"] = user_data.get("username", session["user_email"])

        return jsonify({"status": "ok"})

    except Exception as e:
        return jsonify({"error": str(e)}), 401

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "logged out"})

@app.route("/generate", methods=["POST"])
def generate():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401

    text = request.json.get("journal", "")
    mood_score = get_score(text)
    summary = summarize_mood(text)

    save_journal(session["user_id"], text, mood_score, summary)

    return jsonify({
        "mood_score": mood_score,
        "summary": summary
    })

@app.route("/journals", methods=["GET"])
def journals():
    if "user_id" not in session:
        return jsonify([])
    return jsonify(get_journals(session["user_id"]))


if __name__ == "__main__":
    app.run(debug=True)