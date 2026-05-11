import { Link, useLocation } from 'react-router-dom';
import { NAV_ROUTES } from '../../constants';
import * as Icons from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { Avatar } from '../ui/Avatar';

export const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-50/90 backdrop-blur-md border-t border-gray-200 dark:border-white/10 pb-safe z-50">
      <div className="flex items-center justify-around h-14">
        {NAV_ROUTES.map((route) => {
          const Icon = Icons[
            route.icon as keyof typeof Icons
          ] as React.ElementType;
          const isActive =
            location.pathname === route.path ||
            (route.path !== '/' && location.pathname.startsWith(route.path));

          return (
            <Link
              key={route.path}
              to={route.path}
              className={`flex flex-col items-center justify-center w-full h-full relative ${
                isActive
                  ? 'text-primary-500'
                  : 'text-gray-600 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary-500 rounded-b-full"></div>
              )}
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {route.label === 'Messages' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-surface-50 rounded-full"></span>
                )}
              </div>
            </Link>
          );
        })}
        {user && (
          <Link
            to={`/profile/${user.id}`}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div
              className={`p-0.5 rounded-full ${location.pathname.includes('/profile') ? 'ring-2 ring-primary-500' : ''}`}
            >
              <Avatar
                src={user.profile?.avatar_url}
                alt={user.username}
                size="sm"
              />
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
};
