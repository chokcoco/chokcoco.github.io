# AI Lab Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `index.art` into a responsive laboratory-magazine homepage with real course links while preserving its existing wave artwork and content.

**Architecture:** Keep the special `.art` file as a standalone HTML document. Replace the page-level fixed viewport layout with a scrollable document, preserve the existing SVG as an atmospheric fixed background layer, and place all new CSS and semantic content in the same document.

**Tech Stack:** Semantic HTML5, inline CSS, existing inline SVG, minimal inline JavaScript for no-dependency navigation behavior.

## Global Constraints

- Modify only `Playground/cocoai/index.art` for the live page.
- Keep all styles inline in the existing `<style>` element.
- Preserve the existing SVG wave and original copyright copy.
- Exclude the `fbs-fullstack-landing` course.
- Link only to courses with existing `index.html` pages.
- Keep the ICP area blank; do not invent a registration number or external filing link.
- Support desktop and mobile layouts, keyboard focus, and `prefers-reduced-motion`.

---

### Task 1: Replace the viewport shell and add the visual language

**Files:**
- Modify: `Playground/cocoai/index.art:14-126`

**Interfaces:**
- Consumes: existing `<style>` and `#g-wave` SVG markup.
- Produces: CSS custom properties and layout classes used by header, hero, learning path, course directory, and footer.

- [ ] **Step 1: Add a lightweight static structure check**

