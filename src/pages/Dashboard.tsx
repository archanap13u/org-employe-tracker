import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatsOverview } from '@/components/StatsOverview';
import { LocationTracker } from '@/components/LocationTracker';
import { TimeTracker } from '@/components/TimeTracker';
import { TaskManager } from '@/components/TaskManager';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { DataExport } from '@/components/DataExport';

const Dashboard = () => {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const email = session?.user?.email ?? user?.email;
    if (!email) {
      // not logged in -> show auth page
      navigate('/auth', { replace: true });
    } else {
      checkAdminStatus();
    }
  }, [session, user, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">TrackMaster</h1>
              <p className="text-xs text-muted-foreground">Welcome back!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="icon" onClick={() => navigate('/admin')} title="Admin Panel">
                <Shield className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <StatsOverview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LocationTracker />
          <TimeTracker />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TaskManager />
          </div>
          <div className="space-y-6">
            <DataExport />
          </div>
        </div>

        <ActivityTimeline />
      </main>
    </div>
  );
};

export default Dashboard;
