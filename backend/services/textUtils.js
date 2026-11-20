const STOPWORDS = new Set(
  `a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself yourselves etc e.g i.e via per within across using use used also well strong good great excellent ability able must preferred plus including include includes required requirements requirement responsibilities responsibility role candidate candidates job position company team teams work working years year experience experienced knowledge understanding skills skill looking join opportunity we're you'll you're our new like based may one two three four five day days time make help ensure etc. based related relevant hands-on hiring hire need needs seeking want wanted ideal familiarity proficiency proficient strong`.split(
    /\s+/
  )
);

// Multi-word and symbol-heavy terms that naive tokenisation would break apart.
const KNOWN_PHRASES = [
  "machine learning", "deep learning", "data science", "data analysis", "data structures", "computer science",
  "natural language processing", "computer vision", "rest api", "rest apis", "restful api", "graphql",
  "node.js", "next.js", "react.js", "vue.js", "express.js", "nuxt.js", "nest.js", "c++", "c#", ".net", "asp.net",
  "ci/cd", "unit testing", "test driven development", "object oriented", "oop", "system design", "problem solving",
  "project management", "agile", "scrum", "version control", "google cloud", "gcp", "aws", "azure", "power bi",
  "tailwind css", "material ui", "spring boot", "ruby on rails", "react native", "large language models", "llm",
  "prompt engineering", "mongodb atlas", "sql server", "postgresql", "mysql", "mongodb", "redis", "docker",
  "kubernetes", "microservices", "full stack", "front end", "back end", "frontend", "backend", "ui/ux",
  "communication skills", "team player", "time management", "critical thinking", "attention to detail",
];

const normalize = (s = "") =>
  String(s)
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9+#./\- ]/g, " ")
    .split(" ")
    .map((t) => t.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(haystack, term) {
  const re = new RegExp(`(^|[^a-z0-9+#])${escapeRegex(term)}($|[^a-z0-9+#])`, "i");
  return re.test(haystack);
}

function resumeToText(resume = {}) {
  const p = resume.personal || {};
  const parts = [
    p.fullName, p.jobTitle, p.summary,
    ...(resume.skills || []),
    ...(resume.experience || []).flatMap((e) => [e.position, e.company, e.description]),
    ...(resume.education || []).flatMap((e) => [e.degree, e.field, e.institution, e.description]),
    ...(resume.projects || []).flatMap((e) => [e.name, e.technologies, e.description]),
    ...(resume.certifications || []).flatMap((e) => [e.name, e.issuer]),
  ];
  return parts.filter(Boolean).join("\n");
}

module.exports = { STOPWORDS, KNOWN_PHRASES, normalize, tokenize, containsTerm, resumeToText, escapeRegex };
