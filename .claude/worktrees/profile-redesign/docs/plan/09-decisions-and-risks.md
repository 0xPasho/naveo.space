# 09 — Decisiones, riesgos y operación

## Decisiones cerradas

| Tema | Decisión | Razón |
|---|---|---|
| Stack base | Next.js 16 + React 19 + Tailwind 4 + shadcn/ui | Ya en el repo. Monolito según CLAUDE.md. |
| DB | Postgres + extensión `pgvector` | Single-source para datos relacionales y vectores; menos infra. |
| Embeddings provider | Voyage (`voyage-multilingual-2`, 1024 dims) | Bilingüe ES/EN nativo, mejor calidad multilingüe que OpenAI. |
| LLM provider | Anthropic | Producto trata sobre Claude/MCPs; uso natural. |
| Modelo judge default | `claude-haiku-4-5` | Costo bajo, suficiente para 95% de criterios. |
| Modelo target default | `claude-haiku-4-5` | Default para ejercicios; el alumno elige solo si aplica. |
| Modelo escalado | `claude-sonnet-4-6` | Solo para criterios sutiles donde Haiku no discrimina. |
| Banco i18n | `content/<locale>/knowledge/...` espejo desde día 1 | Decisión del usuario. |
| Edición de contenido | MDX en repo + PRs | Sin CMS. Decisión del usuario: minimalismo. |
| MDX renderer | `next-mdx-remote/rsc` | RSC-friendly, no Contentlayer (descontinuado). |
| Editor de código | Monaco (`@monaco-editor/react`) | Familiar, pesado pero ya estándar; en mobile cae a textarea. |
| Auth | Clerk | Ya integrado. |
| Cache | Tabla `RubricCache` en Postgres | Sin Redis en MVP. |
| Rate limit | Counter en Postgres | Sin Upstash en MVP. |
| Sandbox handlers MCP | Node Worker en server | Suficiente para MVP, sin Docker. |
| Lenguaje del alumno | TS/JS para handlers | Más portable; sandboxable en Node Worker. |
| Forms client | React Hook Form + Zod | Estándar React 19. |
| Server state cliente | React Query | Por CLAUDE.md. |

## Preguntas abiertas (a confirmar antes de Fase 4+)

| # | Pregunta | Default propuesto | Quién decide |
|---|---|---|---|
| Q1 | ¿Login obligatorio para correr ejercicios? | Sí, pero primer step de Track 1 permite 1-2 runs sin login (rate-limit por IP) | Producto |
| Q2 | ¿Free tier de runs/día? | 20 runs/día. Configurable vía env. | Producto |
| Q3 | ¿Tutor IA con memoria entre sesiones? | Sí — guardar `TutorMessage` por `(userId, stepId)`. Refresca al borrar la conversación. | Producto |
| Q4 | ¿Sandbox para handlers MCP — Node Worker o Docker? | Node Worker en MVP. Docker si Fase 4 demuestra problemas de seguridad. | Técnico |
| Q5 | ¿Costo medio máximo por usuario / mes? | < $1 USD. Si excede, se ajustan modelos default o se imponen límites. | Producto |
| Q6 | ¿Stripe / pago en MVP? | NO. Free durante validación. Stripe en Fase 6. | Producto |
| Q7 | ¿Telemetría — Posthog, Mixpanel, autohosted? | Posthog cloud en MVP. Eventos definidos en Fase 6.4. | Técnico |
| Q8 | ¿Dominio? | TBD. | Producto |
| Q9 | ¿Modelo de embeddings cuando Voyage cambie precio? | Re-evaluar en Fase 5. Migración soportada por `scripts/embed-content.ts`. | Técnico |

## Variables de entorno

