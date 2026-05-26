# Daily Quests — guía de autoría

Misión: cada usuario tiene **una "Misión del día"** que aparece en `/practice` y en el dashboard. Es el gancho de retención: mini-lección de **5-8 escenas** (cada escena un ejercicio corto), ~2-3 minutos, refuerza un concepto, mantiene la racha. Vive fuera del árbol `track → course → step`.

**Floor de 5 escenas es regla del producto, no arbitrario**: bajo eso la daily se siente quiz y el usuario la cierra en 30 segundos sin que el ritual diario aterrice. El schema rechaza quests con menos.

Este doc es para quien va a sumar contenido. El modelo de datos y la lógica ya están en `src/modules/daily-quest/`.

## Cómo se asigna una daily

`getOrAssignDailyQuest(userId, locale)` en `src/modules/daily-quest/service.ts`:

1. Si ya existe una `DailyQuestAssignment` para `(userId, hoy en UTC)`, la devuelve.
2. Si no, ejecuta el pipeline de selección:
   - **Pool**: todas las daily quests del locale activo.
   - **Filtro de kinds soportados**: descarta quests con escenas de kind no soportado (defensivo).
   - **Bias por concepts conocidos** (ver siguiente sección).
   - **Pick determinístico**: `hash(userId + díaIso) % elegibles.length`.
3. Persiste la asignación. Recargar `/practice` no cambia la quest del día.

**Locale switch**: la asignación se persiste con un locale, pero al leer el contenido se prefiere el locale actual del request. Como los archivos `.mdx` comparten slug en `es/` y `en/`, el usuario que cambia idioma a mitad del día sigue viendo "su" quest traducida.

## Bias por concepts conocidos

**Regla**: una daily quest le aparece al usuario solo si refuerza algo que ya vio en una lección. Sin esto el usuario se topa con quests sobre temas que aún no le enseñaron, lo que confunde y arruina el ritmo del currículum.

**Cómo se implementa** (`pickQuest` + `getUserKnownConcepts` en `service.ts`):

1. **`getUserKnownConcepts(userId, locale)`** consulta todos los `Progress.completed` del usuario, lee cada step's `frontMatter.teaches`, y arma un `Set<conceptSlug>` con la unión.
2. **Quest elegible** si su `teaches: [...]` intersecta el set. Si una quest **no tiene** `teaches`, se considera **fundacional/universal** y queda elegible siempre.
3. **Fallback**: si el filtro deja cero candidatas (usuario nuevo sin steps completados, o desalineación de tagging), se cae al pool soportado completo. Nunca dejamos al usuario sin daily.

**Por qué este filtro funciona:**

- Usuario nuevo (0 steps completados): set vacío → solo califican las quests sin `teaches` (fundacionales). Sirve para el día 1.
- Usuario con 5-10 steps: set chico → 4-8 quests elegibles. Repite cada ~semana.
- Usuario avanzado: set grande → la mayoría del pool elegible.

**Implicación para autoría**:

- Las quests "fundacionales" (sin `teaches`) son raras pero importantes. Deben funcionar para alguien que JUSTO arrancó (tema super básico: qué es un prompt, anatomía mínima).
- La mayoría de las quests **debe** llevar `teaches: [...]` con slugs de la taxonomía de steps. **No inventés slugs nuevos** — usá los que ya existen en `content/{es,en}/steps/**/*.mdx`.

## Concept slug taxonomy

Los slugs vienen del campo `teaches:` de los steps. Hay ~122 slugs únicos al momento, distribuidos en 5 estaciones temáticas.

**Para ver los slugs en uso**:

```bash
python3 -c "
import os, re
slugs = set()
for root, _, files in os.walk('content/es/steps'):
    for f in files:
        if not f.endswith('.mdx'): continue
        with open(os.path.join(root, f)) as fp:
            c = fp.read()
        m = re.search(r'(?ms)^teaches:\s*\n((?:\s+-\s+\S+\n?)+)', c)
        if m:
            for ln in m.group(1).split('\n'):
                ln = ln.strip()
                if ln.startswith('-'): slugs.add(ln.lstrip('- ').strip())
for s in sorted(slugs): print(s)
"
```

**Slugs frecuentes por área**:

- **Anatomía y especificidad**: `prompt-anatomy-basics`, `prompt-specificity`, `ambiguity-resolution`, `xml-tags-claude`, `ask-model-to-clarify-first`.
- **System vs user**: `system-vs-user`, `system-prompt-design`.
- **Few-shot**: `few-shot-basics`, `few-shot-selection`, `counter-examples`, `negative-instruction-trap`.
- **Correcciones**: `surgical-correction-prompt`, `specific-correction`, `prompt-iteration-loop`, `recover-from-bad-output`.
- **Output**: `strict-output-format`, `structured-output`, `suppress-preamble`, `length-constraints`, `tool-output-shape`.
- **Multi-turn**: `context-drift-detection`, `multi-turn-context-recovery`, `multi-turn-followup`, `multi-turn-closing-discipline`.
- **Tools/MCP**: `tool-description-craft`, `tool-description-precision`, `tool-idempotency`, `tool-side-effect-marking`, `tool-catalog-size`, `tool-naming-discoverability`, `mcp-debug-ignored`, `mcp-error-handling`.
- **Hallucinations**: `hallucination-mitigation`, `hallucination-mechanics`.

## Dónde se renderiza

