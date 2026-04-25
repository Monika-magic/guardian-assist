import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, MapPin, ExternalLink, ShieldCheck, Activity, Sparkles, AlertTriangle, Volume2, MessageSquare, Phone, Bell, Send, Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { sasn, useSASN, type TimelineEvent, type Delivery } from "@/lib/sasn-store";
import { mapsUrl } from "@/lib/geo";
import { speak, stopMic, stopSpeaking } from "@/lib/media";
import { buildSmsHref, buildTelHref, openNativeHref } from "@/lib/contact-links";
import { LiveCamera } from "@/components/LiveCamera";

export const Route = createFileRoute("/alert")({
  head: () => ({
    meta: [
      { title: "SASN — Active Alert" },
      { name: "description", content: "Live alert console with location, recording, and event log." },
    ],
  }),
  component: AlertScreen,
});

function AlertScreen() {
  const { activeAlertId, alerts, currentCoords, recording, timeline, contacts } = useSASN();
  const alert = alerts.find(a => a.id === activeAlertId) ?? alerts[0];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!alert || alert.endedAt) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - alert.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [alert]);

  if (!alert) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <ShieldCheck className="h-12 w-12 text-success" />
        <p className="mt-4 text-lg font-semibold">All clear</p>
        <p className="mt-1 text-sm text-muted-foreground">No active alerts. You're safe.</p>
        <Link to="/" className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          Back to home
        </Link>
      </div>
    );
  }

  const isActive = !alert.endedAt;
  const coords = currentCoords ?? alert.coords[alert.coords.length - 1];
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Header banner */}
      <div className={`relative overflow-hidden rounded-3xl border p-5 ${isActive ? "border-danger/40 bg-gradient-to-br from-danger/15 via-danger/5 to-transparent" : "border-success/30 bg-success/5"}`}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-danger/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            {isActive ? <AlertTriangle className="h-5 w-5 text-danger animate-pulse-soft" /> : <CheckCircle2 className="h-5 w-5 text-success" />}
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {alert.trigger === "ai" ? "AI Triggered" : "Manual SOS"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {isActive ? "Alert Sent Successfully" : "Alert Resolved"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isActive ? `Broadcasting to ${contacts.length} contacts · ${fmt(elapsed)}` : `Ended at ${new Date(alert.endedAt!).toLocaleTimeString()}`}
          </p>
          {isActive && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => speak("Alert. The user is in danger. Location has been shared.")}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider backdrop-blur transition-colors hover:bg-foreground/20"
              >
                <Volume2 className="h-4 w-4" /> Replay Voice Alert
              </button>
              <button
                onClick={() => {
                  stopMic();
                  stopSpeaking();
                  sasn.stopAlert();
                  sasn.pushEvent("success", "Alert resolved by user");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider backdrop-blur transition-colors hover:bg-foreground/20"
              >
                <ShieldCheck className="h-4 w-4" /> Mark Safe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Location card */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live Location</span>
          </div>
          <span className="font-mono text-[10px] text-success">● streaming</span>
        </div>

        {coords && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="rounded-xl bg-background/40 p-2.5">
                <p className="text-muted-foreground">LAT</p>
                <p className="mt-0.5 text-sm text-foreground">{coords.lat.toFixed(6)}</p>
              </div>
              <div className="rounded-xl bg-background/40 p-2.5">
                <p className="text-muted-foreground">LNG</p>
                <p className="mt-0.5 text-sm text-foreground">{coords.lng.toFixed(6)}</p>
              </div>
            </div>

            {/* Faux map */}
            <div className="relative mt-3 h-40 overflow-hidden rounded-xl border border-border bg-background/40">
              <div
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage: `linear-gradient(oklch(0.62 0.245 25 / 0.15) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.245 25 / 0.15) 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.62_0.245_25/0.25),transparent_60%)]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="pulse-ring relative h-3 w-3 rounded-full bg-danger" />
              </div>
              {/* trail of recent pings */}
              {alert.coords.slice(-6).map((c, i) => {
                const last = alert.coords[alert.coords.length - 1];
                if (!last) return null;
                const dx = (c.lng - last.lng) * 80000;
                const dy = (c.lat - last.lat) * -80000;
                return (
                  <div
                    key={c.ts}
                    className="absolute h-1.5 w-1.5 rounded-full bg-accent"
                    style={{
                      left: `calc(50% + ${dx}px)`,
                      top: `calc(50% + ${dy}px)`,
                      opacity: 0.3 + (i / 6) * 0.7,
                    }}
                  />
                );
              })}
              <div className="absolute bottom-2 left-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {alert.coords.length} pings
              </div>
            </div>

            <a
              href={mapsUrl(coords)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-secondary/80"
            >
              Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>

      {/* Recording + AI strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full bg-danger ${recording ? "animate-blink" : ""}`} />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Audio</span>
          </div>
          <p className="mt-2 text-sm font-semibold">{recording ? "Recording in progress" : "Stopped"}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Encrypted · simulated</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Trae AI</span>
          </div>
          <p className="mt-2 text-sm font-semibold">Monitoring</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Distress model active</p>
        </div>
      </div>

      {/* Live video */}
      <LiveCamera active={isActive} />

      {/* Per-contact delivery feed */}
      <DeliveryPanel deliveries={alert.deliveries} mapsLink={coords ? mapsUrl(coords) : ""} />
      <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
          <Activity className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">n8n workflow executed</p>
          <p className="text-[11px] text-muted-foreground">SMS · Email · Police API · Contact ping fan-out</p>
        </div>
        <span className="font-mono text-[10px] text-success">200 OK</span>
      </div>

      {/* Timeline */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Event Timeline</p>
        <div className="flex flex-col gap-2">
          {timeline.slice(0, 12).map(ev => <TimelineRow key={ev.id} ev={ev} />)}
          {timeline.length === 0 && (
            <p className="text-xs text-muted-foreground">No events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ ev }: { ev: TimelineEvent }) {
  const colors: Record<TimelineEvent["type"], string> = {
    info: "bg-muted-foreground",
    danger: "bg-danger",
    success: "bg-success",
    ai: "bg-accent",
  };
  return (
    <div className="glass-card flex items-start gap-3 rounded-xl p-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[ev.type]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug">{ev.message}</p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          {new Date(ev.ts).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

function DeliveryPanel({ deliveries, mapsLink }: { deliveries: Delivery[]; mapsLink: string }) {
  // Group deliveries by contact
  const byContact = new Map<string, Delivery[]>();
  for (const d of deliveries) {
    const arr = byContact.get(d.contactId) ?? [];
    arr.push(d);
    byContact.set(d.contactId, arr);
  }

  const total = deliveries.length;
  const delivered = deliveries.filter(d => d.status === "delivered").length;
  const pct = total ? Math.round((delivered / total) * 100) : 0;

  const smsMessage = `🚨 EMERGENCY — I need help. My live location: ${mapsLink}`;

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Contact Delivery Feed
          </span>
        </div>
        <span className="font-mono text-[10px] text-success">
          {delivered}/{total} delivered
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-danger to-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {byContact.size === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Waiting for broadcast… add contacts to receive alerts.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {Array.from(byContact.entries()).map(([cid, ds]) => {
          const head = ds[0];
          const smsHref = buildSmsHref(head.phone, smsMessage);
          const telHref = buildTelHref(head.phone);
          return (
            <div key={cid} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{head.contactName}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{head.phone}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (openNativeHref(smsHref)) {
                        sasn.pushEvent("success", `Native SMS composer opened for ${head.contactName}`);
                      }
                    }}
                    disabled={!smsHref}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                    title="Send SMS now"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (openNativeHref(telHref)) {
                        sasn.pushEvent("success", `Native call opened for ${head.contactName}`);
                      }
                    }}
                    disabled={!telHref}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-success/15 text-success transition-colors hover:bg-success/25"
                    title="Call now"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {ds.map(d => (
                  <ChannelChip key={d.id} d={d} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Tap <MessageSquare className="inline h-3 w-3" /> or <Phone className="inline h-3 w-3" /> to send the alert
        from your device. Automated relay is simulated above.
      </p>
    </div>
  );
}

function ChannelChip({ d }: { d: Delivery }) {
  const channelIcon = {
    sms: <MessageSquare className="h-3 w-3" />,
    push: <Bell className="h-3 w-3" />,
    call: <Phone className="h-3 w-3" />,
  }[d.channel];

  const statusIcon =
    d.status === "delivered" ? <Check className="h-3 w-3" />
    : d.status === "sent" ? <Send className="h-3 w-3" />
    : d.status === "failed" ? <AlertTriangle className="h-3 w-3" />
    : <Clock className="h-3 w-3 animate-pulse-soft" />;

  const tone =
    d.status === "delivered" ? "border-success/40 bg-success/10 text-success"
    : d.status === "sent" ? "border-accent/40 bg-accent/10 text-accent"
    : d.status === "failed" ? "border-danger/40 bg-danger/10 text-danger"
    : "border-border bg-background/40 text-muted-foreground";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${tone}`}>
      {channelIcon}
      <span>{d.channel}</span>
      <span className="opacity-60">·</span>
      {statusIcon}
      <span>{d.status}</span>
    </span>
  );
}
