"use client";

/**
 * Admin panel — login-protected in-site management area.
 * Access via #/admin.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io } from "socket.io-client";
import {
  BadgeDollarSign,
  Briefcase,
  Building2,
  Images,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Package,
  Phone,
  ReceiptText,
  ClipboardList,
  Info,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminFetchOrders,
  adminFetchQuotes,
  adminLogin,
  adminLogout,
  adminSession,
  adminStats,
} from "@/lib/api";
import { formatPKR } from "@/lib/format";
import { SITE } from "@/lib/constants";
import { AdminProducts } from "./admin-products";
import { AdminOrders } from "./admin-orders";
import { AdminQuotes } from "./admin-quotes";
import { AdminClients } from "./admin-clients";
import { AdminServices } from "./admin-services";
import { AdminPortfolio } from "./admin-portfolio";
import { AdminSettings } from "./admin-settings";
import { AdminAbout } from "./admin-about";
import type { Order, QuoteRequest } from "@/lib/types";

type Tab = "dashboard" | "products" | "orders" | "quotes" | "clients" | "services" | "portfolio" | "about" | "settings";

type NewOrderEvent = {
  orderNumber: string;
  customerName: string;
  phone?: string;
  city?: string;
  subtotal?: number;
  paymentMethod?: string;
  itemCount?: number;
  firstItem?: string;
  at?: string;
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ReceiptText },
  { id: "quotes", label: "Quote Requests", icon: ClipboardList },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "portfolio", label: "Portfolio", icon: Images },
  { id: "about", label: "About Us", icon: Info },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminView() {
  const [authState, setAuthState] = useState<"checking" | "login" | "panel">("checking");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({ orders: 0, quotes: 0 });
  const seenQuotes = useRef<Set<string>>(new Set());

  useEffect(() => {
    adminSession()
      .then((s) => setAuthState(s.authenticated ? "panel" : "login"))
      .catch(() => setAuthState("login"));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [s, o, q] = await Promise.all([adminStats(), adminFetchOrders(), adminFetchQuotes()]);
      setStats(s);
      setOrders(o);
      setQuotes(q);
    } catch {
      // non-critical
    }
  }, []);

  const markTabRead = useCallback((nextTab: Tab) => {
    setTab(nextTab);
    setUnreadCounts((current) => {
      if (nextTab === "orders") return { ...current, orders: 0 };
      if (nextTab === "quotes") return { ...current, quotes: 0 };
      return current;
    });
  }, []);

  useEffect(() => {
    // data fetch on auth change — setState happens async after await
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authState === "panel") refresh();
  }, [authState, refresh]);

  /* ---------- Live order notifications (socket.io via gateway) ---------- */
  const seenOrders = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (authState !== "panel") return;
    // Never use a port in the URL — the gateway reads XTransformPort
    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 20,
      timeout: 10000,
    });
    socket.on("new-order", (o: NewOrderEvent) => {
      if (!o?.orderNumber || seenOrders.current.has(o.orderNumber)) return;
      seenOrders.current.add(o.orderNumber);
      if (tab !== "orders") {
        setUnreadCounts((current) => ({ ...current, orders: current.orders + 1 }));
      }
      toast.success(`New order — ${o.orderNumber}`, {
        description: [
          o.customerName,
          o.city,
          o.subtotal !== undefined ? formatPKR(o.subtotal) : undefined,
          o.itemCount ? `${o.itemCount} item${o.itemCount === 1 ? "" : "s"}` : undefined,
          o.firstItem,
        ]
          .filter(Boolean)
          .join(" · "),
        duration: 15000,
        action: {
          label: "View Order",
          onClick: () => markTabRead("orders"),
        },
      });
      void refresh(); // dashboard stats + orders list update instantly
    });
    return () => {
      socket.disconnect();
    };
  }, [authState, refresh, tab]);

  /* Keep the panel live even when the optional socket service is offline. */
  useEffect(() => {
    if (authState !== "panel") return;

    let initialized = false;
    let quotesInitialized = false;
    const checkForNewOrders = async () => {
      try {
        const [latestOrders, latestQuotes] = await Promise.all([adminFetchOrders(), adminFetchQuotes()]);
        if (!initialized) {
          latestOrders.forEach((order) => seenOrders.current.add(order.orderNumber));
          initialized = true;
        }
        if (!quotesInitialized) {
          latestQuotes.forEach((quote) => seenQuotes.current.add(quote.reference));
          quotesInitialized = true;
        }

        const newOrders = latestOrders.filter((order) => !seenOrders.current.has(order.orderNumber));
        newOrders.forEach((order) => {
          seenOrders.current.add(order.orderNumber);
          if (tab !== "orders") {
            setUnreadCounts((current) => ({ ...current, orders: current.orders + 1 }));
          }
          toast.success(`New order — ${order.orderNumber}`, {
            description: `${order.customerName} · ${order.city} · ${formatPKR(order.subtotal)}`,
            duration: 15000,
            action: {
              label: "View Order",
              onClick: () => markTabRead("orders"),
            },
          });
        });

        const newQuotes = latestQuotes.filter((quote) => !seenQuotes.current.has(quote.reference));
        newQuotes.forEach((quote) => {
          seenQuotes.current.add(quote.reference);
          if (tab !== "quotes") {
            setUnreadCounts((current) => ({ ...current, quotes: current.quotes + 1 }));
          }
          toast.success(`New quote request — ${quote.reference}`, {
            description: `${quote.name} · ${quote.service} · ${quote.city}`,
            duration: 15000,
            action: {
              label: "View Quotes",
              onClick: () => markTabRead("quotes"),
            },
          });
        });

        if (newOrders.length > 0 || newQuotes.length > 0) await refresh();
      } catch {
        // The socket connection or the next polling pass can recover silently.
      }
    };

    void checkForNewOrders();
    const interval = window.setInterval(() => void checkForNewOrders(), 3000);
    return () => window.clearInterval(interval);
  }, [authState, refresh, tab]);

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (authState === "login") {
    return <AdminLogin onSuccess={() => setAuthState("panel")} />;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-zinc-950 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white lg:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle admin menu"
          >
            {sidebarOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="Madni Advertiser logo"
              width={48}
              height={48}
              className="h-11 w-11 object-contain"
            />
            <p className="text-[10px] font-bold tracking-[0.3em] text-primary">ADMIN&nbsp;PANEL</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="hidden text-xs font-bold text-zinc-400 hover:text-primary sm:block">
            ← View public site
          </a>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-white/20 bg-transparent text-xs font-bold text-white hover:bg-white/10 hover:text-white"
            onClick={async () => {
              await adminLogout().catch(() => {});
              setAuthState("login");
            }}
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 top-14 z-30 w-60 border-r bg-white pt-4 transition-transform lg:sticky lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ height: "calc(100vh - 3.5rem)" }}
          aria-label="Admin navigation"
        >
          <nav className="space-y-1 px-3">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  markTabRead(id);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-bold transition-colors ${
                  tab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                {(id === "orders" || id === "quotes") && unreadCounts[id] > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                      tab === id ? "bg-white text-primary" : "bg-primary text-primary-foreground"
                    }`}
                    aria-label={`${unreadCounts[id]} unread ${label.toLowerCase()}`}
                  >
                    {unreadCounts[id] > 99 ? "99+" : unreadCounts[id]}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mx-3 mt-8 rounded-xl bg-zinc-950 p-4 text-white">
            <p className="font-display text-sm font-bold">Need help?</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Contact support at {SITE.phone} if anything looks off.
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 lg:p-8">
          {tab === "dashboard" && (
            <AdminDashboard stats={stats} orders={orders} quotes={quotes} onGo={setTab} />
          )}
          {tab === "products" && <AdminProducts />}
          {tab === "orders" && <AdminOrders orders={orders} refresh={refresh} />}
          {tab === "quotes" && <AdminQuotes quotes={quotes} refresh={refresh} />}
          {tab === "clients" && <AdminClients />}
          {tab === "services" && <AdminServices />}
          {tab === "portfolio" && <AdminPortfolio />}
          {tab === "about" && <AdminAbout />}
          {tab === "settings" && <AdminSettings onUpdated={() => setAuthState("login")} />}
        </main>
      </div>
    </div>
  );
}

/* ================= Login ================= */
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Enter username and password");
      return;
    }
    setLoading(true);
    try {
      await adminLogin(username, password);
      toast.success("Welcome back!");
      onSuccess();
    } catch {
      toast.error("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo.png"
            alt="Madni Advertiser logo"
            width={96}
            height={96}
            className="mx-auto h-20 w-20 object-contain"
          />
          <h1 className="mt-4 font-display text-2xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm text-zinc-400">Madni Advertiser — staff access only</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
          <div className="space-y-1.5">
            <Label htmlFor="admin-user" className="text-zinc-300">Username</Label>
            <Input
              id="admin-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="border-white/10 bg-zinc-950 text-white placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-pass" className="text-zinc-300">Password</Label>
            <Input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="border-white/10 bg-zinc-950 text-white placeholder:text-zinc-600"
            />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            Sign In
          </Button>
          <p className="text-center text-xs">
            <a href="/" className="text-zinc-500 hover:text-primary">← Back to public site</a>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ================= Dashboard ================= */
function AdminDashboard({
  stats,
  orders,
  quotes,
  onGo,
}: {
  stats: Awaited<ReturnType<typeof adminStats>> | null;
  orders: Order[];
  quotes: QuoteRequest[];
  onGo: (tab: Tab) => void;
}) {
  const cards = [
    { label: "Products", value: stats?.products ?? "—", icon: Package, tab: "products" as Tab },
    { label: "Total Orders", value: stats?.orders ?? "—", icon: ReceiptText, tab: "orders" as Tab },
    { label: "Pending Orders", value: stats?.pendingOrders ?? "—", icon: ReceiptText, tab: "orders" as Tab },
    { label: "New Quotes", value: stats?.newQuotes ?? "—", icon: ClipboardList, tab: "quotes" as Tab },
    { label: "Revenue", value: stats ? formatPKR(stats.revenue) : "—", icon: BadgeDollarSign, tab: "orders" as Tab },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of shop activity — today and all-time.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tab }) => (
          <button
            key={label}
            onClick={() => onGo(tab)}
            className="rounded-2xl border bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="mt-3 font-display text-2xl font-bold text-zinc-900">{value}</p>
            <p className="mt-0.5 text-xs font-medium text-zinc-500">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-display text-base font-bold text-zinc-900">Recent Orders</h2>
            <Button variant="ghost" size="sm" className="font-bold text-primary" onClick={() => onGo("orders")}>
              View All
            </Button>
          </div>
          <ul className="max-h-80 divide-y overflow-y-auto scrollbar-thin">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-primary">{o.orderNumber}</p>
                  <p className="truncate text-sm font-semibold text-zinc-800">{o.customerName}</p>
                  <p className="flex items-center gap-1 text-xs text-zinc-400">
                    <Phone className="h-3 w-3" aria-hidden="true" /> {o.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">{formatPKR(o.subtotal)}</p>
                  <p className="text-xs text-zinc-500">{o.city}</p>
                </div>
              </li>
            ))}
            {orders.length === 0 && <li className="px-5 py-10 text-center text-sm text-zinc-400">No orders yet.</li>}
          </ul>
        </section>

        {/* Recent quotes */}
        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-display text-base font-bold text-zinc-900">Recent Quote Requests</h2>
            <Button variant="ghost" size="sm" className="font-bold text-primary" onClick={() => onGo("quotes")}>
              View All
            </Button>
          </div>
          <ul className="max-h-80 divide-y overflow-y-auto scrollbar-thin">
            {quotes.slice(0, 6).map((q) => (
              <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-primary">{q.reference}</p>
                  <p className="truncate text-sm font-semibold text-zinc-800">{q.name} — {q.service}</p>
                  <p className="truncate text-xs text-zinc-400">{q.details}</p>
                </div>
                <p className="shrink-0 text-xs font-medium text-zinc-500">{q.city}</p>
              </li>
            ))}
            {quotes.length === 0 && <li className="px-5 py-10 text-center text-sm text-zinc-400">No quote requests yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
