# 10 — Estaciones de la Crew (Fase 0)

## Por qué este documento

El producto tiene narrativa de crew y economía de juego (vidas, gemas, XP, leaderboard, streak), pero los dos sistemas viven aislados. La crew es decoración encima de un loop de Duolingo genérico, y el loop de Duolingo no aprovecha la cosa más valiosa que tenemos: cada personaje es experto en un dominio.

Este documento define **Fase 0** del rediseño de retención: el modelo de datos de las **estaciones**, su tagging en contenido, y el enganche con el flujo de XP. No incluye UI ni daily quests; esos vienen después y dependen de que esto exista.

## Premisa

Cada personaje es el jefe de una **estación** del puente. Su autoridad viene de saber, no de gustar. Cuando aparece en otra lección es porque su dominio se cruza con el tema, no por cariño.

La progresión del usuario se mide **por estación**, no solo por track. Atlas no tiene estación: es el capitán que firma capstones cruzando todas.

## Las 5 estaciones

| Slug | Estación | Owner | Dominio | Ejemplos de ejercicios |
|---|---|---|---|---|
| `vega` | Comms | Vega | Anatomía del prompt, claridad, formato, few-shot, system vs user channel | `prompt-anatomy`, `prompt-AB` sobre formato, `prompt-task` puro |
| `echo` | Datos | Echo | Validación, integridad de outputs, memoria conversacional, corrección quirúrgica | `conversation-goal`, ejercicios de detección de drift, format-convert |
| `forge` | Engineering | Forge | Tools, schemas JSON, descripciones, MCPs, handlers, debugging | `tool-schema-author`, `tool-description`, `mcp-debug`, `tool-handler-implement` |
| `orbit` | Mission Ops | Orbit | Flujos multi-step, chains, paralelización, routing, evals de pipeline | `step-order-dnd` sobre dependencias, chain-design, prompt-router |
| `hex` | Security | Hex | Inyección directa e indirecta, fugas, validación adversarial, hardening | `prompt-AB` de inyecciones, demos de payloads, validación defensiva |

Atlas no es estación. Sigue siendo el firmante de capstones; cruza todas las estaciones pero no acumula mastery propia.

## Cambios al frontmatter

Agregar dos campos opcionales a `StepFrontmatter`:

```ts
station?: "vega" | "echo" | "forge" | "orbit" | "hex"
touches?: ("vega" | "echo" | "forge" | "orbit" | "hex")[]
```

**Reglas**:
- Ejercicios con `exercise.kind` definido deben declarar `station`. Es requerido en validación.
- Steps narrativos puros (sin `exercise`) pueden omitir `station`. No otorgan mastery, solo XP de lectura si aplica.
- `touches[]` se usa para los pocos ejercicios cuya pedagogía cruza dominios (estimado ~3 por ciento del contenido). Otorga mastery secundaria a las estaciones tocadas.
- No puede haber overlap entre `station` y `touches` (un ejercicio no se toca a sí mismo).

**Implementación**:
- `src/modules/content/types.ts:212` — agregar `station` y `touches` al tipo `StepFrontmatter`.
- `src/modules/content/lib.ts:244` — extender `StepFrontmatterSchema` Zod con los campos y una refine que requiera `station` cuando `exercise` esté presente.
- `scripts/build-content.ts` — sin cambios. El frontmatter pasa como JSON al campo `ContentPiece.frontMatter`.

## Auditoría de contenido (snapshot)

Sobre los ~141 steps actuales, la distribución estimada por muestreo es:

| Estación | Steps estimados | Tracks principales |
|---|---|---|
| `vega` | ~35 | te-incorporas-a-la-crew, tu-primera-conversacion |
| `echo` | ~18 | tu-primera-conversacion (parte) |
| `forge` | ~28 | forge-te-da-las-herramientas, partes de sistemas-multi-step |
| `orbit` | ~28 | sistemas-multi-step, pre-flight (parte) |
| `hex` | ~20 | protocolo-de-seguridad |
| Narrativo / sin estación | ~12 | distribuido |

