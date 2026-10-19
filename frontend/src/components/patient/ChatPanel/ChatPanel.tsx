import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useChat } from "../../../hooks/useChat";
import "./ChatPanel.css";

const SUGGESTIONS = [
  "Што значат моите последни резултати?",
  "Што се променило од последниот преглед?",
  "Што да го прашам лекарот на следниот преглед?",
];

export default function ChatPanel({ patientId }: { patientId?: string }) {
  const { messages, loading, error, send } = useChat(patientId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  if (!patientId) return null;

  const submit = () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    void send(text);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  if (!open) {
    return (
      <button type="button" className="chat-fab" onClick={() => setOpen(true)}>
        💬 Асистент
      </button>
    );
  }

  return (
    <section className="chat-panel" role="dialog" aria-label="AI асистент">
      <header className="chat-header">
        <div>
          <h2>💬 AI асистент</h2>
          <p>Не е замена за вашиот лекар. Разговорот не се зачувува.</p>
        </div>
        <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Затвори">
          ×
        </button>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Поставете прашање за вашите резултати, терапија или симптоми.</p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((text) => (
                <button key={text} type="button" className="chat-suggestion" onClick={() => void send(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`chat-bubble chat-bubble-${message.role}`}>
            {message.content}
          </div>
        ))}

        {loading && <div className="chat-bubble chat-bubble-assistant chat-typing">Пишува…</div>}
        {error && <p className="chat-error">{error}</p>}
        <div ref={endRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишете го вашето прашање…"
          maxLength={1000}
          rows={2}
          disabled={loading}
        />
        <button type="button" className="chat-send" onClick={submit} disabled={loading || !draft.trim()}>
          Испрати
        </button>
      </div>
    </section>
  );
}