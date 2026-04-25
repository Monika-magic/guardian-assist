import { createFileRoute } from "@tanstack/react-router";
import { Activity, Bell, Clock, ShieldCheck, TrendingUp, Sparkles, Zap } from "lucide-react";
import { useSASN } from "@/lib/sasn-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "SASN — Insights Dashboard" },
      { name: "description", content: "System status, total alerts, and live monitoring metrics." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { alerts, activeAlertId, contacts, timeline } = useSASN();
  const last = alerts[0];
  const aiCount = alerts.filter(a => a.trigger === "ai").length;
  const manualCount = alerts.length - aiCount;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Insights</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Network Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time monitoring across your safety mesh.</p>
      </div>

      {/* Status hero */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 ${activeAlertId ? "border-danger/40 bg-danger/10" : "border-success/30 bg-success/5"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">System Status</p>
            <p className="mt-1 text-2xl font-bold">{activeAlertId ? "ALERT ACTIVE" : "ALL SYSTEMS NORMAL"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeAlertId ? "Broadcasting to your network" : "Background monitoring engaged"}
            </p>
          </div>
          <div className={`grid h-14 w-14 place-items-center rounded-2xl ${activeAlertId ? "bg-danger/20 text-danger animate-pulse-soft" : "bg-success/15 text-success"}`}>
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<Bell className="h-4 w-4" />} label="Total Alerts" value={alerts.length} accent="danger" />
        <Metric icon={<Sparkles className="h-4 w-4" />} label="AI Triggered" value={aiCount} accent="accent" />
        <Metric icon={<Zap className="h-4 w-4" />} label="Manual SOS" value={manualCount} accent="primary" />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Contacts" value={contacts.length} accent="success" />
      </div>

      {/* Last activity */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Last Activity</span>
        </div>
        {last ? (
          <>
            <p className="mt-2 text-sm font-semibold">
              {last.trigger === "ai" ? "AI-detected distress" : "Manual SOS trigger"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(last.startedAt).toLocaleString()} · {last.coords.length} location pings
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No alerts on record yet.</p>
        )}
      </div>

      {/* Sponsor / integrations */}
      <div className="glass-card rounded-2xl p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Active Integrations</p>
        <div className="mt-3 flex flex-col gap-2.5">
          <Integration name="n8n Workflow Engine" status="Online" detail="Alert fan-out · 12ms avg" />
          <Integration name="Trae AI Detection" status="Monitoring" detail="Distress model v2.1" />
          <Integration name="Geo Mesh" status="Streaming" detail="10s ping interval" />
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recent Events</p>
        </div>
        <div className="glass-card divide-y divide-border rounded-2xl">
          {timeline.slice(0, 6).map(ev => (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <p className="flex-1 truncate text-xs">{ev.message}</p>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(ev.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">No events recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: "danger" | "accent" | "primary" | "success" }) {
  const colors = {
    danger: "text-danger bg-danger/10",
    accent: "text-accent bg-accent/10",
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
  } as const;
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${colors[accent]}`}>{icon}</div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Integration({ name, status, detail }: { name: string; status: string; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-[11px] text-muted-foreground">{detail}</p>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-success">{status}</span>
    </div>
  );
}