Run:

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('/Users/qi.qiao/Documents/Playground/cocoai/index.art','utf8'); for (const id of ['lab','path','courses','about']) if (!html.includes('id=\"'+id+'\"')) process.exitCode=1"
```

Expected: exits with status `1` before the new anchored sections exist.

- [ ] **Step 2: Replace the fixed body layout with a scrollable layout**

Implement:

```css
html { scroll-behavior: smooth; }
body {
  min-width: 320px;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #0d1716;
  color: #e8efec;
}
#g-wave { position: fixed; inset: 0; pointer-events: none; }
```

- [ ] **Step 3: Add a contained responsive grid and interaction states**

Implement:

```css
.site-shell { position: relative; z-index: 1; width: min(1180px, calc(100% - 48px)); margin: 0 auto; }
.course-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 14px; }
a:focus-visible { outline: 2px solid #9ce9d5; outline-offset: 4px; }
@media (max-width: 760px) { .site-shell { width: min(100% - 32px, 620px); } .course-grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
```

- [ ] **Step 4: Run the static structure check**

Run the command from Step 1 after Task 2 has been implemented.

Expected: exits with status `0`.

### Task 2: Build the header, hero, learning path, and about sections

**Files:**
- Modify: `Playground/cocoai/index.art:127-205`

**Interfaces:**
- Consumes: `.site-shell`, background, and focus styles from Task 1.
- Produces: anchor targets `#lab`, `#path`, `#courses`, `#about`; a four-tab navigation; readable primary actions.

- [ ] **Step 1: Add a semantic header with four single-line anchor tabs**

Implement:

```html
<header class="site-header">
  <a class="wordmark" href="#lab">恬齐网络AI思维实验室</a>
  <nav class="tab-nav" aria-label="主导航">
    <a href="#lab">实验室</a>
    <a href="#path">学习路径</a>
    <a href="#courses">课程</a>
    <a href="#about">关于</a>
  </nav>
</header>
```

- [ ] **Step 2: Add a concise first-screen hero and preserve the original welcome sentence**

Implement a `main` section with `id="lab"` that includes the original text `Welcome to Coco’s home, 也许你想去` as a small line, one H1, one short description under 20 Chinese words, and two links: one to `#courses`, one to `#path`.

- [ ] **Step 3: Add non-card learning-path and about content**

Implement:

```html
<section id="path" class="path-section" aria-labelledby="path-title">
  <h2 id="path-title">从理解，到构建，到可靠交付。</h2>
  <ol class="path-list">
    <li><span>01</span><strong>建立坐标</strong><p>理解模型、检索、工作流与智能体的边界。</p></li>
    <li><span>02</span><strong>搭建系统</strong><p>把知识、工具、上下文和接口组织成可运行的系统。</p></li>
    <li><span>03</span><strong>验证实践</strong><p>用测试、评测和真实项目让学习真正留下来。</p></li>
  </ol>
</section>
```

Add an `id="about"` section explaining the site’s focus on AI thought, verifiable engineering, and long-term learning.

- [ ] **Step 4: Verify anchors and heading order**

Run:

```bash
node -e "const fs=require('fs'); const h=fs.readFileSync('/Users/qi.qiao/Documents/Playground/cocoai/index.art','utf8'); const ids=['lab','path','courses','about']; if (!ids.every(id=>h.includes('id=\"'+id+'\"')) || (h.match(/<h1/g)||[]).length!==1) process.exit(1)"
```

Expected: exits with status `0`.

### Task 3: Add the current course directory and a compliant footer

**Files:**
- Modify: `Playground/cocoai/index.art:after learning path`

**Interfaces:**
- Consumes: course-grid CSS from Task 1 and `#courses` anchor from Task 2.
- Produces: 10 visible course links and a footer with a blank filing space.

- [ ] **Step 1: Add the `#courses` heading and course link records**

Create course entries for:

```text
advanced-learning-of-obsidian
ai-agent-development-programming-guide
exportf-flow
harness-engineering
high-quality-ai-code-review
how-to-write-a-excellent-skill
java-web-backend-from-beginner-to-advanced
langchain-langgraph-from-beginner-to-advanced
python-from-beginner-to-advanced
rag-from-beginner-to-expert
```

Each entry must use `href="/courses/<slug>/"`, have a visible course title, a plain-language description derived from its local `course.json`, and a concise meta line. Do not include an entry containing `fbs-fullstack-landing`.

- [ ] **Step 2: Shape the grid asymmetrically without nesting cards**

Implement course link elements as direct children of `.course-grid`, using named modifier classes such as `.course-featured`, `.course-wide`, and `.course-standard`; switch all entries to one column below `760px`.

- [ ] **Step 3: Replace the old footer with preserved copyright and blank registration slot**

Implement:

```html
<footer class="site-footer">
  <p>Copyright @2020 - 2026 版权所有 Coco</p>
  <p class="filing-space" aria-label="ICP备案信息待补充"></p>
</footer>
```

- [ ] **Step 4: Verify course count, exclusion, and absolute paths**

Run:

```bash
node -e "const fs=require('fs'); const h=fs.readFileSync('/Users/qi.qiao/Documents/Playground/cocoai/index.art','utf8'); const links=[...h.matchAll(/href=\"\\/courses\\/([^/]+)\\//g)].map(m=>m[1]); if (new Set(links).size!==10 || links.includes('fbs-fullstack-landing')) process.exit(1)"
```

Expected: exits with status `0`.

### Task 4: Render and validate desktop and mobile

**Files:**
- Verify: `Playground/cocoai/index.art`

**Interfaces:**
- Consumes: completed standalone HTML page.
- Produces: browser-rendered confirmation of layout and interactions.

- [ ] **Step 1: Start a local static server**

Run:

```bash
cd /Users/qi.qiao/Documents/Playground/cocoai && python3 -m http.server 4173
```

Expected: server listens on `http://127.0.0.1:4173`.

- [ ] **Step 2: Check desktop and mobile screenshots**

Open `http://127.0.0.1:4173/index.art` in the browser at `1440x960` and `390x844`. Confirm the Header is single-line at desktop, TABs remain reachable on mobile, no content overlaps, and the first viewport presents the brand and a courses action.

- [ ] **Step 3: Run final static checks**

Run:

```bash
node -e "const fs=require('fs'); const h=fs.readFileSync('/Users/qi.qiao/Documents/Playground/cocoai/index.art','utf8'); if (!h.includes('prefers-reduced-motion') || !h.includes('ICP备案信息待补充')) process.exit(1)"
```

Expected: exits with status `0`.
