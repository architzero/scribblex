import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/?error=' + error);
      return;
    }

    if (token) {
      localStorage.setItem('accessToken', token);
      
      // Fetch user data
      fetch('http://localhost:4000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        })
        .catch(() => {
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#1a1a1a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#666666]">Completing sign in...</p>
      </div>
    </div>
  );
}
