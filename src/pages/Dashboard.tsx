import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const email = session?.user?.email ?? user?.email;
    if (!email) {
      // not logged in -> auth page
      navigate('/auth', { replace: true });
    }
  }, [session, user, navigate]);

  return (
    <main style={{ padding: 24 }}>
      <h1>User Dashboard</h1>
      <p>Welcome. This is the dashboard shown after a successful login.</p>
    </main>
  );
}
