"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { loanApi } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

const statusIcons: Record<string, any> = {
  Approved: { icon: CheckCircle, color: "text-green-600", badge: "badge-success" },
  Pending: { icon: Clock, color: "text-yellow-600", badge: "badge-warning" },
  Rejected: { icon: XCircle, color: "text-red-600", badge: "badge-danger" },
  Closed: { icon: FileText, color: "text-gray-600", badge: "badge-gray" },
};

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const { register, handleSubmit, reset } = useForm<any>();

  const loadLoans = async () => {
    try {
      const res = await loanApi.getMyLoans();
      setLoans(res.data);
    } catch {
      toast.error("Failed to load loan applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const onApply = async (data: any) => {
    try {
      await loanApi.apply({
        ...data,
        loan_amount: parseFloat(data.loan_amount),
        loan_duration_months: parseInt(data.loan_duration_months),
      });
      toast.success("Loan application submitted successfully!");
      setShowForm(false);
      reset();
      loadLoans();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to submit loan application");
    }
  };

  const viewSchedule = async (loanId: string) => {
    try {
      const res = await loanApi.getRepaymentSchedule(loanId);
      setSchedule(res.data);
      setSelectedLoanId(loanId);
    } catch {
      toast.error("Failed to load amortization schedule");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Loan Origination & Servicing</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            Apply for Loan
          </button>
        </div>

        {showForm && (
          <div className="card max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Loan Application Form</h2>
            <form onSubmit={handleSubmit(onApply)} className="space-y-4">
              <div>
                <label className="label">Loan Type</label>
                <select {...register("loan_type", { required: true })} className="input-field">
                  <option value="Personal">Personal Loan (12.0% p.a.)</option>
                  <option value="Home">Home Loan (8.5% p.a.)</option>
                  <option value="Car">Car Loan (9.5% p.a.)</option>
                  <option value="Education">Education Loan (7.0% p.a.)</option>
                  <option value="Business">Business Loan (14.0% p.a.)</option>
                </select>
              </div>
              <div>
                <label className="label">Principal Amount (₹)</label>
                <input
                  {...register("loan_amount", { required: true, min: 1 })}
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="label">Tenure (months)</label>
                <input
                  {...register("loan_duration_months", { required: true, min: 1, max: 360 })}
                  type="number"
                  className="input-field"
                  placeholder="24"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Submit Application</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Loans List */}
        <div className="space-y-4">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
          ) : loans.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active loans or pending applications.</p>
            </div>
          ) : (
            loans.map((loan) => {
              const s = statusIcons[loan.status] || statusIcons.Pending;
              const Icon = s.icon;
              return (
                <div key={loan.id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-6 h-6", s.color)} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{loan.loan_type} Loan</p>
                          <span className={s.badge}>{loan.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {loan.loan_duration_months} months · {loan.interest_rate}% p.a. · Applied {formatDate(loan.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.loan_amount)}</p>
                      <p className="text-sm text-gray-500">Monthly EMI: {formatCurrency(loan.monthly_emi)}</p>
                      <p className="text-xs text-gray-400">Total Payable: {formatCurrency(loan.total_repayment)}</p>
                      <button
                        onClick={() => viewSchedule(loan.id)}
                        className="text-blue-600 text-xs mt-1 hover:underline block ml-auto"
                      >
                        {selectedLoanId === loan.id ? "Hide Amortization" : "View Amortization Schedule"}
                      </button>
                    </div>
                  </div>

                  {/* Repayment Schedule */}
                  {selectedLoanId === loan.id && schedule.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 overflow-x-auto">
                      <h4 className="text-sm font-semibold mb-2">Monthly EMI Amortization Schedule</h4>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 border-b">
                            <th className="py-2 text-left">Month</th>
                            <th className="py-2 text-right">EMI</th>
                            <th className="py-2 text-right">Principal</th>
                            <th className="py-2 text-right">Interest</th>
                            <th className="py-2 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.slice(0, 12).map((row) => (
                            <tr key={row.month} className="border-b border-gray-50">
                              <td className="py-1.5">{row.month}</td>
                              <td className="py-1.5 text-right font-medium">{formatCurrency(row.emi_amount)}</td>
                              <td className="py-1.5 text-right">{formatCurrency(row.principal_component)}</td>
                              <td className="py-1.5 text-right">{formatCurrency(row.interest_component)}</td>
                              <td className="py-1.5 text-right">{formatCurrency(row.remaining_balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {schedule.length > 12 && (
                        <p className="text-xs text-gray-400 mt-2">Showing first 12 installments of {schedule.length} months.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
