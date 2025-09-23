import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AnnouncementsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium">Tournament Registration</h4>
            <p className="text-sm text-muted-foreground">Registration opens next week</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium">New Training Schedule</h4>
            <p className="text-sm text-muted-foreground">Updated times for next month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}