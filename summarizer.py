import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel("gemini-1.5-flash")


def summarize_mood(user:str,journal: str) -> str:
   """
   Analyze a user's input text and return a detailed emotional summary,
   mood classification, mental health indicators, and help recommendations.
   """
   prompt = f"""
       You are an advanced emotional wellness assistant. Analyze the following text for emotional and psychological state:

       \"\"\"{journal}\"\"\"
       Your task is to:
        "This is the daily journal entry provided by {user} and your task is to greet {user} and:\n"
        "1. Accurately summarize the key events and feelings expressed in the entry.\n"
        "2. Identify and articulate any potential mental health concerns or risks that may be indicated by the content of the journal entry.\n"
        "3. Frame your response in a way that is sensitive and avoids alarmist or overly clinical language. Focus on describing potential areas of concern rather than diagnosing or providing medical advice.\n"
        "4. Do not use words that may trigger the user such as 'suicidal' or 'self harm'.\n"
        "5. Use a tone that is empathetic and understanding, reflecting that the journal entry represents the user's personal experience.\n"
        "6. Please keep the summary concise and focused, highlighting the most relevant aspects of the entry in relation to mental well-being.\n"
        "7. If the journal entry is gibberish or nonsensical, provide a very concise, positive and supportive message, and set the mental health risk score to 0. \n"
        "8. If the journal entry is short or lacks descriptive detail, provide a concise positive affirmation or a relevant emotional supporting quote, and still follow the other instructions. \n"
    )
 )
       Structure the response clearly and conversationally. End with a kind and encouraging message to the user. Please give a single plain paragraph without any numberings, sections or bullet lists.
   """
   try:
       response = model.generate_content(prompt)
       summary = response.text.strip()
       return summary
   except Exception as e:
       return f"Error analyzing mood: {e}"

def get_score(summary: str) -> int:
   """
   Extract a mood score (0 to 10) from a given emotional summary using Gemini.
   Returns an integer score between 0 (very negative) to 10 (very positive).
   """
   prompt = f"""
       You will be given a mood summary generated from a user's emotional state.
       Based on the tone, classify the user's mood on a scale from 0 to 10 where:
       - 0 means extremely negative,
       - 5 means neutral,
       - 10 means extremely positive.
       Only respond with a single integer (no explanation, no punctuation, just the number).
       Mood Summary:
       \"\"\"{summary}\"\"\"
   """
   try:
       response = model.generate_content(prompt)
       score_text = response.text.strip()
       score = int(score_text)
       return max(0, min(score, 10))  
   except Exception as e:
       print(f"Error extracting score: {e}")
       return -1  