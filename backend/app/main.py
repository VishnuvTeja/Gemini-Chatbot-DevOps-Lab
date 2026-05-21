from functools import lru_cache
from time import perf_counter

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest
from starlette.responses import Response

from .config import Settings, get_settings
from .gemini import GeminiChatService
from .schemas import ChatRequest, ChatResponse, HealthResponse


CHAT_REQUESTS = Counter("chatbot_chat_requests_total", "Total chatbot requests")
CHAT_ERRORS = Counter("chatbot_chat_errors_total", "Total chatbot errors")
CHAT_LATENCY = Histogram("chatbot_chat_latency_seconds", "Chatbot response latency")


@lru_cache
def get_chat_service() -> GeminiChatService:
    return GeminiChatService(get_settings())


app = FastAPI(
    title="Gemini Chatbot API",
    description="FastAPI backend for the Gemini chatbot DevOps learning project.",
    version="1.0.0",
)


settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(status="ok", model=settings.gemini_model)


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    service: GeminiChatService = Depends(get_chat_service),
) -> ChatResponse:
    CHAT_REQUESTS.inc()
    start = perf_counter()
    try:
        reply = service.reply(request.messages)
        return ChatResponse(reply=reply)
    except Exception as exc:
        CHAT_ERRORS.inc()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        CHAT_LATENCY.observe(perf_counter() - start)


@app.get("/metrics")
def metrics() -> Response:
    return Response(generate_latest(), media_type="text/plain; version=0.0.4")
