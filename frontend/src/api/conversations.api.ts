import api from './axios';
import {
  Conversation,
  Message,
  CursorPage,
  ConversationType,
  ConversationMember,
  MediaAttachment,
  FileAttachment,
} from '../types';

export interface CreateConversationPayload {
  type: ConversationType;
  participant_ids: string[];
  title?: string;
}

export interface SendMessagePayload {
  conversation_id: string;
  content?: string;
  message_type?: 'text';
  reply_message_id?: string;
}

export const conversationsApi = {
  // ---- Conversations ----
  getConversations: (limit = 20, cursor?: string) =>
    api
      .get<CursorPage<Conversation>>('/conversations', {
        params: { limit, cursor },
      })
      .then((r) => r.data),

  getConversation: (id: string) =>
    api.get<Conversation>(`/conversations/${id}`).then((r) => r.data),

  createGroupConversation: (title: string, memberIds: string[]) =>
    api
      .post<Conversation>('/conversations/group', {
        type: ConversationType.GROUP,
        title,
        member_ids: memberIds,
      })
      .then((r) => r.data),

  createPrivateConversation: (memberId: string) =>
    api
      .post<Conversation>('/conversations/private', {
        type: ConversationType.PRIVATE,
        member_ids: [memberId],
      })
      .then((r) => r.data),

  markAsRead: (conversationId: string) =>
    api.post<{ success: boolean }>(`/conversations/${conversationId}/read`).then((r) => r.data),

  // ---- Messages ----
  getMessages: (conversationId: string, limit = 30, cursor?: string) =>
    api
      .get<CursorPage<Message>>(`/conversations/${conversationId}/messages`, {
        params: { limit, cursor },
      })
      .then((r) => r.data),

  sendMessage: (data: SendMessagePayload, files?: File[]) => {
    const formData = new FormData();
    formData.append('conversation_id', data.conversation_id);
    if (data.content) formData.append('content', data.content);
    if (data.message_type) formData.append('message_type', data.message_type);
    if (data.reply_message_id)
      formData.append('reply_message_id', data.reply_message_id);
    if (files) {
      files.forEach((file) => formData.append('files', file));
    }
    return api
      .post<Message>('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  // ---- Members ----
  getConversationMembers: (
    conversationId: string,
    limit = 20,
    cursor?: string,
  ) =>
    api
      .get<CursorPage<ConversationMember>>(
        `/conversations/${conversationId}/members`,
        { params: { limit, cursor } },
      )
      .then((r) => r.data),

  addMember: (conversationId: string, userId: string) =>
    api
      .post(`/conversations/${conversationId}/members`, { userId })
      .then((r) => r.data),

  removeMember: (conversationId: string, memberId: string) =>
    api
      .delete(`/conversations/${conversationId}/members/${memberId}`)
      .then((r) => r.data),

  leaveConversation: (conversationId: string) =>
    api
      .delete(`/conversations/${conversationId}/leave`)
      .then((r) => r.data),

  // ---- Shared Media & Files ----
  getConversationMedias: (
    conversationId: string,
    limit = 20,
    cursor?: string,
  ) =>
    api
      .get<CursorPage<MediaAttachment>>(
        `/conversations/${conversationId}/medias`,
        { params: { limit, cursor } },
      )
      .then((r) => r.data),

  getConversationFiles: (
    conversationId: string,
    limit = 20,
    cursor?: string,
  ) =>
    api
      .get<CursorPage<FileAttachment>>(
        `/conversations/${conversationId}/files`,
        { params: { limit, cursor } },
      )
      .then((r) => r.data),

  getFileDownloadUrl: (conversationId: string, fileName: string) =>
    api
      .get<string>(`/conversations/${conversationId}/files/${fileName}/download`)
      .then((r) => r.data),
};
