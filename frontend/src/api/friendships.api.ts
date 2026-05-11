import api from './axios';
import { Friendship, User, CursorPage } from '../types';

export const friendshipsApi = {
  sendRequest: (addressee_id: string) =>
    api.post<Friendship>('/friendships', { addressee_id }).then((r) => r.data),

  confirmRequest: (requester_id: string) =>
    api.post<Friendship>('/friendships/confirm', { requester_id }).then((r) => r.data),

  cancelRequest: (addressee_id: string) =>
    api.delete('/friendships/cancel-request', { data: { addressee_id } }).then((r) => r.data),

  removeFriend: (friendId: string) =>
    api.delete(`/friendships/${friendId}/remove-friend`).then((r) => r.data),

  getFriends: (limit = 10, cursor?: string) =>
    api.get<CursorPage<User>>('/friendships/friends', { params: { limit, cursor } }).then((r) => r.data),

  getSentRequests: (limit = 10, cursor?: string) =>
    api.get<CursorPage<Friendship>>('/friendships/sent-requests', { params: { limit, cursor } }).then((r) => r.data),

  getReceivedRequests: (limit = 10, cursor?: string) =>
    api.get<CursorPage<Friendship>>('/friendships/received-requests', { params: { limit, cursor } }).then((r) => r.data),

  getBlockedUsers: (limit = 10, cursor?: string) =>
    api.get<CursorPage<User>>('/friendships/blocked-users', { params: { limit, cursor } }).then((r) => r.data),

  getMutualFriends: (otherUserId: string, limit = 10, cursor?: string) =>
    api.get<CursorPage<User>>('/friendships/mutual-friends', {
      params: { limit, cursor },
      data: { otherUserId },
    }).then((r) => r.data),

  blockUser: (blockUserId: string) =>
    api.patch('/friendships/block', { blockUserId }).then((r) => r.data),

  unblockUser: (blockUserId: string) =>
    api.delete('/friendships/unblock', { data: { blockUserId } }).then((r) => r.data),
};
