"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";

export function Field({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input type={type} className="input" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 4, hint, actions }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="label mb-0">{label}</label>
        <div className="flex gap-1">{actions}</div>
      </div>
      <textarea className="input resize-y" rows={rows} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function AiButton({ onClick, loading, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {children}
    </button>
  );
}

export function Accordion({ title, icon: Icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 font-semibold">
          {Icon && <Icon size={18} className="text-indigo-600" />} {title}
          {typeof count === "number" && count > 0 && <span className="rounded-full bg-indigo-50 px-2 text-xs text-indigo-700">{count}</span>}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );
}

export function ListEditor({ items, onChange, blank, addLabel, renderItem, itemTitle }) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">{itemTitle(item, i)}</span>
            <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove">
              <Trash2 size={15} />
            </button>
          </div>
          {renderItem(item, (patch) => update(i, patch), i)}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { ...blank }])} className="btn-secondary w-full border-dashed">
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}

export function SkillsInput({ skills, onChange }) {
  const [value, setValue] = useState("");
  const add = (raw) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...skills];
    parts.forEach((p) => {
      if (!next.some((s) => s.toLowerCase() === p.toLowerCase())) next.push(p);
    });
    onChange(next);
    setValue("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          className="input"
          value={value}
          placeholder="Type a skill and press Enter (comma-separated works too)"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(value);
            }
          }}
        />
        <button type="button" className="btn-secondary" onClick={() => add(value)}>Add</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
            {s}
            <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))} className="text-indigo-400 hover:text-rose-600" aria-label={`Remove ${s}`}>
              ×
            </button>
          </span>
        ))}
        {!skills.length && <span className="text-sm text-slate-400">No skills added yet.</span>}
      </div>
    </div>
  );
}
