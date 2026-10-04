"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { accountApi, transactionApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CustomerDashboard() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    const load = async () => {
      try {
        const acctRes = await accountApi.getMyAccounts();
        setAccounts(acctRes.data);
        if (acctRes.data.length > 0) {
          const txRes = await transactionApi.getHistory(acctRes.data[0].account_number, 10);
          setTransactions(txRes.data);
        }
      } catch (e) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.total_balance || 0), 0);
  const totalDeposited = transactions
    .filter((t) => t.transaction_type === "deposit")
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions
    .filter((t) => t.transaction_type === "withdrawal")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.username} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time banking balance and transaction ledger</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Balance" value={formatCurrency(totalBalance)} icon={Wallet} color="blue" loading={loading} />
          <StatCard title="Active Accounts" value={accounts.length} icon={TrendingUp} color="green" loading={loading} />
          <StatCard title="Recent Deposits" value={formatCurrency(totalDeposited)} icon={ArrowDownLeft} color="green" loading={loading} />
          <StatCard title="Recent Withdrawals" value={formatCurrency(totalWithdrawn)} icon={ArrowUpRight} color="red" loading={loading} />
        </div>

        {/* Accounts Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Accounts</h2>
            <Link href="/dashboard/accounts" className="text-blue-600 text-sm hover:underline">Manage Accounts</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No bank account created yet</p>
              <Link href="/dashboard/accounts" className="btn-primary inline-block mt-3 text-sm">
                Open An Account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-xs text-gray-500">{account.account_number} · {account.account_type} · {account.branch}</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">{formatCurrency(account.total_balance)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-blue-600 text-sm hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No transactions recorded yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      tx.transaction_type === "deposit" ? "bg-green-100" : "bg-red-100"
                    )}>
                      {tx.transaction_type === "deposit" ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{tx.transaction_type}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-semibold text-sm", tx.transaction_type === "deposit" ? "text-green-600" : "text-red-600")}>
                      {tx.transaction_type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    {tx.is_flagged && <span className="badge-danger text-xs">Flagged</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
