import { useEffect, useState } from "react";
import type { AIAnalysis } from "../../../api/types/ai";
import { formatShortDate, formatTime, toDateKey } from "../../../utils/date";
import "./AiAnalysisModal.css";

interface AiAnalysisModalProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  generateLabel: string;
  items: AIAnalysis[]; // newest first
  loading: boolean; // generating a new one
  historyLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onClose: () => void;
}

function formatCreatedAt(value: string): string {
  return `${formatShortDate(toDateKey(value))}, ${formatTime(value)}`;
}

export default function AiAnalysisModal({
  isOpen,
  title,
  subtitle,
  generateLabel,
  items,
  loading,
  historyLoading,
  error,
  onGenerate,
  onClose,
}: AiAnalysisModalProps) {
  // null = show the newest one
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A newly generated analysis becomes the selected one.
  const newestId = items[0]?.id;
  useEffect(() => {
    setSelectedId(null);
  }, [newestId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  return (
    <div
      className="ai-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
        <div className="ai-modal__header">
          <div>
            <h2 id="ai-modal-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          <button type="button" className="ai-modal__close" onClick={onClose} aria-label="Затвори">
            ×
          </button>
        </div>

        <div className="ai-modal__layout">
          <nav className="ai-modal__history" aria-label="Претходни анализи">
            <div className="ai-modal__history-title">Претходни ({items.length})</div>

            {historyLoading && <p className="ai-modal__status">Се вчитува…</p>}

            {!historyLoading && items.length === 0 && (
              <p className="ai-modal__status">Сè уште нема анализи.</p>
            )}

            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`ai-modal__history-item ${
                      selected?.id === item.id ? "ai-modal__history-item--active" : ""
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {formatCreatedAt(item.created_at)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ai-modal__body">
            {loading && <p className="ai-modal__status">Се генерира анализата…</p>}

            {!loading && error && <p className="ai-modal__error">{error}</p>}

            {!loading && selected && (
              <>
                <p className="ai-modal__date">{formatCreatedAt(selected.created_at)}</p>
                <p className="ai-modal__text">{selected.analysis}</p>
              </>
            )}

            {!loading && !error && !selected && !historyLoading && (
              <p className="ai-modal__status">
                Притиснете „{generateLabel}“ за да добиете прва анализа.
              </p>
            )}
          </div>
        </div>

        <div className="ai-modal__footer">
          <button type="button" className="ai-modal__secondary" onClick={onClose}>
            Затвори
          </button>
          <button type="button" className="ai-modal__primary" onClick={onGenerate} disabled={loading}>
            {loading ? "Се генерира…" : generateLabel}
          </button>
        </div>
      </div>
    </div>
  );
}