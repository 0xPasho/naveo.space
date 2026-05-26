# 08 — Fases ejecutables

Roadmap en orden estricto. Cada fase tiene:
- **Objetivo**: qué logra al terminar.
- **Tareas**: pasos concretos.
- **Definition of Done (DoD)**: cuándo declaramos la fase terminada.

## Fase 0 — Foundation (ya hecho parcialmente)

**Estado**: en curso, ~60% completo.

Lo que ya está:
- Next.js 16 + React 19 + Tailwind 4.
- next-intl configurado (es default, en).
- Clerk integrado.
- Módulo `home` placeholder.

Lo que falta para cerrar Fase 0:
- [ ] Instalar Prisma + `@prisma/client`.
- [ ] Configurar Postgres con extensión pgvector (local + producción).
- [ ] Schema inicial con `User`, `ContentPiece`, `PieceEmbedding`, `PieceRelation` (sin datos aún).
- [ ] Migration manual para crear `CREATE EXTENSION vector` y el índice `ivfflat`.
- [ ] `src/server/db.ts` con singleton.
- [ ] `src/server/auth.ts` con `currentUser()`.
- [ ] `src/server/rate-limit.ts` con counter en Postgres.
- [ ] `.env.example` con todas las vars.
- [ ] AGENTS.md / CLAUDE.md ya están — ningún cambio.

**DoD**: `pnpm dev` corre, `pnpm prisma db push` aplica, query `SELECT '[1,2,3]'::vector` funciona en la DB.

---

## Fase 1 — Foundation sin LLM (todo determinista)

**Objetivo**: tener un step "hello world" navegable end-to-end con un ejercicio determinista. Sin LLM aún. Esto valida toda la pipeline de contenido y UI antes de meter costo.

### 1.1 — Capa de contenido

- [ ] `src/modules/content/types.ts`: Step, Concept, Pattern, etc.
- [ ] `src/modules/content/lib.ts`: hash, slug, validación Zod del front-matter.
- [ ] `src/modules/content/service.ts`: `getStep(slug, locale)`, `getCourse(slug, locale)`, `listTracks(locale)`, `listSteps(courseSlug, locale)`.
- [ ] `scripts/build-content.ts`: parse MDX → upsert ContentPiece + PieceRelation. Sin embeddings todavía.
- [ ] `package.json` script: `"build:content": "tsx scripts/build-content.ts"`.

### 1.2 — Estructura de contenido inicial

- [ ] `content/es/tracks.yaml` con Track 1 declarado.
- [ ] `content/es/steps/anatomia-del-prompt/_course.yaml`.
- [ ] **3 steps iniciales** con kinds deterministas:
  - `01-tu-primer-prompt.mdx` (`prompt-anatomy` — drag-and-drop)
  - `02-formato-xml-vs-json.mdx` (`prompt-AB` — MCQ)
  - `03-tag-fill.mdx` (`prompt-tag-fill` — fill-in-the-blank determinista, sin LLM aún; valida solo que el XML parsee)

### 1.3 — UI: Lesson Player base

- [ ] `src/modules/lessons/lesson-player-view.tsx`: layout 2 columnas + footer.
- [ ] `src/modules/lessons/components/reading-pane.tsx`: render MDX con `next-mdx-remote/rsc`.
- [ ] `src/common/components/mdx-components.tsx`: mapping de componentes shadcn.
- [ ] `src/common/components/callout.tsx`, `code-block.tsx` (Shiki para syntax highlight).
- [ ] `src/modules/lessons/components/footer-nav.tsx`: BACK / Check / NEXT.
- [ ] Routing: `app/[locale]/tracks/[track]/[course]/[lesson]/[step]/page.tsx`.

### 1.4 — Runners deterministas

