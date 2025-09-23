import React from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AddPlayerPage() {
  return (
    <MainLayout title="Add New Player">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input placeholder="Enter first name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input placeholder="Enter last name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <Input type="number" placeholder="Enter age" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Email
                </label>
                <Input type="email" placeholder="Enter parent email" />
              </div>
              <Button type="submit">Add Player</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}