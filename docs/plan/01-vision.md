# 01 — Visión

## Pitch en una línea

Una plataforma **interactiva y gamificada** donde el alumno **lee a la izquierda y practica a la derecha**, igual que CryptoZombies, pero (a) cubre **IA aplicada y programación básica**, y (b) la propia IA forma parte del producto — como tutor, evaluador y compañero de práctica (al estilo Claude Artifacts / ChatGPT Canvas).

## Frame narrativo: The Crew

Lo que une todo el contenido es una historia: **the crew**, una pequeña tripulación de robots humanoides a la que el alumno se une como nuevo miembro. La iniciación es el onboarding: aprender a coordinarte con cada compañero — y la forma de coordinarte es con prompts estructurados. Cada miembro tiene una especialidad (capitán, mentor, verificador, ingeniero). Personajes y voz definidos en `cast.md`. Es el equivalente al "ejército de zombies" de CryptoZombies.

## Por qué este producto

Hoy aprender IA aplicada (prompt engineering, MCPs, agentes) implica:

- Leer docs sueltas de Anthropic / OpenAI / proveedores.
- Mirar tutoriales en video sin práctica integrada.
- Probar prompts en playgrounds que no enseñan principios.
- O hacer cursos lineales tipo "video + slides" sin feedback.

**Lo que falta**: práctica deliberada con feedback inmediato, en un solo lugar, con una progresión narrativa. CryptoZombies hizo esto para Solidity y enganchó a 400k usuarios. Nadie lo ha hecho bien para IA.

## Inspiraciones — análisis técnico real

### CryptoZombies — qué hace bien

**Estructura del contenido** (repo público `CryptozombiesHQ/cryptozombie-lessons`):

- Cada lección es una **carpeta numerada** (`en/1/`, `en/2/`, ...).
- Cada chapter es un **archivo Markdown con YAML front-matter**, no JSON, no DB.
- Los archivos se nombran por tema (`contracts.md`, `arrays.md`, ...).
- El front-matter contiene la metadata clave del ejercicio:

```yaml
---
title: "Contracts"
actions: ['checkAnswer', 'hints']
requireLogin: true
material:
  editor:
    language: sol
    startingCode: |
      pragma solidity //1. Enter solidity version here
      //2. Create contract here
  answer: |
    pragma solidity ^0.4.19;
    contract ZombieFactory {}
---
```

**Implicaciones**:
- El "ejercicio" vive en el mismo archivo que la teoría — no hay tabla `Exercise` separada.
- `startingCode` = lo que el alumno ve. `answer` = lo que se compara para validar.
- Validación: comparación AST/string contra `answer`. Estricta — solo acepta una forma estructural correcta. Por eso usuarios reportaban históricamente que soluciones alternativas correctas eran rechazadas.
- Multi-archivo: las pestañas (`zombieattack.sol`, `zombiefeeding.sol`, etc.) se logran extendiendo `material.editor` a un array, marcando algunos como `readOnly`. Esto permite acumular código entre chapters.
- i18n: misma estructura clonada por idioma (`en/1/contracts.md`, `es/1/contracts.md`). Crowdin gestiona traducciones.
- "Hints" se leen del propio archivo, configurables vía `actions: [hints]`.

**El loop real**:

```
Markdown con front-matter
    -> Renderer divide en (instrucciones | startingCode)
    -> Editor (Monaco/CodeMirror) cargado con startingCode
    -> Usuario edita -> "Check Answer" -> comparacion contra answer
    -> Si pasa: marca chapter completo, avanza a siguiente
```

**Sin sandbox de ejecución real.** Solidity casi nunca se compila en el navegador del alumno — la validación es estructural. Esto es importantísimo: **CryptoZombies casi no "ejecuta" código del alumno, solo lo valida**.

### Claude Artifacts — qué hace bien

