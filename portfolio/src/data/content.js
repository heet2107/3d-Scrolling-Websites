// Every word on this site, in one place.
//
// The scenes are geometry and light; this is the only file that knows what the
// site is ABOUT. Copy is kept here rather than in markup because four of the
// six acts build their DOM from JS anyway, and splitting the source of truth
// between a template and a module is how a résumé ends up disagreeing with
// itself.

export const ME = {
  name: 'HEET BAROT',
  first: 'HEET',
  last: 'BAROT',
  title: 'AI Engineer & Full-Stack Developer',
  roles: ['AI Engineer', 'Prompt Architect', 'MCP Builder', 'Full-Stack Dev'],
  email: 'heetbarot21@gmail.com',
  github: 'https://github.com/heet2107',
  linkedin: 'https://www.linkedin.com/in/heet-barot',
  site: 'https://heet-barot-portfolio.vercel.app',
  location: 'Austin, TX',
  availability: 'Available US & Remote',
  year: 2026,

  lede: 'Building AI-powered products and cinematic web experiences.',
  statement: 'Building AI systems and products that feel alive.',
  quote: ['Good', 'Systems', 'Think', 'Louder.'],

  bio: 'AI Engineer specializing in LLM integration and prompt engineering, '
     + 'with production experience building AI-powered systems at scale. '
     + 'Expert in RAG pipelines with semantic search, MCP servers for '
     + 'tool-augmented LLMs, and multi-agent orchestration. Strong full-stack '
     + 'foundation in React, TypeScript, Node.js and Python, with secure, '
     + 'scalable pipelines built on GitHub Actions, Terraform, Kubernetes '
     + 'and Docker.',

  stats: [
    { n: '5+', label: 'Years experience' },
    { n: '10+', label: 'Projects shipped' },
    { n: '3', label: 'Companies' },
  ],
};

/** The marquee ribbon under the opening, and the labels in act two. */
export const STACK = [
  'AI Engineer', 'Prompt Architect', 'RAG Pipelines', 'MCP Builder',
  'Claude API', 'React / Next.js', 'TypeScript', 'Python',
  'Node.js', 'AWS Cloud', 'DevOps / CI-CD', 'Salesforce',
];

// --------------------------------------------------------------------------
// Act II — the tools, as they sit in the room.
//
// `d` is depth (0 = nearest the camera, 1 = furthest) and `x`/`y` are the
// card's position on the plane at that depth. Solved so the deck reads as a
// room with things in it rather than a grid pushed back in Z.

export const TOOLS = [
  { label: 'Claude API',  kind: 'llm',   x: -0.62, y: 0.30, d: 0.20 },
  { label: 'MCP Servers', kind: 'llm',   x: -0.10, y: 0.46, d: 0.05 },
  { label: 'RAG',         kind: 'llm',   x: 0.48,  y: 0.34, d: 0.24 },
  { label: 'LangGraph',   kind: 'llm',   x: 0.92,  y: 0.06, d: 0.52 },
  { label: 'Next.js',     kind: 'web',   x: -0.95, y: -0.02, d: 0.48 },
  { label: 'React',       kind: 'web',   x: -0.44, y: -0.16, d: 0.12 },
  { label: 'TypeScript',  kind: 'web',   x: 0.16,  y: -0.06, d: 0.00 },
  { label: 'Node.js',     kind: 'web',   x: 0.70,  y: -0.22, d: 0.18 },
  { label: 'Python',      kind: 'lang',  x: -0.72, y: -0.44, d: 0.34 },
  { label: 'PostgreSQL',  kind: 'data',  x: -0.16, y: -0.54, d: 0.28 },
  { label: 'Supabase',    kind: 'data',  x: 0.40,  y: -0.50, d: 0.40 },
  { label: 'AWS',         kind: 'infra', x: 0.88,  y: -0.38, d: 0.58 },
  { label: 'Docker',      kind: 'infra', x: -1.02, y: 0.44,  d: 0.66 },
  { label: 'Terraform',   kind: 'infra', x: 1.06,  y: 0.44,  d: 0.70 },
];

/** Per-family colour, used for the card rim and the ember it throws. */
export const KIND_TINT = {
  llm:   [1.00, 0.62, 0.16],
  web:   [1.00, 0.78, 0.42],
  lang:  [0.98, 0.55, 0.10],
  data:  [0.92, 0.46, 0.08],
  infra: [0.80, 0.40, 0.10],
};

// --------------------------------------------------------------------------
// Act III — the journey. One card per year, in order.

