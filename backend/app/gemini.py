from google import genai
from google.genai import types

from .config import Settings
from .schemas import ChatMessage


class GeminiChatService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = genai.Client(api_key=settings.gemini_api_key)

    def reply(self, messages: list[ChatMessage]) -> str:
        prompt = self._to_prompt(messages)
        response = self.client.models.generate_content(
            model=self.settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                system_instruction=(
                    "You are a helpful DevOps learning chatbot. Keep answers clear, "
                    "practical, and concise unless the user asks for depth."
                ),
            ),
        )
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini returned an empty response.")
        return text.strip()

    @staticmethod
    def _to_prompt(messages: list[ChatMessage]) -> str:
        lines = []
        for message in messages[-16:]:
            speaker = "User" if message.role == "user" else "Assistant"
            lines.append(f"{speaker}: {message.content}")
        lines.append("Assistant:")
        return "\n".join(lines)
