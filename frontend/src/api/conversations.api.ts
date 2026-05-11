import api from './axios';
import { Conversation, Message, CursorPage, ConversationType } from '../types';

export interface CreateConversationPayload {
  type: ConversationType;
  participant_ids: string[];
  title?: string;
}

export interface SendMessagePayload {
  content?: string;
  message_type?: 'text' | 'media' | 'file';
  reply_message_id?: string;
}

export const conversationsApi = {
  getConversations: (limit = 20, cursor?: string) =>
    api.get<CursorPage<Conversation>>('/conversations', { params: { limit, cursor } }).then((r) => r.data),

  getConversation: (id: string) =>
    api.get<Conversation>(`/conversations/${id}`).then((r) => r.data),

  createConversation: (data: CreateConversationPayload) =>
    api.post<Conversation>('/conversations', data).then((r) => r.data),

  getMessages: (conversationId: string, limit = 30, cursor?: string) =>
    api.get<CursorPage<Message>>(`/conversations/${conversationId}/messages`, {
      params: { limit, cursor },
    }).then((r) => r.data),
};
