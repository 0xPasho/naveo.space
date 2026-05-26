/**
 * SEO blog topic matrix for Naveo.
 *
 * Generates ~500 unique, keyword-focused topics by composing small base
 * arrays (tools × concepts × intents + comparatives). Edit the arrays
 * to tune; dedupes on slug so overlapping templates are safe.
 *
 * Each topic is locale-agnostic — it carries an EN-flavored title and
 * keyword that the generator re-renders inside the target language.
 * `translationKey` is the slug (shared across locales).
 *
 * Categories must match BLOG_CATEGORIES in src/modules/blog/data.ts:
 *   prompting | skills | mcp | agents | tooling | workflows | comparisons
 */

export type BlogIntent =
  | "how-to"
  | "guide"
  | "comparison"
  | "list"
  | "tutorial"
  | "mistakes"
  | "tips"
  | "tool-roundup"
  | "ai-workflow"

export interface BlogTopic {
  title: string
  slug: string
  translationKey: string
  category: string
  keyword: string
  tool: string | null
  intent: BlogIntent
  year: number
}

const YEAR = 2026

interface Tool {
  slug: string
  display: string
}

const TOOLS: Tool[] = [
  { slug: "claude", display: "Claude" },
  { slug: "claude-code", display: "Claude Code" },
  { slug: "cursor", display: "Cursor" },
  { slug: "gpt-5", display: "GPT-5" },
  { slug: "copilot", display: "GitHub Copilot" },
  { slug: "anthropic-sdk", display: "Anthropic SDK" },
  { slug: "openai-sdk", display: "OpenAI SDK" },
]

// Concepts that map to the "concepts" axis. These flow into the title
// templates as the noun phrase.
interface Concept {
  slug: string
  noun: string
  category: string
}

const PROMPTING_CONCEPTS: Concept[] = [
  { slug: "prompt-engineering", noun: "Prompt Engineering", category: "prompting" },
  { slug: "system-prompts", noun: "System Prompts", category: "prompting" },
  { slug: "few-shot-prompting", noun: "Few-Shot Prompting", category: "prompting" },
  { slug: "chain-of-thought", noun: "Chain-of-Thought Prompts", category: "prompting" },
  { slug: "prompt-templates", noun: "Prompt Templates", category: "prompting" },
  { slug: "structured-outputs", noun: "Structured Outputs", category: "prompting" },
  { slug: "xml-prompting", noun: "XML Prompting", category: "prompting" },
  { slug: "prompt-caching", noun: "Prompt Caching", category: "prompting" },
  { slug: "context-windows", noun: "Context Windows", category: "prompting" },
  { slug: "role-prompting", noun: "Role Prompting", category: "prompting" },
]

const SKILL_CONCEPTS: Concept[] = [
  { slug: "claude-skills", noun: "Claude Skills", category: "skills" },
  { slug: "custom-skills", noun: "Custom Skills", category: "skills" },
  { slug: "skill-bundles", noun: "Skill Bundles", category: "skills" },
  { slug: "skill-design", noun: "Skill Design", category: "skills" },
  { slug: "skill-frontmatter", noun: "Skill Frontmatter", category: "skills" },
  { slug: "domain-skills", noun: "Domain Skills", category: "skills" },
  { slug: "skill-permissions", noun: "Skill Permissions", category: "skills" },
  { slug: "subagent-skills", noun: "Sub-agent Skills", category: "skills" },
]

const MCP_CONCEPTS: Concept[] = [
  { slug: "mcp-servers", noun: "MCP Servers", category: "mcp" },
  { slug: "mcp-clients", noun: "MCP Clients", category: "mcp" },
  { slug: "mcp-tools", noun: "MCP Tools", category: "mcp" },
  { slug: "mcp-resources", noun: "MCP Resources", category: "mcp" },
  { slug: "mcp-transports", noun: "MCP Transports", category: "mcp" },
  { slug: "remote-mcp", noun: "Remote MCP Servers", category: "mcp" },
  { slug: "mcp-auth", noun: "MCP Authentication", category: "mcp" },
  { slug: "mcp-typescript", noun: "MCP in TypeScript", category: "mcp" },
  { slug: "mcp-python", noun: "MCP in Python", category: "mcp" },
]

