import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
}

export const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
  };

  const addTask = async () => {
    if (!user || !newTaskTitle) {
      toast.error('Please enter a task title');
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTaskTitle,
      priority: newTaskPriority,
      status: 'pending',
      progress: 0,
    });

    if (error) {
      toast.error('Failed to add task');
      return;
    }

    setNewTaskTitle('');
    fetchTasks();
    toast.success('Task added successfully');

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      activity_type: 'task',
      title: 'Task Created',
      description: `Created task: "${newTaskTitle}"`,
    });
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        progress,
        status: progress === 100 ? 'completed' : 'in_progress',
        completed_at: progress === 100 ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    if (!error) {
      fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (!error) {
      fetchTasks();
      toast.success('Task deleted');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-accent" />
          Task Management
        </CardTitle>
        <CardDescription>Track projects and to-dos with progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addTask} className="bg-gradient-primary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium">{task.title}</span>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
                <div className="flex gap-2 pt-1">
                  {[0, 25, 50, 75, 100].map((value) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => updateTaskProgress(task.id, value)}
                      className="flex-1 h-7 text-xs"
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
