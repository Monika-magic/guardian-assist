import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, UserRound, Phone } from "lucide-react";
import { sasn, useSASN } from "@/lib/sasn-store";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "SASN — Emergency Contacts" },
      { name: "description", content: "Manage your trusted emergency contacts." },
    ],
  }),
  component: Contacts,
});

function Contacts() {
  const { contacts } = useSASN();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("Family");

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    sasn.addContact({ name: name.trim(), phone: phone.trim(), relation });
    sasn.pushEvent("success", `Contact added: ${name.trim()}`);
    setName(""); setPhone(""); setRelation("Family");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Trusted Network</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Emergency Contacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">These people receive your live location during an alert.</p>
      </div>

      <form onSubmit={add} className="glass-card flex flex-col gap-3 rounded-2xl p-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Sister, friend, neighbor..."
            className="rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 ..."
              className="rounded-xl border border-border bg-input/50 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Relation</label>
            <select
              value={relation}
              onChange={e => setRelation(e.target.value)}
              className="rounded-xl border border-border bg-input/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option>Family</option>
              <option>Friend</option>
              <option>Authority</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add to Network
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {contacts.length} saved
        </p>
        {contacts.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
            No contacts yet. Add your first trusted person.
          </div>
        )}
        {contacts.map(c => (
          <div key={c.id} className="glass-card flex items-center gap-3 rounded-2xl p-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {c.relation}
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {c.phone}
              </p>
            </div>
            <button
              onClick={() => sasn.removeContact(c.id)}
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
