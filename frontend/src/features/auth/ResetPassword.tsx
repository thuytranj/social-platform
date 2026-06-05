import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../store/ToastContext';
import { authApi } from '../../api/auth.api';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!state?.resetToken) {
    return <Navigate to="/login" replace />;
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      await authApi.requestPasswordReset(state.resetToken, data.password);
      success('Password reset successfully. You can now login.');
      navigate('/login');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 card-elevated animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-ink mb-2">Set New Password</h1>
        <p className="text-gray-500 dark:text-ink-muted text-sm">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" className="btn-gradient mt-6" isLoading={isLoading}>
          Reset Password <ArrowRight size={18} className="ml-2" />
        </Button>
      </form>
    </div>
  );
};
