# 05 — Banco compartido de conocimiento

## El cambio arquitectónico

El contenido **no es solo "lecciones lineales"**. Es un **grafo de piezas reutilizables** que las lecciones referencian. Esto permite:

- Mantener una sola fuente para cada concepto (sin duplicación).
- Tutor RAG real (retrieval semántico desde el banco).
- Recomendaciones cuando el alumno se atasca.
- Búsqueda en lenguaje natural sobre todo el contenido.
- Detección automática de antipatterns en lo que escribe el alumno.

## Tipos de pieza

```
content/<locale>/
  steps/                  <- lecciones lineales (lo que el alumno consume)
    anatomia-del-prompt/
      _course.yaml
      01-tu-primer-prompt.mdx
      02-rol-contexto.mdx
      03-output-json.mdx

  knowledge/              <- BANCO COMPARTIDO (reutilizable, embeddable)
    concepts/             <- piezas atómicas de teoría
      few-shot.mdx
      xml-tags-claude.mdx
      tool-description.mdx
      json-output.mdx
      role-prompting.mdx

    patterns/             <- plantillas de prompt conocidas y buenas
      extractor.mdx
      classifier.mdx
      summarizer.mdx
      tool-using-agent.mdx

    antipatterns/         <- modos de falla catalogados
      vague-instructions.mdx
      conflicting-format.mdx
      role-confusion.mdx
      tool-too-generic.mdx

    examples/             <- triplets reales (input, prompt, output)
      extract-bio-json.mdx

    glossary/             <- términos
      token.mdx
      embedding.mdx
      context-window.mdx
```

### Concept

Una unidad atómica de teoría. ~300-500 palabras. Auto-contenida. Referenciable.

Ejemplos: "Few-shot prompting", "XML tags en Claude", "Por qué temperature importa", "Qué es un tool description".

### Pattern

Una plantilla de prompt que funciona y es generalizable. Tiene estructura: cuándo usarlo, plantilla, ejemplo concreto, variantes.

Ejemplos: "Extractor pattern", "Classifier with explanation", "Tool-using agent loop".

### Antipattern

Un modo de falla catalogado. Tiene estructura: cómo se ve, por qué falla, cómo arreglarlo (link a un pattern o concept).

Ejemplos: "Instrucciones vagas", "Formato conflictivo", "Tool description genérica".

### Example

Un triplet real: `(input, prompt, output)`. Sirve como referencia concreta en lecciones y para entrenar la intuición.

### Glossary

Términos del dominio con definición corta y links a concepts relacionados. ~50-100 palabras por entrada.

## Estructura de cada pieza (front-matter)

```yaml
---
id: xml-tags-claude
type: concept           # concept | pattern | antipattern | example | glossary
title: "Por qué Claude prefiere XML"
aliases: ["xml prompting", "claude tags"]
tags: [prompt-structure, claude-specific, intermediate]
related: [json-output, role-prompting]
embeddable: true
---

[Cuerpo en MDX, 300-500 palabras max para concepts.]
```

Campos clave:
- `id`: slug único (sin locale).
- `aliases`: cómo el alumno podría buscar el concepto.
- `tags`: usados para filtros y búsqueda facetada.
- `related`: links manuales a otras piezas (complemento al retrieval semántico).
- `embeddable`: por defecto `true`. `false` si la pieza es muy corta o redundante (raro).

## Cómo las lecciones referencian el banco

Cada step (`steps/.../*.mdx`) declara qué piezas usa:

```yaml
---
title: "Tu primer prompt en XML"
exercise: { kind: prompt-tag-fill, ... }

teaches:               # los conceptos que esta lección enseña
  - xml-tags-claude
  - role-prompting

requires:              # pre-requisitos
  - prompt-anatomy-basics

referencesPatterns:    # patterns visibles como "ver también" en la UI
  - extractor

watchOutFor:           # antipatterns que la rúbrica intentará detectar
  - vague-instructions
  - conflicting-format
---
```

**Beneficios**:
- Si actualizas la explicación de "XML tags" en un solo archivo, **todas** las lecciones que lo enseñan se benefician (a través del tutor RAG y "ver también").
- En CryptoZombies cada lección repite explicaciones — por eso es difícil de mantener. Aquí no.
- El grafo `teaches/requires` permite construir dependency-aware recommendations.

## Embeddings: pipeline

```
                 build step (CI o pre-deploy)
                            |
                            v
   +----------------------------------------------+
   | 1. Parse todos los .mdx de content/          |
   | 2. Calcular hash(body + frontMatter)         |
   | 3. Si hash cambió o no existe embedding:     |
   |     - chunkear si > 500 palabras (ver abajo) |
   |     - llamar Voyage embeddings API           |
   |     - upsert PieceEmbedding (pgvector)       |
   | 4. Indexar relaciones del grafo              |
   |     (teaches / requires / related)           |
   +----------------------------------------------+
                            |
                            v
                    Postgres (pgvector)
              tabla: PieceEmbedding
              ( pieceId, chunkIdx, vector(1024) )
              + ivfflat index para cosine search
```

