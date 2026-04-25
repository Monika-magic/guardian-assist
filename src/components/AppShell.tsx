import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Shield, Users, BarChart3, Siren } from "lucide-react";
import { useSASN } from "@/lib/sasn-store";

export function AppShell() {
  const { activeAlertId } = useSASN();
  const loc = useLocation();

  const tabs = [
    { to: "/", icon: Shield, label: "Home" },
    { to: "/contacts", icon: Users, label: "Contacts" },
    { to: "/alert", icon: Siren, label: "Alert" },
    { to: "/dashboard", icon: BarChart3, label: "Insights" },
  ] as const;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-background/80 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">SASN</p>
            <p className="text-sm font-semibold tracking-tight">Safety Network</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${activeAlertId ? "bg-danger animate-pulse-soft" : "bg-success"}`} />
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {activeAlertId ? "ALERT" : "SAFE"}
          </span>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 pt-6">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-4">
        <div className="glass-card flex items-center justify-around rounded-2xl px-2 py-2">
          {tabs.map(t => {
            const active = loc.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-300 ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