const AGENT_CONCEPTS: Concept[] = [
  { slug: "ai-agents", noun: "AI Agents", category: "agents" },
  { slug: "agent-loops", noun: "Agent Loops", category: "agents" },
  { slug: "tool-use", noun: "Tool Use", category: "agents" },
  { slug: "function-calling", noun: "Function Calling", category: "agents" },
  { slug: "agentic-workflows", noun: "Agentic Workflows", category: "agents" },
  { slug: "subagents", noun: "Sub-agents", category: "agents" },
  { slug: "agent-orchestration", noun: "Agent Orchestration", category: "agents" },
  { slug: "agent-memory", noun: "Agent Memory", category: "agents" },
  { slug: "agent-evaluation", noun: "Agent Evaluation", category: "agents" },
]

const TOOLING_CONCEPTS: Concept[] = [
  { slug: "ai-coding-assistant", noun: "AI Coding Assistants", category: "tooling" },
  { slug: "ide-integration", noun: "IDE Integrations", category: "tooling" },
  { slug: "cli-agents", noun: "CLI Agents", category: "tooling" },
  { slug: "ai-pair-programming", noun: "AI Pair Programming", category: "tooling" },
  { slug: "ai-code-review", noun: "AI Code Review", category: "tooling" },
  { slug: "ai-debugging", noun: "AI Debugging", category: "tooling" },
  { slug: "ai-refactoring", noun: "AI Refactoring", category: "tooling" },
]

const WORKFLOW_CONCEPTS: Concept[] = [
  { slug: "ai-workflows", noun: "AI Workflows", category: "workflows" },
  { slug: "context-engineering", noun: "Context Engineering", category: "workflows" },
  { slug: "ai-evaluation", noun: "AI Evaluation", category: "workflows" },
  { slug: "ai-testing", noun: "AI Testing", category: "workflows" },
  { slug: "rag-pipelines", noun: "RAG Pipelines", category: "workflows" },
  { slug: "memory-systems", noun: "Memory Systems", category: "workflows" },
  { slug: "ai-cost-optimization", noun: "AI Cost Optimization", category: "workflows" },
]

const ALL_CONCEPTS: Concept[] = [
  ...PROMPTING_CONCEPTS,
  ...SKILL_CONCEPTS,
  ...MCP_CONCEPTS,
  ...AGENT_CONCEPTS,
  ...TOOLING_CONCEPTS,
  ...WORKFLOW_CONCEPTS,
]

interface TemplateSpec {
  template: string
  intent: BlogIntent
}

// Tool × concept gets a single template per concept-category to keep the
// long-tail focused. Concept-only templates do the heavy lifting.
const TOOL_X_CONCEPT_TEMPLATES: TemplateSpec[] = [
  { template: "How to Use {Noun} in {Tool} ({Year})", intent: "how-to" },
]

// Generic concept-only templates (no tool dimension, evergreen).
const CONCEPT_ONLY_TEMPLATES: TemplateSpec[] = [
  { template: "What Are {Noun}? A Practical Introduction for {Year}", intent: "guide" },
  { template: "{Noun} Explained: The Mental Model You Actually Need", intent: "guide" },
  { template: "10 {Noun} Tips Every AI Developer Should Know", intent: "tips" },
  { template: "{Noun}: Common Mistakes and How to Fix Them", intent: "mistakes" },
  { template: "Tutorial: Build Your First {Noun} Workflow", intent: "tutorial" },
]

interface Comparison {
  a: Tool
  b: Tool
  category: string
}

const COMPARISONS: Comparison[] = [
  { a: TOOLS[1], b: TOOLS[2], category: "comparisons" }, // Claude Code vs Cursor
  { a: TOOLS[0], b: TOOLS[3], category: "comparisons" }, // Claude vs GPT-5
  { a: TOOLS[1], b: TOOLS[4], category: "comparisons" }, // Claude Code vs Copilot
  { a: TOOLS[2], b: TOOLS[4], category: "comparisons" }, // Cursor vs Copilot
  { a: TOOLS[5], b: TOOLS[6], category: "comparisons" }, // Anthropic SDK vs OpenAI SDK
]

const COMPARISON_TEMPLATES: TemplateSpec[] = [
  { template: "{A} vs {B}: Which One Should You Use in {Year}?", intent: "comparison" },
  { template: "{A} vs {B} for AI Agents", intent: "comparison" },
  { template: "{A} vs {B} for Production Workflows", intent: "comparison" },
  { template: "Switching From {B} to {A}: A Practical Guide", intent: "how-to" },
  { template: "{A} vs {B}: Pricing, Performance, and Real-World Use", intent: "comparison" },
]

