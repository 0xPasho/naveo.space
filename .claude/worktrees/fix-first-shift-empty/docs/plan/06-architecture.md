# 06 — Arquitectura

Adherente a `CLAUDE.md` del proyecto. Monolito Next.js 16, sin servicios separados.

## Estructura de módulos

```
src/
  app/
    [locale]/
      page.tsx                        <- landing
      layout.tsx                      <- next-intl wrap, setRequestLocale
      tracks/
        page.tsx                      <- listado de tracks con progreso
        [track]/
          page.tsx                    <- track detail (courses + progreso)
          [course]/[lesson]/[step]/
            page.tsx                  <- lesson player (la pantalla clave)
      dashboard/
        page.tsx                      <- mi progreso, XP, streak

    api/
      exercises/run/route.ts          <- POST: ejecutar y evaluar intento
      tutor/chat/route.ts             <- POST: chat con RAG
      knowledge/search/route.ts       <- GET: buscar en banco

  modules/
    content/                          <- capa de contenido (MDX -> objetos)
      types.ts                        <- Step, Concept, Pattern, Antipattern...
      lib.ts                          <- chunking, hash, slug
      service.ts  (server-only)       <- read filesystem, parse, query DB
      data.ts                         <- constantes (tipos de pieza, etc.)

    tracks/
      types.ts
      data.ts                         <- orden de tracks (si está hardcodeado)
      service.ts                      <- listTracks(userId), getTrack(slug)
      tracks-list-view.tsx
      track-detail-view.tsx

    lessons/
      types.ts
      service.ts                      <- getStep(slug, userId), nextStep, prevStep
      actions.ts                      <- recordView, markComplete
      lesson-player-view.tsx          <- la pantalla principal
      components/
        reading-pane.tsx              <- MDX renderizado
        exercise-pane.tsx             <- dispatch por kind
        hints-drawer.tsx
        footer-nav.tsx                <- BACK / Check / NEXT

    exercises/
      types.ts                        <- ExerciseKind, ExerciseInput, AttemptResult
      data.ts                         <- registry de kinds disponibles por fase
      lib.ts                          <- helpers comunes (parsers, normalize)
      service.ts  (server-only)       <- dispatch + save Attempt
      actions.ts                      <- runExercise (server action o invocacion API)
      runners/                        <- una carpeta por kind
        prompt-task/                  <- A5 (Fase 2)
        prompt-anatomy/               <- A1 (Fase 1, determinista)
        prompt-AB/                    <- A7 (Fase 1, MCQ)
        prompt-tag-fill/              <- A3 (Fase 2)
        prompt-format-convert/        <- A4 (Fase 2)
        prompt-iterate/               <- A6 (Fase 2)
        tool-description-craft/       <- B2 (Fase 4)
        tool-schema-author/           <- B1 (Fase 4)
        mcp-debug/                    <- B6 (Fase 4)
        mcp-multi-tool/               <- B5 (Fase 4)
        chain-design/                 <- C1 (Fase 5)
        evals-author/                 <- C5 (Fase 5)
        ...

    rubric/                           <- pipeline de evaluación
      types.ts                        <- Rubric, Check, CheckResult
      lib.ts                          <- hashRubric, mergeResults
      service.ts                      <- runRubric(prompt, outputs, rubric)
      checks/
        deterministic.ts              <- json-valid, regex, contains-keys, length
        llm-judge.ts                  <- usa modules/llm
        embedding-similarity.ts       <- compara embeddings (Fase 3)
        agent-behavior.ts             <- precision/recall del agente (Fase 4)

    llm/                              <- wrapper Anthropic
      types.ts
      service.ts                      <- callModel({model, system, messages})
      lib.ts                          <- prompt templates (judge prompts)

    knowledge/                        <- banco compartido
      types.ts                        <- ContentPiece, RelationKind
      service.ts                      <- query, retrieveSimilar, getById
      lib.ts                          <- chunking estable, similarity
      embeddings.ts  (server-only)    <- voyageEmbed(text[])

    tutor/                            <- chat con RAG (Fase 3)
      types.ts
      service.ts                      <- retrieve + chat
      actions.ts                      <- sendMessage
      tutor-panel-view.tsx            <- panel/drawer dentro del lesson player

    progress/
      types.ts
      service.ts                      <- updateStepStatus, getUserProgress
      actions.ts                      <- markComplete

    gamification/                     <- Fase 5
      service.ts                      <- awardXp, updateStreak, checkBadges

  common/
    api/
      types.ts                        <- AppUser, types compartidos
      hooks/                          <- React Query hooks
        use-step.ts
        use-run-exercise.ts
        use-tutor.ts
        use-progress.ts
      client.ts
    components/
      mdx-components.tsx              <- mapping de componentes shadcn para MDX
      callout.tsx
      code-block.tsx
    layout/
      app-sidebar.tsx
      page-header.tsx
    lib/
      format.ts
      utils.ts
    providers/
      auth-initializer.tsx
      query-provider.tsx
    i18n/
      routing.ts
      navigation.ts
      request.ts

  server/
    db.ts                             <- Prisma singleton
    auth.ts                           <- currentUser, requireUser
    rate-limit.ts                     <- por userId, por endpoint
    cache.ts                          <- RubricCache helpers

  proxy.ts                            <- clerkMiddleware + next-intl

scripts/
  build-content.ts                    <- pipeline de ingest (offline)
  embed-content.ts                    <- recalcula embeddings cambiados
  seed-test-user.ts                   <- helper para dev
```

