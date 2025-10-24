import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, CheckSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const StatsOverview = () => {
  const [stats, setStats] = useState({
    locations: 0,
    totalTime: 0,
    completedTasks: 0,
    activeSessions: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    const [locationsRes, sessionsRes, tasksRes] = await Promise.all([
      supabase.from('location_tracks').select('id', { count: 'exact', head: true }),
      supabase.from('time_sessions').select('duration_seconds, is_active'),
      supabase.from('tasks').select('status', { count: 'exact' }),
    ]);

    const totalTime = sessionsRes.data?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
    const activeSessions = sessionsRes.data?.filter(s => s.is_active).length || 0;
    const completedTasks = tasksRes.data?.filter(t => t.status === 'completed').length || 0;

    setStats({
      locations: locationsRes.count || 0,
      totalTime: Math.floor(totalTime / 3600),
      completedTasks,
      activeSessions,
    });
  };

  const statCards = [
    { icon: MapPin, label: 'Locations Tracked', value: stats.locations, color: 'text-primary' },
    { icon: Clock, label: 'Hours Tracked', value: stats.totalTime, color: 'text-secondary' },
    { icon: CheckSquare, label: 'Tasks Completed', value: stats.completedTasks, color: 'text-accent' },
    { icon: TrendingUp, label: 'Active Sessions', value: stats.activeSessions, color: 'text-success' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-none bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