export const YEARS = [
  {
    year: '2020',
    tag: 'The start',
    title: 'Healthcare IT, full SDLC',
    body: 'Software engineering intern at MiHIN in Grand Rapids — requirements '
        + 'through deployment inside SCRUM teams, data governance aligned to '
        + 'SOX and GDPR, and AWS IAM access policies for clinical systems.',
    marks: ['MiHIN', 'AWS IAM', 'Agile'],
  },
  {
    year: '2021',
    tag: 'Going full-stack',
    title: 'Products, not tickets',
    body: 'Full-stack web developer at Restoration Partner — React, Node.js, '
        + 'TypeScript and PostgreSQL, with REST APIs on Express and Salesforce '
        + 'delivery across Sales Cloud and Service Cloud.',
    marks: ['React', 'Node.js', 'Salesforce'],
  },
  {
    year: '2022',
    tag: 'Security and scale',
    title: 'Built to survive production',
    body: 'OWASP-guided hardening, RBAC and input sanitisation, OAuth 2.0 with '
        + 'rate limiting, and AWS S3, CloudFront, CloudWatch and SIEM tooling '
        + 'wired up for monitoring rather than bolted on afterwards.',
    marks: ['OWASP', 'OAuth 2.0', 'CloudWatch'],
  },
  {
    year: '2023',
    tag: 'The turn',
    title: 'Engineering with models',
    body: 'Joined ContextQA in Austin as a software engineer on AI/ML. The '
        + 'first custom chatbots had already cut support tickets by 45% — the '
        + 'question became how far tool-using models could actually go.',
    marks: ['ContextQA', 'Austin, TX', 'LLM'],
  },
  {
    year: '2024',
    tag: 'Agents that work',
    title: 'MCP, ReAct, retrieval',
    body: 'An autonomous testing agent on MCP servers and the ReAct framework — '
        + '500+ scenarios a day at a 92% success rate — and RAG retrieval A/B '
        + 'tests that lifted NDCG@10 from 0.72 to 0.81.',
    marks: ['MCP', 'ReAct', 'NDCG 0.81'],
  },
  {
    year: '2025',
    tag: 'Shipping AI products',
    title: 'Safety, RLS, scale',
    body: 'BiznezzAI and CaseGenius AI in production — tree-of-thought '
        + 'reasoning, retrieval over 100K+ documents, org-walled RLS, and '
        + 'guardrails blocking 99.7% of malicious inputs.',
    marks: ['BiznezzAI', 'CaseGenius', 'Guardrails'],
  },
  {
    year: '2026',
    tag: 'Now',
    title: 'Software from conversation',
    body: 'Vanikaar turns a spoken product call into a working application '
        + 'before the meeting ends. Live transcription, feature extraction, '
        + 'sandboxed builds — no specs, no prompts.',
    marks: ['Vanikaar', 'Agents', 'Realtime'],
  },
];

// --------------------------------------------------------------------------
// Act IV — the work.

export const PROJECTS = [
  {
    name: 'Vanikaar',
    kind: 'AI Platform',
    sub: 'Voice to software, live',
    body: 'Real-time meeting intelligence that turns spoken product decisions '
        + 'into a working application before the call ends. Live transcription '
        + 'in any language, feature extraction, and automatic MVP generation — '
        + 'no specs, no prompts.',
    tags: ['Real-time Transcription', 'AI Codegen', 'Next.js', 'Sandboxed Builds'],
    art: 'waveform',
    tint: [1.00, 0.58, 0.12],
  },
  {
    name: 'CaseGenius AI',
    kind: 'SaaS',
    sub: 'Legal-tech platform',
    body: 'Transforming immigration law practice — an AI case platform with '
        + 'org-walled RLS security, document intelligence chat, and an '
        + 'adversarially tested safety suite: 8/8 cross-tenant, injection and '
        + 'leak tests passing in production.',
    tags: ['Next.js', 'Claude API', 'Supabase RLS', 'Security', 'RAG'],
    art: 'shield',
    tint: [0.98, 0.70, 0.30],
  },
  {
    name: 'BiznezzAI',
    kind: 'AI Platform',
    sub: 'AI platform for SMBs',
    body: 'AI automation for small businesses — tree-of-thought reasoning for '
        + 'multi-step decisions and a RAG pipeline over 100K+ documents with '
        + 'semantic chunking, metadata filtering and sub-second retrieval. '
        + '90% recommendation acceptance rate.',
    tags: ['Claude API', 'RAG', 'Next.js', 'PostgreSQL'],
    art: 'graph',
    tint: [1.00, 0.66, 0.20],
  },
  {
    name: 'InboundCMS',
    kind: 'Platform',
    sub: 'Agency platform · SEO / AEO / GEO',
    body: 'Site and platform for an Austin creative marketing agency built for '
        + 'the AI-search era — search, Answer Engine and Generative Engine '
        + 'Optimization for visibility across Google, ChatGPT and Gemini.',
    tags: ['Next.js', 'SEO', 'AEO / GEO', 'Analytics'],
    art: 'bars',
    tint: [0.94, 0.52, 0.14],
  },
  {
    name: 'Victory Lane',
    kind: 'Web Experience',
    sub: 'Automotive atelier',
    body: 'Performance. Revamped. A cinematic web experience for a premium '
        + 'automotive atelier — paint correction, ceramic protection, wraps '
        + 'and performance tuning in a moody, high-end visual language.',
    tags: ['Next.js', 'Cinematic UI', 'Responsive Design'],
    art: 'sweep',
    tint: [0.88, 0.42, 0.10],
  },
  {
    name: 'D Barot Law',
    kind: 'Website',
    sub: 'Law firm platform',
    body: 'Full web presence for a New York law firm practising immigration, '
        + 'IP and trademark, and family law across all 50 states — attorney '
        + 'profiles, practice areas and consultation booking.',
    tags: ['Web Platform', 'Booking', 'SEO'],
    art: 'columns',
    tint: [0.96, 0.74, 0.44],
  },
  {
    name: 'FoodLab AI',
    kind: 'App',
    sub: 'Meal planning app',
    body: 'Personalised AI meal planning — intelligent recommendations, '
        + 'calorie tracking and dietary progress visualisation with secure '
        + 'Supabase persistence and interactive nutrition dashboards.',
    tags: ['OpenAI API', 'React', 'Node.js', 'Supabase'],
    art: 'rings',
    tint: [1.00, 0.62, 0.24],
  },
];

