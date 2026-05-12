# Social Platform Frontend — Complete Implementation Plan

## Background

Full-featured social platform frontend connecting to a NestJS + PostgreSQL backend running on `http://localhost:3000`. Backend uses **JWT auth** (access token in header, refresh token in httpOnly cookie), **Cloudinary** for media, and a Socket.io gateway.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | TailwindCSS v3 |
| Routing | React Router v6 |
| HTTP | Axios (with interceptors + auto-refresh) |
| Server State | TanStack Query v5 |
| Client State | Context API (Auth, Socket, Theme, Toast) |
| Realtime | Socket.io-client |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Notifications | Custom Toast system |

---

## API Analysis (from Backend Codebase)

### Auth (`/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register (email, username, password) |
| POST | `/auth/login` | Login → returns `access_token`, sets `refresh_token` cookie |
| POST | `/auth/request-otp` | OTP request |
| POST | `/auth/verify-otp` | OTP verify |
| POST | `/auth/request-password-reset` | Reset password with token |
| POST | `/auth/refresh-token` | Refresh access token using cookie |
| POST | `/auth/logout` | Logout (clears cookie) |
| GET | `/auth/google` | Google OAuth initiation |
| GET | `/auth/google/callback` | Google OAuth callback |

### Users (`/users`) — JWT protected
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Current user |
| GET | `/users` | All users (paginated cursor) |
| GET | `/users/:id` | User by ID |
| GET | `/users/by-username?username=` | Search users |
| GET | `/users/:id/posts` | User's posts |
| PATCH | `/users/profile` | Update profile (multipart: avatar, cover) |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Posts (`/posts`) — JWT protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/posts` | Create post (multipart: files) |
| POST | `/posts/share/:id` | Share a post |
| GET | `/posts/feeds` | Feed (cursor paginated) |
| GET | `/posts/:id` | Single post |
| PATCH | `/posts/:id` | Update post |
| DELETE | `/posts/:id` | Delete post |
| DELETE | `/posts/:postId/media/:mediaId` | Remove media from post |
| POST | `/posts/:id/comments` | Add comment |
| GET | `/posts/:id/comments` | Get comments (cursor) |
| GET | `/posts/:postId/comments/:commentId/replies` | Get replies |
| POST | `/posts/:postId/reactions` | React to post |
| GET | `/posts/:postId/reactions` | Get reactions |
| PATCH | `/posts/:id/reactions` | Update reaction |
| DELETE | `/posts/:postId/reactions` | Remove reaction |

### Comments (`/comments`) — JWT protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/comments/:commentId/replies` | Reply to comment |
| POST | `/comments/:commentId/reactions` | React to comment |
| GET | `/comments/:id/reactions` | Get comment reactions |
| PATCH | `/comments/:id` | Update comment |
| PATCH | `/comments/:id/reactions` | Update comment reaction |
| DELETE | `/comments/:id` | Delete comment |
| DELETE | `/comments/:commentId/reactions` | Remove reaction |

### Friendships (`/friendships`) — JWT protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/friendships` | Send friend request |
| POST | `/friendships/confirm` | Accept friend request |
| DELETE | `/friendships/cancel-request` | Cancel request |
| DELETE | `/friendships/:friendId/remove-friend` | Unfriend |
| GET | `/friendships/friends` | Friend list |
| GET | `/friendships/sent-requests` | Sent requests |
| GET | `/friendships/received-requests` | Received requests |
| GET | `/friendships/blocked-users` | Blocked users |
| GET | `/friendships/mutual-friends` | Mutual friends |
| PATCH | `/friendships/block` | Block user |
| DELETE | `/friendships/unblock` | Unblock user |

