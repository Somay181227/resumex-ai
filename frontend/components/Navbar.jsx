"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FileText, LayoutDashboard, LogOut, Menu, ScanSearch, Shield, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/builder", label: "Builder", icon: FileText },
        { href: "/analyzer", label: "ATS Analyzer", icon: ScanSearch },
        ...(user.role === "admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">X</span>
          ResumeX <span className="text-indigo-600">AI</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                pathname.startsWith(href) ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user ? (
            <div className="ml-3 flex items-center gap-3 border-l border-slate-200 pl-3">
              <span className="text-sm text-slate-600">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={logout} className="btn-ghost" aria-label="Logout">
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/register" className="btn-primary">Get Started</Link>
            </div>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Icon size={16} /> {label}
            </Link>
          ))}
          {user ? (
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50">
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100">Login</Link>
              <Link href="/register" className="block rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-100">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
