const { KNOWN_PHRASES, normalize, tokenize, containsTerm, resumeToText } = require("./textUtils");

const ACTION_VERBS = [
  "achieved", "analyzed", "architected", "automated", "built", "collaborated", "created", "delivered", "designed",
  "developed", "drove", "enhanced", "engineered", "established", "executed", "implemented", "improved", "increased",
  "integrated", "launched", "led", "managed", "mentored", "migrated", "optimized", "organized", "reduced",
  "refactored", "resolved", "scaled", "spearheaded", "streamlined", "tested", "trained", "deployed", "coordinated",
  "contributed", "initiated", "maintained", "programmed", "researched", "simplified", "transformed",
];
const WEAK_PHRASES = ["responsible for", "worked on", "helped with", "duties included", "tasked with", "involved in"];

function extractKeywords(jobDescription, limit = 30) {
  const jd = normalize(jobDescription);
  if (!jd) return [];
  const freq = new Map();
  for (const phrase of KNOWN_PHRASES) {
    if (containsTerm(jd, phrase)) freq.set(phrase, (freq.get(phrase) || 0) + 3);
  }
  const phraseWords = new Set([...freq.keys()].flatMap((p) => p.split(/\s+/)));
  for (const tok of tokenize(jd)) {
    if (tok.length < 3 && !/[+#]/.test(tok)) continue;
    if (phraseWords.has(tok)) continue;
    freq.set(tok, (freq.get(tok) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([k]) => k);
}

function bulletLines(resume) {
  return [
    ...(resume.experience || []).map((e) => e.description || ""),
    ...(resume.projects || []).map((p) => p.description || ""),
  ]
    .join("\n")
    .split(/\n|•|\u2022|(?<=\.)\s+(?=[A-Z])/)
    .map((l) => l.replace(/^[-*\s]+/, "").trim())
    .filter((l) => l.length > 3);
}

function scoreSections(resume) {
  const p = resume.personal || {};
  const checks = [
    { key: "summary", label: "Professional summary", ok: (p.summary || "").trim().length >= 40, weight: 4 },
    { key: "experience", label: "Work experience", ok: (resume.experience || []).some((e) => e.position || e.company), weight: 5 },
    { key: "education", label: "Education", ok: (resume.education || []).some((e) => e.institution || e.degree), weight: 4 },
    { key: "skills", label: "Skills (at least 5)", ok: (resume.skills || []).filter(Boolean).length >= 5, weight: 4 },
    { key: "projects", label: "Projects", ok: (resume.projects || []).some((x) => x.name), weight: 3 },
  ];
  const max = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / max) * 20), max: 20, checks };
}

function scoreContact(resume) {
  const p = resume.personal || {};
  const checks = [
    { label: "Full name", ok: !!(p.fullName || "").trim() },
    { label: "Valid email", ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || "") },
    { label: "Phone number", ok: (p.phone || "").replace(/\D/g, "").length >= 10 },
    { label: "Location", ok: !!(p.location || "").trim() },
    { label: "LinkedIn / GitHub / Portfolio", ok: !!(p.linkedin || p.github || p.website) },
  ];
  const got = checks.filter((c) => c.ok).length;
  return { score: Math.round((got / checks.length) * 10), max: 10, checks };
}

function scoreContent(resume) {
  const lines = bulletLines(resume);
  if (!lines.length) {
    return { score: 0, max: 20, details: { bullets: 0, actionVerbRatio: 0, quantifiedRatio: 0, weakPhrases: [] } };
  }
  const startsWithVerb = lines.filter((l) => ACTION_VERBS.includes(l.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "")));
  const quantified = lines.filter((l) => /\d+%|\d+\+?|\$\s?\d|₹\s?\d|\bx\d|\d+x\b/i.test(l));
  const text = normalize(lines.join(" "));
  const weak = WEAK_PHRASES.filter((w) => text.includes(w));
  const goodLength = lines.filter((l) => {
    const n = l.split(/\s+/).length;
    return n >= 6 && n <= 35;
  });

  const verbRatio = startsWithVerb.length / lines.length;
  const quantRatio = quantified.length / lines.length;
  const lengthRatio = goodLength.length / lines.length;
  let score = verbRatio * 8 + Math.min(quantRatio / 0.5, 1) * 7 + lengthRatio * 5 - weak.length;
  score = Math.max(0, Math.min(20, Math.round(score)));
  return {
    score,
    max: 20,
    details: {
      bullets: lines.length,
      actionVerbRatio: Math.round(verbRatio * 100),
      quantifiedRatio: Math.round(quantRatio * 100),
      weakPhrases: weak,
    },
  };
}

