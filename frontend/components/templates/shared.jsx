import { toBullets } from "@/lib/resume";

export const dateRange = (s, e, current) => [s, current ? "Present" : e].filter(Boolean).join(" – ");

export const contactItems = (p = {}) => [p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean);

export function Bullets({ text, className = "" }) {
  const items = toBullets(text);
  if (!items.length) return null;
  return (
    <ul className={`space-y-0.5 ${className}`}>
      {items.map((b, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden className="shrink-0">•</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

export const has = {
  education: (r) => (r.education || []).some((e) => e.institution || e.degree),
  experience: (r) => (r.experience || []).some((e) => e.company || e.position),
  projects: (r) => (r.projects || []).some((e) => e.name),
  certifications: (r) => (r.certifications || []).some((e) => e.name),
  skills: (r) => (r.skills || []).some(Boolean),
};
