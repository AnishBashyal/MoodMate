import requests
import json

# Your Gemini API URL (replace with the actual Gemini API URL)
API_URL = "https://api.gemini.com/v1/generate_summary"

# Store your API Key securely
API_KEY = "your_api_key_here"  # Don't hardcode in production! Use environment variables.

# Function to call Gemini API for generating the summary
def generate_summary(journal_entry):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "text": journal_entry,  # The journal entry text that needs to be summarized
        "options": {
            "summary_type": "mental_health"  # Assuming the API can filter by type of summary (if supported)
        }
    }

    response = requests.post(API_URL, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        return response.json()["summary"]
    else:
        return f"Error: {response.status_code}, {response.text}"

journal_entry = "Today, I feel very stressed about my upcoming exams. I haven't been able to focus, and it's making me anxious. I also had a disagreement with a friend, which added to my stress."

# Generate summary using Gemini API
summary = generate_summary(journal_entry)
print("AI Summary:", summary)
