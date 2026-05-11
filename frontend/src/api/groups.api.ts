import api from './axios';
import { Group, GroupMember, Post, CursorPage, GroupRole } from '../types';

export interface CreateGroupPayload {
  name: string;
  description?: string;
  privacy?: 'public' | 'private';
  coverFile?: File;
}

export const groupsApi = {
  createGroup: (data: CreateGroupPayload) => {
    const form = new FormData();
    form.append('name', data.name);
    if (data.description) form.append('description', data.description);
    if (data.privacy) form.append('privacy', data.privacy);
    if (data.coverFile) form.append('coverFile', data.coverFile);
    return api.post<Group>('/groups', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  getMyGroups: (limit = 10, cursor?: string) =>
    api.get<CursorPage<Group>>('/groups', { params: { limit, cursor } }).then((r) => r.data),

  getGroupById: (id: string) =>
    api.get<Group>(`/groups/${id}`).then((r) => r.data),

  getGroupMembers: (groupId: string, limit = 10, cursor?: string, role?: GroupRole) =>
    api.get<CursorPage<GroupMember>>(`/groups/${groupId}/members`, {
      params: { limit, cursor, role },
    }).then((r) => r.data),

  getGroupPosts: (groupId: string, limit = 10, cursor?: string) =>
    api.get<CursorPage<Post>>(`/groups/${groupId}/posts`, { params: { limit, cursor } }).then((r) => r.data),

  getJoinRequests: (groupId: string, limit = 10, cursor?: string) =>
    api.get<CursorPage<GroupMember>>(`/groups/${groupId}/join-requests`, {
      params: { limit, cursor },
    }).then((r) => r.data),

  updateGroup: (id: string, data: Partial<CreateGroupPayload>) =>
    api.patch<Group>(`/groups/${id}`, data).then((r) => r.data),

  deleteGroup: (id: string) =>
    api.delete(`/groups/${id}`).then((r) => r.data),

  joinGroup: (id: string) =>
    api.post(`/groups/${id}/join`).then((r) => r.data),

  leaveGroup: (id: string) =>
    api.delete(`/groups/${id}/leave`).then((r) => r.data),

  approveJoinRequest: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/join-requests/${userId}/approve`).then((r) => r.data),

  rejectJoinRequest: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/join-requests/${userId}/reject`).then((r) => r.data),

  addAdmin: (groupId: string, userId: string) =>
    api.patch(`/groups/${groupId}/add-admin`, { userId }).then((r) => r.data),

  removeAdmin: (groupId: string, userId: string) =>
    api.patch(`/groups/${groupId}/remove-admin`, { userId }).then((r) => r.data),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`).then((r) => r.data),

  transferOwnership: (groupId: string, newOwnerId: string) =>
    api.patch(`/groups/${groupId}/transfer-ownership`, { newOwnerId }).then((r) => r.data),
};
