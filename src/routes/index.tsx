import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Siren, Sparkles, MapPin, Mic, Wifi } from "lucide-react";
import { useEffect, useRef } from "react";
import { sasn, useSASN } from "@/lib/sasn-store";
import { driftCoords, getCurrentLocation } from "@/lib/geo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SASN — Home" },
      { name: "description", content: "Tap SOS to alert your network instantly." },
    ],
  }),
  component: Home,
});

function Home() {
  const { activeAlertId, currentCoords, contacts, aiEnabled } = useSASN();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live tracking interval while alert is active
  useEffect(() => {
    if (!activeAlertId) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      const last = currentCoords;
      if (last) {
        const next = driftCoords(last);
        sasn.setCoords(next);
        sasn.pushEvent("info", `Location ping → ${next.lat.toFixed(4)}, ${next.lng.toFixed(4)}`);
      }
    }, 10000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeAlertId, currentCoords]);

  async function triggerSOS(trigger: "manual" | "ai") {
    if (activeAlertId) { navigate({ to: "/alert" }); return; }
    sasn.pushEvent(trigger === "ai" ? "ai" : "danger",
      trigger === "ai" ? "AI detected distress situation" : "Manual SOS triggered");
    const coords = await getCurrentLocation();
    sasn.setCoords(coords);
    sasn.startAlert(trigger, coords);
    sasn.pushEvent("success", `Alert dispatched to ${contacts.length} contacts`);
    sasn.pushEvent("info", "Alert processed via automated workflow (n8n)");
    sasn.pushEvent("info", "Audio recording started");
    navigate({ to: "/alert" });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Stay <span className="text-gradient-danger">protected</span>.
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {activeAlertId ? "Alert active — your network is responding." : "Your safety network is monitoring in the background."}
        </p>
      </div>

      {/* SOS Button */}
      <div className="relative grid place-items-center py-8">
        <div className={`relative ${activeAlertId ? "pulse-ring" : ""}`}>
          <button
            onClick={() => triggerSOS("manual")}
            className="sos-glow group relative grid h-52 w-52 place-items-center rounded-full bg-gradient-to-br from-primary via-primary to-[oklch(0.45_0.22_18)] text-primary-foreground transition-transform duration-300 active:scale-95"
          >
            <div className="absolute inset-2 rounded-full border border-primary-foreground/20" />
            <div className="flex flex-col items-center gap-1.5">
              <Siren className="h-12 w-12 transition-transform group-hover:scale-110" strokeWidth={2.2} />
              <span className="text-3xl font-bold tracking-tight">SOS</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-80">
                {activeAlertId ? "active" : "tap to alert"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* AI simulate */}
      <button
        onClick={() => triggerSOS("ai")}
        disabled={!aiEnabled}
        className="glass-card group flex items-center justify-between rounded-2xl px-5 py-4 transition-all hover:border-accent/60 disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Simulate Danger (AI)</p>
            <p className="text-xs text-muted-foreground">Trae AI · distress detection enabled</p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Run →</span>
      </button>

      {/* Status grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatusCard icon={<MapPin className="h-4 w-4" />} label="Location" value={currentCoords ? "Live" : "Idle"} active={!!currentCoords} />
        <StatusCard icon={<Mic className="h-4 w-4" />} label="Audio" value={activeAlertId ? "REC" : "Off"} active={!!activeAlertId} pulse={!!activeAlertId} />
        <StatusCard icon={<Wifi className="h-4 w-4" />} label="Network" value="Online" active />
      </div>

      {/* Sponsor strip */}
      <div className="glass-card rounded-2xl p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Powered by</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Pill label="n8n · automated workflow" />
          <Pill label="Trae · AI detection" />
          <Pill label="SASN · live mesh" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, active, pulse }: { icon: React.ReactNode; label: string; value: string; active?: boolean; pulse?: boolean }) {
  return (
    <div className="glass-card rounded-2xl p-3">
      <div className={`flex items-center gap-1.5 ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${pulse ? "animate-pulse-soft text-danger" : active ? "text-success" : "text-muted-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  );
}