**Casos cross-track encontrados** (donde la estación natural no coincide con el track):
- `tu-primera-conversacion/04-correction-prompt.mdx` — vive en track de conversación pero su pedagogía es de Echo (preservar datos en ediciones quirúrgicas).
- `pre-flight/01-instrucciones-paso-a-paso.mdx` — onboarding pero ya enseña dependencia secuencial (Orbit).
- `forge-te-da-las-herramientas/03-cuando-el-llm-llama-tools.mdx` — Forge primario, Vega en `touches[]` (la descripción de la tool es comunicación con el modelo).

El tagging concreto de los 141 ejercicios se hace como entregable de esta fase, no se enumera aquí. Cada cambio es un edit al frontmatter del MDX.

## Modelo de datos

Agregar tabla `StationMastery` a `prisma/schema.prisma`. **No reutilizamos `MasteryRecord`**: ese está pensado para spaced repetition por step (SM-2) y vive huérfano sin lecturas; mezclar conceptos lo ensucia. `MasteryRecord` se queda para cuando implementemos review por ejercicio (no es esta fase).

```prisma
model StationMastery {
  userId         String
  station        String   // "vega" | "echo" | "forge" | "orbit" | "hex"
  points         Int      @default(0)        // acumulado bruto, ver fórmula
  mastery        Int      @default(0)        // 0..100 derivado
  tier           Int      @default(0)        // 0..4 (cuatro umbrales, ver más abajo)
  lastActivityAt DateTime?
  totalSteps     Int      @default(0)        // steps únicos completados de esta estación
  perfects       Int      @default(0)        // first-try sin hints
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, station])
  @@index([userId])
  @@index([station, mastery])
}
```

Agregar relación en `User`:

```prisma
stationMastery StationMastery[]
```

## Cálculo de mastery

**Otorgar puntos al completar un ejercicio**:

| Evento | Puntos a la estación primaria | Puntos a cada touch |
|---|---|---|
| Completado (cualquier intento) | 5 | 1 |
| First-try (passed en el primer intento) | 8 | 2 |
| Perfecto (first-try y sin hints) | 10 | 3 |

Los puntos solo cuentan **la primera vez** que el usuario completa un step. Repetir no acumula. Esto evita farming.

**De puntos a mastery (0-100)**:

```
mastery = min(100, round(points / pointsToMax * 100))
```

Donde `pointsToMax` es el total teórico de puntos si el usuario hiciera todos los ejercicios de esa estación en perfecto. Se calcula desde el contenido en build time y se guarda como constante. Esto significa que mastery 100 requiere haber hecho todo lo de la estación en perfecto.

**Decay**:
- Si `lastActivityAt` de una estación tiene más de 7 días, restar 2 puntos por semana adicional sin actividad.
- Mínimo absoluto: 0. No bajamos por debajo de cero.
- Cualquier actividad nueva reinicia el contador de decay (no recupera puntos perdidos, solo detiene la sangría).

**Tiers** (umbrales sobre `mastery`):

| Tier | Mínimo | Etiqueta | Qué desbloquea (definición funcional, UI en fase posterior) |
|---|---|---|---|
| 0 | 0 | Sin contacto | Nada |
| 1 | 25 | Te tiene en el radar | El personaje aparece como hint-giver cuando fallas un ejercicio donde su dominio toca |
| 2 | 50 | Te asigna trabajo | Side-missions de su estación se vuelven elegibles (las side-missions las define Fase 2) |
| 3 | 75 | Te respalda | Reducción de cooldown de heart-loss en su estación (define Fase 2) |
| 4 | 100 | Segunda al mando | Práctica delegada a esa estación (define Fase 2) |

**Importante**: esta fase solo persiste `tier`. Las consecuencias funcionales de cada tier se construyen en Fase 1 y 2. Tier es dato, no UI.

## Puntos de enganche en el código

