"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/ui/StatCard";
import { analyticsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Users, Wallet, TrendingUp, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [distData, setDistData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, monthRes, distRes, growthRes] = await Promise.all([
          analyticsApi.dashboard(),
          analyticsApi.monthlyTransactions(),
          analyticsApi.accountDistribution(),
          analyticsApi.userGrowth(),
        ]);
        setSummary(sumRes.data);

        // Pivot monthly transactions for recharts
        const monthMap: Record<string, any> = {};
        for (const row of monthRes.data) {
          if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, deposit: 0, withdrawal: 0 };
          monthMap[row.month][row.transaction_type] = row.total_amount;
        }
        setMonthlyData(Object.values(monthMap));
        setDistData(distRes.data);
        setGrowthData(growthRes.data);
      } catch (e) {
        toast.error("Failed to load analytics suite");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Intelligence & BI Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Platform metrics, fiscal analytics, and risk monitoring</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Users" value={summary?.total_users ?? "0"} icon={Users} color="blue" loading={loading} />
          <StatCard title="Total Accounts" value={summary?.total_accounts ?? "0"} icon={Wallet} color="green" loading={loading} />
          <StatCard title="Total AUM" value={summary ? formatCurrency(summary.total_balance) : "₹0"} icon={TrendingUp} color="purple" loading={loading} />
          <StatCard title="Active Loans" value={summary?.approved_loans ?? "0"} icon={CheckCircle} color="green" loading={loading} />
          <StatCard title="Pending Review" value={summary?.pending_loans ?? "0"} icon={FileText} color="yellow" loading={loading} />
          <StatCard title="Flagged Anomalies" value={summary?.flagged_transactions ?? "0"} icon={AlertTriangle} color="red" loading={loading} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Transactions Bar Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Transaction Volume</h2>
            {loading ? (
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            ) : monthlyData.length === 0 ? (
              <p className="text-center text-gray-400 py-16">No monthly transaction data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="deposit" fill="#10b981" name="Deposits" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="withdrawal" fill="#ef4444" name="Withdrawals" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Account Distribution Pie Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Portfolio Distribution</h2>
            {loading ? (
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            ) : distData.length === 0 ? (
              <p className="text-center text-gray-400 py-16">No account distribution data recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={distData}
                    dataKey="count"
                    nameKey="account_type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ account_type, count }) => `${account_type}: ${count}`}
                  >
                    {distData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* User Growth Line Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform User Growth Trend</h2>
          {loading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : growthData.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No user registration history</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cumulative_users"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
