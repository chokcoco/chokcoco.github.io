# 第 1 章：为什么需要 RAG：从闭卷回答到有据可查

如果只用一句话说清这门课，我会这样说：我们要做一个小型企业知识库，让模型回答客户问题前先查资料，并且把证据交出来。第一章先不碰复杂框架。先把问题想明白：为什么普通聊天不够，为什么搜索也不够，RAG 到底补上了哪一块。

## 这一章先拿到什么

- 解释 RAG 的位置
- 区分 Prompt、搜索、RAG、微调
- 看懂课程项目路线
- 写出第一版 AI 生码提示词

## 先把这个麻烦看完整

假设一家科技公司有三类资料：产品 FAQ、退款制度、历史客诉工单。客服问模型：“用户买了年度会员，使用 3 天后申请退款，应该怎么处理？”

如果只是普通聊天，模型大概率会给一个听上去挺像样的答案。它可能会说“可以退款”“请联系客服”“一般 3 到 7 个工作日到账”。这些话不一定错，但问题在于：公司制度里有没有 3 天这个条件？优惠券要不要扣减？客服能不能承诺到账时间？如果用户已经用了会员权益，是否要转二线复核？

RAG 要解决的不是“让模型说得更漂亮”。它要解决的是：回答之前，系统先把相关资料找出来，回答之后，还能让人看到它依据了哪几段资料。

## RAG 的核心是证据链，不是向量数据库

RAG 的完整名字是 Retrieval-Augmented Generation。Retrieval 是检索，Generation 是生成。先找资料，再回答。

企业里更早遇到的问题往往不是“向量库选哪个”，而是资料有没有来源、版本、权限、负责人。没有这些东西，系统即使找到了片段，也很难判断它能不能用。

#### 先看一个片段应该携带哪些信息

```javascript
const evidenceChunk = {
  id: "refund-policy#2026-01#annual-refund",
  source: "data/raw/refund-policy.md",
  title: "会员退款制度",
  section: "年度会员退款",
  version: "2026-01",
  permission: "support",
  updated_at: "2026-01-15",
  text: "年度会员购买后 7 天内可申请退款；已使用优惠券的订单，需要按优惠券规则扣减。"
};

// 后面的检索、引用、权限过滤，都会依赖这类字段。
```

## Prompt、搜索、RAG、微调，其实在管四件不同的事

Prompt 更像答题规范，解决“怎么答”的问题。搜索解决“在哪里找”的问题，但它不会自动替你组织成带引用的客服回复。RAG 把找资料、组上下文、生成答案连成一条链。微调更重，它适合长期改变模型的行为习惯。

## 把一次 RAG 回答拆开看

```mermaid
flowchart LR
  A["客户或客服问题"] --> B["检索相关资料"]
  B --> C["按权限和业务域过滤"]
  C --> D["组装上下文包"]
  D --> E["LLM 生成回答"]
  E --> F["返回答案和引用"]
  F --> G["记录日志与评测"]
```

## 先会判断什么时候该用 RAG

| 场景 | 优先方案 | 原因 |
| --- | --- | --- |
| 只是想让回答格式稳定 | Prompt | 事实已经在输入里，先约束表达 |
| 想查公开网页资料 | 搜索 | 人工确认或简单摘要可能够用 |
| 要回答企业制度、FAQ、工单 | RAG | 资料会更新，还需要引用和权限 |
| 要模型长期学会固定标注风格 | 微调 | 目标是改变模型行为，不是补资料 |

## 本章代码

#### 第 1 章先定下来的项目骨架

```text
rag-customer-support/
  README.md                 # 写清楚项目目标、运行命令和当前限制
  package.json              # 先只放 npm scripts，不急着装一堆依赖
  data/
    raw/                    # 原始资料，尽量保持可读、可追溯
      refund-policy.md
      product-faq.md
      complaint-tickets.md
    processed/              # 机器处理后的中间产物，方便检查
      documents.jsonl
      chunks.jsonl
  src/
    adapters/               # 模型调用放这里，后续替换供应商不动主链路
      llm.mock.js
      llm.openai-compatible.js
    ingest/
      build-corpus.js
    rag/
      retrieve.js
      answer.js
      citations.js
    eval/
      eval-cases.json
      run-eval.js
    server.js
  public/
    index.html
```

#### 给 Codex 或 Claude Code 的第一版总控提示词

