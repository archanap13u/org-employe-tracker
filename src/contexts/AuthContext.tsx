import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // NEW: track whether a sign-in flow was initiated by the app (so we only redirect then)
  const redirectAfterSignIn = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // mark that this sign-in was initiated by the app, so we can redirect afterwards
    redirectAfterSignIn.current = true;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && redirectAfterSignIn.current) {
      try {
        const { data, error: rpcError } = await supabase
          .rpc('authenticate_user', { _email: email, _password: password });

        if (!rpcError && Array.isArray(data) && data.length > 0) {
          const row = data[0] as any;
          if (row.is_admin) {
            // redirect to admin page
            window.location.href = '/admin';
            redirectAfterSignIn.current = false;
            return { error };
          } else {
            // redirect to normal dashboard for authenticated non-admin users
            window.location.href = '/dashboard';
            redirectAfterSignIn.current = false;
            return { error };
          }
        } else {
          // RPC failed: fallback behavior
          if (email === 'admin@company.com') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
          redirectAfterSignIn.current = false;
          return { error };
        }
      } catch {
        // silent fallback; don't block sign-in flow
        if (email === 'admin@company.com') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/dashboard';
        }
        redirectAfterSignIn.current = false;
        return { error };
      }
    }

    // reset flag if error or no redirect performed
    redirectAfterSignIn.current = false;
    return { error };
  };

  // Changed: after sign out, send user back to login (root) so the log page is shown
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