### Groups (`/groups`) — JWT protected
| Method | Endpoint | Description |
|---|---|---|
| POST | `/groups` | Create group (multipart: coverFile) |
| GET | `/groups` | My groups |
| GET | `/groups/:id` | Group details |
| GET | `/groups/:groupId/members` | Group members |
| GET | `/groups/:id/posts` | Group posts |
| GET | `/groups/:id/join-requests` | Join requests |
| PATCH | `/groups/:id` | Update group |
| DELETE | `/groups/:id` | Delete group |
| POST | `/groups/:id/join` | Join group |
| DELETE | `/groups/:id/leave` | Leave group |
| POST | `/groups/:id/join-requests/:userId/approve` | Approve join |
| POST | `/groups/:id/join-requests/:userId/reject` | Reject join |
| PATCH | `/groups/:id/add-admin` | Add admin |
| PATCH | `/groups/:id/remove-admin` | Remove admin |
| PATCH | `/groups/:id/transfer-ownership` | Transfer ownership |
| DELETE | `/groups/:id/members/:userId` | Remove member |

### Conversations (`/conversations`) — basic CRUD (messaging via Socket.io)

---

## Data Models (Key)

```typescript
// User
{ id, email, username, is_verified, last_active_at, created_at, profile: Profile }

// Profile
{ id, full_name, sex, date_of_birth, avatar_url, cover_url, bio }

// Post  
{ id, author_id, group_id, content, privacy, react_count, comment_count, share_count, original_post_id, root_post_id, created_at, author: User, postMedias: PostMedia[], group?: Group }

// Reaction types: like | love | haha | wow | sad | angry
// Post privacy: public | friends_only | private

// Message
{ id, conversation_id, sender_id, message_type, content, sent_at, reply_message_id, sender: User, message_medias: Media[] }

// Conversation
{ id, type: PRIVATE|GROUP, title, thumbnail_url, last_message_id, last_message_time, creator_id }
```

---

## Socket.io Architecture (Assumptions)

Since the Conversations controller is minimal (scaffold), messaging is primarily Socket.io-based. Assumed socket events:

```
// Client → Server
join_conversation, leave_conversation
send_message, typing_start, typing_stop

// Server → Client
new_message, message_deleted
user_online, user_offline
typing_start, typing_stop
new_notification
new_comment, new_reaction, new_friend_request
```

---

## Frontend Architecture

### Folder Structure
```
frontend/
  src/
    api/           # Axios instances, typed API functions per domain
    components/    # Shared reusable UI components
      ui/          # Base components: Button, Input, Modal, Avatar, Skeleton, Toast
      layout/      # Sidebar, Navbar, MobileNav
    features/      # Feature-level components (co-located with hooks)
      auth/        # LoginForm, RegisterForm, OTPVerify, ForgotPassword
      feed/        # FeedPage, PostCard, CreatePostModal
      posts/       # PostDetail, MediaGrid, ShareModal
      comments/    # CommentThread, CommentInput, CommentItem
      reactions/   # ReactionPicker, ReactionCounter
      profile/     # ProfilePage, ProfileHeader, ProfilePosts, EditProfileModal
      friends/     # FriendList, FriendRequests, FriendButton
      groups/      # GroupList, GroupCard, GroupDetail, GroupPosts, CreateGroupModal
      messages/    # MessagesPage, ConversationList, ChatWindow, MessageBubble, TypingIndicator
      notifications/ # NotificationCenter, NotificationItem
      search/      # SearchPage, UserSearchCard
    hooks/         # Reusable custom hooks
    layouts/       # MainLayout, AuthLayout
    pages/         # Route-level pages (thin wrappers)
    routes/        # Router config, ProtectedRoute
    socket/        # Socket provider, event handlers, typed event map
    store/         # Context providers (AuthContext, ThemeContext, NotificationContext)
    utils/         # Helpers, formatters, validators
    constants/     # API_URL, socket events, query keys
    types/         # TypeScript interfaces
```

---

## UI/UX Direction

**Design Language**: Light-first, airy social dashboard with soft gray surfaces, rounded cards, and restrained blue-violet accents. Dark mode should remain supported through paired `dark:` classes, but the default visual tone should feel clean and bright.
- Primary: soft blue-violet accents for navigation, buttons, and active states
- Accent: muted cyan/blue for focus, search, and status indicators
- Surface: white, cool gray-50, and gray-100 with subtle borders and soft shadows
- Text: deep gray for primary copy, slate-gray for secondary copy, muted gray for placeholders
- Shadows: small, diffuse shadows rather than heavy elevation

