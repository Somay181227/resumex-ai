import { Bullets, contactItems, dateRange, has } from "./shared";

function Row({ title, children }) {
  return (
    <section className="mb-5 grid grid-cols-[120px_1fr] gap-4">
      <h2 className="pt-0.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-700">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function MinimalTemplate({ resume }) {
  const p = resume.personal || {};
  return (
    <div className="min-h-[1120px] px-12 py-12 text-[12px] leading-relaxed text-slate-700">
      <header className="mb-8">
        <h1 className="text-[32px] font-light tracking-tight text-slate-900">{p.fullName || "Your Name"}</h1>
        {p.jobTitle && <p className="text-[14px] text-emerald-700">{p.jobTitle}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          {contactItems(p).map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </header>
      {p.summary && (
        <Row title="About">
          <p>{p.summary}</p>
        </Row>
      )}
      {has.experience(resume) && (
        <Row title="Experience">
          {resume.experience.filter((e) => e.company || e.position).map((e, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-slate-900">{e.position}{e.company && <span className="font-normal text-slate-500"> @ {e.company}</span>}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{dateRange(e.startDate, e.endDate, e.current)}</span>
              </div>
              <Bullets text={e.description} className="mt-1" />
            </div>
          ))}
        </Row>
      )}
      {has.projects(resume) && (
        <Row title="Projects">
          {resume.projects.filter((x) => x.name).map((x, i) => (
            <div key={i} className="mb-3">
              <div className="font-semibold text-slate-900">
                {x.name}
                {x.technologies && <span className="font-normal text-slate-500"> · {x.technologies}</span>}
              </div>
              {x.link && <div className="text-[11px] text-slate-400">{x.link}</div>}
              <Bullets text={x.description} className="mt-1" />
            </div>
          ))}
        </Row>
      )}
      {has.education(resume) && (
        <Row title="Education">
          {resume.education.filter((e) => e.institution || e.degree).map((e, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-slate-900">{[e.degree, e.field].filter(Boolean).join(", ")}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{dateRange(e.startDate, e.endDate)}</span>
              </div>
              <div className="text-slate-500">{[e.institution, e.grade].filter(Boolean).join(" · ")}</div>
            </div>
          ))}
        </Row>
      )}
      {has.skills(resume) && (
        <Row title="Skills">
          <p>{resume.skills.filter(Boolean).join(", ")}</p>
        </Row>
      )}
      {has.certifications(resume) && (
        <Row title="Certificates">
          {resume.certifications.filter((c) => c.name).map((c, i) => (
            <div key={i}>
              <span className="text-slate-900">{c.name}</span>
              <span className="text-slate-500">{[c.issuer, c.date].filter(Boolean).length ? ` — ${[c.issuer, c.date].filter(Boolean).join(", ")}` : ""}</span>
            </div>
          ))}
        </Row>
      )}
    </div>
  );
}