function scoreFormatting(resume, text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const summaryWords = (resume.personal?.summary || "").split(/\s+/).filter(Boolean).length;
  const issues = [];
  let score = 10;
  if (words < 150) { score -= 4; issues.push(`Resume is short (${words} words). Aim for 300–700 words.`); }
  else if (words > 1000) { score -= 3; issues.push(`Resume is long (${words} words). Keep it concise (1–2 pages).`); }
  if (summaryWords > 80) { score -= 2; issues.push("Summary is longer than 80 words; keep it to 2–4 sentences."); }
  const skills = (resume.skills || []).filter(Boolean);
  if (skills.length > 30) { score -= 2; issues.push("Too many skills listed; keep the 15–25 most relevant."); }
  if (/[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u.test(text)) { score -= 2; issues.push("Avoid emojis/special symbols; ATS parsers may not read them."); }
  return { score: Math.max(0, score), max: 10, words, issues };
}

function scoreKeywords(resumeText, jobDescription) {
  const keywords = extractKeywords(jobDescription);
  if (!keywords.length) return { score: null, max: 40, keywords: [], matched: [], missing: [] };
  const hay = normalize(resumeText);
  const matched = keywords.filter((k) => containsTerm(hay, k));
  const missing = keywords.filter((k) => !matched.includes(k));
  return {
    score: Math.round((matched.length / keywords.length) * 40),
    max: 40,
    matchRate: Math.round((matched.length / keywords.length) * 100),
    keywords,
    matched,
    missing,
  };
}

function buildRecommendations({ sections, contact, content, formatting, keywords }) {
  const recs = [];
  sections.checks.filter((c) => !c.ok).forEach((c) => recs.push({ priority: "high", area: "Sections", text: `Add or expand: ${c.label}.` }));
  contact.checks.filter((c) => !c.ok).forEach((c) => recs.push({ priority: "medium", area: "Contact", text: `Missing contact detail: ${c.label}.` }));
  if (keywords.score !== null && keywords.missing.length) {
    recs.push({
      priority: "high",
      area: "Keywords",
      text: `Include relevant missing keywords from the job description: ${keywords.missing.slice(0, 10).join(", ")}.`,
    });
  }
  if (content.details.bullets && content.details.actionVerbRatio < 60) {
    recs.push({ priority: "medium", area: "Content", text: "Start more bullet points with strong action verbs (e.g. Developed, Led, Optimized)." });
  }
  if (content.details.bullets && content.details.quantifiedRatio < 40) {
    recs.push({ priority: "medium", area: "Content", text: "Quantify achievements with numbers, percentages or scale (e.g. 'reduced load time by 40%')." });
  }
  content.details.weakPhrases.forEach((w) =>
    recs.push({ priority: "low", area: "Content", text: `Replace weak phrase "${w}" with an action-oriented verb.` })
  );
  if (!content.details.bullets) {
    recs.push({ priority: "high", area: "Content", text: "Describe your experience and projects with 2–5 bullet points each." });
  }
  formatting.issues.forEach((i) => recs.push({ priority: "low", area: "Formatting", text: i }));
  if (keywords.score === null) {
    recs.push({ priority: "medium", area: "Keywords", text: "Paste a job description to get keyword matching and a tailored ATS score." });
  }
  const order = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

function analyzeResume(resume, jobDescription = "") {
  const text = resumeToText(resume);
  const sections = scoreSections(resume);
  const contact = scoreContact(resume);
  const content = scoreContent(resume);
  const formatting = scoreFormatting(resume, text);
  const keywords = scoreKeywords(text, jobDescription);

  const base = sections.score + contact.score + content.score + formatting.score; // out of 60
  const total = keywords.score === null ? Math.round((base / 60) * 100) : base + keywords.score;
  const score = Math.max(0, Math.min(100, total));
  const grade = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs Work";

  return {
    score,
    grade,
    breakdown: { keywords, sections, contact, content, formatting },
    recommendations: buildRecommendations({ sections, contact, content, formatting, keywords }),
  };
}

module.exports = { analyzeResume, extractKeywords, ACTION_VERBS, WEAK_PHRASES };
