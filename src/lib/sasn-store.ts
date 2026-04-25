import { useSyncExternalStore } from "react";

export type Contact = { id: string; name: string; phone: string; relation: string };
export type Coords = { lat: number; lng: number; ts: number };
export type TimelineEvent = { id: string; ts: number; type: "info" | "danger" | "success" | "ai"; message: string };
export type Alert = { id: string; startedAt: number; endedAt?: number; trigger: "manual" | "ai"; coords: Coords[] };

type State = {
  contacts: Contact[];
  alerts: Alert[];
  activeAlertId: string | null;
  timeline: TimelineEvent[];
  currentCoords: Coords | null;
  recording: boolean;
  aiEnabled: boolean;
};

const STORAGE_KEY = "sasn-state-v1";

const defaultContacts: Contact[] = [
  { id: "c1", name: "Mom", phone: "+91 98765 43210", relation: "Family" },
  { id: "c2", name: "Police Helpline", phone: "112", relation: "Authority" },
];

let state: State = {
  contacts: defaultContacts,
  alerts: [],
  activeAlertId: null,
  timeline: [],
  currentCoords: null,
  recording: false,
  aiEnabled: true,
};

// hydrate from localStorage
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {}
}

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
const getSnapshot = () => state;

function set(updater: (s: State) => State) {
  state = updater(state);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }
  listeners.forEach(l => l());
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function useSASN() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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
    const alert: Alert = { id, startedAt: Date.now(), trigger, coords: coords ? [coords] : [] };
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
};
