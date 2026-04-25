import { useSyncExternalStore } from "react";

export type Contact = { id: string; name: string; phone: string; relation: string };
export type Coords = { lat: number; lng: number; ts: number };
export type TimelineEvent = { id: string; ts: number; type: "info" | "danger" | "success" | "ai"; message: string };
export type DeliveryChannel = "sms" | "push" | "call";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed";
export type Delivery = {
  id: string;
  contactId: string;
  contactName: string;
  phone: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  ts: number;
};
export type Alert = {
  id: string;
  startedAt: number;
  endedAt?: number;
  trigger: "manual" | "ai";
  coords: Coords[];
  deliveries: Delivery[];
};

type State = {
  contacts: Contact[];
  alerts: Alert[];
  activeAlertId: string | null;
  timeline: TimelineEvent[];
  currentCoords: Coords | null;
  recording: boolean;
  aiEnabled: boolean;
};

const STORAGE_KEY = "sasn-state-v2";

const defaultContacts: Contact[] = [
  { id: "c1", name: "Mom", phone: "+91 98765 43210", relation: "Family" },
  { id: "c2", name: "Police Helpline", phone: "112", relation: "Authority" },
];

const initialState: State = {
  contacts: defaultContacts,
  alerts: [],
  activeAlertId: null,
  timeline: [],
  currentCoords: null,
  recording: false,
  aiEnabled: true,
};

// SSR-safe: server snapshot stays default; client hydrates from localStorage AFTER mount.
let state: State = initialState;
let serverSnapshot: State = initialState;
let hydrated = false;

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  // Lazy hydrate on first client subscription so SSR and first client render match.
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<State>;
        state = { ...initialState, ...saved };
        // Backfill deliveries on older alert records
        state.alerts = (state.alerts ?? []).map(a => ({ ...a, deliveries: a.deliveries ?? [] }));
        queueMicrotask(() => listeners.forEach(l => l()));
      }
    } catch {}
  }
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};
const getSnapshot = () => state;
const getServerSnapshot = () => serverSnapshot;

function set(updater: (s: State) => State) {
  state = updater(state);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  listeners.forEach(l => l());
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function useSASN() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const sasn = {
  addContact(c: Omit<Contact, "id">) {
    set(s => ({ ...s, contacts: [...s.contacts, { ...c, id: uid() }] }));
  },
  removeContact(id: string) {
    set(s => ({ ...s, contacts: s.contacts.filter(c => c.id !== id) }));
  },
  pushEvent(type: TimelineEvent["type"], message: string) {
    const ev: TimelineEvent = { id: uid(), ts: Date.now(), type, message };
    set(s => ({ ...s, timeline: [ev, ...s.timeline].slice(0, 50) }));
  },
  setCoords(c: Coords) {
    set(s => {
      const alerts = s.activeAlertId
        ? s.alerts.map(a => a.id === s.activeAlertId ? { ...a, coords: [...a.coords, c] } : a)
        : s.alerts;
      return { ...s, currentCoords: c, alerts };
    });
  },
  startAlert(trigger: "manual" | "ai", coords: Coords | null) {
    const id = uid();
    const alert: Alert = {
      id,
      startedAt: Date.now(),
      trigger,
      coords: coords ? [coords] : [],
      deliveries: [],
    };
    set(s => ({ ...s, activeAlertId: id, alerts: [alert, ...s.alerts], recording: true }));
    return id;
  },
  stopAlert() {
    set(s => ({
      ...s,
      activeAlertId: null,
      recording: false,
      alerts: s.alerts.map(a => a.id === s.activeAlertId ? { ...a, endedAt: Date.now() } : a),
    }));
  },
  toggleAI() {
    set(s => ({ ...s, aiEnabled: !s.aiEnabled }));
  },
  queueDelivery(d: Omit<Delivery, "id" | "ts" | "status"> & { status?: DeliveryStatus }) {
    const delivery: Delivery = {
      ...d,
      id: uid(),
      ts: Date.now(),
      status: d.status ?? "pending",
    };
    set(s => ({
      ...s,
      alerts: s.alerts.map(a =>
        a.id === s.activeAlertId ? { ...a, deliveries: [...a.deliveries, delivery] } : a
      ),
    }));
    return delivery.id;
  },
  updateDelivery(deliveryId: string, status: DeliveryStatus) {
    set(s => ({
      ...s,
      alerts: s.alerts.map(a => ({
        ...a,
        deliveries: a.deliveries.map(d => d.id === deliveryId ? { ...d, status, ts: Date.now() } : d),
      })),
    }));
  },
};

/**
 * Simulate fan-out delivery to every emergency contact across SMS / Push / Call.
 * Each delivery cycles pending → sent → delivered with realistic jitter so the UI
 * feels like a real broadcast pipeline.
 */
export function dispatchAlertToContacts(mapsLink: string) {
  const s = state;
  const channels: DeliveryChannel[] = ["sms", "push", "call"];
  s.contacts.forEach((c, ci) => {
    channels.forEach((ch, chi) => {
      const id = sasn.queueDelivery({ contactId: c.id, contactName: c.name, phone: c.phone, channel: ch });
      const baseDelay = 250 + ci * 180 + chi * 120 + Math.random() * 200;
      setTimeout(() => {
        sasn.updateDelivery(id, "sent");
        sasn.pushEvent("info", `${ch.toUpperCase()} → ${c.name} (${c.phone}) queued`);
      }, baseDelay);
      setTimeout(() => {
        sasn.updateDelivery(id, "delivered");
        sasn.pushEvent("success", `${ch.toUpperCase()} delivered to ${c.name}`);
      }, baseDelay + 600 + Math.random() * 700);
    });
  });
  sasn.pushEvent("info", `Location link broadcast: ${mapsLink}`);
}