```markdown
你是我的 RAG 项目结对编程助手。请按阶段帮我完成一个本地可运行的客诉答疑知识库。

项目目标：
1. 使用 Node.js 和原生模块优先，不急着引入重型框架。
2. 资料来源放在 data/raw，处理结果写入 data/processed。
3. 第一阶段只实现 mock LLM 和关键词检索，保证没有 API key 也能跑通。
4. 后续再替换为 OpenAI-compatible API、embedding 和向量索引。
5. 每次只生成一个阶段的文件，并告诉我运行什么命令验收。

硬性要求：
- 每个知识片段保留 source、title、section、version、permission、updated_at。
- 回答必须返回 answer、citations、confidence、missing_info。
- 如果资料不足，必须说明缺少什么资料，不要编。
- 代码要有少量必要注释，避免为了注释而注释。

请先生成 package.json、README.md、src/rag/answer.js 和 src/adapters/llm.mock.js。
```

#### package.json 的第一版，先让项目跑起来

```json
{
  "name": "rag-customer-support",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "ask": "node src/rag/answer.js",
    "ingest": "node src/ingest/build-corpus.js",
    "eval": "node src/eval/run-eval.js",
    "serve": "node src/server.js"
  },
  "dependencies": {}
}
```

#### src/adapters/llm.mock.js，先用假模型压住系统形状

```javascript
export async function generateWithMockLLM({ question, contexts }) {
  // 先处理“没有资料”的情况。RAG 系统宁可拒答，也不要编一个顺口答案。
  if (!contexts.length) {
    return {
      answer: "我没有找到足够资料，暂时不能回答这个问题。",
      confidence: "low",
      missing_info: ["缺少与问题相关的知识片段"],
      citations: []
    };
  }

  // 第一章只取第一个片段生成演示回答。后面会加入排序、引用校验和真实模型。
  const first = contexts[0];
  return {
    answer: [
      `根据《${first.title}》的资料，${first.text}`,
      "这只是 mock 回答，用来验证 RAG 链路的数据结构。后续章节会替换为真实模型。"
    ].join("\n"),
    confidence: "medium",
    missing_info: [],
    citations: [
      {
        source: first.source,
        title: first.title,
        section: first.section,
        chunk_id: first.id
      }
    ]
  };
}
```

#### src/rag/answer.js，第一章只跑通问答形状

```javascript
import { generateWithMockLLM } from "../adapters/llm.mock.js";

// 第一章先用一段手写上下文演示。第二章开始会把它换成 data/processed 里的真实中间产物。
const demoContexts = [
  {
    id: "refund-policy#001",
    source: "data/raw/refund-policy.md",
    title: "会员退款制度",
    section: "年度会员退款",
    version: "2026-01",
    permission: "support",
    text: "年度会员购买后 7 天内可申请退款；已使用优惠券的订单，需要按优惠券规则扣减。"
  }
];

export async function answerQuestion(question, contexts = demoContexts) {
  const response = await generateWithMockLLM({ question, contexts });
  return {
    question,
    ...response,
    // debug 字段不是给最终用户看的，是给开发者复盘链路用的。
    debug: {
      retrieved_count: contexts.length,
      context_ids: contexts.map((item) => item.id)
    }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const question = process.argv.slice(2).join(" ") || "年度会员用了优惠券还能退款吗？";
  const result = await answerQuestion(question);
  console.log(JSON.stringify(result, null, 2));
}
```

## 练一下

把上面的 4 段代码交给 AI 生码工具，让它生成项目。运行 `npm run ask -- 年度会员用了优惠券还能退款吗？`，你应该看到 answer、citations、debug 三块内容。第一章不追求智能，先确认系统形状是可检查的。

## 快速自测

- RAG 最先解决的是哪类问题？ 答案：回答缺少企业资料。RAG 的核心是把外部资料接入回答流程，尤其适合企业私有资料和频繁更新的知识。
- 只想让模型按 JSON 格式回答，优先改什么？ 答案：Prompt。格式约束通常先从 Prompt 做起，不要一上来就搭 RAG 或微调。
- 企业 RAG 为什么要保存引用？ 答案：方便核对答案。引用让答案可追溯。答错时也能追查是资料、检索还是生成出了问题。

## 收个口

这一章先把地基打好：RAG 不是一个更会聊天的按钮，而是一条证据链。它让模型先看资料，再组织答案。下一章开始，我们会从空目录把项目搭出来，并把“资料应该长什么样”这件事定下来。

## 本章参考资料

- [Lewis et al., Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)：RAG 原始论文，解释参数化知识和非参数化知识的结合。
- [OpenAI Docs: Retrieval](https://developers.openai.com/api/docs/guides/retrieval)：用于校准文件检索、向量存储和检索产品化表达。
- [LlamaIndex Docs: Introduction to RAG](https://developers.llamaindex.ai/python/framework/understanding/rag/)：用于解释私有数据如何进入 RAG 查询流程。
- [Datawhale All-in-RAG: RAG 简介](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/01_RAG_intro.md)：社区教程，作为课程层级和小白表达的重要参考。
- [Datawhale All-in-RAG: 四步构建 RAG](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/03_get_start_rag.md)：社区教程，用于主线项目的最小闭环。
