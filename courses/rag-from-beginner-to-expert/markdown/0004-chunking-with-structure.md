# 第 4 章：分块不是切字数：让 chunk 能独立回答小问题

现在资料已经能干净入库了。下一步是分块。分块听起来像切文本，实际更像拆说明书：每一块都要小到能被检索命中，又要完整到能回答一个小问题。切得太大，向量会变得含糊；切得太碎，模型拿到的上下文又不够。

## 这一章把文档切成可检索单元

- 理解 chunk 语义边界
- 比较固定分块和结构分块
- 处理表格和步骤文本
- 写分块可视化检查

## 分块坏了，后面会一起坏

分块这件事很容易被低估。好的 chunk 要像一张小卡片：自己能回答一个小问题，又能说明自己来自哪份文档、哪一节、哪个版本。

#### 先看 chunk 的目标形状

```javascript
const chunk = {
  id: "refund-policy#2026-01#chunk-001",
  document_id: "refund-policy#2026-01",
  source: "data/raw/refund-policy.md",
  title: "会员退款制度",
  section_path: ["年度会员退款"],
  permission: "support",
  version: "2026-01",
  text: "年度会员购买后 7 天内可申请退款。已经使用优惠券的订单，需要按优惠券规则扣减。",
  token_estimate: 43,
  prev_chunk_id: null,
  next_chunk_id: "refund-policy#2026-01#chunk-002"
};

// chunk 不是随手切出来的一段文字。
// 它要保留文档身份、章节路径、权限和前后关系。
```

## 先别从字数开始，从边界开始

字数只是预算，不是边界。真正的边界通常藏在标题、列表、步骤和问答结构里。

## 先按 Markdown 标题拆出章节

#### src/chunk/markdown-sections.js：先按 Markdown 标题拆出章节

```javascript
export function splitMarkdownSections(document) {
  const lines = document.text.split("\n");
  const sections = [];
  let current = {
    path: [document.section],
    lines: []
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,6})\s+(.+)$/);

    if (heading) {
      if (current.lines.join("\n").trim()) {
        sections.push({ ...current, text: current.lines.join("\n").trim() });
      }

      current = {
        path: [heading[2].trim()],
        lines: []
      };
      continue;
    }

    current.lines.push(line);
  }

  if (current.lines.join("\n").trim()) {
    sections.push({ ...current, text: current.lines.join("\n").trim() });
  }

  return sections;
}
```

## 再用句子和预算打包

#### src/chunk/text-splitter.js：用近似 token 控制块大小

```javascript
export function estimateTokens(text) {
  // 中文、英文、数字混合时，精确 token 需要依赖模型 tokenizer。
  // 教学项目先用近似值：中文字符和英文词都会贡献 token。
  const chineseChars = text.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const words = text.match(/[a-zA-Z0-9_]+/g)?.length || 0;
  return chineseChars + words;
}

export function splitBySentences(text) {
  return text
    .split(/(?<=[。！？!?])\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function packSentences(sentences, { maxTokens = 180, overlapSentences = 1 } = {}) {
  const chunks = [];
  let buffer = [];

  for (const sentence of sentences) {
    const candidate = [...buffer, sentence].join("");

    if (buffer.length && estimateTokens(candidate) > maxTokens) {
      chunks.push(buffer.join(""));
      buffer = overlapSentences > 0 ? buffer.slice(-overlapSentences) : [];
    }

    buffer.push(sentence);
  }

  if (buffer.length) chunks.push(buffer.join(""));
  return chunks;
}
```

## 生成 chunks.jsonl，并保留前后关系

#### src/chunk/build-chunks.js：把 documents.jsonl 转成 chunks.jsonl

