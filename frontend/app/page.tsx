import Link from "next/link";
import { ArrowRight, Shield, Zap, TrendingUp, CreditCard } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AV</span>
          </div>
          <span className="text-white font-bold text-xl">AVBank</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition">
            Sign In
          </Link>
          <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm mb-6">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          Production-Grade Cloud FinTech Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Banking,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Reimagined
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Modernized from a monolithic core into high-performance FastAPI microservices,
          real-time WebSocket notifications, AI-powered fraud anomaly detection, and automated EMI loan amortizations.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition group"
          >
            Open an Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Shield, title: "Fraud Detection", desc: "Real-time velocity and threshold checks with distributed Redis counters", color: "text-green-400" },
          { icon: Zap, title: "Instant Transfers", desc: "ACID transactions with zero discrepancy ledger logging and sub-millisecond lookups", color: "text-yellow-400" },
          { icon: TrendingUp, title: "Analytics Engine", desc: "Live business intelligence charts with month-over-month growth curves", color: "text-blue-400" },
          { icon: CreditCard, title: "Cards & Loans", desc: "Card lifecycle state machine and monthly EMI loan schedule generator", color: "text-purple-400" },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
            <Icon className={`w-8 h-8 ${color} mb-4`} />
            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