// --------------------------------------------------------------------------
// Act V — the record.

export const EXPERIENCE = [
  {
    company: 'ContextQA',
    role: 'Software Engineer (AI/ML)',
    when: 'Aug 2023 — Present',
    type: 'Full-time',
    where: 'Austin, TX',
    points: [
      'Built an autonomous testing agent on MCP servers and the ReAct '
      + 'framework, letting Claude run multi-step QA workflows with tool '
      + 'selection and error recovery — 500+ test scenarios daily at a 92% '
      + 'success rate.',
      'Designed A/B experiments on RAG retrieval strategies (dense versus '
      + 'hybrid with reranking), lifting NDCG@10 from 0.72 to 0.81 and '
      + 'improving QA workflow efficiency by 40%.',
      'Implemented AI safety guardrails — prompt-injection detection, content '
      + 'filtering and structured output validation — blocking 99.7% of '
      + 'malicious inputs in production.',
      'Shipped GitHub Actions CI/CD with Jest, Snyk scanning, Docker builds '
      + 'and AWS ECS deploys, cutting release cycles from 3 days to 4 hours '
      + 'at 99.9% uptime.',
    ],
    stack: ['Claude', 'MCP', 'RAG', 'React', 'TypeScript',
            'GitHub Actions', 'Docker', 'AWS ECS'],
  },
  {
    company: 'Restoration Partner',
    role: 'Full-Stack Web Developer',
    when: 'Mar 2021 — Jun 2023',
    type: 'Full-time',
    where: 'Portland, MI',
    points: [
      'Built secure, high-performance web applications with React, Node.js, '
      + 'TypeScript and PostgreSQL under OWASP guidelines, with RBAC and '
      + 'input sanitisation.',
      'Designed REST APIs on Express.js with OAuth 2.0 and rate limiting, and '
      + 'delivered Salesforce implementations across Sales Cloud, Service '
      + 'Cloud, Live Agent and AppExchange.',
      'Built custom AI chatbot solutions with context-aware prompting that '
      + 'reduced customer support tickets by 45%.',
      'Deployed AWS S3, CloudFront, CloudWatch and SIEM tooling for security '
      + 'monitoring and performance optimisation.',
    ],
    stack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL',
            'Express.js', 'Salesforce', 'AWS'],
  },
  {
    company: 'MiHIN',
    role: 'Software Engineer Intern',
    when: 'May 2020 — Mar 2021',
    type: 'Internship',
    where: 'Grand Rapids, MI',
    points: [
      'Worked across the full SDLC in healthcare technology — requirements '
      + 'gathering, development, testing and deployment — within SCRUM/XP '
      + 'teams.',
      'Helped develop data governance policies aligned to SOX and GDPR with '
      + 'comprehensive audit trails.',
      'Supported AWS IAM role management, access policies and secure '
      + 'authentication for cloud-based healthcare applications.',
    ],
    stack: ['SDLC', 'Agile / SCRUM', 'AWS IAM', 'GDPR', 'Healthcare IT'],
  },
];

export const CREDENTIALS = [
  {
    title: 'Salesforce Administrator',
    issuer: 'Salesforce',
    badge: 'Certified',
    body: 'Salesforce org administration — workflow automation, reports and '
        + 'dashboards, data and access management across Sales Cloud and '
        + 'Service Cloud.',
  },
  {
    title: 'Salesforce AI Associate',
    issuer: 'Salesforce',
    badge: 'Certified',
    body: 'AI fundamentals on the Salesforce platform — Einstein capabilities, '
        + 'ethical AI principles and data readiness for AI-powered CRM.',
  },
  {
    title: 'Advanced DevOps',
    issuer: 'TrainWithShubham',
    badge: 'Certified',
    body: 'CI/CD pipeline design, Docker, Kubernetes, Terraform and '
        + 'cloud-native deployment automation.',
  },
  {
    title: 'B.A. Information Science',
    issuer: 'Michigan State University',
    badge: 'Degree',
    body: 'Bachelor of Arts in Information Science with a minor in Information '
        + 'Technology. East Lansing, MI.',
  },
  {
    title: 'Full-Stack Web Development',
    issuer: 'Hackbright Academy',
    badge: 'Bootcamp',
    body: 'Intensive full-stack bootcamp — modern JavaScript, React, backend '
        + 'APIs and databases.',
  },
];
