# 第 3 章：资料进入知识库：加载、清洗、元数据和版本

第二章我们把文档契约定住了。现在要面对更真实的一面：企业资料很少乖乖躺在一个干净文件夹里。FAQ 有重复答案，客诉工单带口语和情绪，制度文档有版本差异，某些内容还带权限。第 3 章不急着检索，先把资料治理到“可以放心入库”的程度。

## 这一章先把资料管住

- 识别资料噪声
- 保留来源和版本
- 设计权限字段
- 生成 ingest 脚本

## 真实资料进来时，通常没那么体面

如果只看教程里的 demo，资料总是干净的。可真到公司里，同一条退款规则可能在 FAQ 里写了一遍，在客服手册里又写了一遍；历史工单里有有用结论，也夹着用户情绪、客服口头承诺和过期处理办法。

#### data/raw/product-faq.md：FAQ 适合保留问法和标准答案

```markdown
---
title: 产品 FAQ
section: 会员与发票
version: 2026-01
permission: support
updated_at: 2026-01-18
owner: product-ops
---

# 会员与发票

## Q: 年度会员可以开发票吗？

A: 可以。用户需要在订单完成后 30 天内进入“订单中心 - 发票管理”提交发票信息。

## Q: 发票抬头填错了怎么办？

A: 如果发票尚未开具，用户可以自行修改。已经开具的发票需要提交客服工单，由财务在 3 个工作日内处理。
```

#### data/raw/complaint-tickets.md：历史工单要保留场景，但不能照搬情绪

```markdown
---
title: 历史客诉工单摘要
section: 退款争议
version: 2026-01
permission: support-lead
updated_at: 2026-01-20
owner: customer-success
---

# 退款争议

## 工单 CS-1024

用户购买年度会员后第 5 天申请退款，订单使用了 40 元优惠券。
处理结论：允许退款，但退款金额需要扣除优惠券抵扣部分。客服回复中不能承诺具体到账时间。

## 工单 CS-1088

用户购买年度会员后已经使用 5 次专属权益，再申请全额退款。
处理结论：转交二线客服复核。客服不得直接承诺全额退款。
```

## 清洗不是越狠越好

RAG 里的资料不是训练集，很多结构本身就有意义。Markdown 标题告诉你章节，列表告诉你步骤，空行告诉你段落边界。

#### src/ingest/normalize-text.js：先做克制的清洗

```javascript
export function normalizeText(text) {
  return text
    // 统一换行，避免不同系统导出的文件出现 \r\n / \r 混用。
    .replace(/\r\n?/g, "\n")
    // 去掉行尾空格。保留段落换行，因为 Markdown 标题和列表还要用。
    .replace(/[ \t]+$/gm, "")
    // 连续 3 个以上空行压成 2 个，减少噪声，但不破坏段落结构。
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function stripPrivateNotes(text) {
  // 内部批注可以留在原始文件，但不应该进入面向客服检索的知识库。
  return text.replace(/<!--\s*private:[\s\S]*?-->/g, "").trim();
}
```

## 元数据是检索时的方向盘

如果只保存 text，项目一真实就会出问题：用户是什么角色？这段资料是不是最新版？答案引用的是 FAQ 还是历史工单？出了错找谁维护？

#### src/ingest/metadata.js：元数据不是额外负担，是后面检索的方向盘

```javascript
const allowedPermissions = new Set(["public", "support", "support-lead", "internal"]);

export function normalizeMetadata(meta, source) {
  const normalized = {
    title: meta.title?.trim(),
    section: (meta.section || meta.title || "").trim(),
    version: meta.version?.trim(),
    permission: (meta.permission || "internal").trim(),
    updated_at: meta.updated_at?.trim(),
    owner: (meta.owner || "unknown").trim()
  };

  const missing = Object.entries(normalized)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`${source} 缺少元数据：${missing.join(", ")}`);
  }

  if (!allowedPermissions.has(normalized.permission)) {
    throw new Error(`${source} 的 permission 不合法：${normalized.permission}`);
  }

  return normalized;
}
```

## 重复资料会让模型摇摆

重复内容不只是浪费空间。两个重复片段如果版本不同，模型可能混合答案。

