"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, FileText, LayoutTemplate, ScanSearch, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

const features = [
  { icon: FileText, title: "Smart Resume Builder", text: "Fill personal details, education, experience, skills, projects and certifications with a live preview." },
  { icon: Sparkles, title: "AI Writing Assistant", text: "Generate professional summaries, rewrite bullet points and fix grammar in one click." },
  { icon: ScanSearch, title: "ATS Checker", text: "Rule-based scoring and job-description keyword matching show exactly what recruiters' software sees." },
  { icon: LayoutTemplate, title: "3 Professional Templates", text: "Switch between Modern, Classic and Minimal designs instantly." },
  { icon: Download, title: "PDF Export", text: "Download a pixel-perfect, print-ready PDF of your resume." },
  { icon: ShieldCheck, title: "Secure & Private", text: "JWT authentication and bcrypt-hashed passwords keep your data safe." },
];

const steps = ["Create an account", "Build your resume", "Analyze with AI & ATS", "Download PDF"];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Sparkles size={14} /> AI-powered • ATS-optimized
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-5xl">
              Build a resume that gets <span className="text-amber-300">shortlisted</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-indigo-100">
              ResumeX AI helps students and professionals create polished resumes, improve them with AI, and check ATS compatibility against any job description.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="btn bg-white px-6 py-3 text-indigo-700 hover:bg-indigo-50">
                Get started free <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">I have an account</Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rotate-2 rounded-2xl bg-white p-6 text-slate-800 shadow-2xl">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="text-xl font-bold">Aarav Sharma</div>
                  <div className="text-sm text-indigo-600">Full Stack Developer</div>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">ATS 92</div>
              </div>
              {["Experience", "Projects", "Skills"].map((s) => (
                <div key={s} className="mt-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{s}</div>
                  <div className="mt-2 h-2 w-full rounded bg-slate-200" />
                  <div className="mt-2 h-2 w-4/5 rounded bg-slate-200" />
                  <div className="mt-2 h-2 w-3/5 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">Everything you need to land interviews</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">From the first draft to the final PDF, ResumeX AI guides you at every step.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6 transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">{i + 1}</div>
                <div className="mt-3 font-medium">{s}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/register" className="btn-primary px-6 py-3">Create your resume now <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} ResumeX AI – Smart Resume Builder & ATS Analyzer
      </footer>
    </div>
  );
}
