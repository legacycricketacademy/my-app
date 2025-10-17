import { ConnectChildDialog } from '@/components/parent/ConnectChildDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserPlus, CheckCircle2 } from 'lucide-react';

export default function ConnectChildPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connect Child</h1>
          <p className="text-gray-600">Link your account to your child's player account.</p>
        </div>
        <ConnectChildDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            How to Connect
          </CardTitle>
          <CardDescription>
            Follow these steps to connect your account to your child's player account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium">Click "Connect Child"</h3>
                <p className="text-sm text-gray-600">
                  Use the button above to open the connection dialog.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium">Enter Child's Email</h3>
                <p className="text-sm text-gray-600">
                  Provide the email address associated with your child's player account.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium">Wait for Approval</h3>
                <p className="text-sm text-gray-600">
                  The connection request will be reviewed by academy administrators.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Benefits of Connecting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span>View your child's training schedule and attendance</span>
            </li>
            <li className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span>Track progress and performance metrics</span>
            </li>
            <li className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span>Receive announcements and updates</span>
            </li>
            <li className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              <span>Manage payments and fees</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
