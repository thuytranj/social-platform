import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../store/ToastContext';
import { authApi } from '../../api/auth.api';
import { useState } from 'react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
      });
      success('Registration successful! Please check your email for OTP.');
      navigate('/verify-otp', { state: { email: data.email, type: 'register' } });
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authApi.googleAuth();
  };

  return (
    <div className="w-full max-w-md p-8 card-elevated animate-fade-in my-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text mb-2">Create Account</h1>
        <p className="text-gray-500 dark:text-ink-muted">Join the community today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Username"
          type="text"
          placeholder="your_username"
          leftIcon={<User size={18} />}
          error={errors.username?.message}
          {...register('username')}
        />
        
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" className="btn-gradient mt-6" isLoading={isLoading}>
          Sign Up <ArrowRight size={18} className="ml-2" />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 divider"></div>
        <span className="text-xs text-gray-500 dark:text-ink-muted font-medium uppercase tracking-wider">or sign up with</span>
        <div className="flex-1 divider"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        size="lg"
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </Button>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
};
