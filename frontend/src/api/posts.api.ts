import api from './axios';
import { Post, CursorPage, PostPrivacy } from '../types';

export interface CreatePostPayload {
  content: string;
  privacy?: PostPrivacy;
  group_id?: string;
}

export const postsApi = {
  createPost: (data: CreatePostPayload, files?: File[]) => {
    const form = new FormData();
    form.append('content', data.content);
    if (data.privacy) form.append('privacy', data.privacy);
    if (data.group_id) form.append('group_id', data.group_id);
    files?.forEach((f) => form.append('files', f));
    return api.post<Post>('/posts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  sharePost: (postId: string, data: CreatePostPayload) =>
    api.post<Post>(`/posts/share/${postId}`, data).then((r) => r.data),

  getFeed: (limit = 10, cursor?: string) =>
    api.get<CursorPage<Post>>('/posts/feeds', { params: { limit, cursor } }).then((r) => r.data),

  getPost: (id: string) =>
    api.get<Post>(`/posts/${id}`).then((r) => r.data),

  updatePost: (id: string, data: Partial<CreatePostPayload>) =>
    api.patch<Post>(`/posts/${id}`, data).then((r) => r.data),

  deletePost: (id: string) =>
    api.delete(`/posts/${id}`).then((r) => r.data),

  detachMedia: (postId: string, mediaId: string) =>
    api.delete(`/posts/${postId}/media/${mediaId}`).then((r) => r.data),
};
