import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Search, Download, Filter, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

// Mock payment data
const mockPayments = [
  {
    id: '1',
    parentName: 'John Smith',
    parentEmail: 'john.smith@email.com',
    amount: 150.00,
    status: 'completed',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-001234',
    date: '2024-01-20',
    description: 'Monthly Training Fee - January 2024',
    childName: 'Alex Smith'
  },
  {
    id: '2',
    parentName: 'Sarah Johnson',
    parentEmail: 'sarah.johnson@email.com',
    amount: 75.00,
    status: 'pending',
    paymentMethod: 'Bank Transfer',
    transactionId: 'TXN-001235',
    date: '2024-01-19',
    description: 'Equipment Fee',
    childName: 'Emma Johnson'
  },
  {
    id: '3',
    parentName: 'Mike Wilson',
    parentEmail: 'mike.wilson@email.com',
    amount: 200.00,
    status: 'completed',
    paymentMethod: 'PayPal',
    transactionId: 'TXN-001236',
    date: '2024-01-18',
    description: 'Tournament Registration Fee',
    childName: 'Jake Wilson'
  },
  {
    id: '4',
    parentName: 'Emily Davis',
    parentEmail: 'emily.davis@email.com',
    amount: 100.00,
    status: 'failed',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-001237',
    date: '2024-01-17',
    description: 'Monthly Training Fee - January 2024',
    childName: 'Sophie Davis'
  },
  {
    id: '5',
    parentName: 'David Brown',
    parentEmail: 'david.brown@email.com',
    amount: 125.00,
    status: 'completed',
    paymentMethod: 'Debit Card',
    transactionId: 'TXN-001238',
    date: '2024-01-16',
    description: 'Coaching Session Fee',
    childName: 'Oliver Brown'
  }
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.parentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || payment.paymentMethod === filterMethod;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge variant="default" className="bg-red-100 text-red-800">Failed</Badge>;
      case 'refunded':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Credit Card':
      case 'Debit Card':
        return <CreditCard className="h-4 w-4" />;
      case 'PayPal':
        return <DollarSign className="h-4 w-4" />;
      case 'Bank Transfer':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <MainLayout title="Manage Payments">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Payments</h1>
              <p className="text-muted-foreground">
                Review payments and financial reports
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button>
                <DollarSign className="mr-2 h-4 w-4" />
                Process Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Completed payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Awaiting processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">All payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Payment success</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by parent name, email, child name, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Methods</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Transaction</th>
                    <th className="text-left py-3 px-4 font-medium">Parent</th>
                    <th className="text-left py-3 px-4 font-medium">Child</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Method</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{payment.transactionId}</div>
                          <div className="text-sm text-gray-500">{payment.description}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{payment.parentName}</div>
                          <div className="text-sm text-gray-500">{payment.parentEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{payment.childName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-lg">${payment.amount.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.paymentMethod)}
                          <span className="text-sm">{payment.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {payment.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              Process
                            </Button>
                          )}
                          {payment.status === 'failed' && (
                            <Button variant="outline" size="sm">
                              Retry
                            </Button>
                          )}
                          {payment.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              Refund
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No payments found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Payment Failed</p>
                    <p className="text-sm text-yellow-600">Transaction TXN-001237 failed for Emily Davis</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-600">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Payment Completed</p>
                    <p className="text-sm text-green-600">$150.00 received from John Smith</p>
                  </div>
                </div>
                <span className="text-sm text-green-600">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">New Payment</p>
                    <p className="text-sm text-blue-600">$75.00 pending from Sarah Johnson</p>
                  </div>
                </div>
                <span className="text-sm text-blue-600">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