// Anchor / pillar topics — manually authored, highest-priority SEO.
const ANCHOR_TOPICS: Omit<BlogTopic, "year" | "slug" | "translationKey">[] = [
  {
    title: "The Complete Guide to Prompt Engineering for Developers (2026)",
    category: "prompting",
    keyword: "prompt engineering for developers",
    tool: null,
    intent: "guide",
  },
  {
    title: "Claude Skills: What They Are and How to Build One",
    category: "skills",
    keyword: "claude skills",
    tool: "claude",
    intent: "guide",
  },
  {
    title: "MCP Servers Explained: From Zero to Your First Tool",
    category: "mcp",
    keyword: "mcp server tutorial",
    tool: null,
    intent: "tutorial",
  },
  {
    title: "Building AI Agents That Actually Work in Production",
    category: "agents",
    keyword: "production ai agents",
    tool: null,
    intent: "guide",
  },
  {
    title: "Tool Use vs Function Calling: What's the Difference?",
    category: "agents",
    keyword: "tool use vs function calling",
    tool: null,
    intent: "comparison",
  },
  {
    title: "Prompt Caching: Cut Your AI Bill by 90%",
    category: "prompting",
    keyword: "prompt caching",
    tool: "claude",
    intent: "guide",
  },
  {
    title: "How to Pick the Right AI Coding Assistant in 2026",
    category: "tooling",
    keyword: "best ai coding assistant",
    tool: null,
    intent: "comparison",
  },
  {
    title: "Context Engineering: The Skill Beyond Prompt Engineering",
    category: "workflows",
    keyword: "context engineering",
    tool: null,
    intent: "guide",
  },
]

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[áàä]/g, "a")
    .replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function generateTopics(): BlogTopic[] {
  const out: BlogTopic[] = []
  const seen = new Set<string>()

  const push = (t: Omit<BlogTopic, "year" | "slug" | "translationKey">) => {
    const slug = slugify(t.title)
    if (!slug || seen.has(slug)) return
    seen.add(slug)
    out.push({ ...t, slug, translationKey: slug, year: YEAR })
  }

  for (const anchor of ANCHOR_TOPICS) push(anchor)

  for (const tool of TOOLS) {
    for (const concept of ALL_CONCEPTS) {
      for (const spec of TOOL_X_CONCEPT_TEMPLATES) {
        const title = spec.template
          .replace(/\{Tool\}/g, tool.display)
          .replace(/\{Noun\}/g, concept.noun)
          .replace(/\{Year\}/g, String(YEAR))
        const keyword = `${tool.slug.replace(/-/g, " ")} ${concept.slug.replace(/-/g, " ")}`
        push({
          title,
          category: concept.category,
          keyword,
          tool: tool.slug,
          intent: spec.intent,
        })
      }
    }
  }

  for (const concept of ALL_CONCEPTS) {
    for (const spec of CONCEPT_ONLY_TEMPLATES) {
      const title = spec.template
        .replace(/\{Noun\}/g, concept.noun)
        .replace(/\{Year\}/g, String(YEAR))
      push({
        title,
        category: concept.category,
        keyword: concept.slug.replace(/-/g, " "),
        tool: null,
        intent: spec.intent,
      })
    }
  }

  for (const cmp of COMPARISONS) {
    for (const spec of COMPARISON_TEMPLATES) {
      const title = spec.template
        .replace(/\{A\}/g, cmp.a.display)
        .replace(/\{B\}/g, cmp.b.display)
        .replace(/\{Year\}/g, String(YEAR))
      push({
        title,
        category: cmp.category,
        keyword: `${cmp.a.slug.replace(/-/g, " ")} vs ${cmp.b.slug.replace(/-/g, " ")}`,
        tool: cmp.a.slug,
        intent: spec.intent,
      })
    }
  }

  return out
}

if (require.main === module) {
  const all = generateTopics()
  console.log(`Total unique topics: ${all.length}`)
  for (const t of all) {
    const toolStr = t.tool ? `[${t.tool}] ` : ""
    console.log(
      `  ${t.category.padEnd(12)} ${t.intent.padEnd(13)} ${toolStr}${t.title}`,
    )
  }
}
