import { Bullets, contactItems, dateRange, has } from "./shared";

function Section({ title, children }) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 border-b border-slate-800 text-[13px] font-bold uppercase tracking-[0.2em]">{title}</h2>
      {children}
    </section>
  );
}

export default function ClassicTemplate({ resume }) {
  const p = resume.personal || {};
  return (
    <div className="min-h-[1120px] px-12 py-10 font-serif text-[12px] leading-relaxed text-slate-900">
      <header className="mb-5 text-center">
        <h1 className="text-[28px] font-bold tracking-wide">{p.fullName || "Your Name"}</h1>
        {p.jobTitle && <p className="text-[13px] italic text-slate-700">{p.jobTitle}</p>}
        <p className="mt-1 text-[11px] text-slate-700">{contactItems(p).join("  |  ")}</p>
      </header>
      {p.summary && (
        <Section title="Summary">
          <p>{p.summary}</p>
        </Section>
      )}
      {has.education(resume) && (
        <Section title="Education">
          {resume.education.filter((e) => e.institution || e.degree).map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between gap-2">
                <span className="font-bold">{e.institution}</span>
                <span className="shrink-0">{dateRange(e.startDate, e.endDate)}</span>
              </div>
              <div className="flex justify-between gap-2 italic">
                <span>{[e.degree, e.field].filter(Boolean).join(", ")}</span>
                {e.grade && <span className="shrink-0">{e.grade}</span>}
              </div>
              {e.description && <p className="text-[11px]">{e.description}</p>}
            </div>
          ))}
        </Section>
      )}
      {has.experience(resume) && (
        <Section title="Professional Experience">
          {resume.experience.filter((e) => e.company || e.position).map((e, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between gap-2">
                <span className="font-bold">{e.company}</span>
                <span className="shrink-0">{e.location}</span>
              </div>
              <div className="flex justify-between gap-2 italic">
                <span>{e.position}</span>
                <span className="shrink-0">{dateRange(e.startDate, e.endDate, e.current)}</span>
              </div>
              <Bullets text={e.description} className="mt-1" />
            </div>
          ))}
        </Section>
      )}
      {has.projects(resume) && (
        <Section title="Projects">
          {resume.projects.filter((x) => x.name).map((x, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between gap-2">
                <span>
                  <span className="font-bold">{x.name}</span>
                  {x.technologies && <span className="italic"> — {x.technologies}</span>}
                </span>
                {x.link && <span className="shrink-0 text-[11px]">{x.link}</span>}
              </div>
              <Bullets text={x.description} className="mt-1" />
            </div>
          ))}
        </Section>
      )}
      {has.skills(resume) && (
        <Section title="Skills">
          <p>{resume.skills.filter(Boolean).join(" • ")}</p>
        </Section>
      )}
      {has.certifications(resume) && (
        <Section title="Certifications">
          <ul>
            {resume.certifications.filter((c) => c.name).map((c, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>
                <span className="font-semibold">{c.name}</span>
                {[c.issuer, c.date].filter(Boolean).length > 0 && ` — ${[c.issuer, c.date].filter(Boolean).join(", ")}`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
