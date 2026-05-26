# 02 — Currículo

## Jerarquía pedagógica

```
Track       (ej: "Anatomia del prompt")     <- horizonte motivacional, ~10 horas
 |
 +- Course  (ej: "Tu primer LLM")           <- modulo coherente, ~2 horas
     |
     +- Lesson  (ej: "Como hacer JSON")     <- unidad navegable, ~10 min
         |
         +- Step / Chapter                  <- 1 pantalla, 2-5 min, UNIDAD DE PROGRESO
             |
             +- Bloque de teoria (MDX)
             +- Bloque de practica (ejercicio + rubrica)
             +- Hints progresivos
             +- Criterio de validacion
```

**El Step es la unidad atómica.** Todo en el sistema gira alrededor de Steps:
- el progreso se trackea por step,
- la URL es por step,
- la rúbrica vive en el step,
- los embeddings se calculan por step (y por pieza del banco).

## Tracks definidos

### Track 1 — Anatomía del prompt (8-10 lecciones)

**Promesa**: al terminar, el alumno escribe prompts estructurados, robustos y reproducibles.

**Steps tentativos**:
1. Tu primer prompt (`prompt-task` simple)
2. Rol, contexto, instrucciones (`prompt-iterate`)
3. Output estructurado: JSON (`prompt-task`)
4. Output estructurado: XML — el estilo Claude (`prompt-tag-fill` + `prompt-format-convert`)
5. Few-shot prompting (`prompt-task`)
6. Chain of thought (`prompt-task`)
7. Restricciones y guardrails (`prompt-iterate`)
8. Manejo de inputs sucios (`prompt-task`)
9. Caso final: extractor de datos robusto (`prompt-task` con rúbrica grande)

**Por qué este track va primero**: es la habilidad fundacional. Todo lo demás (MCPs, agentes, RAG) la requiere. Es también el track más demostrable en la landing.

### Track 2 — Conversaciones que funcionan (6 lecciones)

**Promesa**: al terminar, el alumno conduce conversaciones multi-turn con LLMs hacia objetivos concretos.

**Steps tentativos**:
1. Memoria de la conversación (`conversation-goal`)
2. Follow-ups y aclaraciones (`conversation-goal`)
3. Recuperarse de outputs malos (`conversation-goal`)
4. System prompt vs user message (`prompt-debug` MCQ + `prompt-task`)
5. Personajes y consistencia (`conversation-goal`)
6. Caso final: negociar con un agente difícil (`conversation-goal`)

### Track 3 — Tool use y MCPs (10 lecciones, el plato fuerte)

**Promesa**: al terminar, el alumno construye MCPs que un LLM realmente decide usar.

**Steps tentativos**:
1. ¿Qué es un tool? (`prompt-debug` MCQ)
2. Tu primera tool definition (`tool-schema-author`)
3. Cuándo el LLM llama tools (concepto + MCQ)
4. Tu primer MCP (`tool-schema-author` + `tool-handler-implement`)
5. Descripciones de tools que el LLM entiende (`tool-description-craft`) — **el corazón**
6. Manejo de errores en tools (`mcp-resilience`)
7. Encadenar tools (`mcp-multi-tool` con 2 tools)
8. MCPs con estado (`mcp-multi-tool`)
9. Debugging un MCP que el agente ignora (`mcp-debug`)
10. Caso final: MCP que resuelve una tarea real (`mcp-end-to-end`)

**Por qué es el plato fuerte**: es contenido único. Nadie enseña "tu descripción de tool es lo que el LLM lee" como una habilidad explícita. Es el equivalente a "buen nombre de variable" pero para LLMs.

### Track 4 — Flujos complejos: agentes, RAG, evals (8 lecciones, fase posterior)

**Promesa**: al terminar, el alumno orquesta sistemas multi-step y los evalúa rigurosamente.

**Steps tentativos**:
1. Cuándo un solo prompt no basta (concepto)
2. Cadenas simples (`chain-design`)
3. Routing de inputs (`prompt-router`)
4. Agentes con loop (`agent-loop-design`)
5. Mini-RAG (`chain-design` con retrieval)
6. Escribir evals (`evals-author`) — meta-aprendizaje
7. Escribir el LLM-judge de tu propio sistema (`eval-judge-author`)
8. Caso final: armar tu propio sistema multi-step

### Track 5 (opcional) — Programación básica para no-devs

**Promesa**: bridge para que alguien sin programación pueda llegar al Track 1.

Solo se construye si la audiencia lo pide post-launch. JavaScript en el navegador, conceptos mínimos: variables, funciones, objetos, async/await, llamadas HTTP.

## Narrativa transversal: The Crew

Lo que hace que CryptoZombies enganche es la **historia tangible**: "vas a construir un ejército de zombies". Sin eso, las lecciones se sienten como Duolingo aburrido.

Aquí la historia es **the crew**: una pequeña tripulación de robots humanoides a la que el alumno se une como nuevo miembro. Cada track desbloquea una capa más profunda de cómo opera el equipo. Los personajes (Vega, Atlas, Echo, Forge, ...) están definidos en `cast.md`.

**Hooks narrativos por track** (siempre dentro del frame de la crew):

- Track 1: **"Te incorporas a la crew"** — Vega te enseña a estructurar tus prompts hasta que Atlas firma tu primer parte. Cada step añade una capa de protocolo (rol, contexto, ejemplos, formato estructurado).
- Track 2: **"Coordinando con el equipo"** — conversaciones multi-turn con miembros de la crew para resolver situaciones reales del día a día.
- Track 3: **"Construyendo herramientas para la crew"** — Forge te lleva al taller. Cada MCP/tool que construyes es algo que el equipo usa de verdad (un scanner, una DB de partes, un mensajero).
- Track 4: **"Operaciones complejas"** — orquestas agentes para misiones multi-step que requieren coordinación entre varios miembros de la crew.

El hook se hace explícito en el primer step de cada track y se referencia al final.

## Dificultad y pre-requisitos

Cada step declara `requires: [conceptId, ...]`. El sistema:
1. No bloquea avance (el alumno puede saltar), pero...
2. Sugiere pre-requisitos no completados antes del step.
3. Si el alumno falla 3 veces en un step, automáticamente le ofrece el pre-requisito que probablemente le falte.

## Cantidad mínima para validar el producto (MVP de contenido)

- **Track 1 completo en ES**: 8 steps funcionales con rúbrica.
- **5 piezas de banco**: 3 concepts + 2 patterns referenciados desde Track 1.

Eso es el corte para mostrar el producto. Track 2/3 vienen después.
