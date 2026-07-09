# RAG 从入门到精通 Resources

## Knowledge

- [Paper: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" - Lewis et al.](https://arxiv.org/abs/2005.11401)
  RAG 概念的经典论文来源。Use for: 解释 RAG 的原始动机、parametric memory 与 non-parametric memory 的区别、为什么检索能改善知识密集型任务。
- [OpenAI Docs: Retrieval](https://developers.openai.com/api/docs/guides/retrieval)
  OpenAI 关于 Retrieval API、file search、vector stores、ranking options 的官方文档。Use for: 解释现代产品化 RAG 的文件上传、切分、索引、检索、排序和成本概念。
- [OpenAI Docs: Vector embeddings](https://developers.openai.com/api/docs/guides/embeddings)
  官方 embedding 说明，覆盖文本相关度、语义搜索、聚类、推荐等用途。Use for: 解释 embedding 是什么、为什么文本能被转成向量、向量相似度如何用于检索。
- [OpenAI Cookbook: Vector databases](https://developers.openai.com/cookbook/examples/vector_databases/readme)
  OpenAI Cookbook 中关于向量数据库的示例集合。Use for: 后续需要从无代码概念过渡到工程实现时，展示常见向量数据库生态。
- [LangChain Docs: Build a RAG agent with LangChain](https://docs.langchain.com/oss/python/langchain/rag)
  LangChain 官方 RAG 教程，清晰拆分 indexing、retrieval and generation。Use for: 设计课程中的“RAG 两阶段流程”图和工程角色分工。
- [LlamaIndex Docs: Introduction to RAG](https://developers.llamaindex.ai/python/framework/understanding/rag/)
  LlamaIndex 官方 RAG 入门，强调把用户数据加载、索引并用于查询。Use for: 面向小白解释“AI 没有训练过你的企业资料，所以需要 RAG”。
- [Pinecone Learn: Retrieval-Augmented Generation](https://www.pinecone.io/learn/retrieval-augmented-generation/)
  向量数据库厂商的 RAG 概念文章。Use for: 辅助解释向量库、检索质量和应用场景；使用时注意它带有产品视角。
- [Weaviate Blog: What is RAG?](https://weaviate.io/blog/what-is-rag)
  向量数据库厂商的 RAG 解释材料。Use for: 补充企业知识库、语义搜索和向量数据库的实际表达；使用时注意它带有产品视角。
- [Article: 一文了解RAG18种常见算法对比，看这一篇就够了！](https://blog.csdn.net/l01011_/article/details/149039999)
  用户补充的 RAG 优化算法综述。Use for: 课程进阶部分的算法地图和术语露出，例如查询改写、混合检索、多轮检索、GraphRAG 等；不作为唯一事实来源。
- [Article: 一文详谈RAG优化方案与实践](https://zhuanlan.zhihu.com/p/703182970)
  用户补充的 RAG 优化实践文章。Use for: 切分、检索、重排、评测、可观测性等实践框架的补充参考；不作为唯一事实来源。
- [GitHub: RAG Best Practices](https://github.com/ali-bahrainian/RAG_best_practices)
  RAG 最佳实践研究的实现仓库，覆盖查询扩展、检索模块、生成模型、chunk_size、overlap、top_k 等配置。Use for: 评测章节、参数取舍、代码扩展路线和实验意识。
- [Internal PDF: 大模型生码的原理与 RAG 工程实践](./assets/大模型生码的原理与%20RAG%20工程实践.pdf)
  公司内部关于生码、Agent、Skill 和原子化 RAG 的工程实践材料。Use for: 进阶解释“减少模型猜测、增加工程约束”，主课只抽取适合初学者的高层洞察。
- [Internal PDF: RAG 方案对比](./assets/RAG%20方案对比.pdf)
  公司内部关于单体大文档、TS RAG、原子 RAG、知识工程层、workflow 层和系统能力层的方案对比。Use for: 企业级知识库设计、知识物料治理、可回溯和可解释性。
- [Internal PDF: 关于 RAG 优化的思考记录](./assets/关于%20RAG%20优化的思考记录.pdf)
  公司内部关于 RAG 优化、检索可观测性、评测集、检索指标和生成指标的思考。Use for: 课程中的 RAG 评测、日志、错误定位和优化方法。

## Wisdom (Communities)

- [All-in-RAG | 大模型应用开发实战一：RAG技术全栈指南](https://datawhalechina.github.io/all-in-rag/#/)
- [RAG 从入门到实战完整教程](https://rag.deeptoai.com/docs)
- [RAG 简介](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/01_RAG_intro.md)
- [开发 RAG 的准备工作](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/02_preparation.md)
- [四步构建RAG](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter1/03_get_start_rag.md)
- [RAG 数据加载](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter2/04_data_load.md)
- [RAG 文本分块](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter2/05_text_chunking.md)
- [RAG 向量嵌入](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter3/06_vector_embedding.md)
- [RAG 多模态嵌入](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter3/07_multimodal_embedding.md)
- [RAG 向量数据库](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter3/08_vector_db.md)
- [RAG Milvus介绍及多模态检索实践](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter3/09_milvus.md)
- [RAG 索引优化](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter3/10_index_optimization.md)
- [RAG 混合检索](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter4/11_hybrid_search.md)
- [RAG 查询构建](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter4/12_query_construction.md)
- [RAG 文本到SQL](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter4/13_text2sql.md)
- [RAG 查询重构与分发](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter4/14_query_rewriting.md)
- [RAG 检索进阶](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter4/15_advanced_retrieval_techniques.md)
- [RAG 格式化生成](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter5/16_formatted_generation.md)
- [RAG 评估介绍](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter6/18_system_evaluation.md)
- [RAG 评估常用工具](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter6/19_common_tools.md)
- [RAG 基于知识图谱的RAG](https://github.com/datawhalechina/all-in-rag/blob/main/docs/chapter7/20_kg_rag.md)
- [OpenAI Developer Community](https://community.openai.com/)
  OpenAI 开发者论坛。Use for: 查找 Retrieval、embeddings、file search、生产问题和最佳实践讨论。
- [LangChain Forum](https://forum.langchain.com/)
  LangChain 社区论坛。Use for: 查找 RAG chain、agentic RAG、retriever、evaluation 的实践问题。
- [LlamaIndex Discord](https://discord.com/invite/dGcwcsnxhU)
  LlamaIndex 官方社区入口。Use for: 查找数据连接器、索引、query engine、企业知识库案例。
- [RAG完整教程 - 从入门到生产部署](https://github.com/vivy-yi/rag-tutorial/blob/main/README.md)
- [学习检索增强生成(RAG)技术，看这篇就够了——热门RAG文章摘译(22篇)](https://zhuanlan.zhihu.com/p/673392898)
- [LightRAG: Simple and Fast Retrieval-Augmented GenerationLightRAG: Simple and Fast Retrieval-Augmented Generation](https://zhuanlan.zhihu.com/p/1944880049955254759)
- [Multi-Head RAG: Solving Multi-Aspect Problems with LLMs](https://zhuanlan.zhihu.com/p/1936801624677938627)
- [SafeRAG: Benchmarking Security in Retrieval-Augmented Generation of Large Language Model](https://zhuanlan.zhihu.com/p/1922065496389419074)
- [Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG](https://zhuanlan.zhihu.com/p/1893616563510288868)
- [Ask in Any Modality: A Comprehensive Survey on Multimodal Retrieval-Augmented Generation](https://zhuanlan.zhihu.com/p/29346473723)

## Course Decisions

- 案例方向：贴近科技公司实践，优先使用客诉答疑、业务测试用例生成、代码库助手；
- 样例资料：允许生成虚构企业资料，不要求使用真实企业文档；
- 交付形态：当前阶段使用 HTML lesson，同时生成一个可以导入到其他学习平台的 .md 版本格式；
- 课程结构：重构为 12 章，每章 2-4 个核心知识点，理论学习 12 小时，实践项目 1-2 天；