**Typography**: `Inter` (body) + `Plus Jakarta Sans` (headings) from Google Fonts, with slightly larger headings and medium-weight labels for a polished dashboard feel

**Key UI Patterns**:
- Left sidebar navigation (desktop) — sticky, icon+label, soft active pill
- Top navbar — rounded search field, notifications, user avatar menu, logout action
- Center feed — max-width 680px, generous card spacing, soft shadows
- Right panel — suggestions, group recommendations
- Mobile — bottom navigation bar
- Reaction emoji picker — hover popup with a small hover buffer so emojis stay selectable
- Post card — white card, rounded-3xl corners, muted action buttons, clean divider lines
- Chat panel — light panel styling with soft borders and readable input fields

---

## Proposed Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Login form + Google OAuth |
| Register | `/register` | Registration form |
| Verify OTP | `/verify-otp` | OTP verification |
| Forgot Password | `/forgot-password` | Password reset flow |
| Feed | `/` | Main news feed |
| Profile | `/profile/:id` | User profile |
| Groups | `/groups` | Group discovery + my groups |
| Group Detail | `/groups/:id` | Group page with posts |
| Friends | `/friends` | Friends list + requests |
| Messages | `/messages` | Conversations list |
| Chat | `/messages/:id` | Chat window |
| Search | `/search` | Search users |
| Settings | `/settings` | Account settings |

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── ThemeProvider
│       └── NotificationProvider
│           └── SocketProvider
│               └── Router
│                   ├── AuthLayout (login, register, verify-otp, forgot-password)
│                   └── MainLayout (protected)
│                       ├── Sidebar
│                       ├── Navbar
│                       ├── <Outlet />  — page content
│                       └── MobileNav
```

---

## Implementation Order

1. **Project Setup** — Vite + React + TailwindCSS + deps
2. **Design System** — tailwind.config, CSS variables, fonts
3. **Types** — all TypeScript interfaces
4. **Constants** — API base URL, socket events, query keys
5. **API Layer** — axios instance, auth API, users API, posts API, reactions API, comments API, friendships API, groups API
6. **Auth Contexts + Hooks** — AuthContext, useAuth hook
7. **Auth Pages** — Login, Register, OTP, ForgotPassword
8. **Shared UI Components** — Button, Input, Avatar, Skeleton, Modal, Toast, Spinner, Badge, Card, Dropdown
9. **Layout** — MainLayout, Sidebar, Navbar, MobileNav
10. **Protected Routes**
11. **Socket Provider** — connection, typed events, reconnect
12. **Feed Page** — infinite scroll, CreatePost, PostCard, reactions, comments
13. **Profile Page** — profile header, posts, edit modal
14. **Friends Page** — friends list, requests, search
15. **Groups Pages** — list, detail, create
16. **Messages/Chat** — conversation list, chat window, realtime
17. **Notifications** — notification center, realtime badge
18. **Search Page**
19. **Settings Page**
20. **Polish** — animations, skeletons, empty states, error boundaries

---

## Open Questions

> [!IMPORTANT]
> **Socket Gateway**: The `conversations.service.ts` is a bare scaffold — realtime messaging likely runs through a WebSocket gateway not yet visible in the code. I'll assume standard Socket.io events and document them. You may need to wire up the actual gateway events when they're implemented.

> [!NOTE]
> **Frontend port**: Backend expects `FRONTEND_URL=http://localhost:5173` — Vite default. This is already set in `.env`.

> [!NOTE]
> **Google OAuth flow**: The callback returns JSON. In a browser OAuth redirect, this means the frontend needs to handle the redirect + extract the token from the URL or a post-message. I'll implement a dedicated callback page.

---

## Verification Plan

### Automated
- `npm run dev` — starts on port 5173
- `npm run build` — TypeScript compilation check

### Manual Verification
- Auth flow: register → OTP → login → refresh → logout
- Feed: create post with image, react, comment, share
- Profile: view, edit avatar/cover, see friends
- Groups: create, join, post, manage members
- Messages: start conversation, send message
- Realtime: open two tabs, test reactions/comments propagate
- Responsive: test on mobile viewport
- Dark mode toggle
