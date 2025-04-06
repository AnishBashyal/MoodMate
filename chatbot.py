import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import List, Dict, Any

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("Gemini model initialized successfully")
except Exception as e:
    print(f"Error initializing Gemini model: {str(e)}")
    model = None

def generate_chat_response(
    message: str,
    entry_content: str,
    entry_summary: str,
    entry_mood: float,
    conversation_history: List[Dict[str, str]]
) -> str:
    """Generate a contextual response based on the chat message and journal entry."""
    if model is not None:
        try:
            formatted_history = "\n".join([
                f"{'User' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
                for msg in conversation_history[-5:]  # Use last 5 messages for context
            ])

            prompt = f"""You are a supportive AI assistant helping the user reflect on their journal entry.
The user's journal entry is about: {entry_summary}
Their mood score was: {entry_mood}/10
The full entry content: {entry_content}

Previous conversation:
{formatted_history}

User's current message: {message}

Please provide a supportive response (3-4 sentences) that:
1. Acknowledges their feelings and thoughts without directly quoting their journal
2. Makes specific references to themes or emotions from their journal entry
3. Either ends with ONE relevant follow-up question OR a supportive statement (not both)
4. Maintains a therapeutic and supportive tone

Choose whether to ask a question or make a statement based on:
- If the user just asked a question, respond with a statement
- If the user made a statement, respond with a question
- If the user seems to need validation, respond with a statement
- If the user seems open to reflection, respond with a question

Your response should be personalized based on their journal content and conversation history.
Do not start with phrases like "Based on your journal" or "I see from your entry."

Response:"""

            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating chat response with Gemini: {str(e)}")
    
    message_lower = message.lower()
    
    user_asking_question = any(word in message_lower for word in ["what", "why", "how", "when", "where", "who", "?"])
    
    if any(word in message_lower for word in ["mood", "feel", "emotion", "happy", "sad", "angry", "anxious"]):
        if entry_mood >= 7:
            if user_asking_question:
                return f"Your positive mood is wonderful! It's clear you're experiencing genuine joy in your life right now. These moments of happiness are valuable and worth celebrating."
            else:
                return f"Your positive mood is wonderful! It's clear you're experiencing genuine joy in your life right now. What specific moment or interaction contributed most to these good feelings?"
        elif entry_mood >= 4:
            if user_asking_question:
                return f"I sense you're feeling somewhat neutral about things. Life has its ups and downs, and it's okay to feel balanced rather than extremely positive or negative. A neutral mood can be a sign of emotional stability."
            else:
                return f"I sense you're feeling somewhat neutral about things. Life has its ups and downs, and it's okay to feel balanced. Is there a particular area of your life you'd like to explore or improve?"
        else:
            if user_asking_question:
                return f"I hear that you're feeling down, and I want you to know that's completely valid. Everyone experiences difficult emotions, and it's okay to not be okay. Your feelings are important and deserve to be acknowledged."
            else:
                return f"I hear that you're feeling down, and I want you to know that's completely valid. Everyone experiences difficult emotions, and it's okay to not be okay. Would you like to talk about what's weighing on you?"
    
    elif any(word in message_lower for word in ["why", "what", "how", "think", "believe", "understand"]):
        if user_asking_question:
            return f"That's a thoughtful question that shows you're engaging in self-reflection. Your journal reveals someone who's processing their experiences thoughtfully. This kind of self-awareness is a valuable skill for personal growth."
        else:
            return f"That's a thoughtful question that shows you're engaging in self-reflection. Your journal reveals someone who's processing their experiences thoughtfully. What insights are you hoping to gain from exploring this further?"
    
    elif any(word in message_lower for word in ["help", "advice", "suggestion", "should", "could", "would"]):
        if user_asking_question:
            return f"I'm here to listen and support you as you navigate your thoughts and feelings. Your journal shows someone who's thoughtful about their experiences and open to growth. Remember, your feelings are valid, and there's no right or wrong way to process them."
        else:
            return f"I'm here to listen and support you as you navigate your thoughts and feelings. Your journal shows someone who's thoughtful about their experiences and open to growth. What specific aspect would you like to discuss?"
    
    elif any(word in message_lower for word in ["thank", "grateful", "appreciate", "blessed", "fortunate"]):
        if user_asking_question:
            return f"Practicing gratitude is a powerful way to shift your perspective and enhance your well-being. It's wonderful that you're recognizing the positive aspects of your life, even during challenging times. This practice can significantly improve your overall mood and outlook."
        else:
            return f"Practicing gratitude is a powerful way to shift your perspective and enhance your well-being. It's wonderful that you're recognizing the positive aspects of your life. What's one thing you're feeling particularly thankful for today?"
    
    else:
        if user_asking_question:
            return f"I'm listening and here to support you as you process your thoughts and feelings. Your journal shows someone who's thoughtful and reflective about their experiences. Sometimes simply being heard and understood can bring clarity and new perspectives."
        else:
            return f"I'm listening and here to support you as you process your thoughts and feelings. Your journal shows someone who's thoughtful and reflective about their experiences. What aspect of your current situation would you like to explore further?" 