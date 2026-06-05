import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../store/ToastContext';
import { authApi } from '../../api/auth.api';

export const VerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!state?.email || !state?.type) {
    return <Navigate to="/login" replace />;
  }

  const email = state.email;
  const type = state.type;

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(char => !/^[0-9]$/.test(char))) return;

    const newOtp = [...otp];
    pastedData.forEach((value, i) => {
      if (i < 6) newOtp[i] = value;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleResend = async () => {
    try {
      await authApi.requestOtp(email, type);
      success('OTP resent to your email');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      error('Please enter a 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.verifyOtp(email, otpValue, type);
      
      if (type === 'register') {
        success('Email verified successfully! You can now login.');
        navigate('/login');
      } else if (type === 'reset_password') {
        success('OTP verified. Please set your new password.');
        navigate('/reset-password', { state: { resetToken: res.reset_token } });
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 card-elevated animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-500">
          <KeyRound size={32} />
        </div>
        <h1 className="text-2xl font-display font-bold text-ink mb-2">Verify your email</h1>
        <p className="text-gray-500 dark:text-ink-muted text-sm">
          We've sent a code to <span className="font-medium text-ink">{email}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-border-base bg-surface-50 dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
          ))}
        </div>

        <Button type="submit" fullWidth size="lg" className="btn-gradient" isLoading={isLoading}>
          Verify <ArrowRight size={18} className="ml-2" />
        </Button>
      </form>

      <div className="mt-8 text-center text-sm">
        <p className="text-gray-500 dark:text-ink-muted mb-2">Didn't receive the code?</p>
        <button 
          type="button" 
          onClick={handleResend}
          className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          Click to resend
        </button>
      </div>
    </div>
  );
};