- [ ] `src/modules/exercises/runners/prompt-anatomy/`: componente drag-and-drop + validador.
- [ ] `src/modules/exercises/runners/prompt-AB/`: MCQ + validador.
- [ ] `src/modules/exercises/runners/prompt-tag-fill/`: textarea + parser XML + validación de tags.
- [ ] `src/modules/exercises/service.ts`: `dispatch(stepId, kind, payload) → AttemptResult`.
- [ ] `src/modules/exercises/actions.ts`: server action `runExercise()`.
- [ ] `src/app/api/exercises/run/route.ts`: POST handler con Zod + auth + rate-limit.

### 1.5 — Progreso

- [ ] `src/modules/progress/service.ts`: `getUserProgress`, `markComplete`.
- [ ] `src/modules/progress/actions.ts`: `markStepComplete()`.
- [ ] Footer nav lee progress; NEXT habilitado si `passed`.
- [ ] Sidebar/dashboard muestra steps completados.

### 1.6 — Track listing

- [ ] `app/[locale]/tracks/page.tsx`: listado de tracks con progreso global.
- [ ] `app/[locale]/tracks/[track]/page.tsx`: courses del track.
- [ ] Branding mínimo en landing.

**DoD**:
- Logged-in user puede ir a `/es/tracks`, abrir Track 1, completar los 3 steps deterministas, y ver progreso `3/3`.
- Cero llamadas a Anthropic. Cero costo.
- Tests E2E de playwright cubren el flujo del primer step.

---

## Fase 2 — Evaluación con LLM

**Objetivo**: introducir el evaluador con rúbrica para ejercicios no-deterministas. Track 1 completo.

### 2.1 — Wrapper LLM

- [ ] `src/modules/llm/service.ts`: `callModel({model, system, messages, maxTokens})`.
- [ ] Soporta streaming + non-streaming.
- [ ] Manejo de errores: timeout, rate-limit del provider, output parsing.
- [ ] `src/modules/llm/lib.ts`: prompt templates de los judges.

### 2.2 — Pipeline de rúbrica

- [ ] `src/modules/rubric/types.ts`: Rubric, Check, CheckResult.
- [ ] `src/modules/rubric/lib.ts`: `hashRubric`, `mergeResults`, `decidePassed(passThreshold)`.
- [ ] `src/modules/rubric/checks/deterministic.ts`: json-valid, has-keys, regex, contains, length-between, schema-valid, runs-without-error.
- [ ] `src/modules/rubric/checks/llm-judge.ts`: ejecuta judge prompt, parsea respuesta JSON.
- [ ] `src/modules/rubric/service.ts`: orquesta, llama deterministas primero, judges después solo si pasaron.

### 2.3 — Cache + rate limit

- [ ] `src/server/cache.ts`: `getCached(hash)`, `putCached(hash, value)` contra `RubricCache`.
- [ ] `src/server/rate-limit.ts`: counter por userId+endpoint con ventana diaria.
- [ ] Endpoint `POST /api/exercises/run` integra cache + rate-limit.

### 2.4 — Runners con LLM

- [ ] `prompt-task` (A5)
- [ ] `prompt-iterate` (A6)
- [ ] `prompt-format-convert` (A4)
- [ ] `prompt-tag-fill` con rúbrica de output (no solo estructura)

### 2.5 — Track 1 completo

- [ ] Steps 4-9 escritos en MDX con sus rúbricas.
- [ ] QA manual: cada step se puede completar con varios prompts diferentes (no respuesta única).
- [ ] Costo medido: cada step "barato" debería costar < $0.01 por intento promedio.

### 2.6 — UI: panel de resultados

- [ ] Checklist visual con criterios verdes/rojos.
- [ ] Tabs para ver outputs de cada test case.
- [ ] Mensajes de error claros (no "incorrecto" plano).
- [ ] Streaming de resultados criterio-por-criterio.

**DoD**:
- Track 1 completable end-to-end.
- 3 alumnos beta (internos) lo terminan sin pedir ayuda fuera del producto.
- Costo total por alumno terminando Track 1: < $0.50.
- Cache hit rate > 30% una vez que hay 10+ alumnos.

