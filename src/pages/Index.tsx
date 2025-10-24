import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // redirect root to the auth page so login is the landing page
    navigate('/auth', { replace: true });
  }, [navigate]);

  return null;
}
