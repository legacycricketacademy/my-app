import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function NotificationsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <div>
              <h4 className="font-medium">Payment Reminder</h4>
              <p className="text-sm text-muted-foreground">Payment due in 3 days</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <h4 className="font-medium">Training Session</h4>
              <p className="text-sm text-muted-foreground">Session tomorrow at 9 AM</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}