---

## Fase 3 — Banco compartido + Tutor RAG

**Objetivo**: el banco activo. Tutor inteligente. Búsqueda en lenguaje natural. Recomendaciones.

### 3.1 — Embeddings pipeline

- [ ] `src/modules/knowledge/embeddings.ts`: cliente Voyage.
- [ ] `scripts/build-content.ts` extendido: si hash cambió → re-embed.
- [ ] `scripts/embed-content.ts`: sub-comando para re-calcular todo (cuando se cambie modelo).
- [ ] Migration con `CREATE EXTENSION vector` ejecutada en producción.
- [ ] Test: insertar 5 piezas, búsqueda devuelve resultado coherente.

### 3.2 — Banco mínimo

- [ ] **15 concepts** cubriendo Track 1.
- [ ] **5 patterns**: extractor, classifier, summarizer, tool-using-agent, role-prompting-base.
- [ ] **5 antipatterns**: vague-instructions, conflicting-format, role-confusion, json-without-schema, prompt-injection-naive.
- [ ] **10 glossary entries**.
- [ ] Cada step de Track 1 declara `teaches`, `requires`, `referencesPatterns`, `watchOutFor`.

### 3.3 — Knowledge service

- [ ] `src/modules/knowledge/service.ts`: `retrieveSimilar(text, k, type?, locale)`, `getById`, `listByType`.
- [ ] Endpoint `GET /api/knowledge/search?q=&locale=`.

### 3.4 — Tutor RAG

- [ ] `src/modules/tutor/service.ts`: `retrieveContext(stepId, query) → pieces[]`, `chat(messages, context) → stream`.
- [ ] `src/app/api/tutor/chat/route.ts`: POST con SSE streaming.
- [ ] `src/modules/tutor/tutor-panel-view.tsx`: drawer con conversación.
- [ ] Persistencia en `TutorMessage`.

### 3.5 — Recomendaciones contextuales

- [ ] Cuando alumno falla 3 veces: identificar `requires` no completados, ofrecerlos.
- [ ] Si su último prompt está cerca (cosine > 0.7) de un antipattern: mostrar tip.

### 3.6 — Búsqueda en UI

- [ ] Cmd+K abre buscador global.
- [ ] Resultados mezclan steps + concepts + patterns.

**DoD**:
- Tutor responde preguntas de cualquier step de Track 1 con referencias correctas del banco.
- Búsqueda devuelve resultados relevantes para 10 queries de prueba en español.
- Detección de antipattern dispara correctamente en al menos 3 casos sintéticos.

---

## Fase 4 — Tools y MCPs

**Objetivo**: Track 3 completo. Sandbox de handlers. Ejercicios de tool description y MCP debug.

### 4.1 — Sandbox de handlers

- [ ] Node Worker (`worker_threads`) para correr handlers del alumno.
- [ ] Timeout corto (5s).
- [ ] Sin acceso a `fs`, `net`, `child_process`.
- [ ] Stdio capturado y devuelto en el resultado.

### 4.2 — Agente de prueba

- [ ] `src/modules/exercises/lib/test-agent.ts`: agente Claude con tool-use loop.
- [ ] Recibe: tarea, lista de tools (incluyendo el del alumno).
- [ ] Devuelve: secuencia de invocaciones, resultado final.

### 4.3 — Runners

- [ ] `tool-schema-author` (B1)
- [ ] `tool-description-craft` (B2) — con precision/recall
- [ ] `tool-handler-implement` (B3)
- [ ] `tool-name-pick` (B4)
- [ ] `mcp-multi-tool` (B5)
- [ ] `mcp-debug` (B6)
- [ ] `mcp-resilience` (B7)
- [ ] `mcp-end-to-end` (B8)

### 4.4 — Track 3

