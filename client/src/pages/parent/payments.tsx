import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface Payment {
  id: number;
  kidId: number;
  kidName: string;
  amount: string;
  paymentType: string;
  month: string | null;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentMethod: string | null;
}

export default function Payments() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/parent/payments"],
    queryFn: () => api.get("/parent/payments"),
  });

  const payments: Payment[] = data?.data || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-700 font-medium" data-testid="loading-payments">Loading payments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="error-heading">Error Loading Payments</h2>
              <p className="text-gray-600">Unable to load payment information. Please try again.</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">No Payments Yet</h2>
              <p className="text-gray-600">You don't have any payment records at this time.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
          <p className="text-gray-600">View and manage your payment history</p>
        </div>

        {/* Mobile View - Cards */}
        <div className="block lg:hidden space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              onClick={() => navigate(`/parent/payments/${payment.id}`)}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`payment-card-${payment.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{payment.kidName}</h3>
                  <p className="text-sm text-gray-600">{payment.month || "—"}</p>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                  {getStatusIcon(payment.status)}
                  <span className="capitalize">{payment.status}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="font-semibold text-gray-900">{formatAmount(payment.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Due Date</span>
                  <span className="text-sm text-gray-900">{formatDate(payment.dueDate)}</span>
                </div>
                {payment.paidDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paid Date</span>
                    <span className="text-sm text-gray-900">{formatDate(payment.paidDate)}</span>
                  </div>
                )}
                {payment.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Method</span>
                    <span className="text-sm text-gray-900 capitalize">{payment.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kid Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Month</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Paid Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  onClick={() => navigate(`/parent/payments/${payment.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  data-testid={`payment-row-${payment.id}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.kidName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.month || "—"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatAmount(payment.amount)}</td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="capitalize">{payment.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.dueDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.paidDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{payment.paymentMethod || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
