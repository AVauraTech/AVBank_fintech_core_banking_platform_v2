"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  CreditCard,
  FileText,
  MessageSquare,
  BarChart3,
  LogOut,
  X,
  AlertTriangle,
} from "lucide-react";
import { clearAuth } from "@/lib/auth";
import toast from "react-hot-toast";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowUpDown },
  { label: "Cards", href: "/dashboard/cards", icon: CreditCard },
  { label: "Loans", href: "/dashboard/loans", icon: FileText },
  { label: "Feedback", href: "/dashboard/feedback", icon: MessageSquare },
];

const adminNavItems: NavItem[] = [
  { label: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Loan Approvals", href: "/admin/loans", icon: FileText },
  { label: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowUpDown },
];

interface SidebarProps {
  isAdmin?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isAdmin = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = isAdmin ? adminNavItems : navItems;

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
    toast.success("Logged out successfully");
  };

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-white w-64 flex-shrink-0">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AV</span>
          </div>
          <span className="font-bold text-lg">AVBank</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-red-600/20 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
