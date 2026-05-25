import React, { useMemo, useRef, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Bot, Send, ShieldCheck, Workflow, Moon, Sun } from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am your Gemini chatbot. Ask me a DevOps, cloud, Kubernetes, or CI/CD question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const inputRef = useRef(null);

  // Initialize theme from localStorage
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
  }, []);

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

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <h2>Chat</h2>
            <p>Backend: {API_BASE_URL || "same origin"}</p>
          </div>
          <div className="header-controls">
            <button
              className="theme-toggle"
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
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
