from fastapi.testclient import TestClient

from app.main import app, get_chat_service


class FakeChatService:
    def reply(self, messages):
        return f"echo: {messages[-1].content}"


def test_health():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat():
    app.dependency_overrides[get_chat_service] = lambda: FakeChatService()
    client = TestClient(app)

    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "hello"}]},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == {"reply": "echo: hello"}
