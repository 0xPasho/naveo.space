## Cast — The Crew

La pequeña tripulación de robots humanoides a la que el alumno se une. Visualmente: estética humanoide funcional — chasis utilitario, insignias de la crew en oro, cada miembro con un detalle que delata su especialidad (visor de Echo, herramientas de Forge, charreteras de Atlas).

**Premisa narrativa**: estás entrando a la crew como nuevo miembro. Para que el resto pueda contar contigo necesitas aprender a **coordinarte con ellos** — y la forma de coordinarte es darles la instrucción correcta con el contexto correcto. Eso es prompt engineering. El curso es tu onboarding.

## Cómo se usa este doc

- Cada step de contenido se escribe **desde la perspectiva de un personaje de la crew** (o sobre cómo dirigirte a uno).
- Los nombres y el frame son el lore; **el tono es básico, profesional, ligeramente cálido**. Sin slang fuerte. Sin tono militar duro. Más cerca de Wall-E + The Bear que de Star Trek.
- Los ejemplos de prompt en los MDX deben tratar tareas creíbles del día a día de la crew: presentarte a un compañero, pedirle a Echo que verifique algo, mandar un parte al capitán, etc.
- **Setting intencionalmente vago**: usar "a bordo", "la crew", "el puesto" — evitar comprometerse con nave/estación/depósito. Eso permite que el visual evolucione.
- Cuando se introduce un personaje nuevo se hace explícito en el primer step donde aparece.

## Personajes

### Vega — primera oficial / mentor

- **Rol pedagógico**: mentor inicial. Es a quien el alumno encuentra primero. Le enseña cómo se comunica la crew y cómo se da una instrucción que no se malinterprete.
- **Personalidad**: paciente, directa. Le importa que aprendas; no se irrita con preguntas básicas.
- **Aparece en**: Track 1 desde el primer step. Es la voz por defecto del onboarding.
- **Visual**: chasis humanoide funcional, insignia "VEGA" en el pecho, ojos LED suaves.

### Atlas — capitán

- **Rol pedagógico**: figura de autoridad. No tolera prompts mal estructurados; cuando le hablas, todo tiene que estar en su sitio (rol, contexto, formato). Aparece como el "examen" final del Track 1.
- **Personalidad**: cortante, eficiente, escasas palabras. Cada interacción con Atlas se siente como un debrief formal.
- **Aparece en**: capstones de Track 1 y como evaluador implícito en Tracks avanzados.
- **Visual**: más alto, charreteras de capitán, una insignia dorada de mando en el hombro.

### Echo — quartermaster / verificador

- **Rol pedagógico**: chequea identidad y datos. Sirve para steps donde el LLM debe extraer/validar datos estructurados (output JSON con schema, has-keys, etc.). Habla en checklists.
- **Personalidad**: metódica, casi burocrática. Le encantan los formatos limpios.
- **Aparece en**: Track 1 (steps de output estructurado) y como "QA agent" en Track 4.
- **Visual**: visor LED horizontal que escanea, brazo derecho con scanner integrado, chasis más limpio que el resto.

### Forge — chief engineer (Track 3+)

- **Rol pedagógico**: el ingeniero de la crew. Construye y mantiene los tools/MCPs que usa el equipo. Aparece cuando el alumno trabaja con tool descriptions, schemas, handlers.
- **Personalidad**: nerd, le encanta explicar cómo funcionan las cosas por dentro.
- **Aparece en**: Track 3 desde el primer step.
- **Visual**: brazos articulados con destornilladores integrados, panel abierto en el pecho mostrando cables.

### Personajes futuros

Se inventan según se necesiten — un negociador para Track 2 (conversaciones multi-turn), un planificador para Track 4 (chains/agentes), etc. Mantener el principio: **un personaje por arquetipo de habilidad**, no por capricho.

## Reglas de escritura

1. **El alumno es siempre el "tú"**: está a bordo, no hablando en tercera persona.
2. **Los personajes hablan como personajes** dentro de los ejemplos de prompt (rol, contexto, ejemplos del frontmatter), pero **el cuerpo del MDX explicativo es voz neutra del autor del curso**.
3. **El nombre del personaje en MDX se marca** con `<Character name="vega" />` (componente ya construido). Renderiza en oro con tracking.
4. **El destino narrativo del Track 1**: al terminar, Atlas reconoce tu primer parte bien hecho y te asigna a turnos regulares. Quedas dentro de la crew "en periodo de prueba" hasta Track 2.
