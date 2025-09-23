import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ScheduleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Morning Training</h4>
              <p className="text-sm text-muted-foreground">9:00 AM - 11:00 AM</p>
            </div>
            <Button size="sm" variant="outline">View</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Fitness Session</h4>
              <p className="text-sm text-muted-foreground">5:00 PM - 6:30 PM</p>
            </div>
            <Button size="sm" variant="outline">View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}