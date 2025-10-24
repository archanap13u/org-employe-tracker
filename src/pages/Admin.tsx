import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const email = session?.user?.email ?? user?.email;
    if (!email) {
      // not logged in -> show auth page
      navigate('/auth', { replace: true });
      return;
    }

    // simple check: only allow admin@company.com to view this page
    if (email !== 'admin@company.com') {
      navigate('/dashboard', { replace: true });
    }
  }, [session, user, navigate]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, admin. If you see this page, you have access.</p>
    </main>
  );
}
