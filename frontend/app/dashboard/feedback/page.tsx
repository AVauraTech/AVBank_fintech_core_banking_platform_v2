"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { feedbackApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { MessageSquare, Star } from "lucide-react";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<any>();

  const load = async () => {
    try {
      const res = await feedbackApi.getMyFeedback();
      setFeedbacks(res.data);
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await feedbackApi.submit({ ...data, rating: parseInt(data.rating) });
      toast.success("Feedback submitted successfully!");
      reset();
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to submit feedback");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-slide-up">
        <h1 className="text-2xl font-bold text-gray-900">Customer Support & Feedback</h1>

        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold mb-4">Submit Service Feedback</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Subject</label>
              <input
                {...register("subject", { required: true })}
                className="input-field"
                placeholder="Banking experience or inquiry"
              />
            </div>
            <div>
              <label className="label">Rating</label>
              <select {...register("rating")} className="input-field">
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} {"★".repeat(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Comments</label>
              <textarea
                {...register("feedback_text", { required: true })}
                rows={4}
                className="input-field resize-none"
                placeholder="Share your experience or request assistance..."
              />
            </div>
            <button type="submit" className="btn-primary">Send Feedback</button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Submitted Feedback History</h2>
          {loading ? (
            [1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)
          ) : feedbacks.length === 0 ? (
            <div className="card text-center py-8">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No feedback submitted yet</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{fb.subject}</p>
                    <p className="text-sm text-gray-500 mt-1">{fb.feedback_text}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(fb.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 ml-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < fb.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                        }`}
                      />
                    ))}
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
