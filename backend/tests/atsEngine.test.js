const test = require("node:test");
const assert = require("node:assert");
const { analyzeResume, extractKeywords } = require("../services/atsEngine");

const strong = {
  personal: {
    fullName: "Aarav Sharma", jobTitle: "Full Stack Developer", email: "a@b.com", phone: "+91 9876543210",
    location: "Bengaluru", linkedin: "linkedin.com/in/a",
    summary: "Full stack developer skilled in React, Node.js and MongoDB with internship experience building REST APIs.",
  },
  education: [{ institution: "ABC", degree: "B.Tech", field: "CS" }],
  experience: [{ company: "X", position: "Intern", description: "Developed 12 REST APIs with Node.js serving 5,000 users\nOptimized MongoDB queries reducing latency by 35%" }],
  skills: ["React", "Node.js", "MongoDB", "Docker", "AWS", "Git"],
  projects: [{ name: "ResumeX", description: "Built an AI resume builder using Next.js and Express\nImplemented JWT authentication for 200+ users" }],
};

test("extractKeywords keeps multi-word and symbol terms", () => {
  const kws = extractKeywords("Looking for a Node.js developer with CI/CD, machine learning and C++ skills");
  for (const k of ["node.js", "ci/cd", "machine learning", "c++"]) assert.ok(kws.includes(k), `missing ${k}`);
});

test("empty resume scores low and recommends sections", () => {
  const r = analyzeResume({});
  assert.ok(r.score < 30);
  assert.ok(r.recommendations.some((x) => x.area === "Sections"));
  assert.strictEqual(r.breakdown.keywords.score, null);
});

test("strong resume scores higher than weak resume", () => {
  const weak = { ...strong, experience: [{ company: "X", position: "Intern", description: "worked on apis\nresponsible for testing" }] };
  assert.ok(analyzeResume(strong).score > analyzeResume(weak).score);
});

test("keyword matching reports matched and missing terms", () => {
  const r = analyzeResume(strong, "React Node.js MongoDB Kubernetes TypeScript");
  const kw = r.breakdown.keywords;
  assert.ok(kw.matched.includes("react") && kw.matched.includes("node.js"));
  assert.ok(kw.missing.includes("kubernetes") && kw.missing.includes("typescript"));
  assert.ok(r.score >= 0 && r.score <= 100);
});
