export const TEMPLATES = [
  { id: "modern", name: "Modern", description: "Bold header with an accent sidebar — great for tech roles." },
  { id: "classic", name: "Classic", description: "Traditional serif layout preferred by corporate recruiters." },
  { id: "minimal", name: "Minimal", description: "Clean single-column design with lots of white space." },
];

export const emptyResume = () => ({
  title: "Untitled Resume",
  template: "modern",
  personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", summary: "" },
  education: [],
  experience: [],
  skills: [],
  projects: [],
  certifications: [],
});

export const blankItems = {
  education: { institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "", description: "" },
  experience: { company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "" },
  projects: { name: "", link: "", technologies: "", description: "" },
  certifications: { name: "", issuer: "", date: "", link: "" },
};

export const sampleResume = () => ({
  ...emptyResume(),
  title: "Sample – Full Stack Developer",
  personal: {
    fullName: "Aarav Sharma",
    jobTitle: "Full Stack Developer",
    email: "aarav.sharma@email.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/aaravsharma",
    github: "github.com/aaravsharma",
    website: "",
    summary:
      "Full stack developer skilled in the MERN stack and Next.js, with internship experience building scalable REST APIs and responsive web apps. Passionate about clean code, performance and delivering user-focused products.",
  },
  education: [
    { institution: "ABC Institute of Technology", degree: "B.Tech", field: "Computer Science", startDate: "2021", endDate: "2025", grade: "8.7 CGPA", description: "" },
  ],
  experience: [
    {
      company: "TechNova Solutions",
      position: "Software Development Intern",
      location: "Remote",
      startDate: "Jan 2024",
      endDate: "Jun 2024",
      current: false,
      description:
        "Developed 12+ REST APIs with Node.js and Express serving 5,000+ daily users\nOptimized MongoDB queries, reducing average response time by 35%\nCollaborated with a 6-member agile team to ship features every sprint",
    },
  ],
  skills: ["JavaScript", "React", "Next.js", "Node.js", "Express.js", "MongoDB", "Tailwind CSS", "Git", "REST APIs", "Docker"],
  projects: [
    {
      name: "ResumeX AI",
      link: "github.com/aaravsharma/resumex-ai",
      technologies: "Next.js, Express, MongoDB, OpenAI",
      description: "Built an AI-powered resume builder with ATS scoring and PDF export\nImplemented JWT authentication and role-based admin panel",
    },
  ],
  certifications: [{ name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", date: "2024", link: "" }],
});

export const toBullets = (text = "") =>
  String(text)
    .split(/\n|•/)
    .map((l) => l.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean);
