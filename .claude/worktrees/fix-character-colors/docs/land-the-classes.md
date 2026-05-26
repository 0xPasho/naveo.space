# Land the Classes — Plan completo del temario

> Doc de inspección. Plan por track con steps, kinds de ejercicio asignados, hook narrativo, temas spicy, riesgos didácticos y fuentes. Sintetizado de 3 agentes de investigación (Anthropic ecosystem, prompting/agents/programming, Codex).
>
> **Estado**: propuesta para revisar y aprobar antes de migrar a `02-curriculum.md`.

---

## Vista global

| # | Track | Pasos | Free/Pro | Nuevos kinds | Costo LLM por alumno (estimado) |
|---|---|---|---|---|---|
| 0 | Lógica de programación | 8 | **FREE** | Z1–Z4 | $0 |
| 1 | Anatomía del prompt | 9 | mix (3 free) | — | < $0.50 |
| 2 | Conversaciones que funcionan | 6 | PRO | — | < $1.00 |
| 3 | Tool use y MCPs | 10 | PRO | — | < $2.00 |
| 4 | Anthropic Skills | 7 | PRO | D1–D3 | < $1.50 |
| 5 | Flujos complejos: agentes/RAG/evals | 8 | PRO | C7 | < $3.00 |
| 6 | Build apps con la API | 6 | PRO | E1–E3 | < $1.00 |
| 7 | Aprender con Claude Code | 6 | PRO | F1–F3 | high-touch UI |
| 8 | Aprender con Codex | 5 | PRO | G1–G5 | high-touch UI |

**Totales**: 65 steps · 12 nuevos exercise kinds · Track 0 100% determinista · Tracks 1-2 los más explorados pedagógicamente · Tracks 3-5 el plato fuerte conceptual · Tracks 6-8 aplicados/prácticos.

---

## Track 0 · Lógica de programación (FREE)

**Audiencia**: alguien sin experiencia en código que quiere llegar a Track 1+ con base mínima.

**Promesa**: el alumno termina capaz de leer un ejemplo del SDK de Anthropic, modificarlo, y ejecutarlo en el navegador.

**Steps**:

| # | Tema | Kind | Por qué conecta con IA |
|---|---|---|---|
| 1 | Variables y tipos | `Z2 code-fill-blank` | el "frame" de un mensaje al modelo (`apiKey`, `userMessage`) |
| 2 | Strings + template literals | `Z3 code-sandbox-run` | construir prompts dinámicos con `${}` |
| 3 | Funciones y parámetros | `Z3 code-sandbox-run` | una llamada al modelo es una función con args |
| 4 | Objetos | `Z2 code-fill-blank` | la forma exacta de un request a la API: `{ model, max_tokens, messages }` |
| 5 | Arrays y `.map` | `Z1 code-trace` + `Z3` | lista de mensajes y batch de inputs |
| 6 | JSON | `Z4 code-bug-find` | el formato de la API; bug = JSON malformado |
| 7 | async / await | `Z3 code-sandbox-run` | la API tarda, no bloquea |
| 8 | `fetch` + leer response | `Z3 code-sandbox-run` | tu primer "API call" (a un mock de Claude) |

**Hook narrativo**: **"El loro de bolsillo"**. El alumno construye paso a paso un loro digital: primero solo guarda lo que le digas (variables), luego repite con énfasis (strings), luego le mandas instrucciones (funciones), luego responde con una pequeña pausa (async), y al final llama a un cerebro externo (fetch). En step 8 el cerebro es un mock del API de Claude — y en Track 1 step 1 el cerebro se vuelve real.

**Spicy / no obvio**:
- Cero costo en LLM. Track entero ejecuta en sandbox del navegador.
- El alumno termina escribiendo `messages: [{role, content}]` sin saber que es exactamente la forma del SDK de Anthropic.
- Cada concepto se introduce con un ejemplo que **prefigura** su uso en IA, no como pedagogía neutra.

**Hard de enseñar didácticamente**:
- **async/await**: no hay intuición física para "espera sin bloquear". MDN, FCC y todos pelean con esto. Invertir en visualización tipo timeline (event loop animado) y ejemplo "pizza" (Wes Bos / FCC). Considerar un `Z5 code-timeline-order` donde el alumno ordena visualmente el orden de eventos.
- **JSON vs object**: parecen lo mismo pero uno es string y otro es estructura. Diseñar un ejercicio donde el alumno toca ambos lados y ve el `JSON.parse` / `JSON.stringify`.

