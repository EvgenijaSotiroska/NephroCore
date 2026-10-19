import { useCallback, useState } from "react";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import chatApi from "../api/chatApi";
import type { ChatMessage } from "../api/types/chat";

// The server accepts at most this many messages per request.
const MAX_HISTORY = 20;

export function useChat(patientId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!patientId || !content || loading) return;

      const next: ChatMessage[] = [...messages, { role: "user", content }];
      setMessages(next);
      setLoading(true);
      setError(null);

      try {
        const { data } = await chatApi.send(patientId, next.slice(-MAX_HISTORY));
        setMessages([...next, { role: "assistant", content: data.reply }]);
      } catch (err) {
        setError(getApiErrorMessage(err, "Асистентот не успеа да одговори. Обидете се повторно."));
      } finally {
        setLoading(false);
      }
    },
    [patientId, messages, loading]
  );

  return { messages, loading, error, send };
}