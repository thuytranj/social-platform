import { Link, useLocation } from 'react-router-dom';
import { NAV_ROUTES } from '../../constants';
import * as Icons from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { Avatar } from '../ui/Avatar';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border-subtle bg-white dark:border-white/10 dark:bg-surface-800 overflow-y-auto px-4 py-6 z-40">
      {/* Profile Card */}
      {user && (
        <Link
          to={`/profile/${user.id}`}
          className="flex flex-col items-center gap-3 mb-8 p-4 rounded-lg hover:bg-surface dark:hover:bg-surface-700 transition-colors group"
        >
          <Avatar
            src={user.profile?.avatar_url}
            alt={user.username}
            size="lg"
          />
          <div className="text-center">
            <p className="font-semibold text-text-primary dark:text-text-primary group-hover:text-primary-600 transition-colors">
              {user.profile?.full_name || user.username}
            </p>
            <p className="text-xs text-text-tertiary dark:text-text-tertiary">
              @{user.username}
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6 w-full justify-around text-center pt-3 border-t border-border-subtle dark:border-white/10">
            <div>
              <p className="font-semibold text-text-primary dark:text-text-primary text-sm">
                {Math.floor(Math.random() * 1000) + 100}
              </p>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                Followers
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary dark:text-text-primary text-sm">
                {Math.floor(Math.random() * 500) + 50}
              </p>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                Following
              </p>
            </div>
            <div>
              <p className="font-semibold text-text-primary dark:text-text-primary text-sm">
                {Math.floor(Math.random() * 200) + 20}
              </p>
              <p className="text-xs text-text-tertiary dark:text-text-tertiary">
                Posts
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium text-sm w-full
                ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/30 shadow-xs dark:shadow-dark-xs'
                    : 'text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary hover:bg-surface dark:hover:bg-surface-700 transition-colors'
                }`}
            >
              <Icon
                size={20}
                className={`transition-colors flex-shrink-0 ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-text-tertiary group-hover:text-primary-500'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{route.label}</span>

              {/* Notification Badge */}
              {route.label === 'Messages' && (
                <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border-subtle dark:border-white/10 space-y-2 text-xs text-text-tertiary dark:text-text-tertiary">
        <a
          href="#"
          className="block hover:text-text-secondary transition-colors"
        >
          Privacy Terms
        </a>
        <a
          href="#"
          className="block hover:text-text-secondary transition-colors"
        >
          Advertising
        </a>
        <p className="text-xs text-text-tertiary pt-2">© 2024 VibeConnect</p>
      </div>
    </aside>
  );
};