## Reglas de módulos (resumen de CLAUDE.md aplicado)

1. **Types** en `module/types.ts`. NO inline en views.
2. **Constants/data** en `module/data.ts`.
3. **Pure functions** en `module/lib.ts`.
4. **Custom hooks** en `module/hooks.ts` (cuando aplique).
5. **Server-side business logic** en `module/service.ts`. Marcado con `import "server-only"` en archivos que lo necesiten.
6. **Server Actions** en `module/actions.ts`. Devuelven `{ ok, error }` — nunca throw.
7. **Shared code** en `common/`.
8. **No instanciar `new PrismaClient()` fuera de `server/db.ts`.**
9. **Validación con Zod** en cada Route Handler y Server Action.
10. **No importar server code en client components.** Si un módulo tiene partes server, separar en archivos diferentes.

## Estructura del contenido en repo

```
content/
  es/
    tracks.yaml                       <- orden de tracks (alto nivel)
    steps/
      anatomia-del-prompt/
        _course.yaml                  <- metadata del course (title, hook narrativo)
        01-tu-primer-prompt.mdx
        02-rol-contexto.mdx
        03-output-json.mdx
      tools-y-mcps/
        _course.yaml
        01-que-es-un-tool.mdx
    knowledge/
      concepts/
        few-shot.mdx
        xml-tags-claude.mdx
        tool-description.mdx
      patterns/
        extractor.mdx
        classifier.mdx
      antipatterns/
        vague-instructions.mdx
        tool-too-generic.mdx
      glossary/
        token.mdx

  en/
    [espejo de la estructura anterior]
```

### Ejemplo: `tracks.yaml`

```yaml
tracks:
  - slug: anatomia-del-prompt
    title: "Anatomía del prompt"
    order: 1
    description: "Aprende a estructurar prompts robustos y reproducibles."
    courses:
      - te-incorporas-a-la-crew
  - slug: tools-y-mcps
    title: "Tools y MCPs"
    order: 2
    description: "Construye MCPs que el LLM realmente decide usar."
    courses:
      - construyendo-mcps
```

### Ejemplo: `_course.yaml`

```yaml
slug: te-incorporas-a-la-crew
title: "Te incorporas a la crew"
order: 1
narrativeHook: |
  Vas a construir tu mascota IA. Empieza con un chatbot básico
  y termina con un asistente que te entiende en 3 idiomas.
estimatedMinutes: 60
```

### Ejemplo: step completo

```yaml
---
title: "Hacer que Claude responda en JSON"
order: 3
estimatedMinutes: 5

exercise:
  kind: prompt-task
  model: claude-haiku-4-5
  testCases:
    - input: "Juan, 32, j@x.com"
    - input: "María Pérez, 28, mp@y.com"
    - input: "Carlos sin email"
  rubric:
    - id: json-valid
      kind: deterministic
      check: json-parse
      criterion: "El output es JSON válido"
    - id: keys-present
      kind: deterministic
      check: has-keys
      args: [name, age, email]
      criterion: "Tiene name, age, email"
    - id: no-hallucination
      kind: llm-judge
      model: claude-haiku-4-5
      criterion: "No inventa datos no presentes"
  hints:
    - "Pídelo explícito en el prompt"
    - "¿Qué pasa si falta un dato?"
    - "Few-shot con un ejemplo de input vacío ayuda"
  passThreshold:
    rule: all-criteria-all-cases

teaches: [json-output, xml-tags-claude]
requires: [prompt-anatomy-basics]
referencesPatterns: [extractor]
watchOutFor: [vague-instructions]
---

## Output estructurado

[Cuerpo MDX con explicación, ejemplos en code blocks, componentes shadcn embebidos como `<Callout>`...]
```

