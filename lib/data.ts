export const profile = {
  name: "Heet Barot",
  firstName: "Heet",
  lastName: "Barot",
  role: "Software Engineer · AI/ML Systems",
  tagline: "AI Engineer · Prompt Architect · Full-Stack Builder",
  location: "Austin, TX",
  email: "heetbarot21@gmail.com",
  phone: "+1 (224) 401-5925",
  linkedin: "https://www.linkedin.com/in/heet-barot",
  github: "https://github.com/heet2107",
  summary:
    "Software Development Engineer specializing in LLM integration and prompt engineering, with production experience building AI-powered systems at scale — RAG pipelines with semantic search, MCP servers for tool-augmented LLMs, and multi-agent orchestration grounded in constitutional AI principles.",
  statement:
    "I build AI systems that ship — autonomous agents, RAG pipelines, and full-stack products with measurable business impact.",
};

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  highlights: string[];
  stack: string[];
};

export const experience: Experience[] = [
  {
    company: "ContextQA",
    role: "Software Engineer — AI/ML",
    period: "Aug 2023 — Present",
    location: "Austin, TX",
    highlights: [
      "Built an autonomous testing agent with MCP servers and the ReAct framework — Claude executes multi-step QA workflows with tool selection and error recovery, processing 500+ test scenarios daily at a 92% success rate.",
      "Designed A/B experiments on RAG retrieval strategies (dense vs hybrid + reranking), lifting NDCG@10 from 0.72 to 0.81 and QA workflow efficiency by 40%.",
      "Implemented AI safety guardrails — prompt-injection detection, content filtering, and structured output validation — blocking 99.7% of malicious inputs in production.",
      "Shipped GitHub Actions CI/CD with Jest, Snyk scanning, Docker builds, and AWS ECS deploys — release cycles cut from 3 days to 4 hours at 99.9% uptime.",
    ],
    stack: ["Claude", "MCP", "RAG", "React", "GitHub Actions", "AWS ECS", "Docker"],
  },
  {
    company: "Restoration Partner",
    role: "Full-Stack Web Developer",
    period: "Mar 2021 — Jun 2023",
    location: "Portland, MI",
    highlights: [
      "Built secure, high-performance web apps with React, Node.js, TypeScript, and PostgreSQL under OWASP guidelines with RBAC and input sanitization.",
      "Designed REST APIs on Express.js with OAuth 2.0, rate limiting, and comprehensive documentation; delivered SFDC implementations across Sales Cloud and Service Cloud.",
      "Built custom AI chatbot solutions with context-aware prompting that cut customer support tickets by 45%.",
      "Deployed AWS S3, CloudFront, CloudWatch, and SIEM tooling for security monitoring and performance.",
    ],
    stack: ["React", "Node.js", "TypeScript", "PostgreSQL", "Salesforce", "AWS"],
  },
  {
    company: "MiHIN",
    role: "Software Engineer Intern",
    period: "May 2020 — Mar 2021",
    location: "Grand Rapids, MI",
    highlights: [
      "Worked across the full SDLC in healthcare technology — requirements, development, testing, deployment — within SCRUM/XP teams.",
      "Helped develop data governance policies aligned to SOX and GDPR with full audit trails; supported AWS IAM role and access management for cloud healthcare apps.",
    ],
    stack: ["SDLC", "Agile", "AWS IAM", "Healthcare", "GDPR"],
  },
];

export type Project = {
  slug: string;
  title: string;
  category: string;
  year: string;
  description: string;
  stack: string[];
  image: string;
  link?: string;
  metric?: string;
};

