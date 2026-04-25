import { useNavigate, useLocation } from "@tanstack/react-router";
import { Siren, Lock } from "lucide-react";
import { useState } from "react";
import { sasn, useSASN } from "@/lib/sasn-store";
import { getCurrentLocation } from "@/lib/geo";
import { speak, startMic } from "@/lib/media";

/**
 * Floating "Quick SOS" button — simulates a lock-screen overlay trigger.
 * Always visible, fixed position. One tap fires the full SOS flow without navigation friction.
 */
export function QuickSOS() {
  const { activeAlertId, contacts } = useSASN();
  const navigate = useNavigate();
  const loc = useLocation();
  const [busy, setBusy] = useState(false);

  // Hide on alert screen itself (it has its own controls)
  if (loc.pathname === "/alert") return null;

  async function fire() {
    if (busy) return;
    if (activeAlertId) { navigate({ to: "/alert" }); return; }
    setBusy(true);
    sasn.pushEvent("danger", "Quick SOS triggered (lock-screen overlay)");
    speak("Alert. The user is in danger. Location has been shared.");
    const coords = await getCurrentLocation();
    sasn.setCoords(coords);
    sasn.startAlert("manual", coords);
    sasn.pushEvent("success", `SMS sent to ${contacts.length} emergency contacts`);
    sasn.pushEvent("success", "Push notification sent");
    sasn.pushEvent("success", "Call alert triggered");
    sasn.pushEvent("info", "Alert dispatched via n8n automated workflow");
    const ok = await startMic();
    sasn.pushEvent(ok ? "success" : "info", ok ? "Microphone recording live audio" : "Audio recording (simulated — mic denied)");
    setBusy(false);
    navigate({ to: "/alert" });
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40 mx-auto max-w-md">
      <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
        <button
          onClick={fire}
          aria-label="Quick SOS lock-screen simulation"
          className={`group relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-danger to-[oklch(0.5_0.22_18)] text-primary-foreground shadow-[0_0_30px_oklch(0.62_0.27_25/0.55)] ring-2 ring-danger/40 transition-transform active:scale-90 ${activeAlertId ? "animate-pulse-soft" : ""}`}
        >
          <span className="absolute -inset-1 rounded-full border border-danger/40 animate-ping opacity-60" />
          <Siren className="h-6 w-6" strokeWidth={2.4} />
        </button>
        <span className="flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground backdrop-blur">
          <Lock className="h-2.5 w-2.5" /> Quick SOS
        </span>
      </div>
    </div>
  );
}
