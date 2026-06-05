import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import { authApi } from '../../api/auth.api';

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { success, error } = useToast();

  useEffect(() => {
    // Note: This component is a placeholder. 
    // In a real application, the backend would redirect here with an auth code,
    // which this component would then exchange for an access token.
    // Or, the backend sets the token in a cookie and redirects.
    // We'll simulate a successful login for now, assuming the backend
    // handles the Google OAuth flow and sets the HttpOnly cookie.

    const handleCallback = async () => {
      try {
        // Attempt to fetch user data. If successful, it means the backend
        // successfully set the session/cookie during the OAuth redirect.
        // We might need to call a specific endpoint to finalize the token exchange
        // if the backend expects it.
        
        // For now, we'll try to refresh the token to get the access token.
        const res = await authApi.refreshToken();
        login(res.access_token);
        success('Successfully logged in with Google!');
        navigate('/');
      } catch (err) {
        console.error('Google OAuth Callback Error:', err);
        error('Google login failed. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [login, navigate, success, error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-ink font-medium">Completing login...</p>
    </div>
  );
};
