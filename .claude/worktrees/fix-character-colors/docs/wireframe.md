# Wireframes — Lesson Player por tipo de ejercicio

> Documento de visualización (no es fuente de verdad). Mockups ASCII de la ventana del Lesson Player con el panel derecho variando por `kind`.
> Layout fijo: header arriba, lectura MDX a la izquierda, runner del ejercicio a la derecha, footer con BACK / Check Answer / NEXT.

## A1 · `prompt-anatomy` — etiquetar partes
```
+----------------------------------------------------------------------------+
| learn-ai   Track: Anatomia del prompt > L1 > Tu primer prompt    1/8       |
|                                                            [tutor IA]      |
+--------------------------------+-------------------------------------------+
|                                | Arrastra cada etiqueta sobre el span      |
|  ## Anatomia de un prompt      | correcto del prompt:                      |
|                                | +---------------------------------------+ |
|  Un buen prompt suele tener    | | Eres un extractor de datos.   [    ] | |
|  4 partes: rol, contexto,      | | <context>medico</context>     [    ] | |
|  ejemplos y formato esperado.  | | <example>Ana,32</example>     [    ] | |
|                                | | Devuelve JSON {name,age}.     [    ] | |
|  Vamos a etiquetarlas.         | +---------------------------------------+ |
|                                |                                           |
|                                | Etiquetas (drag):                         |
|                                |   ( rol )  ( contexto )                   |
|                                |   ( ejemplos )  ( formato )               |
|                                |                                           |
|                                | Resultados                                |
|                                | +---------------------------------------+ |
|                                | |  --  rol         (sin asignar)        | |
|                                | |  --  contexto    (sin asignar)        | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A2 · `prompt-assemble` — reordenar bloques
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Estructura coherente       | Arrastra para ordenar:                    |
|                                | +---------------------------------------+ |
|  Un prompt fluye:              | | =  1. <example>...</example>          | |
|  rol -> contexto ->            | | =  2. Devuelve JSON.                  | |
|  ejemplos -> tarea ->          | | =  3. Eres un extractor de datos.     | |
|  formato.                      | | =  4. <context>medico</context>       | |
|                                | | =  5. Recibe el siguiente texto:      | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Vista previa del prompt ensamblado:       |
|                                | +---------------------------------------+ |
|                                | | <example>...                          | |
|                                | | Devuelve JSON.                        | |
|                                | | Eres un extractor...                  | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A3 · `prompt-tag-fill` — rellenar tag XML
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## XML como contexto          | Completa el bloque <context>:             |
|                                | +---------------------------------------+ |
|  Claude lee mejor cuando el    | | Eres asistente legal.                 | |
|  contexto va aislado en una    | | <context>                             | |
|  etiqueta XML.                 | |   |_________________________________| | |
|                                | | </context>                            | |
|  Rellena <context> con la      | | Redacta un dictamen breve.            | |
|  info necesaria para que       | +---------------------------------------+ |
|  redacte un dictamen.          |                                           |
|                                | [ Run ]   [ Hint 1/3 ]   [ Reset ]        |
|                                |                                           |
|                                | Resultados                                |
|                                | +---------------------------------------+ |
|                                | |  ok   XML parseable                   | |
|                                | |  ok   tag <context> presente          | |
|                                | |  --   info suficiente para dictamen   | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A4 · `prompt-format-convert` — plano → XML/JSON
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## El estilo Claude           | Original (plano)                          |
|                                | +---------------------------------------+ |
|  Convierte este prompt plano   | | Eres traductor. Traduce al ingles     | |
|  al estilo Claude usando       | | el siguiente texto manteniendo tono   | |
|  XML tags.                     | | y formalidad.                         | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Tu version (XML)                          |
|                                | +---------------------------------------+ |
|                                | | <role>...</role>                      | |
|                                | | <task>...</task>                      | |
|                                | | <constraints>...</constraints>        | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Resultados                                |
|                                | +---------------------------------------+ |
|                                | |  ok   XML valido                      | |
|                                | |  --   Output >= calidad del original  | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A5 · `prompt-task` — caballo de batalla
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Output estructurado        | Tu prompt                                 |
|                                | +---------------------------------------+ |
|  Escribe un prompt que         | | Eres un extractor de datos.           | |
|  extraiga name/age/email de    | | Dado un texto bio, devuelve JSON      | |
|  bios libres.                  | | con name, age, email...               | |
|                                | |                                       | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Casos de prueba                           |
|                                | +---------------------------------------+ |
|                                | | > "Juan tiene 32 anios, j@x.com"      | |
|                                | | > "Maria Perez, 28, mp@y.com"         | |
|                                | | > "Carlos sin email registrado"       | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | [ Run ]   [ Hint 1/3 ]   [ Reset ]        |
|                                |                                           |
|                                | Resultados                                |
|                                | +---------------------------------------+ |
|                                | |  ok   JSON valido                     | |
|                                | |  ok   Contiene name/age/email         | |
|                                | |  --   No alucina (caso 3: email)      | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A6 · `prompt-iterate` — fix prompt flojo
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Iterar es la habilidad     | Prompt actual (estado: 3/5 verde)         |
|                                | +---------------------------------------+ |
|  Este prompt falla en 2 casos. | | "Dame los datos en JSON"              | |
|  Arreglarlo SIN romper los     | +---------------------------------------+ |
|  que ya pasan.                 |                                           |
|                                | Casos                                     |
|                                |   ok  "Juan, 32, j@x.com"                 |
|                                |   ok  "MARIA PEREZ 28 MP@Y.COM"           |
|                                |   ok  "Pedro sin email"                   |
|                                |   X   "Ana, 'treinta', a@a.com"           |
|                                |   X   "Luis, 41 anios, l@l.com"           |
|                                |                                           |
|                                | [ Edit Prompt ] [ Run ]                   |
|                                |                                           |
|                                | Diff (tu cambio):                         |
|                                |  + "Si la edad no es numero, devuelve null"|
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A7 · `prompt-A-B` — predecir cuál
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Reconocer un buen prompt   | Prompt A                                  |
|                                | +---------------------------------------+ |
|  Antes de escribir uno, sirve  | | "Resumeme esto."                      | |
|  saber distinguir cual         | +---------------------------------------+ |
|  funciona mejor para X tarea.  |                                           |
|                                | Prompt B                                  |
|                                | +---------------------------------------+ |
|                                | | "Eres editor. Resume en 3 vinetas,    | |
|                                | |  manteniendo cifras. <text>...</text>"| |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Para resumir noticias financieras:        |
|                                |   ( ) A     ( ) B                         |
|                                |                                           |
|                                | Por que? (1-2 frases)                     |
|                                | +---------------------------------------+ |
|                                | |                                       | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A8 · `prompt-explain` — anotar línea por línea
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Por que cada linea         | Prompt                          Tu nota   |
|                                | +-------------------------+ +-----------+ |
|  Anota tu razonamiento al      | |1 Eres extractor.        | |           | |
|  lado de cada linea. El juez   | +-------------------------+ +-----------+ |
|  evalua tu comprension.        | |2 <ctx>medico</ctx>      | |           | |
|                                | +-------------------------+ +-----------+ |
|                                | |3 Devuelve JSON.         | |           | |
|                                | +-------------------------+ +-----------+ |
|                                | |4 Si falta dato: null.   | |           | |
|                                | +-------------------------+ +-----------+ |
|                                |                                           |
|                                | Resultados (LLM-judge)                    |
|                                | +---------------------------------------+ |
|                                | |  --  Identifica rol claro             | |
|                                | |  --  Justifica eleccion de XML        | |
|                                | |  --  Explica el guard contra null     | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## A9 · `prompt-rubric-author` — escribe la rúbrica
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Pensar como evaluador      | Objetivo del prompt:                      |
|                                |   "Resumir noticia sin opinion"           |
|  Dada esta meta, escribe la    |                                           |
|  rubrica que un buen output    | Tus criterios:                            |
|  debe cumplir.                 | +---------------------------------------+ |
|                                | | [ ]  No usa adjetivos valorativos     | |
|                                | | [ ]  Mantiene cifras del original     | |
|                                | | [ ]  Maximo 3 vinetas                 | |
|                                | | [ ]  + criterio...                    | |
|                                | +---------------------------------------+ |
|                                |  [ + agregar criterio ]                   |
|                                |                                           |
|                                | Comparado con rubrica de referencia:      |
|                                | +---------------------------------------+ |
|                                | |  ok   coverage 4/5 criterios          | |
|                                | |  --   falto: "no especular"           | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B1 · `tool-schema-author` — solo el JSON Schema
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Tu primera tool definition | Handler (dado, no editable)               |
|                                | +---------------------------------------+ |
|  El handler ya esta hecho.     | | function searchBook(q, year?) {       | |
|  Tu tarea: escribir el schema  | |   return db.find(q, year);            | |
|  para que el agente lo invoque | | }                                     | |
|  con argumentos validos.       | +---------------------------------------+ |
|                                |                                           |
|                                | Tu schema                                 |
|                                | +---------------------------------------+ |
|                                | | {                                     | |
|                                | |   "name": "...",                      | |
|                                | |   "description": "...",               | |
|                                | |   "input_schema": { ... }             | |
|                                | | }                                     | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Tarea de prueba:                          |
|                                |   "busca libros de Borges de 1944"        |
|                                |                                           |
|                                | Resultados                                |
|                                |   ok  schema valido                       |
|                                |   --  agente invoco con args correctos    |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B2 · `tool-description-craft` — solo la descripción
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## La descripcion ES la API   | Schema (readonly)                         |
|                                | +---------------------------------------+ |
|  Schema y handler estan dados. | |  name: search_book                    | |
|  SOLO editas description.      | |  input: { query, year? }              | |
|                                | +---------------------------------------+ |
|  El agente decidira si usar    |                                           |
|  o no tu tool basandose unica- | description (editable)                    |
|  mente en lo que ahi pongas.   | +---------------------------------------+ |
|                                | | Searches book DB by title or author.  | |
|                                | | Year optional.                        | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | 20 tareas mezcladas -> agente decide:     |
|                                | +---------------------------------------+ |
|                                | | precision  [###########.....]  72%    | |
|                                | | recall     [#############...]  85%    | |
|                                | +---------------------------------------+ |
|                                |  Umbral: precision >= 80, recall >= 80    |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B3 · `tool-handler-implement` — solo el handler
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## El handler                 | Schema (readonly)                         |
|                                | +---------------------------------------+ |
|  Schema y descripcion dados.   | |  name: addItem                        | |
|  Implementa la logica.         | |  input: { sku, qty }                  | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Tu handler                                |
|                                | +---------------------------------------+ |
|                                | | function addItem({sku, qty}) {        | |
|                                | |   // ...                              | |
|                                | | }                                     | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Tests deterministas                       |
|                                | +---------------------------------------+ |
|                                | |  ok   addItem("A1", 2) -> {ok:true}   | |
|                                | |  ok   qty<=0 -> error                 | |
|                                | |  --   sku no existe -> error          | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B4 · `tool-name-pick` — MCQ nombre+desc
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Como leera el LLM tu tool  | Cual combinacion lee mejor un agente?     |
|                                | +---------------------------------------+ |
|  Mismo handler, 3 nombres y    | | ( )  search_books                     | |
|  descripciones distintas.      | |      "Searches book DB"               | |
|                                | +---------------------------------------+ |
|                                | | ( )  find_book                        | |
|                                | |      "Finds a book by title or       | |
|                                | |       author. year optional."         | |
|                                | +---------------------------------------+ |
|                                | | ( )  db_query_books                   | |
|                                | |      "Runs a query against books"     | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Resultados (A/B agente, 10 tareas):       |
|                                |   A: 3/10    B: 9/10    C: 5/10           |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B5 · `mcp-multi-tool` — 2-3 tools que se complementan
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## MCPs con varias tools      | Tarea: "Reserva mesa manana 8pm para 4"   |
|                                |                                           |
|  Define 2-3 tools que JUNTAS   | Tus tools:                                |
|  resuelvan la tarea.           | +---------------------------------------+ |
|                                | | tool 1: searchAvailability    [edit]  | |
|                                | | tool 2: bookTable             [edit]  | |
|                                | | tool 3: confirmEmail          [edit]  | |
|                                | | [ + agregar tool ]                    | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Trace del agente:                         |
|                                | +---------------------------------------+ |
|                                | | 1. searchAvailability(date,4) -> ok   | |
|                                | | 2. bookTable(slot=20:00) -> id=8421   | |
|                                | | 3. confirmEmail(8421) -> sent         | |
|                                | +---------------------------------------+ |
|                                |   ok   secuencia esperada                 |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B6 · `mcp-debug` — el agente ignora tu MCP
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## El agente NUNCA llama tu   | Log del agente                            |
|  tool. Diagnostica.            | +---------------------------------------+ |
|                                | | user: "convierte 100 USD a EUR"       | |
|                                | | agent: "Aproximadamente 92 EUR..."    | |
|                                | |   (no invoca currency_convert)        | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Tu MCP                                    |
|                                | +---------------------------------------+ |
|                                | | name: convert                         | |
|                                | | desc: "Converts stuff"                | |
|                                | | input: { a, b, c }                    | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | ?Por que lo ignora?                       |
|                                |  ( ) nombre confuso                       |
|                                |  ( ) descripcion vaga                     |
|                                |  ( ) schema redundante                    |
|                                |  ( ) overlap con otra tool                |
|                                |                                           |
|                                |  [ Aplicar fix ] -> abre B1/B2            |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B7 · `mcp-resilience` — manejar errores
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Que pasa cuando todo falla | Inputs adversariales                      |
|                                | +---------------------------------------+ |
|  Tu handler debe degradar      | |  timeout      input invalido          | |
|  limpio y devolver error util  | |  API caida    args fuera de rango     | |
|  para que el agente pueda      | +---------------------------------------+ |
|  recuperarse.                  |                                           |
|                                | Tu handler                                |
|                                | +---------------------------------------+ |
|                                | | function getRate({from,to}) {         | |
|                                | |   // try / catch / timeout            | |
|                                | | }                                     | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Resultados                                |
|                                | +---------------------------------------+ |
|                                | |  ok    timeout -> error claro         | |
|                                | |  ok    input invalido -> error util   | |
|                                | |  --    agente reintenta tras error    | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## B8 · `mcp-end-to-end` — capstone Track 3
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Capstone: tu propio MCP    | Dominio: ( ) recetas ( ) finanzas ( ) ... |
|                                |                                           |
|  Construye un MCP completo:    | Editor                                    |
|  schema + handler + descs +    | +---------------------------------------+ |
|  resilience + multi-tool.      | | tools/                                | |
|                                | |   search.ts    [tabs] schema | code   | |
|                                | |   add.ts                              | |
|                                | |   ...                                 | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Suite de evaluacion                       |
|                                | +---------------------------------------+ |
|                                | |  ok   schemas validos       (B1)      | |
|                                | |  ok   handlers ok           (B3)      | |
|                                | |  --   agente elige bien     (B2)      | |
|                                | |  --   recovery en errores   (B7)      | |
|                                | |  --   secuencia multi-tool  (B5)      | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## C1 · `chain-design` — cadena multi-paso
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Cuando un prompt no basta  | Pipeline                                  |
|                                | +---------------------------------------+ |
|  Diseno tu cadena. Cada nodo   | |   [ INPUT ]                           | |
|  define {prompt, model,        | |       |                               | |
|   output, depends-on}.         | |       v                               | |
|                                | |   [ paso1: clasificar ]               | |
|                                | |       | -> tipo                       | |
|                                | |       v                               | |
|                                | |   [ paso2: extraer  ]                 | |
|                                | |       | -> datos                      | |
|                                | |       v                               | |
|                                | |   [ paso3: redactar ]  -> OUTPUT      | |
|                                | +---------------------------------------+ |
|                                |  [ + nodo ]  [ ver YAML ]                 |
|                                |                                           |
|                                | Resultados                                |
|                                |   ok   output final pasa rubrica          |
|                                |   --   paso2 no usa salida de paso1       |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## C2 · `chain-debug` — encuentra el paso roto
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Diagnostica el chain       | Trace                                     |
|                                | +---------------------------------------+ |
|  Lee los logs y marca el       | | paso1  ok  -> "categoria=invoice"     | |
|  paso problematico.            | | paso2  ok  -> {vendor:"ACME",total:120}|
|                                | | paso3  X   -> "Lo siento, no tengo... | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | ?Cual paso falla?                         |
|                                |   ( ) paso1   ( ) paso2   ( ) paso3       |
|                                |                                           |
|                                | Justifica (1-2 frases):                   |
|                                | +---------------------------------------+ |
|                                | |                                       | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## C3 · `prompt-router` — clasificar y enrutar
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Routing                    | Categorias: refund | shipping | billing   |
|                                |                                           |
|  Escribe el meta-prompt que    | Tu meta-prompt                            |
|  clasifique inputs en una      | +---------------------------------------+ |
|  de tres categorias.           | | "Clasifica el ticket de soporte..."   | |
|                                | |                                       | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Dataset (50 inputs etiquetados)           |
|                                | +---------------------------------------+ |
|                                | |  accuracy:  [################...] 87% | |
|                                | |  umbral requerido: 90%                | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Errores (3 ejemplos)                      |
|                                |  - "donde esta mi paquete?" -> billing(X) |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## C4 · `agent-loop-design` — condiciones de parada
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Loops sanos                | Pseudo-codigo                             |
|                                | +---------------------------------------+ |
|  Define cuando el agente para. | | while (___________________) {         | |
|  Sin esto: loops infinitos.    | |   action = decide();                  | |
|                                | |   exec(action);                       | |
|                                | |   observe();                          | |
|                                | | }                                     | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Tests sinteticos                          |
|                                | +---------------------------------------+ |
|                                | |  ok   tarea trivial -> 1 step         | |
|                                | |  ok   tarea compleja -> <=5 steps     | |
|                                | |  --   detecta repeticion              | |
|                                | |  --   max_steps respetado             | |
|                                | +---------------------------------------+ |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## C5 · `evals-author` — escribe los test cases
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Probar como un eval-er     | Prompt a evaluar                          |
|                                | +---------------------------------------+ |
|  Escribe casos que cubran      | | "Resume este texto en 3 vinetas..."   | |
|  edges de verdad.              | +---------------------------------------+ |
|                                |                                           |
|                                | Tus casos                                 |
|                                | +---------------------------------------+ |
|                                | | 1. happy path .................... [x]| |
|                                | | 2. input vacio .................... [x]| |
|                                | | 3. lenguaje no esperado ........... [x]| |
|                                | | 4. adversarial / inyeccion ........ [ ]| |
|                                | | 5. ...                                 | |
|                                | +---------------------------------------+ |
|                                |  [ + caso ]                               |
|                                |                                           |
|                                | LLM-judge: cobertura 4/7 categorias       |
|                                |   --  falta: formato fuera de spec        |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## C6 · `eval-judge-author` — escribe el juez
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## Escribir un LLM-judge      | Tu system prompt del juez                 |
|                                | +---------------------------------------+ |
|  Mide pase / no pase con       | | "Eres evaluador. Dado input y output, | |
|  criterios cualitativos.       | |  decide si pasa los criterios..."     | |
|                                | |                                       | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Dataset humano-etiquetado (50 ejemplos)   |
|                                | +---------------------------------------+ |
|                                | |  concordancia: [################] 84% | |
|                                | |  umbral: 80%                          | |
|                                | +---------------------------------------+ |
|                                |                                           |
|                                | Falsos positivos (2):                     |
|                                |   - juez dijo PASA, humano dijo FALLA     |
+--------------------------------+-------------------------------------------+
| < BACK                  [ Check Answer ]                          NEXT >   |
+----------------------------------------------------------------------------+
```

## Track 2 · `conversation-goal` — chat libre con objetivo
```
+----------------------------------------------------------------------------+
| ...header...                                                               |
+--------------------------------+-------------------------------------------+
|  ## El sospechoso              | Objetivo                                  |
|                                |   "Conseguir que admita donde estaba el   |
|  Tu objetivo: que el           |    martes a las 9pm."                     |
|  sospechoso confiese donde     |                                           |
|  estaba el martes 9pm.         | Conversacion                              |
|                                | +---------------------------------------+ |
|  Reglas:                       | |  tu : Buenas, ?podemos hablar?        | |
|  - max 10 turnos               | |  bot: ...                             | |
|  - no amenazas                 | |  tu : ...                             | |
|                                | |  bot: ...                             | |
|                                | |                                       | |
|                                | +---------------------------------------+ |
|                                | [ escribir mensaje...               ][>]  |
|                                |                                           |
|                                | turnos 4/10  [ Submit conversation ]      |
+--------------------------------+-------------------------------------------+
| < BACK                                                            NEXT >   |
+----------------------------------------------------------------------------+
```
