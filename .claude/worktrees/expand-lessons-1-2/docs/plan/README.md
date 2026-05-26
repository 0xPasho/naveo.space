# Plan — `learn-ai`

Plataforma gamificada e interactiva para aprender **IA aplicada** (prompt engineering, MCPs, agentes, flujos complejos) y **programación básica como puente**, con un layout estilo CryptoZombies: **lección a la izquierda, actividad a la derecha**.

Este directorio (`docs/plan/`) contiene el plan completo del producto y la arquitectura técnica acordada antes de empezar a codificar. Es la fuente de verdad de "qué vamos a construir y por qué".

## Estado

- **Fase actual**: planificación cerrada, listo para arrancar Fase 1.
- **Lo único en código**: baseline Next.js 16 + i18n (`es` por defecto, `en`) + Clerk + shadcn/ui (módulo `home` placeholder).
- **No hay aún**: Prisma, contenido, módulos de dominio, ejercicios, banco de conocimiento, embeddings.

## Cómo leer estos documentos

En orden recomendado para alguien que se incorpora al proyecto:

| # | Archivo | Qué cubre |
|---|---|---|
| 01 | [vision.md](./01-vision.md) | El pitch, por qué este producto, análisis de las inspiraciones (CryptoZombies, Claude Artifacts) |
| 02 | [curriculum.md](./02-curriculum.md) | Qué se enseña: tracks, courses, jerarquía pedagógica |
| 03 | [exercise-types.md](./03-exercise-types.md) | Catálogo completo de tipos de ejercicio (Habilidades A, B, C) |
| 04 | [rubric-and-evaluation.md](./04-rubric-and-evaluation.md) | Cómo se evalúa lo no-determinista: rúbrica + LLM-judge + cache |
| 05 | [knowledge-bank.md](./05-knowledge-bank.md) | Banco compartido de conceptos, patterns, antipatterns + embeddings |
| 06 | [architecture.md](./06-architecture.md) | Estructura de módulos, schema Prisma, rutas, contenido en repo |
| 07 | [lesson-player-ui.md](./07-lesson-player-ui.md) | UI: layout del player, paneles, estados |
| 08 | [phases.md](./08-phases.md) | Roadmap ejecutable (Fases 1 a 6) |
| 09 | [decisions-and-risks.md](./09-decisions-and-risks.md) | Decisiones cerradas, preguntas abiertas, env vars, riesgos |

## Principios rectores

1. **AI-first**: el contenido principal trata sobre IA. Programación básica es solo puente para quien lo necesite.
2. **No-determinista por defecto**: la mayoría de ejercicios no tienen una respuesta correcta. Se evalúan con rúbricas + LLM-judge.
3. **Determinismo donde aplica**: estructura (XML válido, JSON parseable, schema correcto) sí es determinista — y barato. Lo aprovechamos.
4. **Banco compartido**: el contenido no es lineal — es un grafo de piezas reutilizables (concepts, patterns, antipatterns) embedded en pgvector.
5. **Minimalismo**: MDX en repo, sin CMS. Una sola dependencia por capa (Anthropic para LLM, Voyage para embeddings, Postgres para todo lo demás).
6. **Adherencia a `CLAUDE.md`**: módulos de dominio en `src/modules/`, server thin, validación con Zod, i18n con next-intl, sin servicios separados.

## Lo que NO vamos a construir (al menos no en MVP)

- CMS para no-devs
- Dark mode
- Mobile app nativa
- Backend separado / microservicios
- Cola de jobs (BullMQ, etc.) — empezamos sync, añadimos solo si hay razón concreta
- Modo offline
- Multiplayer / colaboración en tiempo real
- Marketplace de cursos
- Múltiples providers de LLM en paralelo