```
# Database
DATABASE_URL=postgres://user:pass@host:5432/learn_ai

# Auth (Clerk)
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# LLM
ANTHROPIC_API_KEY=sk-ant-...
LLM_JUDGE_DEFAULT_MODEL=claude-haiku-4-5
LLM_TARGET_DEFAULT_MODEL=claude-haiku-4-5
LLM_TIMEOUT_MS=30000

# Embeddings
VOYAGE_API_KEY=pa-...
VOYAGE_EMBED_MODEL=voyage-multilingual-2

# Rate limits
RATE_LIMIT_FREE_RUNS_PER_DAY=20
RATE_LIMIT_LOGGED_OUT_RUNS_PER_DAY=3

# Tutor
TUTOR_DEFAULT_MODEL=claude-haiku-4-5
TUTOR_MAX_TOKENS=2048
TUTOR_TOP_K_RETRIEVAL=5

# Telemetria (Fase 6)
NEXT_PUBLIC_POSTHOG_KEY=
POSTHOG_HOST=

# Pago (Fase 6)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

`.env.example` debe estar en el repo y actualizado.

## Riesgos y mitigaciones

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Costo LLM se dispara | Alta | RubricCache agresivo; rate-limit estricto por usuario; Haiku como default; alerta cuando un usuario consume > $X/día. |
| Latencia (cada Run llama 3-6 veces a la API) | Media | Streaming de resultados criterio-por-criterio; deterministas primero (filtro barato); cache hit rate > 30%. |
| Calidad del LLM-judge inconsistente | Media | Cada criterion guarda outputs + razón; replay sin re-llamar API target; ajuste iterativo del judge prompt. |
| Sandbox handler MCP inseguro | Alta (Fase 4+) | Node Worker con timeout corto; bloquear `fs`/`net`/`child_process`; auditoría de seguridad antes de Fase 4 release. |
| Mantener 2 idiomas duplica trabajo | Media | Solo ES en Fase 1-4. EN en Fase 5. Glossary y rúbricas se traducen junto al cuerpo. |
| Contenido se vuelve obsoleto rápido (modelos cambian) | Media | Steps versionados; ejercicios escritos contra principios, no contra modelos específicos cuando posible. |
| Prompt injection del alumno contra el judge | Baja-media | System prompt del judge wrappea input del alumno con tags + sanitización; el judge devuelve JSON estructurado, no texto libre. |
| Falsos positivos del judge (acepta prompts malos) | Media | Eval suite interna: dataset de "buenos" y "malos" prompts conocidos; medir accuracy del judge en CI. |
| Retrieval del tutor devuelve piezas no relacionadas | Media | Threshold mínimo de cosine; si nada cruza el umbral, tutor responde con disclaimer "no encontré contenido relevante". |
| Embedding de Voyage cambia y rompe búsqueda | Baja | Versionar el modelo embedding; si cambia, re-embed completo via `scripts/embed-content.ts`. |
| Drift entre ES y EN (cuando exista) | Media | Linter en CI: si un step ES tiene `teaches: [X]`, el espejo EN debe tener `teaches: [X]` también. |
| Vendor lock-in con Anthropic | Baja | Wrapper en `modules/llm/service.ts` permite cambiar provider sin tocar el resto del código. |
| pgvector performance con N piezas grande | Baja (no pasará pronto) | índice ivfflat con `lists = 100`. Si el banco crece > 10k piezas, considerar HNSW. |

## Métricas de éxito (cómo sabemos que funciona)

### Producto
- **% de alumnos que completan Track 1**: > 40% target.
- **Tiempo promedio para completar un step**: 4-8 min (si es < 2 min, demasiado fácil; si es > 15 min, mal diseño).
- **NPS de alumnos al completar Track 1**: > 50.

### Pedagógico
- **Tasa de éxito al primer intento**: 30-60% por step (si > 80% es muy fácil; si < 20% es frustrante).
- **Promedio de hints usados**: ~1 por step en Track 1.
- **Retención día 7**: > 30% de los que completaron primer step vuelven.

### Técnico
- **Cache hit rate de RubricCache**: > 30% post-100 alumnos.
- **Costo por alumno por Track 1**: < $0.50.
- **Latencia p95 de `/api/exercises/run`**: < 8s (con LLM-judge).
- **Latencia p95 de `/api/exercises/run` deterministic-only**: < 500ms.
- **Uptime**: > 99.5%.

## Operación: contenido como código

- Cada nuevo step / pieza es un PR.
- CI corre `pnpm build:content --dry-run` que valida el front-matter sin tocar DB.
- En merge a main: `pnpm build:content` corre con DATABASE_URL de staging primero.
- Despliegue a producción copia el cambio al hacer deploy de Vercel.
- **No se editan steps en producción directamente.** Si algo está mal: PR.

## Plantillas de aprobación

Antes de merge de un nuevo step, el reviewer verifica:

- [ ] Front-matter pasa Zod.
- [ ] Rúbrica tiene al menos 1 check determinista (rápido fail) y 1 LLM-judge (calidad).
- [ ] `teaches` apunta a concepts existentes.
- [ ] `requires` no genera ciclos (validado por build).
- [ ] Hints están en orden de progresividad.
- [ ] Solución (último hint) realmente pasa la rúbrica con el modelo target default.
- [ ] Espejo EN actualizado o flagged.

## Documentación viva

Este `docs/plan/` es **el plan al momento de escribirlo**. A medida que avancemos:

- Las **decisiones cerradas** se mantienen (ya no se discuten).
- Las **preguntas abiertas** se resuelven y se mueven a "decisiones cerradas" con la resolución.
- Los **riesgos** que se materialicen se mueven a una sección "lecciones aprendidas".
- Las **fases** se marcan como completadas con fecha + commit hash.

Cuando un documento aquí entre en contradicción con el código, el código gana, **pero hay que actualizar el plan en el mismo PR** que lo cause.
