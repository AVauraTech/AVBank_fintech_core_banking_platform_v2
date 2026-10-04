"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { accountApi, transactionApi } from "@/lib/api";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, AlertTriangle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function TransactionsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "deposit" | "withdraw">("history");
  const { register, handleSubmit, reset } = useForm<any>();

  useEffect(() => {
    accountApi
      .getMyAccounts()
      .then((res) => {
        setAccounts(res.data);
        if (res.data.length > 0) {
          setSelectedAccount(res.data[0].account_number);
          loadTransactions(res.data[0].account_number);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadTransactions = async (accountNumber: string) => {
    setTxLoading(true);
    try {
      const res = await transactionApi.getHistory(accountNumber);
      setTransactions(res.data);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  };

  const handleDeposit = async (data: any) => {
    try {
      await transactionApi.deposit({
        ...data,
        account_number: selectedAccount,
        amount: parseFloat(data.amount),
      });
      toast.success(`Deposited ${formatCurrency(parseFloat(data.amount))} successfully`);
      loadTransactions(selectedAccount);
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Deposit failed");
    }
  };

  const handleWithdraw = async (data: any) => {
    try {
      await transactionApi.withdraw({
        ...data,
        account_number: selectedAccount,
        amount: parseFloat(data.amount),
      });
      toast.success(`Withdrawn ${formatCurrency(parseFloat(data.amount))} successfully`);
      loadTransactions(selectedAccount);
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Withdrawal failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">Transactions Ledger</h1>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <div className="card">
            <label className="label">Select Account</label>
            <select
              className="input-field"
              value={selectedAccount}
              onChange={(e) => {
                setSelectedAccount(e.target.value);
                loadTransactions(e.target.value);
              }}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.account_number}>
                  {a.name} — {a.account_number} ({formatCurrency(a.total_balance)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(["history", "deposit", "withdraw"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition capitalize",
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab === "history"
                ? "Transaction History"
                : tab === "deposit"
                ? "Deposit Funds"
                : "Withdraw Funds"}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <div className="card">
            {txLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions found for this account</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.transaction_type === "deposit" ? "bg-green-100" : "bg-red-100"
                        )}
                      >
                        {tx.transaction_type === "deposit" ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 capitalize">{tx.transaction_type}</p>
                          {tx.is_flagged && (
                            <span className="badge-danger">
                              <AlertTriangle className="w-3 h-3 mr-1 inline" />
                              Security Review: {tx.fraud_reason || "Flagged"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(tx.created_at)} · via {tx.payment_method}
                          {tx.description ? ` · ${tx.description}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-bold",
                          tx.transaction_type === "deposit" ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {tx.transaction_type === "deposit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">Ledger Bal: {formatCurrency(tx.balance_after)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === "deposit" || activeTab === "withdraw") && (
          <div className="card max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {activeTab === "deposit" ? "Deposit Money" : "Withdraw Money"}
            </h2>
            <form
              onSubmit={handleSubmit(activeTab === "deposit" ? handleDeposit : handleWithdraw)}
              className="space-y-4"
            >
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  {...register("amount", { required: true, min: 1 })}
                  type="number"
                  step="0.01"
                  min="1"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select {...register("payment_method")} className="input-field">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online Transfer</option>
                </select>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <input
                  {...register("description")}
                  type="text"
                  className="input-field"
                  placeholder="e.g. Salary / Vendor Payment"
                />
              </div>
              <button
                type="submit"
                className={activeTab === "deposit" ? "btn-primary w-full" : "btn-danger w-full"}
              >
                {activeTab === "deposit" ? "Execute Deposit" : "Execute Withdrawal"}
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