#### src/ingest/dedupe.js：重复资料不要等到检索时才处理

```javascript
import { createHash } from "node:crypto";

export function contentFingerprint(text) {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[，。！？、,.!?]/g, "")
    .trim();

  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function removeDuplicateDocuments(documents) {
  const seen = new Map();
  const kept = [];
  const duplicates = [];

  for (const document of documents) {
    const fingerprint = contentFingerprint(document.text);
    const existing = seen.get(fingerprint);

    if (existing) {
      duplicates.push({
        current: document.id,
        duplicate_of: existing.id,
        reason: "same_normalized_content"
      });
      continue;
    }

    seen.set(fingerprint, document);
    kept.push({ ...document, fingerprint });
  }

  return { kept, duplicates };
}
```

## 把导入过程写成能复盘的流水线

导入脚本不要只输出 documents.jsonl，还要输出 import-report.json。

#### src/ingest/build-corpus.js：加入清洗、元数据校验和导入报告

```javascript
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import { normalizeText, stripPrivateNotes } from "./normalize-text.js";
import { normalizeMetadata } from "./metadata.js";
import { removeDuplicateDocuments } from "./dedupe.js";
import { assertDocumentShape } from "../rag/schema.js";

const rawDir = "data/raw";
const outputDir = "data/processed";

function toDocument({ file, meta, body }) {
  const cleanText = normalizeText(stripPrivateNotes(body));
  const metadata = normalizeMetadata(meta, join(rawDir, file));

  return assertDocumentShape({
    id: `${file.replace(/\.md$/, "")}#${metadata.version}`,
    source: join(rawDir, file),
    ...metadata,
    text: cleanText
  });
}

export async function buildCorpus() {
  const files = (await readdir(rawDir)).filter((file) => file.endsWith(".md"));
  const documents = [];

  for (const file of files) {
    const markdown = await readFile(join(rawDir, file), "utf8");
    const parsed = parseFrontmatter(markdown, file);
    documents.push(toDocument({ file, ...parsed }));
  }

  const { kept, duplicates } = removeDuplicateDocuments(documents);
  await mkdir(outputDir, { recursive: true });

  await writeFile(
    join(outputDir, "documents.jsonl"),
    kept.map((doc) => JSON.stringify(doc)).join("\n") + "\n",
    "utf8"
  );

  await writeFile(
    join(outputDir, "import-report.json"),
    JSON.stringify({ input: documents.length, kept: kept.length, duplicates }, null, 2),
    "utf8"
  );

  return { input: documents.length, kept: kept.length, duplicates: duplicates.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildCorpus();
  console.log(`输入 ${result.input} 份资料，入库 ${result.kept} 份，重复 ${result.duplicates} 份。`);
}
```

#### 验收命令：检查文档和导入报告

```bash
npm run ingest

# documents.jsonl 应该保留 source、version、permission、owner
cat data/processed/documents.jsonl

# import-report.json 用来检查是否有重复资料被跳过
cat data/processed/import-report.json
```

## 练一下

故意复制一份 `refund-policy.md`，改个文件名但不改正文。运行 `npm run ingest`，看看 `import-report.json` 是否能识别重复。再把其中一份的 `permission` 改成不存在的值，确认脚本会报错。

## 快速自测

- 为什么不把历史工单原文直接塞进知识库？ 答案：会带入噪声。历史工单常有情绪、口语和个人信息，适合整理成摘要后再入库。
- permission 字段在后面最直接服务什么？ 答案：权限过滤。检索时不仅要看相关性，还要按用户角色过滤可见资料。
- import-report.json 的价值是什么？ 答案：复盘入库过程。导入报告能告诉你输入多少、保留多少、跳过哪些重复资料。

## 本章参考资料

- [Datawhale All-in-RAG: 开发 RAG 的准备工作](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/02_preparation.md)：社区教程，用于项目环境和入门路径设计。
- [Datawhale All-in-RAG: 四步构建 RAG](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/03_get_start_rag.md)：社区教程，用于主线项目的最小闭环。
- [OpenAI Docs: Retrieval](https://developers.openai.com/api/docs/guides/retrieval)：用于校准文件检索、向量存储和检索产品化表达。
