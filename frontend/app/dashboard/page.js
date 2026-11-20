"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, FilePlus2, FileText, Pencil, ScanSearch, Sparkles, Trash2, Trophy, BarChart3 } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { sampleResume, TEMPLATES } from "@/lib/resume";
import Spinner from "@/components/Spinner";
import ProfileCard from "@/components/ProfileCard";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value ?? "—"}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

const scoreBadge = (s) =>
  s >= 85 ? "bg-emerald-100 text-emerald-700" : s >= 70 ? "bg-indigo-100 text-indigo-700" : s >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";

export default function DashboardPage() {
  const { user, ready } = useRequireAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api("/resumes"), api("/resumes/stats")]);
      setResumes(r.resumes);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function createSample() {
    const { resume } = await api("/resumes", { method: "POST", body: sampleResume() });
    router.push(`/builder/${resume._id}`);
  }
  async function duplicate(id) {
    await api(`/resumes/${id}/duplicate`, { method: "POST" });
    load();
  }
  async function remove(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api(`/resumes/${id}`, { method: "DELETE" });
    load();
  }

  if (!ready || loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="text-slate-500">Manage your resumes and track your ATS performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={createSample} className="btn-secondary"><Sparkles size={16} /> Try a sample</button>
          <Link href="/builder" className="btn-primary"><FilePlus2 size={16} /> New resume</Link>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Saved resumes" value={stats?.totalResumes} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={ScanSearch} label="Analyzed" value={stats?.analyzedResumes} color="bg-sky-50 text-sky-600" />
        <StatCard icon={BarChart3} label="Average ATS score" value={stats?.averageAtsScore} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Trophy} label="Best ATS score" value={stats?.bestAtsScore} color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Your resumes</h2>
          {resumes.length === 0 ? (
            <div className="card flex flex-col items-center p-10 text-center">
              <FileText size={40} className="text-slate-300" />
              <p className="mt-3 font-medium">No resumes yet</p>
              <p className="text-sm text-slate-500">Create your first resume or start from a sample.</p>
              <Link href="/builder" className="btn-primary mt-4"><FilePlus2 size={16} /> Create resume</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {resumes.map((r) => (
                <div key={r._id} className="card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{r.title}</h3>
                      <p className="truncate text-sm text-slate-500">{r.personal?.fullName || "No name"} · {r.personal?.jobTitle || "No title"}</p>
                    </div>
                    {typeof r.lastAtsScore === "number" && (
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreBadge(r.lastAtsScore)}`}>ATS {r.lastAtsScore}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded bg-slate-100 px-2 py-0.5">{TEMPLATES.find((t) => t.id === r.template)?.name || r.template}</span>
                    <span>Updated {new Date(r.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Link href={`/builder/${r._id}`} className="btn-secondary px-3 py-1.5"><Pencil size={14} /> Edit</Link>
                    <Link href={`/analyzer?resume=${r._id}`} className="btn-secondary px-3 py-1.5"><ScanSearch size={14} /> Analyze</Link>
                    <button onClick={() => duplicate(r._id)} className="btn-ghost px-2 py-1.5" title="Duplicate" aria-label="Duplicate"><Copy size={14} /></button>
                    <button onClick={() => remove(r._id, r.title)} className="btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50" title="Delete" aria-label="Delete"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside>
          <ProfileCard />
        </aside>
      </div>
    </div>
  );
}