**Pipeline de XP ya cableado**: la orquestación de "step completion → XP + gemas" vive en `src/modules/exercises/service.ts` alrededor de la línea 632. Ahí:
- Línea 632-643: `awardXp` corre cuando `stepOutcome.firstCompletion === true`.
- Línea 648-656: `awardGemsForStepCompletion` corre con `firstCompletion` y `firstTry`.
- `args.step` es de tipo `Step` y tiene `frontMatter` accesible (ya se usa en línea 354).

**Donde se inserta el cálculo de mastery**:

1. Nueva función `src/modules/gamification/service.ts:applyStationMasteryDelta({ userId, step, firstTry, hintsUsed })`:
   - Lee `step.frontMatter.station` y `step.frontMatter.touches`.
   - Si no hay station, no hace nada.
   - Calcula delta por la tabla de la sección anterior.
   - Upsertea `StationMastery` para la station primaria y para cada touch.
   - Recalcula `mastery` y `tier` en la misma transacción.

2. Llamarla desde `src/modules/exercises/service.ts` justo después del award de gemas (línea ~656), best-effort con `.catch` igual que los otros awards, para no bloquear el response.

3. **Cron de decay** (`src/modules/gamification/decay.ts` nuevo):
   - Job diario que aplica el decay a `StationMastery` con `lastActivityAt` más viejo que 7 días.
   - Se enchufa al mismo cron pendiente que ya tiene el snapshot de leaderboard.

## Migración y backfill

**Schema migration**:
- Crear tabla `StationMastery` vía `prisma migrate dev`.
- Sin defaults destructivos. Tabla vacía después de migración.

**Backfill**:
- Script `scripts/backfill-station-mastery.ts` que:
  - Lee todos los `Progress` con `status: "completed"`.
  - Para cada uno, lee el step, extrae `station` y `touches`.
  - Aplica la fórmula de puntos usando `Attempt.passed` y `Progress.hintsUsed` para detectar perfecto vs first-try vs completado.
  - Inserta `StationMastery` para todos los usuarios existentes.
- Idempotente: se puede correr múltiples veces, salta si ya existe la fila.
- Corre una sola vez en producción tras deploy.

## Lo que esta fase NO incluye

Explícitamente fuera de scope para evitar scope creep:

- UI de mastery (badges, barra de progreso, página de crew). Eso es Fase 1.
- Daily quests emitidas por personajes. Esa es Fase 1.
- Side-missions / tickets de estación. Esa es Fase 2.
- Cambios al cooldown de hearts ni a la economía de gemas. Esa es Fase 3.
- Resucitar la página `/crew`. Eso es Fase 1 (cuando la UI tenga datos que mostrar).
- Tocar `MasteryRecord` o implementar spaced repetition por ejercicio. Eso no entra en este rediseño.

## Riesgos abiertos

1. **Distribución desbalanceada**: Echo tiene solo ~18 ejercicios estimados contra Vega con ~35. Llegar a mastery 100 en Echo cuesta proporcionalmente menos. Mitigación: el sistema usa porcentaje del total de su estación, no comparación entre estaciones. Documentar para que la UI no compare mastery absoluta entre estaciones de forma engañosa.

2. **Touches potencialmente subjetivo**: la decisión de qué ejercicios tienen touch a otra estación es interpretativa. Mitigación: en la auditoría de tagging, mantener `touches` conservador (solo cuando sea evidente). Mejor tener pocos touches correctos que muchos discutibles.

3. **Backfill puede ser lento**: con N usuarios y M progresos, el backfill es O(N*M). Aceptable en MVP. Si se vuelve problema, batch por usuario.

## Definition of done (Fase 0)

- [ ] Tipos y Zod schema aceptan `station` y `touches`.
- [ ] Los ~141 steps existentes tienen `station` taggeado (los narrativos pueden quedar sin él).
- [ ] Tabla `StationMastery` migrada.
- [ ] `applyStationMasteryDelta` invocado en exercise completion y testeado.
- [ ] Decay job corriendo en cron.
- [ ] Backfill ejecutado en preview y validado contra al menos 3 usuarios reales.
- [ ] Cero cambios visibles para el usuario. Esto es infraestructura silenciosa para Fase 1.
