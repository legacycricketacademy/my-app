import React from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConnectionRequestsPage() {
  return (
    <MainLayout title="Connection Requests">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Connection Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Alex Brown</h3>
                <p className="text-sm text-gray-600">Requested to join: Under 12s team</p>
                <p className="text-sm text-gray-600">Date: 2024-09-20</p>
                <div className="mt-2 space-x-2">
                  <Button size="sm">Approve</Button>
                  <Button size="sm" variant="outline">Reject</Button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Emma Wilson</h3>
                <p className="text-sm text-gray-600">Requested to join: Over 12s team</p>
                <p className="text-sm text-gray-600">Date: 2024-09-19</p>
                <div className="mt-2 space-x-2">
                  <Button size="sm">Approve</Button>
                  <Button size="sm" variant="outline">Reject</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}