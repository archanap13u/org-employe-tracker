import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, CheckSquare, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  created_at: string;
}

export const ActivityTimeline = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActivities();
      
      const channel = supabase
        .channel('activity-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_logs',
          },
          () => fetchActivities()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setActivities(data);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="h-4 w-4 text-primary" />;
      case 'time': return <Clock className="h-4 w-4 text-secondary" />;
      case 'task': return <CheckSquare className="h-4 w-4 text-accent" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent tracking activity and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                <div className="mt-1">
                  {getIcon(activity.activity_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
