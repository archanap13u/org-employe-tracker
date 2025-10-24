import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Play, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const TimeTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startSession = async () => {
    if (!user || !title) {
      toast.error('Please enter a title');
      return;
    }

    const now = new Date();
    const { data, error } = await supabase
      .from('time_sessions')
      .insert({
        user_id: user.id,
        title,
        description,
        started_at: now.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start session');
      return;
    }

    setCurrentSessionId(data.id);
    setStartTime(now);
    setIsTracking(true);
    toast.success('Time tracking started');

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'time',
      title: 'Time Session Started',
      description: `Started tracking "${title}"`,
    });
  };

  const stopSession = async () => {
    if (!user || !currentSessionId) return;

    const now = new Date();
    const durationSeconds = elapsedTime;

    const { error } = await supabase
      .from('time_sessions')
      .update({
        ended_at: now.toISOString(),
        duration_seconds: durationSeconds,
        is_active: false,
      })
      .eq('id', currentSessionId);

    if (error) {
      toast.error('Failed to stop session');
      return;
    }

    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
    setCurrentSessionId(null);
    setTitle('');
    setDescription('');
    toast.success(`Session ended: ${formatTime(durationSeconds)}`);

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'time',
      title: 'Time Session Ended',
      description: `Completed "${title}" - Duration: ${formatTime(durationSeconds)}`,
    });
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-secondary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-secondary" />
          Time Tracking
        </CardTitle>
        <CardDescription>Track work hours and productivity sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-title">Session Title</Label>
          <Input
            id="session-title"
            placeholder="What are you working on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isTracking}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="session-description">Description (optional)</Label>
          <Input
            id="session-description"
            placeholder="Additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isTracking}
          />
        </div>

        {isTracking && (
          <div className="text-center p-6 bg-gradient-secondary rounded-lg">
            <div className="text-5xl font-bold text-secondary-foreground font-mono">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-secondary-foreground/80 mt-2">{title}</p>
          </div>
        )}

        <Button
          onClick={isTracking ? stopSession : startSession}
          className={`w-full ${isTracking ? 'bg-destructive hover:bg-destructive/90' : 'bg-gradient-secondary'}`}
          size="lg"
        >
          {isTracking ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop Session
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Session
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
