"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Lightbulb, Loader2, Pencil, ScanSearch, Sparkles, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";
import ScoreRing from "@/components/ScoreRing";

const PRIORITY = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

function Bar({ label, score, max }) {
  const pct = max ? Math.round((score / max) * 100) : 0;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-indigo-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500">{score}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width .6s" }} />
      </div>
    </div>
  );
}

export default function Analyzer() {
  const { ready } = useRequireAuth();
  const params = useSearchParams();
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState(params.get("resume") || "");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    if (!ready) return;
    Promise.all([api("/resumes"), api("/ai/status")])
      .then(([r, s]) => {
        setResumes(r.resumes);
        setProvider(s.provider);
        setResumeId((cur) => cur || r.resumes[0]?._id || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ready]);

  async function analyze(e) {
    e?.preventDefault();
    if (!resumeId) return;
    setAnalyzing(true);
    setError("");
    try {
      setResult(await api("/ai/analyze", { method: "POST", body: { resumeId, jobDescription: jd } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (!ready || loading) return <Spinner />;

  const ats = result?.ats;
  const insights = result?.insights;
  const b = ats?.breakdown;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ScanSearch className="text-indigo-600" /> AI Resume Analyzer & ATS Checker</h1>
          <p className="text-slate-500">Score your resume with rule-based ATS checks and job-description keyword matching, plus AI suggestions.</p>
        </div>
        {provider && (
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            AI engine: {provider === "fallback" ? "built-in rule-based" : provider}
          </span>
        )}
      </div>

      {resumes.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="font-medium">You don&apos;t have any resumes yet.</p>
          <Link href="/builder" className="btn-primary mt-4">Create a resume</Link>
        </div>
      ) : (
        <form onSubmit={analyze} className="card mt-6 grid gap-4 p-5 md:grid-cols-3">
          <div>
            <label className="label" htmlFor="resume">Resume</label>
            <select id="resume" className="input" value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>{r.title}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary mt-4 w-full" disabled={analyzing || !resumeId}>
              {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {analyzing ? "Analyzing..." : "Analyze resume"}
            </button>
            {resumeId && (
              <Link href={`/builder/${resumeId}`} className="btn-ghost mt-2 w-full"><Pencil size={14} /> Edit this resume</Link>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="jd">Job description (optional, recommended)</label>
            <textarea
              id="jd"
              className="input"
              rows={7}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here to get keyword matching and a tailored ATS score..."
            />
          </div>
        </form>
      )}

      {error && <div className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {ats && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card flex flex-col items-center p-6 text-center">
            <h2 className="mb-4 font-semibold">ATS Score</h2>
            <ScoreRing score={ats.score} />
            <div className="mt-3 text-lg font-bold">{ats.grade}</div>
            <p className="mt-1 text-sm text-slate-500">
              {b.keywords.score === null ? "Score based on structure & content. Add a job description for keyword matching." : `Keyword match rate: ${b.keywords.matchRate}%`}
            </p>
            <div className="mt-6 w-full space-y-3 text-left">
              {b.keywords.score !== null && <Bar label="Keyword match" score={b.keywords.score} max={40} />}
              <Bar label="Sections" score={b.sections.score} max={20} />
              <Bar label="Content quality" score={b.content.score} max={20} />
              <Bar label="Contact info" score={b.contact.score} max={10} />
              <Bar label="Formatting & length" score={b.formatting.score} max={10} />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {insights && (
              <div className="card p-6">
                <h2 className="flex items-center gap-2 font-semibold"><Sparkles size={18} className="text-violet-600" /> AI Insights</h2>
                <p className="mt-2 text-slate-600">{insights.overview}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="flex items-center gap-1 text-sm font-semibold text-emerald-700"><ThumbsUp size={14} /> Strengths</h3>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {insights.strengths?.map((s) => <li key={s} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1 text-sm font-semibold text-rose-700"><ThumbsDown size={14} /> Weaknesses</h3>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {insights.weaknesses?.length ? insights.weaknesses.map((s) => <li key={s} className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />{s}</li>) : <li className="text-slate-500">No major weaknesses found.</li>}
                    </ul>
                  </div>
                </div>
                {insights.suggestions?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="flex items-center gap-1 text-sm font-semibold text-indigo-700"><Lightbulb size={14} /> Suggestions</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{insights.suggestions.map((s) => <li key={s}>{s}</li>)}</ul>
                  </div>
                )}
                <p className="mt-4 text-xs text-slate-400">Generated by: {insights.provider}</p>
              </div>
            )}

            {b.keywords.score !== null && (
              <div className="card p-6">
                <h2 className="font-semibold">Keyword matching</h2>
                <p className="text-sm text-slate-500">{b.keywords.matched.length} of {b.keywords.keywords.length} job-description keywords found in your resume.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-emerald-700">Matched</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {b.keywords.matched.map((k) => <span key={k} className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700"><CheckCircle2 size={12} />{k}</span>)}
                      {!b.keywords.matched.length && <span className="text-sm text-slate-400">None</span>}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-rose-700">Missing</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {b.keywords.missing.map((k) => <span key={k} className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs text-rose-700"><XCircle size={12} />{k}</span>)}
                      {!b.keywords.missing.length && <span className="text-sm text-slate-400">None — great match!</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6">
              <h2 className="font-semibold">Improvement recommendations</h2>
              <ul className="mt-3 space-y-2">
                {ats.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase ${PRIORITY[r.priority]}`}>{r.priority}</span>
                    <span><span className="font-medium text-slate-500">{r.area}:</span> {r.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card grid gap-4 p-6 sm:grid-cols-3">
              <div><div className="text-2xl font-bold">{b.content.details.actionVerbRatio}%</div><div className="text-sm text-slate-500">Bullets with action verbs</div></div>
              <div><div className="text-2xl font-bold">{b.content.details.quantifiedRatio}%</div><div className="text-sm text-slate-500">Quantified bullets</div></div>
              <div><div className="text-2xl font-bold">{b.formatting.words}</div><div className="text-sm text-slate-500">Total words</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
