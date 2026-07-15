# 第 11 章：做成能用的系统：API、最小前端、权限和企业边界

> 框架稿。完整正文会在第 1-7 章样张确认后生成。

## 本章项目产物

把 RAG 链路封装成 API，并做一个最小提问页面

## 本章学习目标

- 实现 HTTP API
- 加入角色权限
- 展示引用来源
- 说明上线前边界

## 本章参考资料

- [OpenAI Docs: Retrieval](https://developers.openai.com/api/docs/guides/retrieval)：用于校准文件检索、向量存储和检索产品化表达。
- [LangChain Docs: Build a RAG agent](https://docs.langchain.com/oss/python/langchain/rag)：用于对照 indexing、retrieval、generation 的工程拆分。
- [LlamaIndex Docs: Introduction to RAG](https://developers.llamaindex.ai/python/framework/understanding/rag/)：用于解释私有数据如何进入 RAG 查询流程。
