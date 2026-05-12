import { Link, useLocation } from 'react-router-dom';
import { NAV_ROUTES } from '../../constants';
import * as Icons from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { Avatar } from '../ui/Avatar';

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-gray-200 dark:border-white/10 bg-white/95 dark:bg-surface-50 overflow-y-auto px-4 py-6 z-40 backdrop-blur-sm">
      <Link to="/" className="flex items-center gap-2 px-2 mb-8 hover-lift">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-bold text-xl shadow-glow-sm">
          V
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-ink">
          VibeConnect
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
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
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group font-medium text-[15px]
                ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 shadow-sm'
                    : 'text-gray-700 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink hover:bg-gray-100 dark:hover:bg-surface-200'
                }`}
            >
              <Icon
                size={22}
                className={`transition-colors ${isActive ? 'text-primary-600' : 'group-hover:text-primary-500'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {route.label}

              {/* Mock Notification Badge */}
              {route.label === 'Messages' && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/10">
          <Link
            to={`/profile/${user.id}`}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-surface-200 transition-colors group"
          >
            <Avatar
              src={user.profile?.avatar_url}
              alt={user.username}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-ink truncate group-hover:text-primary-500 transition-colors">
                {user.profile?.full_name || user.username}
              </p>
              <p className="text-xs text-gray-600 dark:text-ink-muted truncate">
                @{user.username}
              </p>
            </div>
            <Icons.ChevronRight
              size={18}
              className="text-gray-400 dark:text-ink-faint group-hover:text-gray-600 dark:group-hover:text-ink-muted"
            />
          </Link>
        </div>
      )}
    </aside>
  );
};
