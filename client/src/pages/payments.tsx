import React from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentsPage() {
  return (
    <MainLayout title="Payments">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">John Doe - December 2024</h3>
                <p className="text-sm text-gray-600">Amount: $175.00</p>
                <p className="text-sm text-gray-600">Status: Pending</p>
                <Button size="sm" className="mt-2">Send Reminder</Button>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Sarah Smith - December 2024</h3>
                <p className="text-sm text-gray-600">Amount: $200.00</p>
                <p className="text-sm text-gray-600">Status: Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}