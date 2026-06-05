import React from 'react';
import { Earth, Users, Lock } from 'lucide-react';

// API
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;

// Local storage keys
export const LS_ACCESS_TOKEN = 'sp_access_token';
export const LS_THEME = 'sp_theme';

// Query keys
export const QK = {
  ME: ['me'] as const,
  USERS: ['users'] as const,
  USER: (id: string) => ['user', id] as const,
  USER_POSTS: (id: string) => ['user-posts', id] as const,

  FEEDS: ['feeds'] as const,
  POST: (id: string) => ['post', id] as const,
  POST_COMMENTS: (id: string) => ['post-comments', id] as const,
  POST_REACTIONS: (id: string, type?: string) =>
    ['post-reactions', id, type ?? 'all'] as const,
  COMMENT_REPLIES: (postId: string, commentId: string) =>
    ['comment-replies', postId, commentId] as const,
  COMMENT_REACTIONS: (id: string) => ['comment-reactions', id] as const,

  FRIENDS: ['friends'] as const,
  SENT_REQUESTS: ['friendship-sent'] as const,
  RECEIVED_REQUESTS: ['friendship-received'] as const,
  BLOCKED_USERS: ['blocked-users'] as const,
  MUTUAL_FRIENDS: (id: string) => ['mutual-friends', id] as const,

  GROUPS: ['groups'] as const,
  GROUP: (id: string) => ['group', id] as const,
  GROUP_POSTS: (id: string) => ['group-posts', id] as const,
  GROUP_MEMBERS: (id: string) => ['group-members', id] as const,
  GROUP_JOIN_REQ: (id: string) => ['group-join-requests', id] as const,

  CONVERSATIONS: ['conversations'] as const,
  CONVERSATION: (id: string) => ['conversation', id] as const,
  MESSAGES: (id: string) => ['messages', id] as const,
  CONVERSATION_MEMBERS: (id: string) => ['conversation-members', id] as const,
  CONVERSATION_MEDIAS: (id: string) => ['conversation-medias', id] as const,
  CONVERSATION_FILES: (id: string) => ['conversation-files', id] as const,

  SEARCH_USERS: (q: string) => ['search-users', q] as const,
} as const;

// Socket event names
export const SOCKET_EVENTS = {
  // Emit
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  SEND_MESSAGE: 'send_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MARK_READ: 'mark_read',

  // Listen
  NEW_MESSAGE: 'new_message',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_UPDATED: 'message_updated',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  NEW_NOTIFICATION: 'new_notification',
  NEW_REACTION: 'new_reaction',
  NEW_COMMENT: 'new_comment',
  FRIEND_REQUEST: 'friend_request',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
} as const;

// Conversation-namespace socket events (backend gateway at /conversation)
export const CONV_SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  SEND_MESSAGE: 'send_message',
  NEW_MESSAGE: 'new_message',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  UPDATE_MESSAGE: 'update_message',
  MESSAGE_UPDATED: 'message_updated',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_DELETED: 'message_deleted',
  ADD_REACTION: 'add_reaction',
  UPDATE_REACTION: 'update_reaction',
  REMOVE_REACTION: 'remove_reaction',
  MESSAGE_REACTED: 'message_reacted',
  MESSAGE_UNREACTED: 'message_unreacted',
  MARK_AS_READ: 'mark_as_read',
  MESSAGE_READ: 'message_read',
} as const;

// Reaction config
import { ReactionType } from '../types';

export const REACTION_CONFIG: Record<
  ReactionType,
  { emoji: string; label: string; color: string }
> = {
  [ReactionType.LIKE]: { emoji: '👍', label: 'Like', color: '#3b82f6' },
  [ReactionType.LOVE]: { emoji: '❤️', label: 'Love', color: '#ef4444' },
  [ReactionType.HAHA]: { emoji: '😂', label: 'Haha', color: '#f59e0b' },
  [ReactionType.WOW]: { emoji: '😮', label: 'Wow', color: '#8b5cf6' },
  [ReactionType.SAD]: { emoji: '😢', label: 'Sad', color: '#6b7280' },
  [ReactionType.ANGRY]: { emoji: '😡', label: 'Angry', color: '#f97316' },
};

// Post privacy config
import { PostPrivacy } from '../types';

export const PRIVACY_CONFIG: Record<
  PostPrivacy,
  { label: string; getIcon: () => React.ReactNode }
> = {
  [PostPrivacy.PUBLIC]: {
    label: 'Public',
    getIcon: () => <Earth size={16} />,
  },
  [PostPrivacy.FRIENDS_ONLY]: {
    label: 'Friends only',
    getIcon: () => <Users size={16} />,
  },
  [PostPrivacy.PRIVATE]: {
    label: 'Private',
    getIcon: () => <Lock size={16} />,
  },
};

// Nav routes
export const NAV_ROUTES = [
  { label: 'Home', path: '/', icon: 'Home' },
  { label: 'Friends', path: '/friends', icon: 'Users' },
  { label: 'Groups', path: '/groups', icon: 'LayoutGrid' },
  { label: 'Messages', path: '/messages', icon: 'MessageCircle' },
] as const;
