import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PaymentCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">December 2024</h4>
              <p className="text-sm text-muted-foreground">$175.00</p>
            </div>
            <Button size="sm" variant="outline">Pay Now</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">November 2024</h4>
              <p className="text-sm text-green-600">Paid</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}