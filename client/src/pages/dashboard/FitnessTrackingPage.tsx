import { useQuery } from '@tanstack/react-query';
import { Heart, Activity, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function FitnessTrackingPage() {
  const { data: fitnessResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/fitness/summary'],
    queryFn: async () => {
      const response = await fetch('/api/fitness/summary', {
        credentials: 'include'
      });
      if (response.status === 404) {
        return { ok: true, items: [], count: 0 };
      }
      if (!response.ok) throw new Error('Failed to fetch fitness data');
      return response.json();
    }
  });

  const fitnessData = fitnessResponse?.items ?? fitnessResponse ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fitness Tracking</h1>
          <p className="text-gray-600">Track player fitness, performance, and progress.</p>
        </div>
        <LoadingState message="Loading fitness data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fitness Tracking</h1>
          <p className="text-gray-600">Track player fitness, performance, and progress.</p>
        </div>
        <ErrorState 
          title="Failed to load fitness data"
          message="Unable to fetch fitness tracking information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!fitnessData || fitnessData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fitness Tracking</h1>
            <p className="text-gray-600">Track player fitness, performance, and progress.</p>
          </div>
          <Button>
            <Activity className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Heart}
              title="No fitness data recorded"
              description="Start tracking player fitness and performance metrics."
              action={{
                label: "Log Activity",
                onClick: () => console.log("Log activity clicked")
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fitness Tracking</h1>
          <p className="text-gray-600">Track player fitness, performance, and progress.</p>
        </div>
        <Button>
          <Activity className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      <div className="grid gap-6">
        {fitnessData.map((record: any) => (
          <Card key={record.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  {record.playerName || 'Player'}
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {record.activityType || 'Activity'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {record.date ? new Date(record.date).toLocaleDateString() : 'No date'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {record.duration || 'N/A'} minutes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {record.score || 'N/A'} points
                  </span>
                </div>
              </div>
              {record.notes && (
                <p className="text-sm text-gray-600 mt-4">{record.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
