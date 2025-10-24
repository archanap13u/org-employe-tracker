import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const DataExport = () => {
  const { user } = useAuth();

  const exportData = async (format: 'json' | 'csv') => {
    if (!user) return;

    try {
      const [locations, sessions, tasks, activities] = await Promise.all([
        supabase.from('location_tracks').select('*'),
        supabase.from('time_sessions').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('activity_logs').select('*'),
      ]);

      const data = {
        locations: locations.data || [],
        sessions: sessions.data || [],
        tasks: tasks.data || [],
        activities: activities.data || [],
        exportedAt: new Date().toISOString(),
      };

      let content: string;
      let filename: string;
      let type: string;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `trackmaster-export-${Date.now()}.json`;
        type = 'application/json';
      } else {
        // Simple CSV export
        const csvRows = [
          ['Type', 'Title', 'Date', 'Details'].join(','),
          ...data.activities.map(a => 
            [a.activity_type, a.title, a.created_at, a.description].join(',')
          ),
        ];
        content = csvRows.join('\n');
        filename = `trackmaster-export-${Date.now()}.csv`;
        type = 'text/csv';
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Download your tracking data for backup or analysis</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button onClick={() => exportData('json')} variant="outline" className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button onClick={() => exportData('csv')} variant="outline" className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardContent>
    </Card>
  );
};
