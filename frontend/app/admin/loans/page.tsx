"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { loanApi } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      const res = await loanApi.getAllLoans();
      setLoans(res.data);
    } catch {
      toast.error("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (loanId: string, status: string, reason?: string) => {
    try {
      await loanApi.updateStatus(loanId, { status, rejection_reason: reason });
      toast.success(`Loan status updated to ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Status update failed");
    }
  };

  const filtered = filter === "all" ? loans : loans.filter((l) => l.status.toLowerCase() === filter);

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">Loan Underwriting & Approvals</h1>

        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium capitalize transition",
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-gray-400">No loans match the selected filter</p>
            </div>
          ) : (
            filtered.map((loan) => (
              <div key={loan.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{loan.loan_type} Loan</p>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          loan.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : loan.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {loan.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Principal: {formatCurrency(loan.loan_amount)} · Monthly EMI: {formatCurrency(loan.monthly_emi)} · {loan.loan_duration_months} Months ({loan.interest_rate}% p.a.)
                    </p>
                    <p className="text-xs text-gray-400">Application Date: {formatDate(loan.created_at)}</p>
                    {loan.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1 font-medium">Rejection Reason: {loan.rejection_reason}</p>
                    )}
                  </div>
                  {loan.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(loan.id, "Approved")}
                        className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() =>
                          updateStatus(loan.id, "Rejected", "Credit policy criteria not fulfilled")
                        }
                        className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
