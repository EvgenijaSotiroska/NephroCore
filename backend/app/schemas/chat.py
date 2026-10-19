from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_MESSAGES = 20
MAX_QUESTION_LENGTH = 1000
MAX_MESSAGE_LENGTH = 6000  # assistant answers are longer than questions


class ChatMessage(BaseModel):
    # Only these two roles are accepted, so the browser can never send a "system" message.
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_LENGTH)

    @field_validator("content")
    @classmethod
    def not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty.")
        return value


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=MAX_MESSAGES)

    @model_validator(mode="after")
    def check_conversation(self):
        if self.messages[-1].role != "user":
            raise ValueError("The last message must be from the user.")
        if any(m.role == "user" and len(m.content) > MAX_QUESTION_LENGTH for m in self.messages):
            raise ValueError(f"A question can be at most {MAX_QUESTION_LENGTH} characters.")
        return self


class ChatReply(BaseModel):
    reply: str