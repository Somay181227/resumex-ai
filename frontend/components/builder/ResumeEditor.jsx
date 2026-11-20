"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Award, Briefcase, CheckCircle2, Download, Eye, FolderGit2, GraduationCap, LayoutTemplate, Pencil, Save, ScanSearch, User, Wrench,
} from "lucide-react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/auth";
import { blankItems, emptyResume, TEMPLATES } from "@/lib/resume";
import { printResume } from "@/lib/pdf";
import ResumeDocument from "@/components/templates";
import Spinner from "@/components/Spinner";
import { Accordion, AiButton, Field, ListEditor, SkillsInput, TextArea } from "./fields";

function GrammarPanel({ result, onApply, onClose }) {
  if (!result) return null;
  return (
    <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-violet-800">
          {result.issues.length ? `${result.issues.length} suggestion(s)` : "No issues found"}
        </span>
        <button type="button" onClick={onClose} className="text-xs text-violet-600 hover:underline">Close</button>
      </div>
      {result.issues.length > 0 && (
        <>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-violet-900">
            {result.issues.map((i, k) => (
              <li key={k}>{i.message}{i.examples?.length ? <span className="text-violet-500"> ({i.examples.join(", ")})</span> : null}</li>
            ))}
          </ul>
          <button type="button" onClick={onApply} className="btn-primary mt-3 px-3 py-1.5 text-xs">Apply corrected text</button>
        </>
      )}
    </div>
  );
}

