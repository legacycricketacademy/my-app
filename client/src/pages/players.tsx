import React from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PlayersPage() {
  return (
    <MainLayout title="Players">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">All Players</h1>
          <Button>Add New Player</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Player List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">John Doe</h3>
                <p className="text-sm text-gray-600">Age: 12, Parent: Jane Doe</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Sarah Smith</h3>
                <p className="text-sm text-gray-600">Age: 10, Parent: Mike Smith</p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Alex Johnson</h3>
                <p className="text-sm text-gray-600">Age: 14, Parent: Lisa Johnson</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}