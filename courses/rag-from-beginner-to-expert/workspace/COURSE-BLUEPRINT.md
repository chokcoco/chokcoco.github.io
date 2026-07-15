# RAG 从入门到精通 课程蓝图

本文件由 `scripts/build-course.mjs` 生成。当前阶段展开第 1-7 章样张，其余章节保留框架，等样张确认后再继续生成。

## 生成原则

- 只以 `MISSION.md`、`RESOURCES.md` 和本轮确认项为准，不沿用旧课程正文。
- 使用 `.agents/skills/teach/SKILL.md` 的 lesson / reference / learning-records 工作区结构。
- 中文正文经过 `humanizer-zh` 风格约束：少套模板，少用宣传腔，避免机械的 What / Why / How 显性标题。
- 后续章节参考 `assets/课程风格_wenjie.md` 和 `assets/课程风格_wenjie_2.md`：开头先抛真实问题，先讲失败原因，再给工程做法；正文允许有判断、有停顿、有一点口语感，但不写空泛感叹。
- 第 5 章参考 `assets/课程风格_coco.md`、`assets/课程风格_coco_2.md`、`assets/课程风格_coco_3.md`：先给直观判断，再用“技巧/拆解/代码/效果”推进，每段代码后解释关键句子到底解决了什么问题。
- 从第 6 章开始回到概念课定位：每章 2-4 个核心知识点，先讲基础概念、技术发展脉络和原理，再落到应用场景和痛点。代码只在必要时作为伪代码或短示例出现。
- 项目实战统一收纳到最后 1-2 章，前面的章节不围绕同一个项目持续推进，避免初学者被工程细节压垮。
- 章节正文不能长期维持“标题 + 一段正文”的机械形态。可以用故事、反例、表格、流程图、代码和小结交错推进。
- 第 1-5 章已有代码型样张可以保留；第 6 章以后不再为了“落地”强行加代码，必要时只给短伪代码、结构示意或概念清单。
- 代码块必须有高亮；本地 HTML 不能依赖 highlight.js CDN 才有高亮效果。
- 代码块需要必要注释。注释解释业务意图、边界和易错点，不写“给变量赋值”这种空话。
- 社区资料大量参考，但关键事实以论文、官方文档或可复核资料校准。
- 最后 1-2 章实践项目为“科技公司内部知识库 / 客诉答疑 RAG”。
- JavaScript 只在实践章节作为主线可运行代码；概念章节不强行使用编程语言承载知识。

## 12 章设计

| 章节 | 标题 | 项目产物 | 参考资料 |
| --- | --- | --- | --- |
| 1 | 为什么需要 RAG：从闭卷回答到有据可查 | 确定主线项目：科技公司内部知识库 / 客诉答疑 RAG | Lewis et al., Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks；OpenAI Docs: Retrieval；LlamaIndex Docs: Introduction to RAG；Datawhale All-in-RAG: RAG 简介；Datawhale All-in-RAG: 四步构建 RAG |
| 2 | 从空目录开始：项目骨架、资料格式和 AI 生码边界 | 生成 Node.js 项目骨架，定义文档、片段、引用的数据结构 | Datawhale All-in-RAG: 开发 RAG 的准备工作；Datawhale All-in-RAG: 四步构建 RAG；LangChain Docs: Build a RAG agent |
| 3 | 资料进入知识库：加载、清洗、元数据和版本 | 把客诉制度、产品 FAQ、历史工单整理成可索引知识物料 | Datawhale All-in-RAG: 开发 RAG 的准备工作；Datawhale All-in-RAG: 四步构建 RAG；OpenAI Docs: Retrieval |
| 4 | 分块不是切字数：让 chunk 能独立回答小问题 | 实现结构感知分块、overlap 和分块检查报告 | Datawhale All-in-RAG: 文本分块；RAG Best Practices |
| 5 | Embedding 和向量索引：把文字放进可搜索的语义空间 | 实现 mock embedding 与可替换真实 embedding adapter | OpenAI Docs: Vector embeddings；Datawhale All-in-RAG: 向量嵌入；Datawhale All-in-RAG: 向量数据库 |
| 6 | 检索第一版：关键词、语义、混合检索和权限过滤 | 理解检索技术的基本类型、适用场景和常见失败原因 | Datawhale All-in-RAG: 混合检索；Datawhale All-in-RAG: 索引优化；RAG Best Practices |
| 7 | 从找得到到排得对：重排、去重和上下文包 | 理解排序、重排、去重和上下文组织在 RAG 中的位置 | Datawhale All-in-RAG: 检索进阶；RAG Best Practices；LangChain Docs: Build a RAG agent |
| 8 | 问题也要处理：查询改写、路由和 Text2SQL 的边界 | 为客诉问答加入查询改写、业务域路由和结构化过滤 | Datawhale All-in-RAG: 查询构建；Datawhale All-in-RAG: 检索进阶 |
| 9 | 生成不是自由发挥：引用、拒答和结构化输出 | 实现 answer prompt、citation 检查和无法回答时的拒答规则 | Datawhale All-in-RAG: 格式化生成；OpenAI Docs: Retrieval |
| 10 | 别靠感觉调 RAG：评测集、日志和错误归因 | 建立 20 条客诉问答评测集，记录检索和生成过程 | Datawhale All-in-RAG: 系统评估；RAG Best Practices |
| 11 | 做成能用的系统：API、最小前端、权限和企业边界 | 把 RAG 链路封装成 API，并做一个最小提问页面 | OpenAI Docs: Retrieval；LangChain Docs: Build a RAG agent；LlamaIndex Docs: Introduction to RAG |
| 12 | 6 小时毕业项目：从空目录做出客诉答疑 RAG | 从零完成 ingest、chunk、index、retrieve、answer、eval、API、front-end | Datawhale All-in-RAG: 四步构建 RAG；Datawhale All-in-RAG: 系统评估；RAG Best Practices；OpenAI Docs: Retrieval |