## Schema de Prisma

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

// --- Contenido (poblado por scripts/build-content.ts) ---

model ContentPiece {
  id          String   // slug
  locale      String   // 'es' | 'en'
  type        String   // 'step' | 'concept' | 'pattern' | 'antipattern' | 'example' | 'glossary' | 'course' | 'track'
  slug        String
  title       String
  hash        String   // sha256(body + frontMatter); detecta cambios para re-embed
  frontMatter Json
  body        String   // MDX raw
  parentSlug  String?  // para steps: el course; para courses: el track
  order       Int?     // posición dentro del padre
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  embeddings  PieceEmbedding[]
  outgoing    PieceRelation[]  @relation("from")
  incoming    PieceRelation[]  @relation("to")

  @@id([id, locale])
  @@index([type, locale])
  @@index([parentSlug, locale])
}

model PieceEmbedding {
  id         String   @id @default(cuid())
  pieceId    String
  pieceLocale String
  chunkIdx   Int
  vector     Unsupported("vector(1024)")  // pgvector
  createdAt  DateTime @default(now())

  piece      ContentPiece @relation(fields: [pieceId, pieceLocale], references: [id, locale])

  @@index([pieceLocale])
  // ivfflat index se crea con migration manual:
  // CREATE INDEX ON "PieceEmbedding" USING ivfflat (vector vector_cosine_ops);
}

model PieceRelation {
  fromId      String
  fromLocale  String
  toId        String
  toLocale    String
  kind        String  // 'teaches' | 'requires' | 'references' | 'watchOutFor' | 'related'

  from ContentPiece @relation("from", fields: [fromId, fromLocale], references: [id, locale])
  to   ContentPiece @relation("to",   fields: [toId, toLocale],     references: [id, locale])

  @@id([fromId, fromLocale, toId, toLocale, kind])
  @@index([toId, toLocale, kind])
}

// --- Datos de usuario ---

model User {
  id        String   @id  // Clerk userId
  createdAt DateTime @default(now())

  progress       Progress[]
  attempts       Attempt[]
  xp             Xp?
  badges         BadgeAward[]
  tutorMessages  TutorMessage[]
}

model Progress {
  userId      String
  stepId      String   // ContentPiece.id where type='step'
  stepLocale  String
  status      String   // 'not_started' | 'in_progress' | 'completed'
  attempts    Int      @default(0)
  hintsUsed   Int      @default(0)
  completedAt DateTime?
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@id([userId, stepId, stepLocale])
  @@index([userId, status])
}

model Attempt {
  id        String   @id @default(cuid())
  userId    String
  stepId    String
  stepLocale String
  payload   Json     // prompt enviado, choices, etc
  outputs   Json?    // outputs del modelo si aplica
  results   Json     // rubricResults
  passed    Boolean
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, stepId, stepLocale])
  @@index([createdAt])
}

model RubricCache {
  hash      String   @id  // sha256(prompt + exerciseId + rubricVersion + testCaseSet + targetModel)
  results   Json
  outputs   Json     // outputs del modelo, para re-evaluar sin re-llamar API
  createdAt DateTime @default(now())

  @@index([createdAt])
}

// --- Tutor (Fase 3) ---

model TutorMessage {
  id              String   @id @default(cuid())
  userId          String
  stepId          String
  stepLocale      String
  role            String   // 'user' | 'assistant'
  content         String
  retrievedPieces Json?    // [{pieceId, score}, ...] para 'assistant' messages
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, stepId, createdAt])
}

// --- Gamificación (Fase 5) ---

model Xp {
  userId          String   @id
  total           Int      @default(0)
  dailyStreak     Int      @default(0)
  lastActiveDate  DateTime?
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
}

