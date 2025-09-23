import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MealPlanCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Breakfast</span>
            <span className="text-sm text-muted-foreground">8:00 AM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Lunch</span>
            <span className="text-sm text-muted-foreground">12:30 PM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Dinner</span>
            <span className="text-sm text-muted-foreground">7:00 PM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}