export default function ResumeEditor({ id }) {
  const { user, ready } = useRequireAuth();
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [resumeId, setResumeId] = useState(id || null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState("");
  const [grammar, setGrammar] = useState(null);
  const [aiTips, setAiTips] = useState({});
  const [mobileView, setMobileView] = useState("edit");
  const previewBox = useRef(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    if (!ready) return;
    if (id) {
      api(`/resumes/${id}`)
        .then((d) => setResume(d.resume))
        .catch((err) => setError(err.message));
    } else {
      const r = emptyResume();
      const pr = user.profile || {};
      r.personal = { ...r.personal, fullName: user.name, email: user.email, phone: pr.phone || "", location: pr.location || "", linkedin: pr.linkedin || "", github: pr.github || "", website: pr.website || "", jobTitle: pr.headline || "" };
      setResume(r);
    }
  }, [ready, id, user]);

  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 794)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [resume]);

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = useCallback((p) => {
    setResume((r) => ({ ...r, ...p }));
    setDirty(true);
    setStatus("");
  }, []);
  const setPersonal = (k) => (v) => patch({ personal: { ...resume.personal, [k]: v } });

  const save = useCallback(async () => {
    if (!resume) return false;
    setSaving(true);
    setError("");
    try {
      if (resumeId) {
        const d = await api(`/resumes/${resumeId}`, { method: "PUT", body: resume });
        setResume(d.resume);
      } else {
        const d = await api("/resumes", { method: "POST", body: resume });
        setResume(d.resume);
        setResumeId(d.resume._id);
        window.history.replaceState(null, "", `/builder/${d.resume._id}`);
      }
      setDirty(false);
      setStatus("Saved");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [resume, resumeId]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  async function runAi(key, fn) {
    setAiBusy(key);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setAiBusy("");
    }
  }

  const generateSummary = () =>
    runAi("summary", async () => {
      const d = await api("/ai/summary", { method: "POST", body: { resume } });
      setPersonal("summary")(d.summary);
    });

  const grammarSummary = () =>
    runAi("grammar", async () => {
      const d = await api("/ai/grammar", { method: "POST", body: { text: resume.personal.summary } });
      setGrammar(d);
    });

  const improve = (section, index, item, update) =>
    runAi(`${section}-${index}`, async () => {
      const d = await api("/ai/improve", {
        method: "POST",
        body: { text: item.description, section, position: item.position || item.name },
      });
      update({ description: d.improved });
      setAiTips((t) => ({ ...t, [`${section}-${index}`]: d.tips || [] }));
    });

  function exportPdf() {
    const name = (resume.personal?.fullName || resume.title || "resume").trim().replace(/\s+/g, "_");
    printResume(`${name}_Resume`);
  }

  if (!ready || (!resume && !error)) return <Spinner />;
  if (!resume) return <div className="mx-auto max-w-xl p-8 text-center text-rose-600">{error} <Link href="/dashboard" className="underline">Back to dashboard</Link></div>;

  const p = resume.personal || {};

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Pencil size={16} className="shrink-0 text-slate-400" />
          <input
            aria-label="Resume title"
            className="min-w-0 flex-1 bg-transparent text-xl font-bold focus:outline-none"
            value={resume.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status && !dirty && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 size={14} /> {status}</span>}
          {dirty && <span className="text-sm text-amber-600">Unsaved changes</span>}
          {resumeId && (
            <button onClick={async () => { if (dirty && !(await save())) return; router.push(`/analyzer?resume=${resumeId}`); }} className="btn-secondary">
              <ScanSearch size={16} /> Analyze
            </button>
          )}
          <button onClick={exportPdf} className="btn-secondary">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={save} className="btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="mb-4 flex rounded-lg bg-slate-200 p-1 lg:hidden">
        {["edit", "preview"].map((v) => (
          <button key={v} onClick={() => setMobileView(v)} className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-sm font-medium capitalize ${mobileView === v ? "bg-white shadow" : "text-slate-600"}`}>
            {v === "edit" ? <Pencil size={14} /> : <Eye size={14} />} {v}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`min-w-0 space-y-4 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          <Accordion title="Template" icon={LayoutTemplate}>
            <div className="grid gap-3 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => patch({ template: t.id })}
                  className={`rounded-xl border-2 p-3 text-left transition ${resume.template === t.id ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className={`mb-2 h-14 rounded ${t.id === "modern" ? "bg-gradient-to-r from-slate-800 from-35% to-white to-35%" : t.id === "classic" ? "border-b-4 border-slate-800 bg-amber-50" : "bg-emerald-50"}`} />
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.description}</div>
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion title="Personal details" icon={User} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={p.fullName} onChange={setPersonal("fullName")} placeholder="Aarav Sharma" />
              <Field label="Job title" value={p.jobTitle} onChange={setPersonal("jobTitle")} placeholder="Full Stack Developer" />
              <Field label="Email" type="email" value={p.email} onChange={setPersonal("email")} placeholder="you@example.com" />
              <Field label="Phone" value={p.phone} onChange={setPersonal("phone")} placeholder="+91 98765 43210" />
              <Field label="Location" value={p.location} onChange={setPersonal("location")} placeholder="Bengaluru, India" />
              <Field label="LinkedIn" value={p.linkedin} onChange={setPersonal("linkedin")} placeholder="linkedin.com/in/you" />
              <Field label="GitHub" value={p.github} onChange={setPersonal("github")} placeholder="github.com/you" />
              <Field label="Website" value={p.website} onChange={setPersonal("website")} placeholder="yourportfolio.dev" />
            </div>
            <div className="mt-3">
              <TextArea
                label="Professional summary"
                value={p.summary}
                onChange={setPersonal("summary")}
                placeholder="2–4 sentences about your experience, skills and goals."
                actions={
                  <>
                    <AiButton onClick={generateSummary} loading={aiBusy === "summary"}>Generate</AiButton>
                    <AiButton onClick={grammarSummary} loading={aiBusy === "grammar"}>Grammar</AiButton>
                  </>
                }
              />
              <GrammarPanel
                result={grammar}
                onClose={() => setGrammar(null)}
                onApply={() => {
                  setPersonal("summary")(grammar.corrected);
                  setGrammar(null);
                }}
              />
            </div>
          </Accordion>

          <Accordion title="Education" icon={GraduationCap} count={resume.education.length}>
            <ListEditor
              items={resume.education}
              onChange={(education) => patch({ education })}
              blank={blankItems.education}
              addLabel="Add education"
              itemTitle={(e, i) => e.institution || `Education ${i + 1}`}
              renderItem={(e, up) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Institution" value={e.institution} onChange={(v) => up({ institution: v })} className="sm:col-span-2" />
                  <Field label="Degree" value={e.degree} onChange={(v) => up({ degree: v })} placeholder="B.Tech" />
                  <Field label="Field of study" value={e.field} onChange={(v) => up({ field: v })} placeholder="Computer Science" />
                  <Field label="Start" value={e.startDate} onChange={(v) => up({ startDate: v })} placeholder="2021" />
                  <Field label="End" value={e.endDate} onChange={(v) => up({ endDate: v })} placeholder="2025" />
                  <Field label="Grade / CGPA" value={e.grade} onChange={(v) => up({ grade: v })} placeholder="8.5 CGPA" className="sm:col-span-2" />
                </div>
              )}
            />
          </Accordion>

          <Accordion title="Experience" icon={Briefcase} count={resume.experience.length}>
            <ListEditor
              items={resume.experience}
              onChange={(experience) => patch({ experience })}
              blank={blankItems.experience}
              addLabel="Add experience"
              itemTitle={(e, i) => e.position || e.company || `Experience ${i + 1}`}
              renderItem={(e, up, i) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Position" value={e.position} onChange={(v) => up({ position: v })} placeholder="Software Intern" />
                  <Field label="Company" value={e.company} onChange={(v) => up({ company: v })} />
                  <Field label="Location" value={e.location} onChange={(v) => up({ location: v })} className="sm:col-span-2" />
                  <Field label="Start" value={e.startDate} onChange={(v) => up({ startDate: v })} placeholder="Jan 2024" />
                  <Field label="End" value={e.current ? "Present" : e.endDate} onChange={(v) => up({ endDate: v })} placeholder="Jun 2024" />
                  <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                    <input type="checkbox" checked={!!e.current} onChange={(ev) => up({ current: ev.target.checked })} /> I currently work here
                  </label>
                  <div className="sm:col-span-2">
                    <TextArea
                      label="Description (one bullet per line)"
                      value={e.description}
                      onChange={(v) => up({ description: v })}
                      placeholder={"Developed REST APIs with Node.js serving 5k users\nReduced page load time by 30%"}
                      actions={<AiButton onClick={() => improve("experience", i, e, up)} loading={aiBusy === `experience-${i}`}>Improve with AI</AiButton>}
                    />
                    {aiTips[`experience-${i}`]?.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-violet-700">{aiTips[`experience-${i}`].map((t) => <li key={t}>{t}</li>)}</ul>
                    )}
                  </div>
                </div>
              )}
            />
          </Accordion>

          <Accordion title="Skills" icon={Wrench} count={resume.skills.length}>
            <SkillsInput skills={resume.skills} onChange={(skills) => patch({ skills })} />
          </Accordion>

          <Accordion title="Projects" icon={FolderGit2} count={resume.projects.length}>
            <ListEditor
              items={resume.projects}
              onChange={(projects) => patch({ projects })}
              blank={blankItems.projects}
              addLabel="Add project"
              itemTitle={(x, i) => x.name || `Project ${i + 1}`}
              renderItem={(x, up, i) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Project name" value={x.name} onChange={(v) => up({ name: v })} />
                  <Field label="Link" value={x.link} onChange={(v) => up({ link: v })} placeholder="github.com/you/project" />
                  <Field label="Technologies" value={x.technologies} onChange={(v) => up({ technologies: v })} placeholder="React, Node.js, MongoDB" className="sm:col-span-2" />
                  <div className="sm:col-span-2">
                    <TextArea
                      label="Description (one bullet per line)"
                      value={x.description}
                      onChange={(v) => up({ description: v })}
                      actions={<AiButton onClick={() => improve("project", i, x, up)} loading={aiBusy === `project-${i}`}>Improve with AI</AiButton>}
                    />
                    {aiTips[`project-${i}`]?.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-xs text-violet-700">{aiTips[`project-${i}`].map((t) => <li key={t}>{t}</li>)}</ul>
                    )}
                  </div>
                </div>
              )}
            />
          </Accordion>

          <Accordion title="Certifications" icon={Award} count={resume.certifications.length}>
            <ListEditor
              items={resume.certifications}
              onChange={(certifications) => patch({ certifications })}
              blank={blankItems.certifications}
              addLabel="Add certification"
              itemTitle={(c, i) => c.name || `Certification ${i + 1}`}
              renderItem={(c, up) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" value={c.name} onChange={(v) => up({ name: v })} className="sm:col-span-2" />
                  <Field label="Issuer" value={c.issuer} onChange={(v) => up({ issuer: v })} />
                  <Field label="Date" value={c.date} onChange={(v) => up({ date: v })} />
                  <Field label="Credential link" value={c.link} onChange={(v) => up({ link: v })} className="sm:col-span-2" />
                </div>
              )}
            />
          </Accordion>
        </div>

        <div className={`min-w-0 ${mobileView === "edit" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-20">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-1"><Eye size={14} /> Live preview · {TEMPLATES.find((t) => t.id === resume.template)?.name}</span>
            </div>
            <div ref={previewBox} className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
              <div style={{ height: 1123 * scale }}>
                <div className="origin-top-left shadow-lg" style={{ transform: `scale(${scale})`, width: 794 }}>
                  <ResumeDocument resume={resume} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <div className="print-root">
          <ResumeDocument resume={resume} />
        </div>,
        document.body
      )}
    </div>
  );
}
