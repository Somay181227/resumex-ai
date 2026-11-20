"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const FIELDS = [
  ["headline", "Headline", "Aspiring Software Engineer"],
  ["phone", "Phone", "+91 98765 43210"],
  ["location", "Location", "Delhi, India"],
  ["linkedin", "LinkedIn", "linkedin.com/in/you"],
  ["github", "GitHub", "github.com/you"],
];

export default function ProfileCard() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [profile, setProfile] = useState(user.profile || {});
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const d = await api("/auth/profile", { method: "PUT", body: { name, profile } });
      setUser(d.user);
      setMsg("Profile saved");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"><UserRound size={20} /></div>
        <div className="min-w-0">
          <div className="truncate font-semibold">{user.name}</div>
          <div className="truncate text-sm text-slate-500">{user.email}{user.role === "admin" && " · Admin"}</div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {FIELDS.map(([k, label, ph]) => (
          <div key={k}>
            <label className="label">{label}</label>
            <input className="input" value={profile[k] || ""} placeholder={ph} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Saved profile details pre-fill new resumes.</p>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}
