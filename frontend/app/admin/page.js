"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, FileText, Search, Shield, ShieldOff, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Icon size={16} /> {label}</div>
      <div className="mt-1 text-2xl font-bold">{value ?? "—"}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const { user: me, ready } = useRequireAuth({ admin: true });
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query = "") => {
    try {
      const [s, u] = await Promise.all([api("/admin/stats"), api(`/admin/users?q=${encodeURIComponent(query)}`)]);
      setStats(s);
      setUsers(u.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function update(id, body) {
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body });
      load(q);
    } catch (err) {
      setError(err.message);
    }
  }
  async function remove(u) {
    if (!confirm(`Delete ${u.email} and all their resumes?`)) return;
    try {
      await api(`/admin/users/${u._id}`, { method: "DELETE" });
      load(q);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!ready || loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Shield className="text-indigo-600" /> Admin panel</h1>
      <p className="text-slate-500">Manage users and monitor platform activity.</p>
      {error && <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total users" value={stats?.totalUsers} sub={`${stats?.newUsersLast7Days} new this week`} />
        <Stat icon={UserCheck} label="Active users" value={stats?.activeUsers} sub={`${stats?.admins} admin(s)`} />
        <Stat icon={FileText} label="Total resumes" value={stats?.totalResumes} sub={`${stats?.newResumesLast7Days} new this week`} />
        <Stat
          icon={BarChart3}
          label="Avg. ATS score"
          value={stats?.averageAtsScore}
          sub={Object.entries(stats?.templateUsage || {}).map(([k, v]) => `${k}: ${v}`).join(" · ") || "No templates used yet"}
        />
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <h2 className="font-semibold">Users</h2>
          <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input className="input pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button className="btn-secondary">Search</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Resumes</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u._id === me._id;
                return (
                  <tr key={u._id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name}{self && <span className="ml-1 text-xs text-slate-400">(you)</span>}</div>
                      <div className="text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{u.isActive ? "Active" : "Disabled"}</span>
                    </td>
                    <td className="px-4 py-3">{u.resumeCount}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {!self && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => update(u._id, { role: u.role === "admin" ? "user" : "admin" })} className="btn-ghost px-2 py-1" title={u.role === "admin" ? "Remove admin" : "Make admin"}>
                            {u.role === "admin" ? <ShieldOff size={15} /> : <Shield size={15} />}
                          </button>
                          <button onClick={() => update(u._id, { isActive: !u.isActive })} className="btn-ghost px-2 py-1" title={u.isActive ? "Disable" : "Enable"}>
                            {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                          <button onClick={() => remove(u)} className="btn-ghost px-2 py-1 text-rose-600 hover:bg-rose-50" title="Delete"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!users.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
