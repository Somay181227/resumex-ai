const { ACTION_VERBS } = require("./atsEngine");
const { resumeToText } = require("./textUtils");

function provider() {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "fallback";
}

async function callOpenAI(system, user) {
  const res = await fetch(`${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGemini(system, user) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function callLLM(system, user) {
  const p = provider();
  if (p === "openai") return callOpenAI(system, user);
  if (p === "gemini") return callGemini(system, user);
  return null;
}

/* ---------------- Rule-based fallbacks (used when no AI key is configured or the API fails) ---------------- */

const WEAK_TO_STRONG = [
  [/^responsible for (managing|leading)/i, "Led"],
  [/^responsible for/i, "Managed"],
  [/^worked on/i, "Developed"],
  [/^helped (with|to)?/i, "Contributed to"],
  [/^involved in/i, "Participated in"],
  [/^tasked with/i, "Executed"],
  [/^duties included/i, "Handled"],
  [/^made/i, "Created"],
  [/^did/i, "Executed"],
  [/^was in charge of/i, "Oversaw"],
];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function improveLine(line) {
  let l = line.replace(/^[-*•\s]+/, "").trim();
  if (!l) return l;
  for (const [re, rep] of WEAK_TO_STRONG) {
    if (re.test(l)) {
      l = l.replace(re, rep);
      break;
    }
  }
  l = l.replace(/\bi\b/g, "I").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1");
  const first = l.split(/\s+/)[0].toLowerCase();
  if (!ACTION_VERBS.includes(first) && !/^(led|managed|developed|contributed|participated|executed|handled|created|oversaw)$/i.test(first)) {
    if (/^(a|an|the)\s/i.test(l)) l = `Delivered ${l.charAt(0).toLowerCase()}${l.slice(1)}`;
  }
  l = capitalize(l);
  if (!/[.!?]$/.test(l)) l += ".";
  return l;
}

function fallbackImprove(text) {
  const lines = String(text || "")
    .split(/\n|•/)
    .map((x) => x.trim())
    .filter(Boolean);
  const improved = lines.map(improveLine).join("\n");
  const tips = [];
  if (!/\d/.test(improved)) tips.push("Add measurable results (numbers, %, time saved, users served).");
  if (lines.length < 2) tips.push("Break the description into 2–5 concise bullet points.");
  tips.push("Mention the tools/technologies you used in each bullet.");
  return { improved, tips };
}

function fallbackSummary(resume) {
  const p = resume.personal || {};
  const title = p.jobTitle || (resume.experience?.[0]?.position) || "motivated professional";
  const skills = (resume.skills || []).filter(Boolean).slice(0, 5);
  const exp = (resume.experience || []).filter((e) => e.position || e.company);
  const edu = (resume.education || []).find((e) => e.degree || e.institution);
  const proj = (resume.projects || []).filter((x) => x.name).length;

  const parts = [];
  parts.push(
    `${/^[aeiou]/i.test(title) ? "An" : "A"} ${title.toLowerCase().startsWith("motivated") ? title : `results-driven ${title}`}` +
      (exp.length ? ` with hands-on experience across ${exp.length} role${exp.length > 1 ? "s" : ""}` : "") +
      (edu ? ` and a ${edu.degree || "degree"}${edu.field ? ` in ${edu.field}` : ""}` : "") +
      "."
  );
  if (skills.length) parts.push(`Skilled in ${skills.slice(0, -1).join(", ")}${skills.length > 1 ? " and " : ""}${skills.slice(-1)}.`);
  if (proj) parts.push(`Built ${proj} project${proj > 1 ? "s" : ""} demonstrating strong problem-solving and the ability to deliver end-to-end solutions.`);
  parts.push("Eager to contribute to impactful products, learn quickly and collaborate effectively within cross-functional teams.");
  return parts.join(" ");
}

const GRAMMAR_RULES = [
  { re: /\s{2,}/g, msg: "Multiple consecutive spaces", fix: () => " " },
  { re: /\bi\b/g, msg: "Lowercase 'i' should be capitalised", fix: () => "I" },
  { re: /\b(\w+)\s+\1\b/gi, msg: "Repeated word", fix: (m, w) => w },
  { re: /\s+([,.;:!?])/g, msg: "Space before punctuation", fix: (m, p) => p },
  { re: /([,;:])(?=[A-Za-z])/g, msg: "Missing space after punctuation", fix: (m, p) => `${p} ` },
  { re: /\balot\b/gi, msg: "'alot' should be 'a lot'", fix: () => "a lot" },
  { re: /\b(teh)\b/gi, msg: "Typo: 'teh'", fix: () => "the" },
  { re: /\brecieve/gi, msg: "Spelling: 'receive'", fix: () => "receive" },
  { re: /\bmanagment\b/gi, msg: "Spelling: 'management'", fix: () => "management" },
  { re: /\bdevelopement\b/gi, msg: "Spelling: 'development'", fix: () => "development" },
  { re: /\bresponsibilites\b/gi, msg: "Spelling: 'responsibilities'", fix: () => "responsibilities" },
  { re: /\butilize(d|s)?\b/gi, msg: "Prefer simpler 'use' over 'utilize'", fix: (m, s) => `use${s || ""}` },
  { re: /\bin order to\b/gi, msg: "Wordy: 'in order to' → 'to'", fix: () => "to" },
];

function fallbackGrammar(text) {
  let corrected = String(text || "");
  const issues = [];
  for (const rule of GRAMMAR_RULES) {
    const matches = corrected.match(rule.re);
    if (matches) {
      issues.push({ message: rule.msg, occurrences: matches.length, examples: [...new Set(matches)].slice(0, 3) });
      corrected = corrected.replace(rule.re, rule.fix);
    }
  }
  corrected = corrected
    .split("\n")
    .map((line) => line.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase()))
    .join("\n");
  if (/\b(I|me|my)\b/.test(corrected)) {
    issues.push({ message: "Avoid first-person pronouns (I, me, my) in resumes", occurrences: 1, examples: [] });
  }
  if (/\b(was|were|been|being)\s+\w+ed\b/i.test(corrected)) {
    issues.push({ message: "Passive voice detected; prefer active voice", occurrences: 1, examples: [] });
  }
  return { corrected, issues };
}

function fallbackAnalysis(resume, ats) {
  const strengths = [];
  const weaknesses = [];
  const b = ats.breakdown;
  if (b.sections.score >= 16) strengths.push("Resume contains all key sections recruiters expect.");
  if (b.contact.score >= 8) strengths.push("Contact information is complete and easy to find.");
  if (b.content.details.actionVerbRatio >= 60) strengths.push("Good use of strong action verbs.");
  if (b.content.details.quantifiedRatio >= 40) strengths.push("Achievements are quantified with measurable results.");
  if (b.keywords.score !== null && b.keywords.matchRate >= 60) strengths.push("Strong keyword alignment with the job description.");
  if ((resume.skills || []).length >= 8) strengths.push("Broad, well-defined technical skill set.");

  if (b.content.details.quantifiedRatio < 40) weaknesses.push("Few quantified achievements — impact is hard to measure.");
  if (b.content.details.actionVerbRatio < 60) weaknesses.push("Many bullets don't start with action verbs.");
  if (b.keywords.score !== null && b.keywords.matchRate < 50) weaknesses.push("Low keyword overlap with the target job.");
  if (!(resume.personal?.summary || "").trim()) weaknesses.push("Missing professional summary.");
  if (!(resume.projects || []).length) weaknesses.push("No projects listed — add projects to showcase practical skills.");

  return {
    overview: `Your resume scored ${ats.score}/100 (${ats.grade}). ${
      ats.score >= 70 ? "It is in good shape; fine-tune the points below to stand out." : "Focus on the high-priority recommendations to significantly improve your chances."
    }`,
    strengths: strengths.length ? strengths : ["Resume structure is a good starting point."],
    weaknesses,
    suggestions: ats.recommendations.slice(0, 6).map((r) => r.text),
  };
}

/* ---------------- Public API ---------------- */

const SYSTEM = "You are an expert technical recruiter and professional resume writer. Always reply with valid JSON only.";

async function withFallback(llmFn, fallbackFn) {
  try {
    const out = await llmFn();
    if (out) return { ...out, provider: provider() };
  } catch (err) {
    console.warn("AI provider failed, using rule-based fallback:", err.message);
  }
  return { ...fallbackFn(), provider: "rule-based" };
}

exports.getProvider = provider;

exports.generateSummary = (resume) =>
  withFallback(
    () =>
      callLLM(
        SYSTEM,
        `Write a professional, ATS-friendly resume summary (3-4 sentences, max 70 words, no first-person pronouns) for this candidate. Return JSON {"summary": string}.\n\nResume:\n${resumeToText(resume)}`
      ),
    () => ({ summary: fallbackSummary(resume) })
  );

exports.improveDescription = (text, context = {}) =>
  withFallback(
    () =>
      callLLM(
        SYSTEM,
        `Rewrite the following resume ${context.section || "experience"} description${
          context.position ? ` for the role "${context.position}"` : ""
        } into 2-5 concise, impactful bullet points. Start each with a strong action verb, keep facts truthful, suggest metrics where natural using placeholders like [X%] only if no number is given. Return JSON {"improved": string (bullets separated by newlines, no bullet symbols), "tips": string[]}.\n\nText:\n${text}`
      ),
    () => fallbackImprove(text)
  );

exports.checkGrammar = (text) =>
  withFallback(
    () =>
      callLLM(
        SYSTEM,
        `Check the following resume text for grammar, spelling, tone and clarity. Return JSON {"corrected": string, "issues": [{"message": string, "examples": string[]}]}.\n\nText:\n${text}`
      ),
    () => fallbackGrammar(text)
  );

exports.analyze = (resume, ats, jobDescription = "") =>
  withFallback(
    () =>
      callLLM(
        SYSTEM,
        `Analyse this resume${jobDescription ? " against the job description" : ""}. A rule-based ATS engine scored it ${ats.score}/100. Return JSON {"overview": string, "strengths": string[], "weaknesses": string[], "suggestions": string[]} with 3-6 items per list, specific and actionable.\n\nResume:\n${resumeToText(
          resume
        )}${jobDescription ? `\n\nJob description:\n${jobDescription}` : ""}`
      ),
    () => fallbackAnalysis(resume, ats)
  );
