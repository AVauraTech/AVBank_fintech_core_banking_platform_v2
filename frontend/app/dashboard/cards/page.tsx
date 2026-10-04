"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cardApi } from "@/lib/api";
import { formatDate, cn, maskCardNumber } from "@/lib/utils";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { CreditCard } from "lucide-react";

export default function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();

  const loadCards = async () => {
    try {
      const res = await cardApi.getMyCards();
      setCards(res.data);
    } catch {
      toast.error("Failed to fetch cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const onRequest = async (data: any) => {
    try {
      await cardApi.request(data);
      toast.success(`${data.card_type} card requested! Card issued in inactive state.`);
      setShowForm(false);
      reset();
      loadCards();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to request card");
    }
  };

  const toggleStatus = async (card: any) => {
    const newStatus = card.status === "active" ? "inactive" : "active";
    try {
      await cardApi.updateStatus(card.card_number, newStatus);
      toast.success(`Card updated to ${newStatus}`);
      loadCards();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to update status");
    }
  };

  const statusColor: Record<string, string> = {
    active: "badge-success",
    inactive: "badge-warning",
    blocked: "badge-danger",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Card Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            Request New Card
          </button>
        </div>

        {showForm && (
          <div className="card max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Request New Card</h2>
            <form onSubmit={handleSubmit(onRequest)} className="space-y-4">
              <div>
                <label className="label">Card Type</label>
                <select {...register("card_type", { required: true })} className="input-field">
                  <option value="Debit">Debit Card</option>
                  <option value="Credit">Credit Card</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">Issue Card</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)
          ) : cards.length === 0 ? (
            <div className="col-span-full card text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No cards registered yet. Click &quot;Request New Card&quot; to issue one.</p>
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className={cn(
                  "rounded-2xl p-6 text-white relative overflow-hidden shadow-lg",
                  card.card_type === "Credit"
                    ? "bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900"
                    : "bg-gradient-to-br from-blue-700 via-cyan-800 to-slate-900"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold tracking-wider text-xs uppercase bg-white/20 px-2 py-0.5 rounded">
                    AVBank
                  </span>
                  <span className="text-xs font-semibold">{card.card_type}</span>
                </div>
                <p className="font-mono text-lg tracking-widest my-6">
                  {maskCardNumber(card.card_number)}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-white/60">Expires</p>
                    <p className="text-sm font-medium">{formatDate(card.expiry_date)}</p>
                  </div>
                  <div className="text-right">
                    <span className={statusColor[card.status] || "badge-gray"}>
                      {card.status}
                    </span>
                    <button
                      onClick={() => toggleStatus(card)}
                      className="block text-xs text-white/90 hover:text-white underline mt-2"
                    >
                      {card.status === "active" ? "Deactivate" : "Activate"}
                    </button>
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
