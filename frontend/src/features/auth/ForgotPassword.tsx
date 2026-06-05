import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../store/ToastContext';
import { authApi } from '../../api/auth.api';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      await authApi.requestOtp(data.email, 'reset_password');
      success('Password reset instructions sent to your email.');
      navigate('/verify-otp', { state: { email: data.email, type: 'reset_password' } });
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 card-elevated animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-ink mb-2">Forgot Password?</h1>
        <p className="text-gray-500 dark:text-ink-muted text-sm">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth size="lg" className="btn-gradient" isLoading={isLoading}>
          Reset Password <ArrowRight size={18} className="ml-2" />
        </Button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-ink-muted hover:text-gray-900 dark:hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to log in
        </button>
      </div>
    </div>
  );
};