- `/practice` → card destacada arriba ("Misión del día" + intro + CTA + "5 escenas")
- `/practice/daily` → la quest en sí, jugable, con progress bar arriba
- Dashboard (`bridge-dashboard.tsx`) → banner debajo de la fila de crew
- Sidebar "Práctica" → badge `+1` cuando hay daily pendiente
- HUD streak-pill → nudge cuando `atRiskToday` ("Hacer la misión de hoy")
- Resume CTA del dashboard (`getNextActionForUser`) → cae en `/practice/daily` cuando el usuario terminó todos los tracks activos

## Frontmatter — schema

Definido en `src/modules/content/lib.ts:DailyFrontmatterSchema`.

```yaml
---
title: "Misión exprés: ..."          # requerido
intro: |                             # opcional, máx ~2 líneas
  Una frase de gancho.
station: vega                        # opcional, una de: vega, echo, forge, orbit, hex (no atlas)
characters:                          # opcional, primer slug es el lead
  - echo
teaches:                             # opcional pero recomendado, slugs de la taxonomía de steps
  - surgical-correction-prompt
  - specific-correction
scenes:                              # REQUERIDO, 5-8 escenas
  - kind: prompt-AB
    ...
  - kind: slot-fill-dnd
    ...
---

Una línea o dos de cierre debajo del frontmatter (cuerpo MDX).
```

## Kinds de ejercicio soportados

**Sólo determinísticos**, sin LLM eval. Los daily NO descuentan vidas y NO ejecutan rúbricas LLM, por eso quedan baratos.

Lista cerrada (en `src/modules/daily-quest/data.ts:DAILY_QUEST_SUPPORTED_KINDS`):

| kind | qué pide al usuario |
|---|---|
| `prompt-anatomy` | Etiquetar partes de un prompt (Role / Context / Task / Format) |
| `prompt-AB` | Elegir entre dos prompts; explicación se muestra al pasar |
| `prompt-tag-fill` | Completar un template con tags `{{...}}` |
| `tool-description` | Editar una descripción de tool hasta que incluya frases clave |
| `mcp-debug` | Identificar el root cause de un MCP que se comporta raro |
| `step-order-dnd` | Reordenar pasos de un chain-of-thought |
| `slot-fill-dnd` | Arrastrar piezas a slots etiquetados |
| `wiring-dnd` | Conectar nodos en un grafo pequeño |

Kinds **NO soportados** en daily (porque cuestan LLM o vidas): `prompt-task`, `conversation-goal`, `tool-schema-author`, `tool-handler-implement`. Si autorizás uno por error, el loader lo ingiere pero `runDailyQuest` rechaza con `unsupported_kind`.

## Nombrado de archivos

```
content/es/daily/001-vago-vs-especifico.mdx
content/en/daily/001-vago-vs-especifico.mdx
```

- Prefijo numérico opcional pero recomendado para ordenarlos en `ls`. Se ignora en el slug final.
- El **slug** (filename sin prefijo numérico y sin extensión) debe **coincidir entre `es/` y `en/`** para que el locale-switch encuentre el par.
- ID en DB queda `daily:<slug>` (sin locale en el id, ya que `(id, locale)` es la PK compuesta de `ContentPiece`).
- IDs internos de slots/pieces/parts/steps/candidates/sources/targets también deben **coincidir entre los dos locales del mismo quest** (son refs estables que usa el runner).

## Reward

Ver `src/modules/daily-quest/data.ts`:

- **`DAILY_QUEST_XP_PASS`** (actualmente `15` XP) — se otorga **una sola vez por día** en el primer pase de TODAS las escenas.
- No hay gemas extra, no hay badge nuevo.
- La racha se acredita vía `recordActivity(userId, "daily-quest")` al submit, igual que cualquier step.

## Para sumar una quest nueva

1. Pensá el concepto. Asegurate de que esté cubierto por algún step existente (mirá los `teaches:` de los steps en `content/es/steps/`).
2. Pickeá 1-3 `teaches:` slugs de la taxonomía existente. **No inventés**.
3. Pickeá 5 `kind`s soportados, variados.
4. Creá `content/es/daily/NNN-mi-quest.mdx` Y `content/en/daily/NNN-mi-quest.mdx` con el MISMO slug.
5. Voz: **Naveo crew**, mismo tono que los otros daily. Sin em-dashes. Sin emojis. Voseo en es.
6. Corré `npm run build:content` y verificá que el output diga `upserted: 2` (uno por locale) y que no haya warnings que mencionen tu archivo.
7. Probá en `/practice` (probablemente no te toca el mismo día por el hash; podés forzar con un `DELETE FROM "DailyQuestAssignment" WHERE "userId" = '...'` en dev).

## Limpieza / mantenimiento (deuda abierta)

- **No hay cron** que borre filas viejas de `DailyQuestAssignment`. Acumulan a razón de ~1/usuario/día. Cuando sea molesto, agregar al mismo cron donde caigan `LeaderboardSnapshot` y `MasteryRecord` (ambos tienen "cron TODO" marcado en el schema).
- **Pool**: a más quests, menos repeticiones. Mantener creciendo a medida que se suman tracks/conceptos. El filtro por `teaches` significa que crecer el pool sin sumar slugs cubiertos NO ayuda a un usuario nuevo: lo que importa es tener cobertura sobre los conceptos que cada cohorte ya vio.
