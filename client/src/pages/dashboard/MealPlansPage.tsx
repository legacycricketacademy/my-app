import { useQuery } from '@tanstack/react-query';
import { Utensils, Plus, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function MealPlansPage() {
  const { data: mealPlansResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/meal-plans'],
    queryFn: async () => {
      const response = await fetch('/api/meal-plans', {
        credentials: 'include'
      });
      if (response.status === 404) {
        return { ok: true, items: [], count: 0 };
      }
      if (!response.ok) throw new Error('Failed to fetch meal plans');
      return response.json();
    }
  });

  const mealPlans = mealPlansResponse?.items ?? mealPlansResponse ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
          <p className="text-gray-600">Manage nutrition and meal plans for players.</p>
        </div>
        <LoadingState message="Loading meal plans..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
          <p className="text-gray-600">Manage nutrition and meal plans for players.</p>
        </div>
        <ErrorState 
          title="Failed to load meal plans"
          message="Unable to fetch meal plan information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!mealPlans || mealPlans.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
            <p className="text-gray-600">Manage nutrition and meal plans for players.</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Meal Plan
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Utensils}
              title="No meal plans created"
              description="Create meal plans to help players maintain proper nutrition."
              action={{
                label: "Create Meal Plan",
                onClick: () => console.log("Create meal plan clicked")
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
          <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
          <p className="text-gray-600">Manage nutrition and meal plans for players.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Meal Plan
        </Button>
      </div>

      <div className="grid gap-6">
        {mealPlans.map((plan: any) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Utensils className="h-4 w-4 mr-2" />
                  {plan.name || 'Meal Plan'}
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {plan.type || 'General'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {plan.duration || '7 days'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {plan.targetAgeGroup || 'All ages'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Utensils className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {plan.mealsPerDay || '3'} meals/day
                  </span>
                </div>
              </div>
              {plan.description && (
                <p className="text-sm text-gray-600 mt-4">{plan.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
