# 07 — UI del Lesson Player

La pantalla clave del producto. Inspiración directa: CryptoZombies. Layout: izquierda lección, derecha actividad, footer navegación.

## Layout principal (estado normal)

```
+--------------------------------------------------------------------------------+
|  learn-ai      Track: Anatomia del prompt > L3 > Output JSON          3 / 8   |
|                                                                  [tutor IA]   |
+----------------------------------------+---------------------------------------+
|                                        |  Tu prompt                            |
|  ## Output estructurado                | +-----------------------------------+ |
|                                        | | Eres un extractor de datos.       | |
|  Por defecto un LLM responde texto     | | Dado un texto bio, devuelve JSON  | |
|  libre. Para integrarlo a un sistema   | | con name, age, email...           | |
|  necesitamos forzar un formato.        | |                                   | |
|                                        | |                                   | |
|  Hay 3 técnicas principales:           | +-----------------------------------+ |
|    - Pedirlo en lenguaje natural       |                                       |
|    - Few-shot con ejemplos             |  Casos de prueba                      |
|    - Schema explicito                  | +-----------------------------------+ |
|                                        | | > "Juan tiene 32 años, j@x.com"   | |
|  ### Tu turno                          | | > "Maria Perez, 28, mp@y.com"     | |
|                                        | | > "Carlos sin email registrado"   | |
|  Escribe un prompt que extraiga:       | +-----------------------------------+ |
|    name, age, email                    |                                       |
|                                        |  [ Run ]   [ Hint 1/3 ]   [ Reset ]   |
|  Debe pasar los 3 casos de prueba.     |                                       |
|                                        |  Resultados   (caso 3 fallo)          |
|                                        | +-----------------------------------+ |
|  > Tip: piensa que pasa cuando un      | |  ok  Devuelve JSON valido         | |
|  >      dato falta en el input.        | |  ok  Contiene name / age / email  | |
|                                        | |  --  No alucina datos faltantes   | |
|                                        | |      (caso 3: invento el email)   | |
|                                        | +-----------------------------------+ |
+----------------------------------------+---------------------------------------+
|  < BACK                       [ Check Answer ]                         NEXT >  |
+--------------------------------------------------------------------------------+
```

## Componentes

### Header
- Logo `learn-ai`
- Breadcrumb: `Track > Course > Lesson`
- Progreso del curso: `3 / 8` (steps completados / total en course)
- Botón "tutor IA" → abre drawer/panel de chat

### Reading pane (izquierda, ~50% width en desktop)
- MDX renderizado con componentes shadcn:
  - `<h1>`, `<h2>`, `<h3>` con `font-bold tracking-tight`
  - `<Callout type="info|warning|tip">` para destacar
  - `<CodeBlock language="json">` con syntax highlight (Shiki)
  - `<Inline code>` resaltado
- Scroll independiente del exercise pane
- En mobile: stack vertical, lección arriba, actividad abajo

### Exercise pane (derecha, ~50% width)
- **Su contenido es polimórfico** según `exercise.kind`. Cada runner expone un componente React.
- Para `prompt-task`:
  - Textarea grande (Monaco con highlighting de prompts) para el prompt del alumno.
  - Lista colapsable de `testCases` (input visible, output se llena al hacer Run).
  - Botones: `Run`, `Hint`, `Reset`.
  - Panel de **Resultados** debajo: checklist de criterios, cada uno con verde/rojo + razón.
- Para `prompt-anatomy`:
  - Bloques drag-and-drop con etiquetas posibles (`role`, `context`, `examples`, `format`).
  - El alumno arrastra cada parte al label correcto.
- Para `prompt-AB`:
  - Dos prompts mostrados lado a lado.
  - Pregunta + opciones MCQ.
- Para `tool-description-craft`:
  - Schema readonly + textarea de description.
  - Panel inferior: lista de tareas de prueba con check verde si el agente llama el tool, rojo si no debería y lo llamó.
- ...etc por kind.

### Hints drawer
- Botón muestra `Hint 1/3`. Click → expande primer hint.
- Cada hint usado incrementa `hintsUsed` en Progress. Visible al alumno.
- Último "hint" es la solución completa, con confirmación: "esto te muestra la solución, ¿estás seguro?".

### Footer
- `< BACK`: ir al step anterior (en mismo lesson o lesson previa).
- `[ Check Answer ]`: ejecutar exercise.
  - Loading state: spinner + "evaluando..."
  - Si pasa: animación verde + auto-foco en NEXT.
  - Si falla: shake + actualizar checklist.
- `NEXT >`: solo se habilita si `passed === true` o si el alumno explícitamente "salta" (registrado).
- Indicador de progreso `3 / 8` + dots clickables para saltar (con confirmación si no está completado).

## Tutor panel (drawer / overlay)

Se abre con botón en header. Posición: drawer derecho que cubre el exercise pane temporalmente, o panel flotante.