```javascript
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { splitMarkdownSections } from "./markdown-sections.js";
import { estimateTokens, packSentences, splitBySentences } from "./text-splitter.js";

const inputFile = "data/processed/documents.jsonl";
const outputFile = "data/processed/chunks.jsonl";

function toChunk(document, section, text, index, total) {
  const chunkId = `${document.id}#chunk-${String(index + 1).padStart(3, "0")}`;

  return {
    id: chunkId,
    document_id: document.id,
    source: document.source,
    title: document.title,
    section_path: section.path,
    permission: document.permission,
    version: document.version,
    text,
    token_estimate: estimateTokens(text),
    prev_chunk_id: index > 0 ? `${document.id}#chunk-${String(index).padStart(3, "0")}` : null,
    next_chunk_id: index < total - 1 ? `${document.id}#chunk-${String(index + 2).padStart(3, "0")}` : null
  };
}

export async function buildChunks() {
  const lines = (await readFile(inputFile, "utf8")).trim().split("\n").filter(Boolean);
  const documents = lines.map((line) => JSON.parse(line));
  const chunks = [];

  for (const document of documents) {
    const parts = [];
    for (const section of splitMarkdownSections(document)) {
      const packed = packSentences(splitBySentences(section.text), {
        maxTokens: 180,
        overlapSentences: 1
      });

      packed.forEach((text) => parts.push({ section, text }));
    }

    parts.forEach((part, index) => {
      chunks.push(toChunk(document, part.section, part.text, index, parts.length));
    });
  }

  await writeFile(outputFile, chunks.map((chunk) => JSON.stringify(chunk)).join("\n") + "\n", "utf8");
  return { count: chunks.length, outputFile };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildChunks();
  console.log(`已生成 ${result.count} 个 chunk：${result.outputFile}`);
}
```

## 分块之后一定要抽检

#### src/chunk/inspect-chunks.js：分块之后一定要抽检

```javascript
import { readFile } from "node:fs/promises";

const file = "data/processed/chunks.jsonl";

export async function inspectChunks() {
  const chunks = (await readFile(file, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const tooShort = chunks.filter((chunk) => chunk.token_estimate < 20);
  const tooLong = chunks.filter((chunk) => chunk.token_estimate > 220);
  const missingSource = chunks.filter((chunk) => !chunk.source || !chunk.section_path?.length);

  return {
    total: chunks.length,
    too_short: tooShort.map((chunk) => chunk.id),
    too_long: tooLong.map((chunk) => chunk.id),
    missing_source: missingSource.map((chunk) => chunk.id),
    preview: chunks.slice(0, 3).map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      section_path: chunk.section_path,
      token_estimate: chunk.token_estimate,
      text: chunk.text.slice(0, 80)
    }))
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await inspectChunks(), null, 2));
}
```

#### package.json：补上 chunk 和 inspect 命令

```json
{
  "scripts": {
    "ingest": "node src/ingest/build-corpus.js",
    "chunk": "node src/chunk/build-chunks.js",
    "inspect:chunks": "node src/chunk/inspect-chunks.js",
    "check:data": "npm run ingest && npm run chunk && npm run inspect:chunks"
  }
}
```

## 练一下

把 `maxTokens` 从 180 改成 60，再运行 `npm run check:data`。观察 `inspect:chunks` 的 preview：哪些块变得太碎？再把它改成 320，看看块里是否开始混入多个主题。

## 快速自测

- chunk 太大最容易带来什么问题？ 答案：语义变稀。一个块里混太多主题，向量会变得笼统，检索时不够精准。
- 为什么要保留 section_path？ 答案：帮助引用定位。section_path 能让模型和用户知道片段来自哪一节，也方便生成引用。
- overlap 的作用更接近什么？ 答案：补边界信息。相邻块保留少量重叠，可以减少句子被切断后的上下文损失。

## 本章参考资料

- [Datawhale All-in-RAG: 文本分块](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter2/05_text_chunking.md)：社区教程，用于分块策略和细节展开。
- [RAG Best Practices](https://github.com/ali-bahrainian/RAG_best_practices)：社区项目，用于参数实验、chunk、top_k、query expansion 等实践意识。
