// ============================================================
// Core Enums
// ============================================================
export enum PostPrivacy {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private',
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

export enum ReactionTargetType {
  POST = 'post',
  COMMENT = 'comment',
}

export enum MessageType {
  TEXT = 'text',
  MEDIA = 'media',
  FILE = 'file',
  SYSTEM = 'system',
}

export enum ConversationType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export enum GroupRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  BLOCKED = 'blocked',
  DECLINED = 'declined',
}

// ============================================================
// Profile & User
// ============================================================
export interface Profile {
  id: string;
  full_name: string | null;
  sex: Gender | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  avatar_public_id: string | null;
  cover_url: string | null;
  cover_public_id: string | null;
  bio: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_verified: boolean;
  provider?: string;
  last_active_at: string | null;
  created_at: string;
  profile: Profile;
}

export interface UserSummary {
  id: string;
  username: string;
  profile: Pick<Profile, 'full_name' | 'avatar_url'>;
}

// ============================================================
// Media
// ============================================================
export interface PostMedia {
  id: string;
  url: string;
  public_id: string;
  media_type: 'image' | 'video';
  width?: number;
  height?: number;
}

export interface MessageMedia {
  id: string;
  url: string;
  media_type: 'image' | 'video' | 'file';
}

// ============================================================
// Posts
// ============================================================
export interface Post {
  id: string;
  author_id: string;
  group_id: string | null;
  content: string;
  privacy: PostPrivacy;
  react_count: number;
  comment_count: number;
  share_count: number;
  original_post_id: string | null;
  root_post_id: string | null;
  created_at: string;
  updated_at: string;
  author: User;
  postMedias: PostMedia[];
  group?: Group;
  original_post?: Post;
  // Client-side additions
  user_reaction?: ReactionType | null;
}

// ============================================================
// Reactions
// ============================================================
export interface Reaction {
  id: string;
  target_type: ReactionTargetType;
  target_id: string;
  author_id: string;
  type: ReactionType;
  created_at: string;
  author: User;
}

export interface ReactionSummary {
  type: ReactionType;
  count: number;
}

// ============================================================
// Comments
// ============================================================
export interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  parent_comment_id: string | null;
  react_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  author: User;
  user_reaction?: ReactionType | null;
}

// ============================================================
// Friendships
// ============================================================
export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  requester?: User;
  addressee?: User;
}

// Friendship relation from current user's perspective
export type FriendRelation = 'none' | 'friends' | 'sent' | 'received' | 'blocked';

// ============================================================
// Groups
// ============================================================
export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  cover_public_id: string | null;
  privacy: 'public' | 'private';
  member_count: number;
  creator_id: string;
  created_at: string;
  role?: GroupRole | 'pending';
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user: User;
}

// ============================================================
// Conversations & Messages
// ============================================================
export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  thumbnail_url: string | null;
  last_message_id: string | null;
  last_message_time: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  members?: ConversationMember[];
  // Computed client-side
  other_user?: User; // for PRIVATE conversations
  unread_count?: number;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_message_id: string | null;
  joined_at: string;
  user: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  reply_message_id: string | null;
  message_type: MessageType;
  content: string | null;
  sent_at: string;
  updated_at: string;
  deleted_at: string | null;
  sender: User;
  message_medias: MessageMedia[];
  reply_message?: Message;
}

// ============================================================
// API Response Shapes
// ============================================================
export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// ============================================================
// Auth
// ============================================================
export interface AuthResponse {
  access_token: string;
  user: User;
}

export enum OtpType {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset_password',
}

// ============================================================
// Notifications (client-side model)
// ============================================================
export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'post_reaction'
  | 'post_comment'
  | 'comment_reply'
  | 'comment_reaction'
  | 'group_join_request'
  | 'group_join_approved'
  | 'new_message';

export interface Notification {
  id: string;
  type: NotificationType;
  actor: UserSummary;
  target_id?: string;   // post ID, comment ID, etc.
  group_id?: string;
  conversation_id?: string;
  is_read: boolean;
  created_at: string;
  message: string;
}

// ============================================================
// Socket Events
// ============================================================
export interface SocketTypingPayload {
  conversation_id: string;
  user: UserSummary;
}

export interface SocketNewMessagePayload {
  message: Message;
  conversation_id: string;
}

export interface SocketOnlineStatusPayload {
  user_id: string;
  is_online: boolean;
  last_active_at?: string;
}

export interface SocketReactionPayload {
  target_id: string;
  target_type: ReactionTargetType;
  reaction: Reaction;
  action: 'add' | 'update' | 'remove';
  new_count: number;
}

export interface SocketCommentPayload {
  post_id: string;
  comment: Comment;
  action: 'add' | 'delete';
}
