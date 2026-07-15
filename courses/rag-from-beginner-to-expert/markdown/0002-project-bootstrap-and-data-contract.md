# 第 2 章：从空目录开始：项目骨架、资料格式和 AI 生码边界

第一章我们把 RAG 的位置说清楚了：它不是聊天包装，而是一条证据链。第二章开始动手。别急着上向量库，也别急着让 AI 一次写完系统。先把项目骨架和数据契约定住。契约定得清楚，后面让 Codex 或 Claude Code 写代码时，才不会每一章都改一遍数据结构。

## 这一章要交付什么

- 建立项目目录
- 准备 mock 模型适配器
- 设计 documents.jsonl
- 写可复用的生码提示词

## 先别急着“智能”，先让资料有规矩

很多 RAG 项目卡住，不是因为模型不够强，而是因为资料进入系统时太随意。只要它们进系统后都变成一团纯文本，后面就很难做权限、引用和评测。

#### package.json：先用脚本定义项目动作

```json
{
  "name": "rag-customer-support",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "ingest": "node src/ingest/build-corpus.js",
    "ask": "node src/rag/answer.js",
    "eval": "node src/eval/run-eval.js",
    "serve": "node src/server.js",
    "check": "npm run ingest && npm run ask -- 年度会员用了优惠券还能退款吗？"
  },
  "dependencies": {}
}
```

## README 不是摆设，它是项目的第一份契约

README 写得清楚，AI 生码工具就少一点自由发挥。这里先写当前边界、目录约定和命令。

#### README.md：给人看，也给 AI 生码工具看

```markdown
# 客诉答疑 RAG 知识库

这个项目用来学习 RAG 的完整链路。第一版不依赖外部 API，先用 mock LLM 和本地文件跑通。

## 当前边界

- 原始资料放在 data/raw。
- 处理后的文档写入 data/processed/documents.jsonl。
- 每条文档必须保留 source、title、section、version、permission、updated_at。
- 回答必须带 citations。没有资料时拒答。

## 常用命令

```bash
npm run ingest
npm run ask -- 年度会员用了优惠券还能退款吗？
npm run check
```
```

## 原始资料也要稍微整理一下

RAG 不喜欢来路不明的资料。我们先用 Markdown 做原始资料，文件开头的 frontmatter 保存元数据，正文保存制度内容。

#### data/raw/refund-policy.md：一份适合入库的原始资料

```markdown
---
title: 会员退款制度
section: 年度会员退款
version: 2026-01
permission: support
updated_at: 2026-01-15
owner: customer-success
---

# 年度会员退款

年度会员购买后 7 天内可申请退款。已经使用优惠券的订单，需要按优惠券规则扣减。

客服不能承诺具体到账时间，只能说明“通常 3 到 7 个工作日到账，以支付渠道处理结果为准”。

如果用户已经使用年度会员权益超过 3 次，需要转交二线客服复核。
```

## 解析脚本要“挑剔”一点

如果资料缺字段，脚本应该直接报错，而不是默默吞掉。

#### src/ingest/frontmatter.js：解析资料头部元数据

```javascript
export function parseFrontmatter(markdown, source) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`${source} 缺少 frontmatter。每份资料都要写清 title、version 和 permission。`);
  }

  const meta = {};
  for (const line of match[1].split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    meta[key] = value;
  }

  return {
    meta,
    body: match[2].trim()
  };
}
```

## 越早校验，越少返工

数据契约不能只写在文档里，还要写进代码。

#### src/rag/schema.js：别等到检索时才发现资料缺字段

```javascript
const requiredDocumentFields = [
  "id",
  "source",
  "title",
  "section",
  "version",
  "permission",
  "updated_at",
  "text"
];

export function assertDocumentShape(document) {
  const missing = requiredDocumentFields.filter((field) => !document[field]);

  if (missing.length) {
    throw new Error(`文档 ${document.source || "(unknown)"} 缺少字段：${missing.join(", ")}`);
  }

  if (document.text.length < 20) {
    throw new Error(`文档 ${document.id} 正文太短，可能是解析失败。`);
  }

  return document;
}
```

## 把 raw 资料变成 documents.jsonl

现在可以写第一条真正的数据流水线了。

#### src/ingest/build-corpus.js：把 raw 资料写成 documents.jsonl

```javascript
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import { assertDocumentShape } from "../rag/schema.js";

const rawDir = "data/raw";
const outputDir = "data/processed";
const outputFile = join(outputDir, "documents.jsonl");

function toDocument({ file, meta, body }) {
  const id = `${file.replace(/\.md$/, "")}#${meta.version || "draft"}`;

  return assertDocumentShape({
    id,
    source: join(rawDir, file),
    title: meta.title,
    section: meta.section || meta.title,
    version: meta.version,
    permission: meta.permission || "internal",
    updated_at: meta.updated_at,
    owner: meta.owner || "unknown",
    text: body
  });
}

export async function buildCorpus() {
  const files = (await readdir(rawDir)).filter((file) => file.endsWith(".md"));
  const documents = [];

  for (const file of files) {
    const source = join(rawDir, file);
    const markdown = await readFile(source, "utf8");
    const parsed = parseFrontmatter(markdown, source);
    documents.push(toDocument({ file, ...parsed }));
  }

  await mkdir(outputDir, { recursive: true });
  const lines = documents.map((doc) => JSON.stringify(doc)).join("\n");
  await writeFile(outputFile, lines + "\n", "utf8");

  return { count: documents.length, outputFile };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildCorpus();
  console.log(`已生成 ${result.count} 条文档：${result.outputFile}`);
}
```

#### 验收命令：第二章先验数据，不验智能

```bash
# 1. 创建目录
mkdir -p data/raw data/processed src/ingest src/rag

# 2. 放入 refund-policy.md、frontmatter.js、schema.js、build-corpus.js

# 3. 运行入库脚本
npm run ingest

# 4. 检查输出。每一行都应该是一条完整 JSON 文档
cat data/processed/documents.jsonl
```

## 练一下

新增一份 `product-faq.md`，照着 `refund-policy.md` 写 frontmatter 和正文。再运行 `npm run ingest`。如果脚本报缺字段，不要绕过校验，先把资料补完整。

## 快速自测

- 为什么第二章先定数据契约？ 答案：减少后续返工。RAG 后续每个环节都会消费这些字段。契约不稳，检索、引用、权限和评测都会跟着返工。
- permission 字段主要服务什么？ 答案：权限过滤。企业知识库不能只看相关性，还要看用户有没有资格看到这段资料。
- documents.jsonl 为什么适合做中间产物？ 答案：便于逐行检查。JSONL 一行一条记录，适合调试、追加和被后续脚本继续处理。

## 本章参考资料

- [Datawhale All-in-RAG: 开发 RAG 的准备工作](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/02_preparation.md)：社区教程，用于项目环境和入门路径设计。
- [Datawhale All-in-RAG: 四步构建 RAG](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/03_get_start_rag.md)：社区教程，用于主线项目的最小闭环。
- [LangChain Docs: Build a RAG agent](https://docs.langchain.com/oss/python/langchain/rag)：用于对照 indexing、retrieval、generation 的工程拆分。
