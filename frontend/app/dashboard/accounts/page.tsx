"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { accountApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Wallet, PlusCircle } from "lucide-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();

  const loadAccounts = async () => {
    try {
      const res = await accountApi.getMyAccounts();
      setAccounts(res.data);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await accountApi.create({
        ...data,
        initial_deposit: parseFloat(data.initial_deposit || "0"),
      });
      toast.success("Account created successfully!");
      setShowForm(false);
      reset();
      loadAccounts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to create account");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Accounts</h1>
          {accounts.length === 0 && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> Open Account
            </button>
          )}
        </div>

        {showForm && (
          <div className="card max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Open New Bank Account</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input {...register("account_number", { required: true })} className="input-field" placeholder="e.g. AVB1001" />
              </div>
              <div>
                <label className="label">Account Holder Name</label>
                <input {...register("name", { required: true })} className="input-field" placeholder="Full legal name" />
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input {...register("dob", { required: true })} type="date" className="input-field" />
              </div>
              <div>
                <label className="label">Gender</label>
                <select {...register("gender", { required: true })} className="input-field">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input {...register("city", { required: true })} className="input-field" placeholder="City" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input {...register("mobile_number", { required: true })} className="input-field" placeholder="10-digit number" />
              </div>
              <div>
                <label className="label">Branch</label>
                <input {...register("branch", { required: true })} className="input-field" placeholder="Main Branch" />
              </div>
              <div>
                <label className="label">Account Type</label>
                <select {...register("account_type", { required: true })} className="input-field">
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Initial Deposit (₹)</label>
                <input {...register("initial_deposit")} type="number" step="0.01" min="0" className="input-field" placeholder="0.00" />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="btn-primary">Submit Application</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)
          ) : accounts.length === 0 ? (
            <div className="card text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">You do not have an active bank account yet</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">Open Account Now</button>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{account.name}</p>
                      <p className="text-sm text-gray-500">{account.account_number} · {account.account_type} · Branch: {account.branch}</p>
                      <p className="text-xs text-gray-400">{account.city} · DOB: {formatDate(account.dob)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.total_balance)}</p>
                    <span className={account.is_active ? "badge-success" : "badge-danger"}>
                      {account.is_active ? "Active" : "Closed"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
