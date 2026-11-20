import { Bullets, contactItems, dateRange, has } from "./shared";

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b-2 border-indigo-600 pb-1 text-[13px] font-bold uppercase tracking-widest text-indigo-700">{title}</h2>
      {children}
    </section>
  );
}

export default function ModernTemplate({ resume }) {
  const p = resume.personal || {};
  return (
    <div className="flex min-h-[1120px] text-[12px] leading-relaxed text-slate-800">
      <aside className="w-[34%] bg-slate-800 px-6 py-8 text-slate-100">
        <h1 className="text-[26px] font-extrabold leading-tight text-white">{p.fullName || "Your Name"}</h1>
        {p.jobTitle && <p className="mt-1 text-[13px] font-medium text-indigo-300">{p.jobTitle}</p>}
        <div className="mt-6">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-300">Contact</h3>
          <ul className="space-y-1 break-words text-[11px]">
            {contactItems(p).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        {has.skills(resume) && (
          <div className="mt-6">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-300">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.filter(Boolean).map((s) => (
                <span key={s} className="rounded bg-slate-700 px-2 py-0.5 text-[11px]">{s}</span>
              ))}
            </div>
          </div>
        )}
        {has.certifications(resume) && (
          <div className="mt-6">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-300">Certifications</h3>
            <ul className="space-y-2 text-[11px]">
              {resume.certifications.filter((c) => c.name).map((c, i) => (
                <li key={i}>
                  <div className="font-semibold text-white">{c.name}</div>
                  <div className="text-slate-300">{[c.issuer, c.date].filter(Boolean).join(" · ")}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <div className="flex-1 px-7 py-8">
        {p.summary && (
          <Section title="Profile">
            <p>{p.summary}</p>
          </Section>
        )}
        {has.experience(resume) && (
          <Section title="Experience">
            {resume.experience.filter((e) => e.company || e.position).map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between gap-2">
                  <h3 className="font-bold">{e.position}</h3>
                  <span className="shrink-0 text-[11px] text-slate-500">{dateRange(e.startDate, e.endDate, e.current)}</span>
                </div>
                <div className="text-[11.5px] font-medium text-indigo-700">{[e.company, e.location].filter(Boolean).join(" · ")}</div>
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
                  <h3 className="font-bold">{x.name}</h3>
                  {x.link && <span className="shrink-0 text-[11px] text-slate-500">{x.link}</span>}
                </div>
                {x.technologies && <div className="text-[11.5px] italic text-indigo-700">{x.technologies}</div>}
                <Bullets text={x.description} className="mt-1" />
              </div>
            ))}
          </Section>
        )}
        {has.education(resume) && (
          <Section title="Education">
            {resume.education.filter((e) => e.institution || e.degree).map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between gap-2">
                  <h3 className="font-bold">{[e.degree, e.field].filter(Boolean).join(" in ")}</h3>
                  <span className="shrink-0 text-[11px] text-slate-500">{dateRange(e.startDate, e.endDate)}</span>
                </div>
                <div className="text-[11.5px]">{[e.institution, e.grade].filter(Boolean).join(" · ")}</div>
                {e.description && <p className="text-[11px] text-slate-600">{e.description}</p>}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