```
+--------------------------------------+
|  Tutor IA                       [X]  |
+--------------------------------------+
|                                      |
|  Hola! Estoy aqui para ayudarte con  |
|  esta leccion. Pregunta lo que sea.  |
|                                      |
+--------------------------------------+
|  Tu: por que claude responde con     |
|       texto antes del JSON?          |
|                                      |
|  Tutor: Ese es un comportamiento     |
|  comun. La causa es que el modelo    |
|  por defecto "preambula"... [stream] |
|                                      |
|  Referencias:                        |
|   * concept: json-output             |
|   * antipattern: prefix-suffix-...   |
|                                      |
+--------------------------------------+
|  > [escribe tu pregunta...]    [>]   |
+--------------------------------------+
```

- Streaming token-by-token (SSE).
- Footer muestra qué piezas del banco se retrievaron (transparencia).
- Conversación se guarda por `(userId, stepId)` para que al volver siga.

## Estados de la UI

### Cargando step
- Skeleton del layout completo.

### Sin progreso (primer step)
- CTA grande: "Empieza el track" en hero.

### Step completado anteriormente
- Banner pequeño: "Ya completaste este step. Puedes repasarlo o saltar al siguiente."
- Permitir re-intentar para mejorar score.

### Ejercicio en ejecución
- Botón Run cambia a "Evaluando... (cancelar)".
- Cada criterio muestra spinner mientras se evalúa (deterministas instant, LLM-judge ~2-5s).
- Resultados aparecen progresivamente (per-criterion streaming).

### Ejercicio falló
- Checklist muestra cuál criterio falló y por qué.
- Sugerencia automática (si la rúbrica detecta antipattern):
  - Banner: "Tu prompt se parece a `vague-instructions`. Tip: ..."

### Ejercicio pasó
- Animación de éxito (subtle, no excesiva).
- XP earned indicator (Fase 5).
- NEXT auto-focus.
- Si hay milestone (completaste curso/track): celebration modal con badge.

### Sin login
- Permitir leer la lección.
- Al intentar "Run" o "Save progress": modal de Clerk inline.
- Para steps de demo (primer step de Track 1): permitir 1-2 ejecuciones sin login (rate-limit por IP).

## Responsive

- **Desktop (>= 1024px)**: layout 50/50 horizontal.
- **Tablet (768-1023px)**: layout 40/60 (lección más estrecha).
- **Mobile (< 768px)**: stack vertical. Lección arriba, exercise abajo. Tutor en bottom sheet.
- **Editor en mobile**: textarea simple en lugar de Monaco (Monaco es pesado).

## Accesibilidad

- Navegación con teclado: Tab a través de todos los controles.
- Atajos:
  - `Cmd+Enter` / `Ctrl+Enter` en exercise pane → Run.
  - `Cmd+Right` → NEXT (si habilitado).
  - `Cmd+Left` → BACK.
  - `?` → abrir tutor.
- Focus visible en todos los controles.
- Lectores de pantalla: `<main>` lección, `<aside>` exercise, `<nav>` footer.
- Animaciones respetan `prefers-reduced-motion`.

## Diseño visual (recordatorio del CLAUDE.md)

- Light mode only.
- Paleta zinc grayscale.
- Botones primarios: `variant="dark"` (negro).
- Sin verde de "primary" — el verde solo aparece como check de criterios.
- Tipografía: DM Sans (body), JetBrains Mono (code y editor).
- Border radius: 16px cards, 24px botones, 24px inputs.

## Componentes shadcn requeridos

- Button
- Tabs (para multi-archivo en exercise pane)
- Drawer (tutor)
- Toast (errores, éxitos)
- Tooltip (en hints, badges)
- Alert (criterios)
- Dialog (confirmación de "ver solución")
- Progress (barras de progreso)
- Avatar (tutor IA)

## MDX components custom

`src/common/components/mdx-components.tsx` mapea:

```
h1, h2, h3, h4, h5, h6  -> headings con clases Tailwind
p, ul, ol, li, blockquote -> body styles
a -> link con underline
code (inline) -> highlight zinc-100
pre code (block) -> CodeBlock con Shiki
hr -> separator
table, thead, tbody, tr, th, td -> tabla shadcn

Callout type="info|warning|tip" -> Alert variant correspondiente
Tip -> shorthand de Callout type=tip
Warning -> shorthand de Callout type=warning
PromptExample -> bloque destacado con prompt + output
PatternRef id="extractor" -> link al pattern del banco
ConceptRef id="few-shot" -> hover card con resumen del concepto
```

## Animaciones

Mínimas, intencionales:

- Fade-in del Reading pane al cargar (200ms).
- Slide-in de la primera Hint cuando se abre (250ms).
- Scale + glow del check verde cuando un criterio pasa (300ms, una vez).
- Shake del exercise pane si falla (200ms).
- Confetti SOLO al completar un Track entero (no per-step — sería excesivo).

`tw-animate-css` (ya en dependencies) maneja todo esto.