Fuentes: [Reverse engineering Claude Artifacts](https://www.reidbarber.com/blog/reverse-engineering-claude-artifacts), [How Anthropic built Artifacts (Pragmatic Engineer)](https://newsletter.pragmaticengineer.com/p/how-anthropic-built-artifacts).

**Arquitectura**:
- El artifact se renderiza en un **iframe en otro origen** (`claudeusercontent.com`), no en `claude.ai`. Esto es **process isolation real** del navegador.
- El iframe contiene una app Next.js minimalista única en ese dominio.
- El padre (claude.ai) le pasa el código como **string** vía `window.postMessage()`.
- Dentro del iframe se compila ese string a un componente React en tiempo real usando **React Runner**.
- Estado de la UI: hooks normales (`useState`, etc.) viven dentro del iframe.

**Restricciones de seguridad (CSP)**:
- Whitelist de scripts: `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `unpkg.com`, `esm.sh`.
- `localStorage`, `sessionStorage`, `indexedDB` bloqueadas.
- Librerías pre-bundled: DOMPurify, React/ReactDOM, Tailwind, Radix, Lucide, react-hot-loader.
- Tipos soportados: HTML (sub-iframe), SVG, Mermaid, React component.

**El loop real**:

```
Modelo genera codigo -> string -> postMessage al iframe
  -> React Runner compila el string -> renderiza componente
  -> Usuario interactua en el iframe (estado vive ahi)
  -> Si el usuario pide cambios al modelo, regenera todo el codigo
     -> nuevo postMessage -> re-render (pierde estado a menos que se serialice)
```

**Insight clave**: Artifacts NO valida código contra una solución. Solo **renderiza UI viva**. La iteración la dirige el LLM.

### Qué tomamos de cada uno

**De CryptoZombies**:
1. Una sola fuente por step: archivo `.mdx` con front-matter que contiene `startingCode`, `answer`, `hints`, `actions`, `rubric`.
2. Multi-archivo en el editor desde el inicio del diseño.
3. i18n por carpeta espejo (`content/es/...`, `content/en/...`).
4. Validación determinista cuando aplica (estructura, schemas, JSON válido).
5. Layout izquierda/derecha + footer BACK / Check / NEXT.

**De Claude Artifacts**:
1. Iframe sandbox real con CSP para correr código JS/React del alumno (cuando llegue Fase 4).
2. `postMessage` para correr tests dentro del sandbox y devolver resultados al padre.
3. No persistir estado en el iframe — mantenerlo en el padre.
4. React Runner (o `sucrase` + `new Function`) para compilar JSX cuando lleguemos a ejercicios visuales.

## El diferenciador

CryptoZombies enseña Solidity con respuesta única. **Nuestra plataforma enseña IA, donde casi nada tiene respuesta única.** Por eso:

- El corazón del producto NO es un comparador de strings — es un **evaluador con rúbrica**.
- No validamos el prompt; validamos **lo que el prompt logra** (output contra criterios).
- La IA es a la vez **el tema** (qué se enseña) y **la herramienta** (cómo se evalúa, cómo se tutoriza).

## Audiencia

- **Primaria**: developers con experiencia básica de programación que quieren aprender IA aplicada de forma práctica. Saben qué es una API, no han construido un MCP.
- **Secundaria**: gente sin programación previa que quiere aprender IA — entran por el track puente de programación básica.
- **Terciaria**: developers senior que quieren un repaso estructurado de prompt engineering.

## Lo que NO somos

- No somos un curso teórico de ML / data science.
- No somos un IDE para producción.
- No somos un **playground sin curriculum** (i.e. una caja de texto pegada a un LLM, sin progresión, sin evaluación, sin objetivo). El sandbox que ofrecemos (Forge · Workbench) vive **dentro** del onboarding: lo desbloquea el curriculum, está atado a la voz de un miembro de la crew, y existe como espacio de exploración después de aprender un principio — no como sustituto del aprendizaje.
- No somos un agregador de cursos. Producimos contenido propio.
