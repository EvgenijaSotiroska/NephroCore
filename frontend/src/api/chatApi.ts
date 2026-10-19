import axiosInstance from "../axios/axios";
import type { ChatMessage, ChatReply } from "./types/chat";

const chatApi = {
  send: (patientId: string, messages: ChatMessage[]) =>
    axiosInstance.post<ChatReply>(`/patients/${patientId}/chat`, { messages }),
};

export default chatApi;