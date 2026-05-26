# 03 — Tipos de ejercicio

## El cambio fundamental

El plan inicial estaba sesgado al modelo "code-fill con respuesta exacta" (CryptoZombies puro). **Eso NO aplica al 90% de lo que se enseña aquí.** Prompt engineering y MCPs no tienen una respuesta correcta — tienen muchas que cumplen criterios.

Por eso, el corazón del producto es un **evaluador con rúbrica**, no un comparador de strings. La intuición clave: **no validamos el prompt, validamos lo que el prompt logra**.

Hay un espectro:

```
determinista <----------------------------------------------------> abierto

  code-fill        prompt-debug      build-mcp        prompt-task      conversation-goal
  (1 respuesta)    (MCQ)             (mixto)          (rubrica)        (LLM-judge total)
  -----------      ----------        -----------      ------------     -----------------
  costo: 0         costo: 0          costo: bajo      costo: medio     costo: alto
  feedback:        feedback:         feedback:        feedback:        feedback:
   pass / fail      pass / fail       schema ok +      checklist        narrativa del
                                      agente uso       por criterio     judge sobre la
                                      el tool                           conversacion
```

Mezclar tipos baratos (deterministas, MCQ) con caros (LLM-judge) en cada track controla costo, latencia y mantiene ritmo pedagógico.

---

## Habilidad A — Estructurar prompts

| # | Tipo | Qué hace el alumno | Validación | Costo |
|---|---|---|---|---|
| A1 | `prompt-anatomy` | Etiquetar partes de un prompt finished (rol / contexto / ejemplos / formato) | Determinista (match de tags) | 0 |
| A2 | `prompt-assemble` | Reordenar bloques desordenados en un prompt coherente | Determinista (orden esperado) + opcionalmente LLM-judge para verificar que funciona | 0 ó bajo |
| A3 | `prompt-tag-fill` | Llenar un `<context>`, `<examples>` o `<format>` faltante en un esqueleto XML | Determinista (XML válido + tag presente) + rúbrica de output | bajo |
| A4 | `prompt-format-convert` | Convertir un prompt plano a XML (estilo Claude) o JSON | Parser válido + el output del modelo es igual o mejor | bajo |
| A5 | `prompt-task` | Escribir un prompt desde cero para una meta concreta | Rúbrica mixta sobre N test cases | medio |
| A6 | `prompt-iterate` | Arreglar un prompt que falla en casos específicos | Tests rojos pasan, verdes no rompen (regression-style) | medio |
| A7 | `prompt-A-B` | Predecir cuál de dos prompts funciona mejor y por qué | MCQ + opcionalmente LLM-judge sobre la justificación | 0 ó bajo |
| A8 | `prompt-explain` | Anotar línea por línea de un prompt explicando cada decisión | LLM-judge con rúbrica de comprensión | medio |
| A9 | `prompt-rubric-author` | Dado un objetivo, escribir la rúbrica que un buen output debe cumplir | Comparar contra rúbrica de referencia con LLM-judge + similarity de embedding | medio |

**A1, A2, A3, A7 son baratos** (deterministas o MCQ). **A4-A9 cuestan llamadas al modelo.** Mezclarlos da ritmo y controla costo.

### Notas de diseño por tipo

- **A1 (prompt-anatomy)**: ideal como onboarding. Cero costo, alta intuición. UI = drag-and-drop o click-to-label.
- **A3 (prompt-tag-fill)**: el más usado en Track 1. Esqueleto con un hueco específico hace el ejercicio acotado pero con espacio creativo.
- **A4 (prompt-format-convert)**: clave para enseñar el estilo Claude (XML vs JSON). Pasa cuando ambos formatos producen output equivalente.
- **A5 (prompt-task)**: el caballo de batalla. Se usa en cada track. La rúbrica es lo que hace que sea evaluable a pesar de no tener respuesta única.
- **A6 (prompt-iterate)**: enseña la habilidad real del prompt engineering — iterar. Empieza con un prompt visiblemente flojo.
- **A7 (prompt-A-B)**: enseña intuición sin requerir escritura. Útil cuando la habilidad-target es "reconocer", no "producir".
- **A8 / A9**: meta-aprendizaje. El alumno construye la habilidad de auto-evaluar.

---

## Habilidad B — Tools y MCPs

| # | Tipo | Qué hace el alumno | Validación | Costo |
|---|---|---|---|---|
| B1 | `tool-schema-author` | Diseñar el JSON Schema de un tool (sin handler) | Schema válido + agente de prueba lo invoca con argumentos correctos | bajo-medio |
| B2 | `tool-description-craft` | Solo editar la descripción de un tool | Precision/recall del agente: llama al tool en tareas que aplican y NO en las que no | medio |
| B3 | `tool-handler-implement` | Solo el handler (schema dado) | Tests deterministas sobre input/output | 0 |
| B4 | `tool-name-pick` | Elegir el mejor nombre y descripción de tres opciones | MCQ + agente A/B testing | bajo |
| B5 | `mcp-multi-tool` | Definir 2-3 tools que se complementan | Agente resuelve tarea multi-step usándolas en orden correcto | medio-alto |
| B6 | `mcp-debug` | Diagnosticar por qué un MCP nunca es invocado por el agente | MCQ + fix-it (vuelve a B2/B1) | bajo |
| B7 | `mcp-resilience` | Manejar errores (input inválido, timeout, etc.) | Tests deterministas sobre handler + observación del agente recuperándose | medio |
| B8 | `mcp-end-to-end` | Construir un MCP completo para un caso real | Rúbrica con todos los anteriores | alto |

**Insight clave**: B2 y B6 son los más originales del producto. Nadie enseña "tu descripción de tool es lo que el LLM lee" como habilidad. Es el equivalente a "buen nombre de variable" pero para LLMs.