**Fuentes**:
- [freeCodeCamp — Async/Await por la pizza](https://www.freecodecamp.org/news/async-await-javascript-tutorial-explained-by-making-pizza/)
- [freeCodeCamp — Fetch API for beginners](https://www.freecodecamp.org/news/javascript-fetch-api-for-beginners/)
- [MDN — Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## Track 1 · Anatomía del prompt (parcial FREE)

**Promesa**: el alumno escribe prompts estructurados, robustos y reproducibles; sabe cuándo usar XML vs JSON Schema; entiende que prompts para razonadores son distintos a no-razonadores; piensa en cache desde el día 1.

**Steps**:

| # | Tema | Kind | Free/Pro |
|---|---|---|---|
| 1 | Prompt mínimo viable | `A5 prompt-task` (rúbrica chica) | FREE |
| 2 | 4 partes: rol/tarea/contexto/formato | `A1 prompt-anatomy` | FREE |
| 3 | XML tags estilo Claude | `A3 prompt-tag-fill` | FREE |
| 4 | Few-shot: cuándo ayuda y cuándo no | `A7 prompt-A-B` + `A5` | PRO |
| 5 | Output: JSON Schema vs XML vs free-text | `A4 prompt-format-convert` | PRO |
| 6 | CoT y modelos de razonamiento | `A7 prompt-A-B` + `A5` | PRO |
| 7 | Prompt caching como decisión de autoría | `A2 prompt-assemble` | PRO |
| 8 | Iterar: arreglar prompt flojo | `A6 prompt-iterate` | PRO |
| 9 | Capstone: extractor + tu rúbrica | `A5` + `A9 prompt-rubric-author` | PRO |

**Hook narrativo**: **"Construye tu mascota IA"**. Cada step da una capacidad. Step 1: responde algo cualquiera. Step 3: responde con personalidad y formato XML. Step 5: devuelve JSON con `mood`, `hunger`, `last_seen`. Step 9: extrae datos limpios desde texto sucio del usuario, con una rúbrica que el propio alumno escribió. Esa rúbrica viaja con él al Track 5.

**Spicy / no obvio (lo que casi nadie enseña)**:
- **Modelos de razonamiento (Sonnet 4.6 con thinking adaptativo) NO necesitan "piensa paso a paso"**. Mete CoT a un razonador y lo degradas.
- **Few-shot moderno enforce formato más que razonamiento**. Para modelos modernos los ejemplos a veces solo dicen "responde así", no enseñan a pensar.
- **JSON forzado puede degradar razonamiento ~10-15%** en tareas complejas (paper "Let Me Speak Freely?"). XML / free-text + parser puede ganar.
- **Prompt caching es decisión de estructura del prompt**, no de SDK. Lo estático antes, el cache breakpoint al final del bloque estático.
- **Evals-first mindset siembra aquí**: termino el track escribiendo mi rúbrica (la cosecho en Track 5).

**Hard de enseñar didácticamente**:
- **Que los outputs varían pero la rúbrica los hace evaluables**: shift mental fuerte para alguien que viene de programación clásica. Necesita un step preview "ejecuta el mismo prompt 3 veces y observa la varianza" antes del step 1.
- **Que el cache es decisión de estructura**: invisible. Necesita visualización tipo "este bloque es cacheable / este NO" coloreando el prompt.

**Fuentes**:
- [Anthropic — Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Anthropic — Use XML tags](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/use-xml-tags)
- [Anthropic — Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Anthropic — Building with extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Let Me Speak Freely? (format restrictions hurt reasoning)](https://arxiv.org/html/2408.02442v1)
- [Revisiting CoT: Zero-shot can beat few-shot](https://arxiv.org/html/2506.14641v1)

---

## Track 2 · Conversaciones que funcionan (PRO)

**Promesa**: el alumno conduce conversaciones multi-turn hacia un objetivo, sabe cuándo resetear, cuándo resumir, y cuándo el problema NO es el modelo sino la conversación que escribió.

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | System vs user message: qué pertenece a cada uno | `A1 prompt-anatomy` + `conversation-goal` |
| 2 | Persona y consistencia turno a turno | `conversation-goal` (3-4 turnos) |
| 3 | Resumir y recortar contra el "context rot" | `A5 prompt-task` con setup multi-turn |
| 4 | Recuperarse de un turno malo (o saber que NO se puede) | `conversation-goal` |
| 5 | Aclaraciones dirigidas: hacer que el modelo te pregunte | `A6 prompt-iterate` |
| 6 | Capstone: el detective interroga al sospechoso | `conversation-goal` (rúbrica grande, 6-10 turnos) |

**Hook narrativo**: **"El detective"**. Hay un caso a resolver y una serie de sospechosos LLM-driven (cada uno un system prompt distinto, con motivos distintos para mentir). Step 1: entiendes la diferencia entre "reglas del juego" (system) y "lo que dices al sospechoso" (user). Step 6: conduces un interrogatorio completo donde tu prompt-conducción gana o pierde la confesión.

**Spicy / no obvio**:
- **Paper Microsoft/Salesforce 2025**: LLMs degradan ~39% en multi-turn vs single-turn. La intuición popular ("dale más contexto") empeora las cosas.
- **A veces la mejor respuesta de producto es batchear todo el contexto recolectado en un solo prompt fresco** y reiniciar. Reset gana.
- **"Game state summary"** inyectado al inicio de cada turno como mini-knowledge-base es mejor que confiar en el system prompt + history.

**Hard de enseñar didácticamente**:
- **Cuándo resetear vs cuándo seguir**: es juicio, no regla. Mostrar casos donde reset gana y casos donde reset pierde, idealmente medirlo automáticamente con LLM-judge sobre el resultado final.
- **Consistencia de persona**: se mide turno a turno y de manera holística — necesita un judge especializado.

**Fuentes**:
- [LLMs Get Lost In Multi-Turn Conversation (OpenReview 2025)](https://openreview.net/forum?id=VKGTGGcwl6)
- [PromptHub — Why LLMs Fail in Multi-Turn](https://www.prompthub.us/blog/why-llms-fail-in-multi-turn-conversations-and-how-to-fix-it)
- [How Long Contexts Fail (D. Breunig)](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html)
- [Context Rot: Why AI gets worse the longer you chat](https://www.producttalk.org/context-rot/)

---

## Track 3 · Tool use y MCPs (PRO)

**Promesa**: el alumno construye MCPs que Claude **realmente decide usar**, entiende la diferencia entre raw tool-use y MCP, y evita las trampas comunes (descripciones vagas, errores no manejados, auth mal hecho).

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | Anatomía de tool-use | `B1 tool-schema-author` |
| 2 | Qué hace que Claude elija una herramienta | `B2 tool-description-craft` |
| 3 | Agentic loop en acción | `B3 tool-handler-implement` |
| 4 | Introducción a MCP | `B4 tool-name-pick` |
| 5 | Tu primer MCP server | `B5 mcp-multi-tool` |
| 6 | MCPs multi-herramienta | `B5 mcp-multi-tool` |
| 7 | Debugging: transporte / schemas / output | `B6 mcp-debug` |
| 8 | Resilencia: retries / timeouts / errores parciales | `B7 mcp-resilience` |
| 9 | Auth y seguridad (OAuth 2.1 + PKCE) | `B7` (variante auth) |
| 10 | End-to-end: discover → invoke → validate | `B8 mcp-end-to-end` |

**Hook narrativo**: estás construyendo un agente que necesita actualizar Jira, leer código de GitHub, y buscar en docs internos. Raw tool-use significa baked-in todo en tu app. MCP significa: define una vez, reusas en Claude Code, VS Code, y el equipo. La trampa: una descripción vaga ("get the data") confunde a Claude; una específica ("search GitHub issues matching criteria") lo hace confiable. Vamos a construir MCPs que Claude **quiere** usar.

**Spicy / no obvio**:
- **Tu descripción ES la API que el LLM lee**. Si es vaga, Claude adivina mal.
- **Stateful MCPs violan el contrato**: Claude no promete llamadas secuenciales al mismo server.
- **Tool poisoning**: una descripción maliciosa puede dirigir mal a Claude. Auditar descripciones como código.
- **OAuth 2.1 + PKCE en MCPs es 2025-nuevo** (spec 2025-03-26). La mayoría todavía usa tokens estáticos inseguros.
- **Server-executed tools** (`web_search`, `code_execution`) tienen su loop interno en Anthropic; client tools requieren tu loop.

**Hard de enseñar didácticamente**:
- **Debugging del transporte**: stdio vs HTTP vs SSE. Los alumnos deben **ver** un server crashear y leer logs. Requiere ambiente live + paciencia.
- **Cuándo una descripción es realmente buena**: vagas son fáciles de detectar; los solapes sutiles ("fetch current record" vs "fetch latest record") requieren gusto y ejemplos reales de MCPs en producción (GitHub, Slack official).

**Fuentes**:
- [Tool use with Claude — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [How tool use works](https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works)
- [Model Context Protocol — modelcontextprotocol.io](https://modelcontextprotocol.io/)
- [MCP Security Best Practices 2025](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)
- [GitHub — modelcontextprotocol/servers (referencias)](https://github.com/modelcontextprotocol/servers)

---

## Track 4 · Anthropic Skills (PRO)

**Promesa**: el alumno empaca un comportamiento reutilizable como Skill, entiende dónde y cuándo cargan los Skills (progressive disclosure de 3 niveles), y los publica.

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | ¿Qué es un Skill? | `D1 skill-anatomy` |
| 2 | Progressive disclosure: 3 niveles de carga | `A1 prompt-anatomy` adaptado |
| 3 | Anatomía: SKILL.md + instrucciones + ejemplos | `B1 tool-schema-author` adaptado (skill-md-structure) |
| 4 | Discovery: cuándo Claude carga tu Skill | `D2 skill-discovery` |
| 5 | Bundled scripts sin cargar código en contexto | `D3 skill-scripts` |
| 6 | Skill end-to-end: análisis de datos | `C1 chain-design` adaptado |
| 7 | Skill vs MCP vs prompt + auditoría de seguridad | `A8 prompt-explain` |

**Hook narrativo**: ya escribiste 5 veces el mismo "extract & summarize PDF". Skills lo hacen una vez, lo bundlean con ejemplos y reference docs, y dejan que Claude lo descubra cuando aplica. La **genialidad**: el body del Skill no se carga hasta que Claude lo necesita. Puedes shipear 50 Skills, 100+ docs, **0 costo de contexto** hasta que una se dispara. El **peligro**: un Skill malicioso puede hijackear Claude para exfil. Construyes uno completo, entiendes cómo Claude decide cargarlo, y auditas uno por seguridad.

**Spicy / no obvio**:
- **Metadata always-loaded** → 50 Skills con <100 tokens de costo permanente.
- **Scripts ejecutan sin cargar código en contexto**: 10KB de script ejecuta y devuelve 10 palabras de output.
- Una **descripción vaga no dispara el Skill**. La habilidad clave (otra vez) es escribir descripciones específicas — same skill que B2.
- Skills son cómo le das a Claude **memoria organizacional**: workflows, estándares, conocimiento de dominio.
- Skills no sincronizan entre superficies (API vs Claude.ai vs Claude Code) — manejas separado por superficie.

**Hard de enseñar didácticamente**:
- **Cuándo una descripción es "específica suficiente"** para discovery. Línea fuzzy. Requiere live testing iterativo: escribe descripción, prueba con 5+ prompts, itera. No hay rúbrica que lo resuelva sola.

**Fuentes**:
- [Agent Skills Overview — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Equipping agents for the real world with Agent Skills — Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Introducing Agent Skills — Anthropic News](https://www.anthropic.com/news/skills)
- [Agent Skills Cookbook](https://platform.claude.com/cookbook/skills-notebooks-01-skills-introduction)
- [Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

---

## Track 5 · Flujos complejos: agentes, RAG, evals (PRO)

**Promesa**: el alumno orquesta sistemas multi-step usando los 5 patterns de Anthropic, construye un mini-RAG con hybrid retrieval + reranking, y — crucialmente — evalúa todo eso con un golden dataset y un LLM-judge calibrado contra humano.

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | **Evals primero**: golden dataset de 20 casos | `C5 evals-author` + `A9 prompt-rubric-author` |
| 2 | Cadena simple (prompt chaining) | `C1 chain-design` |
| 3 | Routing: clasificar input → sub-prompt especializado | `C3 prompt-router` |
| 4 | Paralelización y orchestrator-workers | `C1` + `C7 architecture-A-B` (nuevo) |
| 5 | Agente con loop: stopReason + budget | `C4 agent-loop-design` |
| 6 | Mini-RAG: hybrid retrieval (BM25 + embeddings) + reranker | `C1 chain-design` con retrieval |
| 7 | Evaluator-optimizer + LLM-as-judge calibrado | `C6 eval-judge-author` |
| 8 | Capstone: asistente de research con eval suite propia | `B8 mcp-end-to-end` adaptado + `C5` |

**Hook narrativo**: **"El asistente de research"**. La historia empieza al revés: en step 1 escribes los 20 casos que el sistema final tiene que pasar — y todo lo que haces en los 7 pasos siguientes es para llegar a ≥85% en ese golden dataset. La evaluación NO es el último paso, es el primero.

**Apuesta pedagógica fuerte (Hamel Husain)**: **evals-first, arquitectura después**. La mayoría de los agentes que fallan, fallan porque su eval es mala — no su arquitectura. Esto diferencia el track de cualquier "build an agent" tutorial estándar.

**Spicy / no obvio**:
- **RAG es mostly search**: la diferencia entre RAG mediocre y RAG bueno es BM25 + embeddings + cross-encoder rerank, no el LLM. Anthropic Contextual Retrieval reduce fallos hasta 67% combinado con rerank.
- **`stop_reason` del modelo es la señal de "terminé"**, no tu hard cap. La mayoría implementa al revés.
- **LLM-as-judge tiene sesgos sistemáticos**: style (0.76-0.92), position, verbosity, self-preference. Calibrar contra humano es no-negociable.
- **Reasoning models cambian agentes**: adaptive thinking (Sonnet 4.6+) calibra razonamiento por step en agentes multi-step largos — no necesitas forzar CoT en cada turno.

**Hard de enseñar didácticamente**:
- **Calibración del juez contra humano**: requiere que el alumno produzca etiquetas humanas (= que él mismo etiquete N casos), y que la plataforma le mida concordancia. Operativamente complejo: hay que diseñar UI de etiquetado liviana ANTES del ejercicio.
- **Cuándo elegir cuál de los 5 patterns**: tentación de enseñarlo como flowchart simplista; mejor: mostrar el mismo problema resuelto con 2 patterns distintos y comparar costo/latencia/calidad. Por eso `C7 architecture-A-B` (nuevo).

**Fuentes**:
- [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic — Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval)
- [Hamel Husain — LLM Evals FAQ](https://hamel.dev/blog/posts/evals-faq/)
- [Hamel Husain — Your AI Product Needs Evals](https://hamel.dev/blog/posts/evals/)
- [Hamel Husain — LLM-as-a-Judge](https://hamel.dev/blog/posts/llm-judge/)
- [Eugene Yan — Patterns for LLM Systems](https://eugeneyan.com/writing/llm-patterns/)
- [Lilian Weng — LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/)
- [Justice or Prejudice? LLM-as-Judge biases](https://llm-judge-bias.github.io/)

---

## Track 6 · Build apps con la API (PRO)

**Promesa**: el alumno construye una micro-app funcional (Next.js + TypeScript) que llama Claude, implementa streaming, y optimiza con prompt caching.

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | "Hello, Claude": mensaje mínimo | `A2 prompt-assemble` |
| 2 | Streaming: render incremental | `E1 api-streaming` |
| 3 | Prompt caching: 90% menos costo | `E2 api-caching` |
| 4 | Tool use desde la API | `B3 tool-handler-implement` |
| 5 | Structured outputs (schema-driven) | `E3 api-structured-outputs` |
| 6 | Next.js + Claude end-to-end | `C1 chain-design` (api-nextjs-integration) |

**Hook narrativo**: cada app que habla con Claude sigue el mismo patrón — prompt → response → iterate. Empieza con la llamada simple. Agrega streaming (UX). Agrega caching (costo). Step 6: app real desplegable a Vercel. Por step 6 tienes algo que puedes shippear.

**Spicy / no obvio**:
- **El SDK es mostly fetch + event parsing**. Entiende eso y debugeas cualquier cosa.
- Streaming no cambia el costo, solo la UX — pero la diferencia de UX es enorme.
- **Prompt caching es ortogonal a streaming**; usa los dos juntos.
- **Structured outputs vía tool use es más confiable que pedir JSON y parsear**. Build the schema first.
- **Cachear 50K tokens de contexto**: $0.27 first request, $0.027 each subsequent within 5 min = 90% savings.

**Hard de enseñar didácticamente**:
- **Debug streaming + caching juntos**: cache hits aparecen en `stream_start`, no al final. Confunde a alumnos que esperan ver el meter al final, e interpretan "cache no funciona" cuando el problema es schema mismatch o TTL expiry.

**Fuentes**:
- [Tool use — Claude API](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Prompt Caching — Claude API](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [TypeScript SDK — anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript)
- [Claude Quickstarts — GitHub](https://github.com/anthropics/claude-quickstarts)

---

## Track 7 · Aprender con Claude Code (PRO)

**Promesa**: el alumno usa Claude Code en serio en su flujo de trabajo diario, entiende CLAUDE.md, slash commands, y hooks, y automatiza tareas repetidas.

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | Claude Code en 5 min: terminal → edits → commits | `F1 claude-code-flow` |
| 2 | CLAUDE.md: memory + standards + arquitectura | `F2 claude-md-craft` |
| 3 | Slash commands: atajos para tareas frecuentes | `B4 tool-name-pick` adaptado |
| 4 | Hooks: automación sin prompt | `F3 claude-code-automation` |
| 5 | Subagents: paralelizar tareas grandes | `C4 agent-loop-design` adaptado |
| 6 | Integración MCP + Claude Code | `B5 mcp-multi-tool` adaptado |

**Hook narrativo**: prompting en chat es rápido pero pierdes contexto al cerrar tab. Claude Code lee tu codebase, edita N archivos, corre comandos, commitea — async mientras tú trabajas en otra cosa. Los puntos de palanca: **CLAUDE.md** (1 doc, ∞ sesiones), **slash commands** (muscle memory + reliability), **hooks** (automatización sin pensar), **MCPs** (conecta tus tools). Al final tratas a Claude Code como un teammate senior, no un chatbot.

**Spicy / no obvio**:
- **CLAUDE.md es un Skill disfrazado**: filesystem-based, progressively loaded, discovered at startup.
- **Slash commands son skills nombradas**: `/review` carga un skill de review y Claude decide qué revisar.
- **Hooks codifican estándares de equipo en el harness**: linting, testing, deploy se vuelven automáticos.
- **El system prompt de Claude Code es legible**. Léelo — es lección magistral de cómo escribir prompts de agente.
- **MCP + Claude Code = full automation**: no API integration needed, just define el transport.

**Hard de enseñar didácticamente**:
- **Cuándo command vs hook vs skill**: subtle design choices. Pattern matching: one-off → command, repeated → hook, reusable → skill. Hard de enseñar abstracto; necesita ejemplos del mundo real.

**Fuentes**:
- [Claude Code Overview](https://code.claude.com/docs)
- Claude Code: memory, hooks, skills, MCP, settings (sub-pages oficiales)

---

## Track 8 · Aprender con Codex (PRO)

**Promesa**: en 5 pasos el alumno instala Codex CLI, configura sandbox y `AGENTS.md`, conecta un MCP, y hace una comparación informada con Claude Code para saber **cuándo elegir cuál**.

**Steps**:

| # | Tema | Kind |
|---|---|---|
| 1 | Login + primer turno (ChatGPT vs API key) | `G1 cli-bootstrap` |
| 2 | Sandbox + approval policy: los dos diales que importan | `G2 sandbox-tune` |
| 3 | `AGENTS.md` jerárquico (root + proximidad) | `A2 prompt-assemble` + `G3 context-file-author` |
| 4 | MCP + slash commands custom | `B5` + `G4 slash-prompt-author` |
| 5 | Hooks PreToolUse + duelo head-to-head con Claude Code | `C4` + `G5 head-to-head-eval` |

**Hook narrativo**: **"Dos terminales, un mismo bug."** El curso introduce Codex el día después de un capítulo de Claude Code. Le damos la misma issue de GitHub: refactorizar un endpoint y añadir tests. Una pestaña con Claude Code, otra con Codex `--full-auto`. Mientras Claude pide aprobación paso a paso, Codex termina solo y la pestaña queda en silencio. El alumno mira los dos diffs lado a lado y por primera vez entiende qué significa **"Codex for keystrokes, Claude Code for commits."**

**Compare/contrast moments con Claude Code**:
- Step 1: ambos OAuth con browser callback, pero Codex tiene fallback `--device-auth`; Claude Code no.
- Step 2: **Codex tiene OS-level sandbox** (Seatbelt en macOS, Landlock+seccomp en Linux). Claude Code se basa en `permissions.allow` JSON sin enforcement del kernel. Killer feature defensivo de Codex.
- Step 3: `AGENTS.md` (concatenación + override por proximidad, hard cap 32 KiB) vs `CLAUDE.md` (imports `@`, sin cap). **`AGENTS.md` es estándar abierto** — lo lee Cursor, Aider, OpenCode.
- Step 4: paridad MCP, pero Claude Code tuvo primero y mejor ecosistema. Codex compensa con **provider freedom** (puede apuntar a Claude, Gemini, locales).
- Step 5: hooks alcanzaron paridad en codex-cli 0.124.0 (Q1 2026); antes era ventaja de Claude Code.

**Spicy / no obvio**:
- **Codex usa handoff summary de una sola capa al compactar** → degrada calidad después de 2 compactions seguidos (issues #14120, #8602). Enseñar `/fork` o `/new` antes de pelear con `/compact`.
- **`--full-auto` no es "full auto"**: sigue siendo `workspace-write` + `on-request`. La verdadera autonomía es `danger-full-access` + `approval_policy = never` y eso solo dentro de container.
- **Custom prompts** viven en `CODEX_HOME` (personales). Para compartir con el equipo: **skills** que viajan en el repo.
- **Pricing 2026 moved a token-based** (~$5/$30 per M para gpt-5.5). Codex consume **~4× menos tokens** que Claude Code para mismo output — pero mide más bajo en SWE-bench Verified (74.9 vs 87.6). Trade-off explícito.

**Hard de enseñar didácticamente**:
- Hacer que el alumno **sienta** la diferencia de tokens consumidos sin pagar el costo real (necesitamos mock counter, no API key).
- Reproducir compaction failures es no-determinístico.
- OAuth flow rompe en sandboxes web (no localhost callback usable). Enseñar `--device-auth` como path A.
- **"Cuándo elegir uno u otro" cambia mes a mes**. Disclaimer de fecha + links a benchmarks vivos en lugar de afirmaciones absolutas.

**Fuentes (todas datadas Q1-Q2 2026)**:
- [Codex CLI docs index](https://developers.openai.com/codex/cli)
- [Codex CLI Features](https://developers.openai.com/codex/cli/features)
- [Authentication](https://developers.openai.com/codex/auth)
- [Configuration Reference](https://developers.openai.com/codex/config-reference)
- [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md)
- [Sandbox concepts](https://developers.openai.com/codex/concepts/sandboxing)
- [MCP in Codex](https://developers.openai.com/codex/mcp)
- [Slash commands](https://developers.openai.com/codex/cli/slash-commands)
- [Hooks (codex-cli 0.124.0+)](https://developers.openai.com/codex/hooks)
- [Codex CLI vs Claude Code 2026 — NxCode](https://www.nxcode.io/resources/news/claude-code-vs-codex-cli-terminal-coding-comparison-2026)

---

## Catálogo consolidado de nuevos exercise kinds

12 nuevos kinds propuestos. Renumerados para evitar colisiones entre prefijos.

### Z* — Programación básica (Track 0)

| Kind | Mecánica | Validación | Costo |
|---|---|---|---|
| `Z1 code-trace` | predecir qué imprime un snippet de 4-8 líneas (MCQ) | determinista | 0 |
| `Z2 code-fill-blank` | completar un hueco específico (identificador, operador, propiedad) | determinista contra string esperado | 0 |
| `Z3 code-sandbox-run` | escribir snippet pequeño; ejecutamos en Web Worker / QuickJS | determinista (verificar `console.log` esperado) | 0 |
| `Z4 code-bug-find` | dado snippet con bug, marcar línea + elegir fix entre 3 opciones | determinista (MCQ doble) | 0 |

(Opcional: `Z5 code-timeline-order` para enseñar event loop visualmente — decidir más adelante.)

### D* — Skills (Track 4)

| Kind | Mecánica | Validación |
|---|---|---|
| `D1 skill-anatomy` | leer un SKILL.md, identificar metadata/instructions/examples/resources, validar frontmatter | determinista |
| `D2 skill-discovery` | escribir descripción de Skill, probar con 5 prompts, iterar hasta que discovery matchea intent | empírico (agente + dataset) |
| `D3 skill-scripts` | escribir script bundleado en una Skill; verificar que Claude lo corre sin cargar código | determinista + observación |

### E* — API building (Track 6)

| Kind | Mecánica | Validación |
|---|---|---|
| `E1 api-streaming` | implementar `client.messages.stream()`, parsear SSE, render incremental en Next.js | determinista (handler tests + manual) |
| `E2 api-caching` | agregar `cache_control` a request; medir `cache_creation_input_tokens` vs `cache_read_input_tokens` | determinista (verificar 90% reducción en repetición) |
| `E3 api-structured-outputs` | definir JSON schema, usar tool-use para enforce, parsear validated output | determinista (schema match) |

### F* — Claude Code (Track 7)

| Kind | Mecánica | Validación |
|---|---|---|
| `F1 claude-code-flow` | correr Claude Code en proyecto real, describir feature, ver edits/tests/commits | observacional (checklist) |
| `F2 claude-md-craft` | escribir CLAUDE.md de proyecto, documentar arquitectura/standards | rúbrica con LLM-judge |
| `F3 claude-code-automation` | definir hook o custom command; medir tiempo ahorrado | observacional |

### G* — Codex (Track 8)

| Kind | Mecánica | Validación |
|---|---|---|
| `G1 cli-bootstrap` | instalar Codex, elegir login, primer turno read-only | determinista (config inspecion) |
| `G2 sandbox-tune` | editar `~/.codex/config.toml`, reproducir 3 presets, observar approval prompt | determinista + observacional |
| `G3 context-file-author` | crear `AGENTS.md` jerárquico (global + project + nested) | rúbrica |
| `G4 slash-prompt-author` | crear custom prompt en `~/.codex/prompts/X.md` invocable como `/X` | determinista |
| `G5 head-to-head-eval` | misma tarea en Codex y Claude Code; comparar tokens/tiempo/calidad/aprobaciones | observacional + reflexión |

### C* — Adicional (Track 5)

| Kind | Mecánica | Validación |
|---|---|---|
| `C7 architecture-A-B` | mismo problema resuelto con 2 patterns distintos; alumno compara costo/latencia/calidad y elige + justifica | MCQ + LLM-judge sobre justificación |

---

## Decisiones abiertas

```
1. ¿Free split en Track 1?
   Recomendación: pasos 1-3 free (deterministas, costo 0),
   4-9 pro. Defendible economicamente.

2. ¿Cuáles tracks entran al MVP?
   Plan original (08-phases.md):  T1 + T3.
   Recomendación expandida:       T0 (free) + T1 (parcial free) + T3.
   Tracks 4 (Skills), 6, 7, 8 → fase 2.
   Codex (T8) → fase 3 (info que cambia rápido).

3. ¿Aprobar todos los 12 nuevos kinds?
   Z1-Z4: SI (deterministas, cheap, MVP-ready)
   D1-D3: SI (Skills es claramente nuevo, lo amerita)
   E1-E3: SI (API building requiere mecánica distinta)
   F1-F3: high-touch UI; reconsiderar para fase 2
   G1-G5: high-touch UI; revisar en fase 3
   C7:    SI (es elegante, sirve a Track 5 en MVP)

4. ¿`C7 architecture-A-B` se construye en MVP?
   Si T5 entra a MVP, sí. Si T5 es fase 2, también.
   Es barato (MCQ + judge sobre justificación).

5. ¿Migración a 02-curriculum.md cuándo?
   Sugerencia: dejar este doc como fuente de plan extendido.
   Migrar solo el subset MVP (T0/T1/T3) a 02-curriculum.md
   cuando esté aprobado.
```

---

## Capa de comunidad — panel de discusión por step (estilo LeetCode)

**Idea**: el panel izquierdo (lectura) tiene dos tabs — `Lección` y `Discusión` — y el de discusión es un mini-foro por step. Es la pieza social que hace que el producto se sienta vivo aunque el alumno esté solo.

### Wireframe del panel izquierdo con tabs

```
+----------------------------------------+----- exercise pane igual ------+
| [ Leccion ] [ Discusion (47) ]         |                                |
+----------------------------------------+                                |
|                                        |                                |
|  TAB: Discusion                        |                                |
|                                        |                                |
|  Ordenar: [ hot ] [ nuevos ] [ top ]   |                                |
|  Filtrar: [ todos ] [ pistas ] [ ? ]   |                                |
|                                        |                                |
|  +--------------------------------+    |                                |
|  | @ana             hace 2 dias   |    |                                |
|  | tag: pista                     |    |                                |
|  |                                |    |                                |
|  | "Me bloqueo el caso 3 hasta    |    |                                |
|  |  que entendi que el modelo     |    |                                |
|  |  inventa cuando no tiene dato. |    |                                |
|  |  La rubrica lo cacha pero..."  |    |                                |
|  |                                |    |                                |
|  |   ^ 12     responder    3 resp |    |                                |
|  +--------------------------------+    |                                |
|                                        |                                |
|  +--------------------------------+    |                                |
|  | @luis            hace 5 horas  |    |                                |
|  | tag: pregunta                  |    |                                |
|  | "?Por que mi prompt pasa los   |    |                                |
|  |  3 casos pero la rubrica..."   |    |                                |
|  |   ^ 3      responder    1 resp |    |                                |
|  +--------------------------------+    |                                |
|                                        |                                |
|  [ Escribir comentario...        ]     |                                |
|  [ ] compartir mi intento (anonimo)    |                                |
|  tag: ( ) pista ( ) pregunta ( ) tip   |                                |
+----------------------------------------+--------------------------------+
| < BACK                  [ Check Answer ]                         NEXT > |
+--------------------------------------------------------------------------+
```

### Features MVP

- **Tabs**: `Lección` (default) y `Discusión` con contador de comentarios.
- **Threading 1 nivel** (comentario → respuestas). Sin árboles infinitos.
- **Upvotes** (1 por usuario por comentario, toggleable).
- **Tags opcionales por comentario**: `pista` / `pregunta` / `tip` / `solucion`. Filtros por tag.
- **Sort**: hot (combinación de upvotes + recencia), nuevos, top.
- **Markdown ligero** en el body (negrita, code, links). Bloques de código con syntax highlight (Shiki, ya en el stack).
- **"Compartir mi intento"** toggle al postear: adjunta el prompt/answer del último Run del alumno (anonimizado, opcional).
- **Auth requerida** para postear (Clerk ya está); leer es público en steps free.

### Anti-spam y moderación

- Rate-limit: 5 comentarios por usuario por día (counter en Postgres, ya tenemos `rate-limit.ts`).
- Botón "reportar" → cola de moderación interna.
- Auto-flag por regex: API keys, emails, números de tarjeta.
- Soft delete: borrado por mod o autor → se marca pero queda el placeholder ("comentario eliminado").
- Edit window de 5 min después de postear.

### Schema Prisma propuesto (sketch — no implementar todavía)

```
Comment {
  id           String   @id @default(cuid())
  stepId       String   @index
  userId       String   @index
  parentId     String?  @index   // null = top-level, set = reply
  body         String                    // markdown
  tag          CommentTag?               // hint | question | tip | solution
  attemptRef   String?                   // pointer al ExerciseAttempt opcional
  upvotes      Int      @default(0)      // denormalizado para sort
  status       Status   @default(VISIBLE) // VISIBLE | HIDDEN | DELETED
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

CommentVote {
  commentId  String
  userId     String
  value      Int                         // +1 / -1
  @@id([commentId, userId])
}

CommentReport {
  id         String   @id
  commentId  String   @index
  reporterId String
  reason     String
  createdAt  DateTime @default(now())
}
```

### Por qué esto importa pedagógicamente

- **El alumno aislado se atasca y abandona**. Ver que otros pasaron por el mismo bloqueo (y cómo lo resolvieron) baja la tasa de drop-off.
- **Las pistas crowd-sourced son mejores que las que escribimos nosotros** una vez que hay tráfico — son más naturales y diversas.
- **Los comentarios buenos se vuelven contenido**: el equipo puede pinear soluciones destacadas, o promoverlas al banco como `examples` o `patterns`.
- **Es un loop social barato**: no necesita ML, ni notificaciones push, ni feeds infinitos. Solo gente comentando en el contexto exacto donde está aprendiendo.

### Riesgos y limitaciones

- **Spoilers**: alguien postea la solución completa del capstone → arruina el ejercicio. Mitigación: tag `solucion` por defecto colapsa el body, alumno hace click para revelar.
- **Tracción cero al inicio**: discusión vacía se ve triste. Mitigación: el equipo siembra 3-5 comentarios reales por step en MVP, marcados con tag `staff`.
- **Tóxicos / off-topic**: rate-limit + reportes + soft delete. No hay DM, no hay perfiles ricos — minimiza la superficie social problemática.
- **i18n**: comentarios viven en el idioma en que se postearon. No los traducimos. Filtro adicional por locale en el panel (mostrar solo `es` o `en` o ambos).

### Fase de construcción

- **No entra a Fase 1** (foundation determinista) ni Fase 2 (LLM eval). Es Fase 5 idealmente — cuando ya hay alumnos terminando tracks reales.
- **Excepción**: en Fase 1 podemos shipear una versión read-only ("Discusión" tab vacía con CTA "pronto") para reservar el espacio en el layout.

---

## Notas de cross-track

- **Track 0 no necesita infra de LLM-judge.** Es feature, no bug.
- **Track 1 alinea con el `02-curriculum.md` actual** pero agrega 3 steps spicy (caching como autoría, reasoning vs non-reasoning, JSON degrada razonamiento) que hoy no están.
- **Track 2 corrige una omisión del plan actual**: el plan dice "recuperarse de outputs malos" pero no surface que **reset es a veces la respuesta correcta**.
- **Step 1 de Track 5 (evals primero) es la decisión de currículo de mayor leverage** en toda la propuesta. Mirrors cómo Hamel Husain enseña esto a teams en producción y diferencia el producto de cualquier "build an agent" tutorial estándar.
- **B2 (`tool-description-craft`), D2 (`skill-discovery`), y T7 step 2 (CLAUDE.md crafting)** son **la misma habilidad** disfrazada: escribir descripciones específicas que disparan el comportamiento correcto del modelo. El producto la enseña 3 veces en contextos distintos. Esa repetición es deliberada.
