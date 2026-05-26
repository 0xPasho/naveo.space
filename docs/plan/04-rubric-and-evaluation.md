# 04 — Rúbrica y pipeline de evaluación

## Concepto: la rúbrica

Una rúbrica es una **lista de checks** que un intento debe cumplir. Cada check es una regla evaluable, ya sea determinista (regex, JSON.parse, schema) o por LLM-judge (criterios cualitativos).

**Por qué rúbricas y no respuesta única**:
- En IA no hay "una respuesta correcta". Hay muchas respuestas que cumplen criterios.
- Una rúbrica articula esos criterios explícitamente.
- El alumno ve **qué le falta**, no solo "incorrecto".
- El autor de contenido razona en términos de "qué tiene que hacer un buen output", que es exactamente la habilidad de prompt engineering.

## Tipos de check

| Tipo | Costo | Cuándo usarlo |
|---|---|---|
| `json-valid` | $0 | "El output es JSON parseable" |
| `has-keys` | $0 | "Tiene las llaves X, Y, Z" |
| `regex` | $0 | Match contra patrón |
| `contains` | $0 | Substring o frase obligatoria/prohibida |
| `length-between` | $0 | Output respeta longitud razonable |
| `schema-valid` | $0 | Para B1 — el JSON Schema definido por el alumno es válido |
| `runs-without-error` | $0 | Para B3 — el handler ejecuta sin throw |
| `xml-tag-present` | $0 | Para A3 — un tag específico aparece en el prompt |
| `agent-invokes-tool` | medio | Para B1/B2 — un agente, dado una tarea, llama al tool del alumno |
| `agent-precision-recall` | medio-alto | Para B2 — accuracy del agente con N tareas mezcladas |
| `llm-judge-haiku` | bajo (~$0.001/check) | Criterios cualitativos baratos: "es coherente", "responde la pregunta" |
| `llm-judge-sonnet` | medio (~$0.01/check) | Criterios sutiles: "no aluciona", "captura todos los matices" |
| `embedding-similarity` | muy bajo | Para A8/A9 — comparar respuesta del alumno con referencia |

## Anatomía de una rúbrica

Vive en el front-matter del step `.mdx`:

```yaml
exercise:
  kind: prompt-task
  model: claude-haiku-4-5
  testCases:
    - input: "Juan tiene 32 años, j@x.com"
    - input: "María Pérez, 28, mp@y.com"
    - input: "Carlos sin email registrado"
  rubric:
    - id: json-valid
      kind: deterministic
      check: json-parse
      criterion: "El output es JSON válido"
    - id: has-keys
      kind: deterministic
      check: contains-keys
      args: [name, age, email]
      criterion: "Contiene name, age, email"
    - id: no-hallucination
      kind: llm-judge
      model: claude-haiku-4-5
      criterion: "No inventa datos no presentes en el input"
      judgePrompt: |
        Dado este input: {{input}}
        Y este output del modelo: {{output}}
        ¿El output incluye datos que NO están en el input?
        Responde SOLO con JSON: { "passes": true|false, "reason": "..." }
  passThreshold:
    rule: all-criteria-all-cases    # otra opción: 'all-criteria-N-of-M'
```

## Pipeline de evaluación

```
                  Usuario presiona [Check Answer]
                                |
                                v
        +-----------------------------------------+
        | 1. Rate-limit check (por userId)        |
        |    -> si excede, devolver 429           |
        +-----------------------------------------+
                                |
                                v
        +-----------------------------------------+
        | 2. Hash(prompt + exerciseId + rubric)   |
        |    Buscar en RubricCache                |
        +-----------------------------------------+
              |                          |
         hit  |                          |  miss
              v                          v
   +-----------------+      +---------------------------+
   | Devolver result |      | 3. Ejecutar prompt vs     |
   | cacheado        |      |    cada testCase          |
   +-----------------+      |    (1 llamada al modelo   |
                            |     target por caso)      |
                            +---------------------------+
                                          |
                                          v
                  +----------------------------------+
                  | 4. Para cada (output, criterio): |
                  |    correr el check               |
                  +----------------------------------+
                                          |
                          +---------------+---------------+
                          |                               |
                          v                               v
              +------------------------+      +-------------------------+
              | DETERMINISTAS (gratis) |      | LLM-JUDGE (con costo)   |
              |   - json-valid         |      |  Solo si pasaron        |
              |   - regex / contains   |      |  los deterministas      |
              |   - schema-valid       |      |   - haiku para barato   |
              |   - has-keys           |      |   - sonnet para sutil   |
              +------------------------+      +-------------------------+
                          |                               |
                          +---------------+---------------+
                                          v
                  +----------------------------------+
                  | 5. Agregar resultados:           |
                  |    - per-criterio, per-case      |
                  |    - calcular passed segun       |
                  |      passThreshold               |
                  +----------------------------------+
                                          |
                                          v
                  +----------------------------------+
                  | 6. Persistir Attempt en DB       |
                  |    Persistir RubricCache         |
                  +----------------------------------+
                                          |
                                          v
                  +----------------------------------+
                  | 7. Devolver al cliente:          |
                  |    {                             |
                  |      passed: bool,               |
                  |      criteria: [{id, passed,     |
                  |                  reason}],       |
                  |      cases: [{input, output,     |
                  |               results}]          |
                  |    }                             |
                  +----------------------------------+
```