### Notas de diseño por tipo

- **B1**: el handler ya existe, importa solo el schema. Test: dar al agente una tarea, ver si invoca el tool con `arguments` válidos.
- **B2 (tool-description-craft)**: schema y handler dados; el alumno solo edita la `description`. Test: damos al agente N tareas mezcladas (algunas que requieren tu tool, otras que no). Medimos **precision** (no llama tu tool cuando no aplica) y **recall** (lo llama cuando aplica). Ambos > umbral = pasa.
- **B3**: implementación pura. Determinista, barato, prácticamente unit tests.
- **B5 (mcp-multi-tool)**: el alumno define 2-3 tools que juntas resuelven algo. El test ejecuta una tarea multi-step y observa la secuencia de llamadas.
- **B6 (mcp-debug)**: damos un MCP que falla en runtime (el agente nunca lo invoca). El alumno identifica la causa: nombre malo, descripción ambigua, schema overcomplicated, etc. Pasar la causa correcta vía MCQ + opción de "fixearlo" mediante B1 o B2.
- **B8**: capstone del Track 3. Rúbrica que combina deterministas (schema válido, handler corre, edge cases) con behavioral (agente lo elige bien).

---

## Habilidad C — Flujos complejos

| # | Tipo | Qué hace el alumno | Validación | Costo |
|---|---|---|---|---|
| C1 | `chain-design` | Definir una cadena de prompts en YAML/visual para un objetivo multi-step | Output final pasa rúbrica + opcional: cada paso pasa rúbrica intermedia | alto |
| C2 | `chain-debug` | Dados los logs de cada paso, identificar qué paso falla | MCQ + LLM-judge sobre la justificación | bajo |
| C3 | `prompt-router` | Escribir un meta-prompt que clasifique inputs y enrute al sub-prompt correcto | Accuracy de clasificación contra dataset etiquetado | medio |
| C4 | `agent-loop-design` | Diseñar las condiciones de parada de un agente | Tests sobre comportamiento (no entra en loop infinito, decide parar correctamente) | alto |
| C5 | `evals-author` | Escribir casos de prueba para un prompt | Cobertura de edge cases evaluada por LLM-judge | medio |
| C6 | `eval-judge-author` | Escribir el prompt del juez (LLM-judge) para un ejercicio | Concordancia con etiquetas de referencia (>= 80% accuracy en muestra) | medio |

**C5 y C6 son meta-aprendizaje**: el alumno aprende lo que la plataforma hace por dentro. Tienen un efecto fuerte de "ahora entiendo cómo funciona el producto".

### Notas de diseño por tipo

- **C1 (chain-design)**: UI con bloques YAML o visual node-based. Cada bloque define `{prompt, model, output-key, depends-on}`. Ejecución secuencial con visualización.
- **C2 (chain-debug)**: damos logs de un chain que falló. El alumno marca el paso problemático.
- **C3 (prompt-router)**: clásico. Dataset de 50 inputs etiquetados con la categoría correcta. El meta-prompt del alumno debe acertar >= 90%.
- **C4**: difícil de evaluar. Probablemente combinar tests sintéticos (entradas que deberían parar inmediato, entradas que requieren 5 iteraciones) con LLM-judge sobre la lógica.
- **C5 (evals-author)**: el alumno escribe casos de prueba. Otro modelo evalúa si los casos cubren edge cases razonables (output formato, vacíos, ambiguos, adversariales).
- **C6 (eval-judge-author)**: el alumno escribe el system prompt del juez. Lo medimos contra un dataset de prompts+outputs ya etiquetados manualmente: el juez del alumno debe coincidir con el humano en >= 80%.

---

## Modalidades por costo

```
GRATIS (sin LLM)                BARATO (1 llamada)         MEDIO (3-6 llamadas)        CARO (10+ llamadas)
-----------------               --------------------       ----------------------       ---------------------
A1 prompt-anatomy               A3 prompt-tag-fill          A5 prompt-task               B5 mcp-multi-tool
A2 prompt-assemble (parcial)    A4 prompt-format-convert    A6 prompt-iterate            B8 mcp-end-to-end
A7 prompt-A-B (MCQ)             A7 con LLM-judge            A8 prompt-explain            C1 chain-design
B3 tool-handler-implement       B4 tool-name-pick           A9 prompt-rubric-author      C4 agent-loop-design
B6 mcp-debug (MCQ)              B6 con verificacion         B1 tool-schema-author        conversation-goal
C2 chain-debug (MCQ)                                        B2 tool-description-craft    (multi-turn libre)
                                                            C3 prompt-router
                                                            C5 evals-author
                                                            C6 eval-judge-author
```

## Reglas de mezcla por lección

Para que un Track sea sostenible en costo y mantenga ritmo:

1. **Mínimo 1 ejercicio gratis por cada 2 caros.** Mantiene velocidad de aprendizaje.
2. **El primer step de un Track debe ser gratis.** Hook sin barrera de costo.
3. **Capstone (último step) puede ser caro.** Recompensa narrativa, vale el costo.
4. **MCQ y A/B se distribuyen entre steps caros para "respiraderos" rápidos.**

## Tipos que NO vamos a construir (por ahora)

- **Visual/UI exercises** (estilo Artifact con React Runner). Posibles en Fase 5+ si hay demanda. Costoso de construir, costo dudoso pedagógico.
- **Code-fill clásico** (estilo CryptoZombies puro). Solo lo usamos para configuración técnica trivial (poner una API key en lugar correcto, importar el SDK correcto). No es el corazón.
- **Speed-run / contests**. Anti-pedagógico para aprender IA bien.
