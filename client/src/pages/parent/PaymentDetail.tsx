import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowLeft, CheckCircle, Clock, AlertCircle, Calendar, DollarSign, User } from "lucide-react";
import { api } from "@/lib/api";

interface PaymentDetail {
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
  notes: string | null;
  stripePaymentIntentId: string | null;
}

export default function PaymentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/parent/payments/${id}`],
    queryFn: () => api.get(`/parent/payments/${id}`),
    enabled: !!id,
  });

  const payment: PaymentDetail | undefined = data?.data;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case "overdue":
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
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
      month: "long",
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
          <span className="text-gray-700 font-medium">Loading payment details...</span>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Not Found</h2>
              <p className="text-gray-600">Unable to load payment details.</p>
              <Button onClick={() => navigate("/parent/payments")} className="mt-4">
                Back to Payments
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/parent/payments")}
          className="mb-6 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>

        {/* Payment Detail Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Payment Details</h1>
                <p className="text-blue-100">Invoice #{payment.id}</p>
              </div>
              <div className={`px-4 py-2 rounded-full border-2 text-sm font-semibold flex items-center gap-2 ${getStatusColor(payment.status)} bg-white`}>
                {getStatusIcon(payment.status)}
                <span className="capitalize">{payment.status}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Amount Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Amount</span>
              </div>
              <p className="text-4xl font-bold text-gray-900">{formatAmount(payment.amount)}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Student</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{payment.kidName}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Month</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{payment.month || "—"}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Due Date</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{formatDate(payment.dueDate)}</p>
              </div>

              {payment.paidDate && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Paid Date</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(payment.paidDate)}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">Payment Type</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 capitalize">{payment.paymentType.replace(/_/g, " ")}</p>
              </div>

              {payment.paymentMethod && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Payment Method</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{payment.paymentMethod}</p>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {payment.notes && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Notes</h3>
                <p className="text-gray-900">{payment.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