## Optimización de costo

### Filtro barato primero

Si la rúbrica tiene tanto checks deterministas como LLM-judge, ejecutamos los deterministas primero. **Si fallan los deterministas, NO corremos los LLM-judge.** Ahorra ~80% del costo en intentos malos.

### Cache agresivo

Hash key: `sha256(prompt_text + exerciseId + rubricVersion + testCaseSet + targetModel)`.

Cache lookup antes de ejecutar:
- Si dos alumnos mandan el mismo prompt para el mismo ejercicio → resultado idéntico desde cache.
- TTL: indefinido mientras `rubricVersion` no cambie (basado en hash del front-matter).
- Si el autor edita el step → nuevo `rubricVersion` → invalida automáticamente.

Cache también guarda el output del modelo target, no solo los results — útil para mostrar al alumno sin re-ejecutar.

### Modelos por defecto

- **Modelo target** (el modelo que ejecuta el prompt del alumno): `claude-haiku-4-5` por default. Solo para ejercicios donde queremos forzar el modelo específico (A4 estilo Claude), se especifica.
- **Modelo judge**: `claude-haiku-4-5` por default. `claude-sonnet-4-6` solo para criterios donde Haiku no discrimina bien (raros — ~5% de criterios).

### Rate limit por usuario

Por endpoint `POST /api/exercises/run`:
- Free tier: configurable vía `RATE_LIMIT_FREE_RUNS_PER_DAY` (default sugerido: 20).
- Reset diario.
- Logged-out: límite por IP, mucho más estricto (3 ejecuciones para demo).

### Replay y ajuste

Cada `Attempt` guarda `(payload, outputs, rubricResults, modelVersions)`. Si después ajustamos el prompt del juez o cambiamos el modelo:
- Podemos **re-evaluar intentos pasados sin volver a llamar la API target** (ya tenemos sus outputs guardados).
- Solo re-corre el judge sobre los outputs almacenados.
- Permite mejorar la rúbrica retroactivamente sin perder histórico.

## Feedback al alumno

El cliente recibe estructura:

```ts
{
  passed: false,
  caseSummary: "2 de 3 casos pasaron",
  criteria: [
    { id: "json-valid", passed: true, summary: "OK en los 3 casos" },
    { id: "has-keys", passed: true, summary: "OK en los 3 casos" },
    { id: "no-hallucination", passed: false, failedCases: [2],
      summary: "Caso 3: el modelo inventó un email que no estaba en el input" }
  ],
  cases: [
    { input: "...", output: "...", criteriaResults: [...] },
    { input: "...", output: "...", criteriaResults: [...] },
    { input: "...", output: "...", criteriaResults: [...] }
  ]
}
```

UI:
- Checklist con cada criterio (verde/rojo + razón).
- Tabs para ver el output de cada caso.
- En caso de fallo, el `summary` específico le dice **qué pasó**, no solo "incorrecto".

Esto es el diferenciador con CryptoZombies: en vez de "X" plano, ves un **diagnóstico**.

## Versionado de rúbricas

Cada step tiene un `rubricVersion` derivado de:

```
rubricVersion = sha256(stableSerialize(frontMatter.exercise))
```

Cualquier cambio al front-matter del exercise → nueva versión → invalida cache. Esto se calcula en build-time y se guarda en `ContentPiece.frontMatter`.

Permite tracking histórico: "este alumno pasó la versión 3 del step `03-output-json`, ahora estamos en versión 4". Por defecto **no requerimos re-pasar versiones nuevas** — el progreso se mantiene si el step ya estaba completado.

## Edge cases que la rúbrica debe manejar

1. **Modelo timeout**: si el modelo target no responde en N segundos, marcar el caso como fail con razón "timeout" pero no consumir cuota del usuario.
2. **Modelo rate limit**: degradar a Haiku, o devolver error "intenta de nuevo en X segundos".
3. **Output vacío del modelo**: tratar como fail automático en checks deterministas.
4. **Prompt del alumno > N tokens**: rechazar antes de enviar (UI muestra warning con conteo de tokens).
5. **Prompt del alumno con prompt injection contra el judge**: el judge prompt está siempre wrapeado con tags + sanitización.
6. **Costo sospechoso**: si un usuario gatilla > X dólares en una hora, auto-cap.
