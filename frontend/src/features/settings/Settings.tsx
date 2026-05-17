import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Moon, Sun, Lock, User, Bell, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../../store/ToastContext';
import { authApi } from '../../api/auth.api';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const Settings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'security'>('account');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onChangePassword = async (data: PasswordFormValues) => {
    try {
      setIsChangingPassword(true);
      await authApi.changePassword(data.currentPassword, data.newPassword);
      success('Password changed successfully');
      reset();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap md:whitespace-normal ${
                activeTab === 'account'
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500 font-medium'
                  : 'text-ink-muted hover:bg-surface-50 dark:hover:bg-surface-200'
              }`}
            >
              <User size={18} /> Account
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap md:whitespace-normal ${
                activeTab === 'appearance'
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500 font-medium'
                  : 'text-ink-muted hover:bg-surface-50 dark:hover:bg-surface-200'
              }`}
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap md:whitespace-normal ${
                activeTab === 'security'
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500 font-medium'
                  : 'text-ink-muted hover:bg-surface-50 dark:hover:bg-surface-200'
              }`}
            >
              <Lock size={18} /> Security
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'account' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink mb-6">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-muted block mb-1">Email</label>
                  <div className="px-4 py-2.5 bg-surface-50 dark:bg-surface-900 rounded-xl text-ink">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-muted block mb-1">Username</label>
                  <div className="px-4 py-2.5 bg-surface-50 dark:bg-surface-900 rounded-xl text-ink">
                    @{user?.username}
                  </div>
                </div>
                <div className="pt-4 border-t border-border-base">
                  <p className="text-sm text-ink-muted mb-4">
                    To change your profile information like name, bio, or avatar, please go to your profile page.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = `/profile/${user?.id}`}>
                    Go to Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink mb-6">Appearance</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-900 rounded-xl">
                  <div>
                    <h3 className="font-medium text-ink">Dark Mode</h3>
                    <p className="text-sm text-ink-muted">Toggle between light and dark themes</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${
                      theme === 'dark' ? 'bg-primary-500' : 'bg-border-strong'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-ink mb-6">Change Password</h2>
              
              {!user?.provider ? (
                <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.currentPassword?.message}
                    {...register('currentPassword')}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.newPassword?.message}
                    {...register('newPassword')}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" className="btn-gradient" isLoading={isChangingPassword}>
                      <Save size={18} className="mr-2" /> Update Password
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-surface-50 dark:bg-surface-900 rounded-xl">
                  <p className="text-ink-muted text-sm">
                    You signed in using {user.provider}. Password changes are managed through your provider.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
