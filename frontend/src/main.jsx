import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Bot, Send, ShieldCheck, Workflow, Moon, Sun, UserRound, RotateCcw } from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const USERNAME_KEY = "chatbot.username";
const historyKey = (username) => `chatbot.history.${username.trim().toLowerCase()}`;

function greetingFor(username) {
  return {
    role: "assistant",
    content: `Hello ${username}! Welcome back to your Gemini DevOps chatbot. How can I help you today?`,
  };
}

function parseHistory(savedHistory, username) {
  if (!savedHistory) return [greetingFor(username)];

  try {
    const parsed = JSON.parse(savedHistory);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [greetingFor(username)];
  } catch {
    return [greetingFor(username)];
  }
}

function App() {
  const [username, setUsername] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const inputRef = useRef(null);

  const loadUser = useCallback((nextUsername) => {
    const cleanName = nextUsername.trim();
    if (!cleanName) return;

    const savedHistory = localStorage.getItem(historyKey(cleanName));
    setUsername(cleanName);
    setNameInput(cleanName);
    setMessages(parseHistory(savedHistory, cleanName));
    localStorage.setItem(USERNAME_KEY, cleanName);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      const isDark = savedTheme === "dark";
      setIsDarkMode(isDark);
      applyTheme(isDark);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(prefersDark);
      applyTheme(prefersDark);
    }
    const savedUsername = localStorage.getItem(USERNAME_KEY) ?? "";
    if (savedUsername) {
      loadUser(savedUsername);
    }
  }, [loadUser]);

  useEffect(() => {
    if (!username || messages.length === 0) return;
    localStorage.setItem(historyKey(username), JSON.stringify(messages));
  }, [messages, username]);

  function applyTheme(isDark) {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }

  function toggleTheme() {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    applyTheme(newTheme);
  }

  function startChat(event) {
    event.preventDefault();
    loadUser(nameInput);
  }

  function clearHistory() {
    if (!username) return;
    const nextMessages = [greetingFor(username)];
    localStorage.removeItem(historyKey(username));
    setMessages(nextMessages);
  }

  function changeUser() {
    localStorage.removeItem(USERNAME_KEY);
    setUsername("");
    setNameInput("");
    setInput("");
  }

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  async function sendMessage(event) {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-16) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Backend request failed");
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: `I could not reach the chatbot backend: ${error.message}`,
        },
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Bot size={24} />
          </div>
          <div>
            <h1>Gemini Chatbot</h1>
            <p>DevOps learning lab</p>
          </div>
        </div>

        <div className="pipeline">
          <div>
            <Workflow size={18} />
            <span>React to FastAPI to Gemini</span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>Trivy to ECR to EKS to ArgoCD</span>
          </div>
        </div>
      </aside>

      {!username ? (
        <section className="welcome-panel">
          <form className="welcome-form" onSubmit={startChat}>
            <div className="welcome-icon">
              <UserRound size={28} />
            </div>
            <h2>Welcome</h2>
            <p>Enter your name to start a saved chatbot session.</p>
            <label htmlFor="username">Name</label>
            <input
              id="username"
              value={nameInput}
              maxLength={40}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Vishnu"
              autoFocus
            />
            <button className="start-button" type="submit" disabled={!nameInput.trim()}>
              Start chat
            </button>
          </form>
        </section>
      ) : (
        <section className="chat-panel">
          <header className="chat-header">
            <div>
              <h2>Chat with {username}</h2>
              <p>{messages.length} saved messages - Backend: {API_BASE_URL || "same origin"}</p>
            </div>
            <div className="header-controls">
              <button
                className="icon-button"
                onClick={changeUser}
                aria-label="Change user"
                title="Change user"
              >
                <UserRound size={19} />
              </button>
              <button
                className="icon-button"
                onClick={clearHistory}
                aria-label="Clear chat history"
                title="Clear history"
              >
                <RotateCcw size={19} />
              </button>
              <button
                className="icon-button"
                onClick={toggleTheme}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <span className={isSending ? "status busy" : "status"}>{isSending ? "Thinking" : "Ready"}</span>
            </div>
          </header>

          <div className="messages" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </article>
            ))}
            {isSending && <article className="message assistant muted">Thinking...</article>}
          </div>

          <form className="composer" onSubmit={sendMessage}>
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(event);
                }
              }}
              placeholder="Ask about Docker, CI/CD, EKS, ArgoCD..."
            />
            <button type="submit" disabled={!canSend} aria-label="Send message">
              <Send size={19} />
            </button>
          </form>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
