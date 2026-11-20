"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const { login, register, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (isRegister && form.password !== form.confirm) return setError("Passwords do not match");
    setSubmitting(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 px-4 py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isRegister ? "Start building your AI-powered resume in minutes." : "Log in to continue building your resume."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" className="input" required value={form.name} onChange={set("name")} placeholder="Aarav Sharma" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required minLength={6} value={form.password} onChange={set("password")} placeholder="At least 6 characters" />
          </div>
          {isRegister && (
            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" className="input" required minLength={6} value={form.confirm} onChange={set("confirm")} />
            </div>
          )}
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
            {submitting ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? "Already have an account? " : "New to ResumeX AI? "}
          <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-indigo-600 hover:underline">
            {isRegister ? "Log in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