export const projects: Project[] = [
  {
    slug: "vanikaar",
    title: "Vanikaar",
    category: "Voice → Software, Live",
    year: "2025",
    description:
      "Real-time meeting intelligence that turns spoken product decisions into a working application before the call ends. Live transcription in any language, feature extraction, and automatic MVP generation — no specs, no prompts.",
    stack: ["Real-time Transcription", "AI Codegen", "Next.js", "Sandboxed Builds", "Multi-language NLP"],
    image: "/projects/vanikaar.jpg",
    link: "https://swarvani-mvp-builder.vercel.app/",
    metric: "Voice to working MVP in one meeting",
  },
  {
    slug: "casegenius",
    title: "CaseGenius",
    category: "AI Legal-Tech Platform",
    year: "2025",
    description:
      "Transforming immigration law practice — an AI-powered case platform with org-walled RLS security, document intelligence chat, and an adversarially-tested safety suite (8/8 cross-tenant, injection, and leak tests passing in production).",
    stack: ["Next.js", "Claude API", "Supabase", "RLS Security", "RAG"],
    image: "/projects/casegenius.jpg",
    link: "https://www.casegenius.app/",
    metric: "8/8 adversarial security suite in prod",
  },
  {
    slug: "biznezz",
    title: "BiznezzAI",
    category: "AI Platform for SMBs",
    year: "2025",
    description:
      "AI automation platform for small businesses — tree-of-thought reasoning for multi-step decisions, and a RAG pipeline over 100K+ documents (invoices, contracts, reports) with semantic chunking and sub-second retrieval.",
    stack: ["Claude API", "RAG", "Next.js", "PostgreSQL"],
    image: "/projects/biznezz.jpg",
    metric: "90% recommendation acceptance rate",
  },
  {
    slug: "inboundcms",
    title: "InboundCMS",
    category: "Agency Platform · SEO / AEO / GEO",
    year: "2025",
    description:
      "Site and platform for an Austin creative marketing agency built for the AI-search era — SEO, Answer Engine Optimization, and Generative Engine Optimization for visibility across Google, ChatGPT, and Gemini.",
    stack: ["Next.js", "SEO", "AEO / GEO", "Analytics"],
    image: "/projects/inboundcms.jpg",
    link: "https://inboundcms.com/",
    metric: "Built for the 2026 digital economy",
  },
  {
    slug: "victorylane",
    title: "Victory Lane",
    category: "Automotive Atelier Experience",
    year: "2025",
    description:
      "Performance. Revamped. A cinematic web experience for a premium automotive atelier — paint correction, ceramic protection, wraps, and performance tuning presented with a moody, high-end visual language.",
    stack: ["Next.js", "Cinematic UI", "Responsive Design"],
    image: "/projects/victorylane.jpg",
    link: "https://victory-lane-seven.vercel.app/",
    metric: "By-appointment premium atelier",
  },
  {
    slug: "dbarotlaw",
    title: "D Barot Law",
    category: "Law Firm Platform",
    year: "2024",
    description:
      "Full web presence for a New York law firm practicing immigration, IP & trademark, and family law across all 50 states — attorney profiles, practice areas, and consultation booking.",
    stack: ["Web Platform", "Booking", "SEO"],
    image: "/projects/dbarotlaw.jpg",
    link: "https://dbarotlaw.com/",
    metric: "Serving clients in all 50 states",
  },
  {
    slug: "foodlab",
    title: "FoodLab",
    category: "AI Meal Planning App",
    year: "2023",
    description:
      "Personalized AI meal planning — intelligent recommendations, calorie tracking, and dietary progress visualization with secure Supabase persistence.",
    stack: ["OpenAI API", "React", "Node.js", "Supabase"],
    image: "/projects/foodlab.jpg",
    metric: "Interactive nutrition dashboards",
  },
];

export const skills: { label: string; items: string[] }[] = [
  {
    label: "AI Engineering",
    items: [
      "Claude API", "Prompt Architecture", "RAG Pipelines", "MCP Servers",
      "Multi-Agent Orchestration", "LangSmith", "Constitutional AI", "Evaluation Systems",
    ],
  },
  {
    label: "Languages & Frameworks",
    items: [
      "Python", "TypeScript", "React", "Next.js", "Node.js", "FastAPI",
      "Express.js", "GraphQL", "PostgreSQL", "MongoDB", "Redis",
    ],
  },
  {
    label: "Cloud & DevOps",
    items: [
      "AWS", "Docker", "Kubernetes", "Terraform", "GitHub Actions",
      "CI/CD", "CloudWatch", "IAM", "Lambda", "S3",
    ],
  },
  {
    label: "Product & Data",
    items: [
      "Salesforce", "Einstein Analytics", "Power BI", "Tableau",
      "Figma", "JIRA", "Agile / SCRUM", "OpenAPI",
    ],
  },
];

export const credentials = {
  education: [
    {
      school: "Michigan State University",
      degree: "B.A. Information Science, Minor in IT",
      place: "East Lansing, MI",
    },
    {
      school: "Hackbright Academy",
      degree: "Full-Stack Web Development Bootcamp",
      place: "Lehi, UT",
    },
  ],
  certifications: [
    "Salesforce Administrator",
    "Salesforce AI Associate",
    "TrainWithShubham — Advanced DevOps",
  ],
};
