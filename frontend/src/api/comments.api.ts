import api from './axios';
import { Comment, CursorPage } from '../types';

export const commentsApi = {
  createComment: (postId: string, content: string) =>
    api.post<Comment>(`/posts/${postId}/comments`, { content }).then((r) => r.data),

  getComments: (postId: string, limit = 10, cursor?: string) =>
    api.get<CursorPage<Comment>>(`/posts/${postId}/comments`, { params: { limit, cursor } }).then((r) => r.data),

  getReplies: (postId: string, commentId: string, limit = 10, cursor?: string) =>
    api.get<CursorPage<Comment>>(`/posts/${postId}/comments/${commentId}/replies`, {
      params: { limit, cursor },
    }).then((r) => r.data),

  replyToComment: (commentId: string, content: string) =>
    api.post<Comment>(`/comments/${commentId}/replies`, { content }).then((r) => r.data),

  updateComment: (id: string, content: string) =>
    api.patch<Comment>(`/comments/${id}`, { content }).then((r) => r.data),

  deleteComment: (id: string) =>
    api.delete(`/comments/${id}`).then((r) => r.data),
};