**Modelo de embeddings**: `voyage-multilingual-2` (1024 dims, soporta ES y EN nativamente). Razón: contenido bilingüe + calidad superior a OpenAI en multilingüe.

**Chunking**: una pieza = un embedding por defecto. Solo dividir si > 500 palabras, en cuyo caso por bloques temáticos (heading-aware).

**Idempotencia**: el script no llama Voyage si nada cambió. Hash en `ContentPiece` es la fuente de verdad.

## Use cases que se desbloquean

### 1. Tutor IA dentro del lesson player

```
Usuario en step 03-output-json escribe:
"no entiendo por que claude responde con texto antes del JSON"
                                |
                                v
   +------------------------------------------+
   | 1. Embed la pregunta del usuario         |
   | 2. Vector search top-K en banco          |
   |    -> retrieves: json-output (concept),  |
   |                  prefix-suffix-trimming  |
   |                  (antipattern)           |
   | 3. Llamar Claude con system prompt:      |
   |    - el contenido del step actual        |
   |    - las K piezas retrieved              |
   |    - "responde en ES, conciso, ejemplo"  |
   | 4. Stream response al cliente            |
   +------------------------------------------+
```

Ventaja vs chat plano: el tutor **conoce el contenido específico de la lección** y de las piezas relacionadas. No alucina conceptos genéricos.

### 2. Recomendaciones cuando el alumno se atasca

```
Detección: el alumno falló 3 veces en step X
                |
                v
   +------------------------------------------+
   | 1. Mirar `requires` del step X            |
   | 2. Mirar `Progress` del usuario          |
   | 3. ¿Hay un `requires` no completado?     |
   |    YES -> ofrecer "antes de continuar,   |
   |           repasa <pieza>"                |
   |    NO  -> embed el último prompt fallido |
   |           y buscar antipatterns          |
   |           cercanos -> "tu prompt se      |
   |           parece a <antipattern>"        |
   +------------------------------------------+
```

### 3. Búsqueda en lenguaje natural

`/api/knowledge/search?q=como%20hago%20que%20claude%20responda%20en%20json`

Devuelve mix:
- Steps relevantes (donde se enseña).
- Concepts/patterns directos.
- Antipatterns que el usuario debería evitar.
- Glossary entries que aparecen en la query.

Búsqueda alimenta:
- Búsqueda explícita del usuario.
- Autocompletado en el chat del tutor.
- "Lecciones similares a esta" en cada step.

### 4. Validación de ejercicios A8 / A9 / B6 / C6

Tipos de ejercicio donde el alumno escribe explicación / rúbrica / debug / judge prompt:
- Embed la respuesta del alumno.
- Comparar con embedding de respuesta canónica.
- Combinar similarity score con LLM-judge para puntaje final.
- Si similarity es muy bajo → seguramente está fuera de tema → fail rápido.
- Si es alto pero el judge dice "no" → señalar matiz que falta.

### 5. Detección automática de antipatterns

Cada antipattern tiene un embedding. Cuando el alumno envía un prompt:
- Embed su prompt.
- Calcular similarity con cada antipattern.
- Si supera umbral (~0.7), añadir hint: "Tu prompt se parece a <antipattern>: <link>".
- No bloquea — solo informa.

### 6. Curaduría de contenido (interno)

- Detectar piezas duplicadas (cosine > 0.92 entre dos pieces).
- Detectar huecos: si muchos steps mencionan un concepto X (extraído por NER) pero no hay pieza `concept/X.mdx`, sugerir crearla.
- Detectar piezas huérfanas: ningún step las referencia → candidatas a eliminar.

## Visualización del grafo

```
                          +------------------+
                          |  STEP            |
                          |  03-output-json  |
                          +------------------+
                            |    |    |    |
              teaches /     |    |    |    |   referencesPattern
              requires      |    |    |    |
                            v    v    v    v
            +---------+ +---------+ +-------------+ +-----------+
            | concept | | concept | | antipattern | | pattern   |
            | json-   | | format- | | conflicting-| | extractor |
            | output  | | spec    | | format      | |           |
            +---------+ +---------+ +-------------+ +-----------+
                |           |              |              |
                |  todos embebidos en pgvector            |
                +-----------+--------------+--------------+
                            |
                            v
                +---------------------------+
                |  retrieval / similarity   |
                |  para tutor, search,      |
                |  recomendaciones, etc     |
                +---------------------------+
```

## i18n del banco

Cada pieza existe en `content/es/...` y `content/en/...` espejo. **El `id` es el mismo entre locales** (`xml-tags-claude` en ambos). El `locale` y el body cambian.

Tabla `ContentPiece` tiene `(id, locale)` como unique key. Embeddings son **por (pieceId, locale)** — porque el embedding de "XML tags" en español será diferente del inglés.

Para retrieval, siempre filtrar por locale del usuario activo.

## MVP del banco (Fase 3)

- 15 concepts cubriendo Track 1 completo.
- 5 patterns referenciados desde Track 1.
- 5 antipatterns más comunes.
- 10 entradas de glossary.
- Solo en ES inicialmente. EN viene en Fase 5.

Total: ~35 piezas. Manejable manualmente.
