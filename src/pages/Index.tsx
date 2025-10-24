import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Ensure the root page renders the login/log page for all visitors.
// Simple Login component that calls AuthContext.signIn
export default function Home() {
  return (
    <main>
      <Login />
    </main>
  );
}

function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrorMsg(error.message ?? 'Sign-in failed');
      }
      // on success, AuthContext.signIn will redirect to /admin or /dashboard
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 420, margin: '48px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ padding: '8px 12px', marginTop: 12 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {errorMsg && <p style={{ color: 'red', marginTop: 12 }}>{errorMsg}</p>}

        <p style={{ marginTop: 16, fontSize: 13, color: '#555' }}>
          Tip: use admin@company.com / admin123 to reach the admin dashboard.
        </p>
      </form>
    </section>
  );
}