- [ ] 10 steps escritos.
- [ ] Banco extendido: concepts sobre tool calling, MCP protocol, schemas.
- [ ] Patterns: tool-using-agent (extendido), error-recovery-agent.
- [ ] Antipatterns: tool-too-generic, schema-overcomplicated, description-vague.

**DoD**:
- Track 3 completable end-to-end.
- Ejercicio B2 demuestra que cambiar la descripción cambia precision/recall del agente (probado con casos sintéticos).
- Costo por alumno terminando Track 3: < $2.00 (tracks con tools cuestan más).

---

## Fase 5 — Flujos complejos + gamificación + EN

**Objetivo**: Track 4 + Track 2 + gamificación + traducción al inglés de tracks 1-3.

### 5.1 — Track 2 (Conversaciones)

- [ ] 6 steps con `conversation-goal`.
- [ ] UI nueva: chat en exercise pane. El alumno escribe mensajes, ve respuestas, evalúa con "Submit conversation" cuando cree que cumplió.

### 5.2 — Track 4 (Flujos complejos)

- [ ] Runners: `chain-design` (C1), `chain-debug` (C2), `prompt-router` (C3), `agent-loop-design` (C4), `evals-author` (C5), `eval-judge-author` (C6).
- [ ] UI para `chain-design`: editor YAML con preview de ejecución de cada paso.

### 5.3 — Gamificación

- [ ] `src/modules/gamification/service.ts`: `awardXp(userId, amount, source)`.
- [ ] XP por step completado: 10 base, +5 si sin hints, +2 si primera vez.
- [ ] Streak diario: contador en `Xp`. Reset si gap > 1 día.
- [ ] Badges: 5 iniciales (`first-step`, `first-track`, `7-day-streak`, `no-hint-master`, `helpful-tutor` por feedback positivo en N steps).
- [ ] UI: dashboard con XP total, streak, badges, ring de progreso por track.

### 5.4 — Traducción EN

- [ ] Espejo `content/en/...` para Tracks 1, 2, 3.
- [ ] QA: cada step EN evaluable con rúbrica equivalente.
- [ ] Selector de idioma visible en header.

**DoD**:
- 4 tracks completos en ES.
- Tracks 1, 2, 3 también en EN.
- Gamificación visible en dashboard, no intrusiva.

---

## Fase 6 — Pulido + lanzamiento

**Objetivo**: producto presentable al público.

### 6.1 — Onboarding

- [ ] Landing con video/demo del primer step en vivo.
- [ ] Free tier: primer step de Track 1 sin login (rate-limit por IP).
- [ ] Onboarding tour cuando el usuario llega por primera vez al lesson player.

### 6.2 — Compartir y social

- [ ] Compartir progreso (ej: "completé Track 1") con OG image generada.
- [ ] Perfil público opcional (`/u/[username]`).

### 6.3 — Free vs Pro

- [ ] Free: límite diario de runs.
- [ ] Pro: ilimitado, acceso a Tracks avanzados.
- [ ] Stripe integration.

### 6.4 — Telemetría y observabilidad

- [ ] Eventos clave: `step_started`, `step_completed`, `exercise_run`, `tutor_used`, `signup`, etc.
- [ ] Dashboard interno: cuántos alumnos en cada step, dónde se atascan, costo per-user.
- [ ] Alertas de costo anómalo.

**DoD**:
- Producto en producción.
- 100 usuarios activos / semana.
- Costo unitario < precio de plan Pro (ratio > 5x).

---

## Visión paralela (lo que NO está en este roadmap)

- **Múltiples lenguajes para handlers** (Python, etc.) — solo si Fase 4 demuestra demanda.
- **Mobile apps nativas** — el web responsive es suficiente.
- **Marketplace de cursos creados por usuarios** — conflicto con la curaduría.
- **Coding agent integrado** — el tutor RAG ya cubre el 80%.
