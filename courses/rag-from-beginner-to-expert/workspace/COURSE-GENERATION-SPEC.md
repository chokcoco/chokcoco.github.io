# RAG Course Generation Spec

This file records the current authoring rules for the course so later chapters can continue with the same style.

## Scope

- Course: `RAG 从入门到精通`.
- Audience: zero-baseline learners or learners with light programming exposure.
- Current confirmed scope: all 12 chapters are generated in the Narrative V3 style.
- Output path: `courses/rag-from-beginner-to-expert/`.
- Legacy top-level `lessons/`, `reference/`, and `markdown/` outputs are retired. Do not generate new course files there.
- Top-level `index.html` is the static course management and browsing entry for GitHub Pages.

## Narrative V3 Chapter Shape

Each chapter should read like a taught lesson, not a generated outline.

1. Opening: introduce the chapter question in plain language. It may connect to the previous chapter.
2. Goals: keep 2-4 compact learning goals.
3. Diagram: use Mermaid flowchart/sequence/architecture diagrams where a visual helps.
4. Knowledge points: use What / Why / How as an internal writing checklist, but do not repeatedly expose those labels to learners. Student-facing headings and paragraphs should read like a human-written lesson: define the concept before using it, explain the problem that caused it to appear, describe how it works in a concrete system, then place it in a business case and name one likely wrong mental model.
5. Focus topics: expand 1-2 important details enough that the learner can reason with them. Do not show a generic heading such as `细节展开`; use the actual topic title directly.
6. Code or pseudocode: optional. Include it only when it clarifies the chapter. Use JavaScript and Java when included.
7. Common misconceptions: keep them near the end so learners can correct false mental models after learning the core ideas.
8. Chapter summary: place it after common misconceptions and before quick checks. It should summarize the whole chapter, echo the opening question, and leave a hook for the next chapter. Vary the title and form; avoid a fixed template such as `本章回收` in every chapter.
9. Quick checks and practice: update them to match the richer knowledge points.

## Focus Topic Requirements

Each focus topic should be a mini technical article inside the chapter.

- Start from a concrete problem, then explain the cause and solution.
- Use What / Why / How as the hidden reasoning spine when a topic introduces a reusable concept, but avoid student-facing headings such as `What：...`, `Why：...`, `How：...` in every topic. Occasional explicit labels are acceptable only when they serve the prose.
- Add one visual aid when it improves understanding: Mermaid flowchart, sequence diagram, architecture diagram, or comparison table.
- Add code or pseudocode only when it makes the idea more precise.
- End with a `Takeaway` that compresses the topic into one durable idea.
- Prefer actionable frameworks, decision tables, and checklists over long abstract paragraphs.

## Tone

- Prefer concrete cases over abstract claims.
- Avoid repeating the same paragraph + bullet pattern everywhere.
- Avoid visible bulk-generation patterns. Section titles should be topic-specific and natural; short conversational phrases are welcome when they make the lesson feel authored rather than assembled.
- Avoid AI-flavored filler such as broad promises, generic transitions, or empty summaries.
- Use terms only after definition. Mark reusable terms with `[[term]]` so the HTML tooltip can explain them.
- Follow the reader-first rule from `MISSION.md`: use low-difficulty explanations, build background before jargon, and keep the path `problem -> cause -> solution -> summary`.
- When using technical comparisons, use tables so learners can scan the tradeoffs quickly.

## Visuals

- Prefer Mermaid for process, architecture, and sequence diagrams.
- Keep old card-based flow diagrams available for simple references.
- Do not style all descendant `span` elements in flow cards. Step badges must use `.step-number`; terminology annotations use `.term`.

## Code Highlighting

- HTML pages load Highlight.js from CDN when available.
- `courses/<course-slug>/assets/code-highlight.js` provides a local fallback so JavaScript and Java snippets still show visible syntax colors if CDN loading fails.
- Code blocks must use language classes such as `language-javascript` and `language-java`.
- `pre code` must not receive an extra white background.

## Multi-Course Directory Rules

- Each course owns its own `lessons/`, `reference/`, `markdown/`, `assets/`, and `workspace/` directories under `courses/<course-slug>/`.
- Course-specific mission, resources, glossary, notes, and preparation files should be copied or maintained under the course workspace.
- Shared platform files live at the repo root: `index.html`, `catalog.json`, `assets/app.css`, `README.md`, and `AGENTS.md`.
- The generated site must work as static files and be suitable for GitHub Pages.

## Acceptance Checklist

- The chapter can be understood without programming background.
- Every non-obvious term is defined or annotated.
- The diagram renders or remains readable as source text if Mermaid fails.
- Code appears only where it helps.
- Focus topics are substantial enough to stand alone as mini-lessons.
- Quick self-test questions match the actual chapter content.
- Practice task asks the learner to produce a small artifact, not just reread the text.
