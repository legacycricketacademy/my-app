import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PlayersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">John Doe</h4>
              <p className="text-sm text-muted-foreground">Age: 12</p>
            </div>
            <Button size="sm" variant="outline">View</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sarah Smith</h4>
              <p className="text-sm text-muted-foreground">Age: 10</p>
            </div>
            <Button size="sm" variant="outline">View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}