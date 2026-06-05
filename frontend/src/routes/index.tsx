import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { ToastContainer } from '../components/ui/Toast';

// Auth Pages
import { Login } from '../features/auth/Login';
import { Register } from '../features/auth/Register';
import { VerifyOtp } from '../features/auth/VerifyOtp';
import { ForgotPassword } from '../features/auth/ForgotPassword';
import { ResetPassword } from '../features/auth/ResetPassword';
import { GoogleCallback } from '../features/auth/GoogleCallback';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';

// Feed, Profile, Friends, Groups, Messages, Search, Notifications, Settings
import { Feed } from '../features/feed/Feed';
import { Profile } from '../features/profile/Profile';
import { Friends } from '../features/friends/Friends';
import { Groups } from '../features/groups/Groups';
import { CreateGroup } from '../features/groups/CreateGroup';
import { GroupDetail } from '../features/groups/GroupDetail';
import { Messages } from '../features/messages/Messages';
import { Search } from '../features/search/Search';
import { Notifications } from '../features/notifications/Notifications';
import { Settings } from '../features/settings/Settings';

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
          { path: '/verify-otp', element: <VerifyOtp /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
          { path: '/reset-password', element: <ResetPassword /> },
        ],
      },
      { path: '/auth/google/callback', element: <GoogleCallback /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Feed /> },
          { path: '/profile/:id', element: <Profile /> },
          { path: '/friends', element: <Friends /> },
          { path: '/groups', element: <Groups /> },
          { path: '/groups/create', element: <CreateGroup /> },
          { path: '/groups/:id', element: <GroupDetail /> },
          { path: '/messages', element: <Messages /> },
          { path: '/search', element: <Search /> },
          { path: '/notifications', element: <Notifications /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