model BadgeAward {
  id        String   @id @default(cuid())
  userId    String
  code      String   // 'first-track-completed' | '7-day-streak' | ...
  awardedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, code])
}
```

### Migration manual para pgvector

Después de `prisma migrate dev`, una migration extra en `prisma/migrations/<timestamp>_pgvector/migration.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE INDEX IF NOT EXISTS piece_embedding_vector_idx
  ON "PieceEmbedding"
  USING ivfflat (vector vector_cosine_ops)
  WITH (lists = 100);
```

## Routes (App Router)

```
/                                              -> redirect a /<defaultLocale>
/[locale]                                      -> landing
/[locale]/tracks                               -> listado tracks
/[locale]/tracks/[track]                       -> track detail (courses)
/[locale]/tracks/[track]/[course]/[lesson]/[step]
                                               -> LESSON PLAYER (la pantalla clave)
/[locale]/dashboard                            -> mi progreso, XP, streak
/[locale]/sign-in / sign-up                    -> Clerk
```

## API routes

```
POST /api/exercises/run
  body: { stepId, locale, payload }
  resp: { passed, criteria, cases, attemptId }

POST /api/tutor/chat
  body: { stepId, locale, messages }
  resp: stream of { delta } + final { retrievedPieces }

GET /api/knowledge/search?q=&locale=
  resp: { results: [{ pieceId, type, title, score, snippet }] }

POST /api/progress
  body: { stepId, locale, status }
  resp: { ok, progress }
```

Todas:
- Validación Zod en entry.
- `currentUser()` early-return 401 si requiere login.
- Rate limit por userId.
- Errores envueltos en handler global → JSON `{ ok: false, error }`.

## Pipeline de contenido (script)

```
                  scripts/build-content.ts
                            |
                            v
   +--------------------------------------------------+
   | 1. Walk content/<locale>/**/*.mdx                |
   | 2. Parse MDX + front-matter (gray-matter)        |
   | 3. Validar front-matter con Zod                   |
   | 4. Compute hash(body + frontMatter)              |
   | 5. Upsert ContentPiece                           |
   | 6. Para cada relación (teaches/requires/...)     |
   |    upsert PieceRelation                           |
   | 7. Si hash cambió o no tiene embedding:          |
   |    - chunkear si > 500 palabras                  |
   |    - voyageEmbed(chunks)                          |
   |    - upsert PieceEmbedding                        |
   | 8. Validar: refs rotas, slugs duplicados,        |
   |    pre-requisitos circulares, etc.                |
   | 9. Reportar diff: piezas agregadas / cambiadas / |
   |    eliminadas                                     |
   +--------------------------------------------------+
```

Corre:
- **Local**: `pnpm build:content` cuando un autor cambia un MDX.
- **CI**: pre-deploy en Vercel build step.
- **Idempotente**: si nada cambió, no consume API de embeddings.

`scripts/embed-content.ts` es un sub-comando que solo recalcula embeddings (cuando se cambia el modelo de embeddings, por ejemplo).

## Decisiones técnicas concretas

| Tema | Decisión |
|---|---|
| MDX renderer | `next-mdx-remote/rsc` (RSC-friendly, no Contentlayer) |
| Editor de código | Monaco vía `@monaco-editor/react` (las líneas de instrucciones serán comentarios) |
| Vector store | `pgvector` en la misma Postgres |
| Embeddings | `voyage-multilingual-2` (1024 dims) |
| LLM | Vercel `ai` SDK + OpenRouter (`@openrouter/ai-sdk-provider`). Default judge: `anthropic/claude-haiku-4.5`; task heavy: `anthropic/claude-sonnet-4.6`. Provider-agnostic by design. |
| Cache | Postgres (`RubricCache` tabla). No Redis en MVP. |
| Rate limit | In-app con Postgres (counter por userId, ventana diaria). No Upstash en MVP. |
| Auth | Clerk (ya integrado) |
| Validación | Zod en cada entry server-side |
| Forms client | React Hook Form + Zod |
| Server state | React Query (TanStack Query) |
| Style | Tailwind 4 + shadcn/ui (vía `@base-ui/react`) |

## Lo que NO usamos en MVP

- Contentlayer (descontinuado en Next 15+)
- Redis / Upstash
- Cola de jobs (BullMQ, etc.)
- Múltiples providers de LLM
- WebSockets — solo HTTP/SSE para tutor stream
- Edge functions — todo Node runtime
