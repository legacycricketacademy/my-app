import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FitnessCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fitness Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm">This Week</span>
            <span className="text-sm font-medium">5 sessions</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">This Month</span>
            <span className="text-sm font-medium">18 sessions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}