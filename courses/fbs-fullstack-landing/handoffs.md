# FBS 前后端转全栈 Landing 课程状态交接

## 交接日期

2026-07-21

## 课程总体状态

- **40 章全部生成完毕**：模块一至六各 6/7/6/7/7/7 章
- 当前 Phase 1 质检：0 error, 0 warning，通过
- 内容哈希：`fed6e9931ac9d1cea312afee976de9232cfd151f55f6365a2720bdcdb627d632`
- 总字符数：约 483,770 字符（40 章）
- 构建产物：40 个 HTML 课程页面 + 课程首页 + 术语表

## 本轮会话完成的工作

### 模块六（BE-A01 ~ BE-A07）生成
- 7 章全部完成，覆盖 Apollo/Chassis 配置、Redis/Codis 缓存、Saturn 任务、Kafka 消息、可靠性模式、日志/排错、影响分析与开发交接
- 每章 > 11,000 字符，已通过 Phase 1 QC

### 模块五结构修复
- 修复了 BE-A01~A07 共 7 章在「练习/自检/参考文献」之后追加碎片知识的违规模式
- 将课后补充内容全部融入正文适当位置
- 消除了独立的 `## 练习四/五/六` 和 `## 进阶思考` 标题，统一归入 `## 练习` 下

### 模块三和 FE-W07 结构修复
- FE-W07 从「参考文献后 5 个完整小节」重写为正文全部在前、练习在后的结构
- FE-A01~A06 补充了缺失的「自检」段落（每章 5 题）
- 将各章「练习」和「自检」之间夹杂的教学章节全部移到练习之前

### 全教程标题序号清理
- 清理了全部 40 章中约 286 处 `##` 级中文/阿拉伯数字序号和 710 处 `###` 级子标题序号
- 修复了去序号后的 14 处标题重复问题

### BE-L02 内容丰富
- 首次出现的 DTO 概念增加了完整解释：全称、起源、核心职责、社区同类对比、FBS 仓库位置
- tag 语法讲解从简略说明扩展为：语法规则详解、`encoding/json`/Chassis/GORM 各自的 reflect 工作机制、`omitempty` 与零值的微妙交互

### BE-L03~L07 结构修复
- 5 章「练习」段落后面散落的 40+ 个小节全部移回正文区

## 已建立的防复发规则

以下规则已写入 `workspace/NOTES.md` 和 `workspace/COURSE-GENERATION-SPEC.md`，后续生成时必须遵守：

1. **禁止在练习/自检/小结之后追加新的主体知识来凑字符数**。体量不足时必须回到受影响的原有位置补充。
2. **框架、协议、数据库、安全等章节，标题首次出现的技术名词必须先解释含义、在架构中解决的问题，再说明常见同类方案及当前方案取舍。**
3. **DTO 等后端专属概念出现时必须附带零基础解释**（全称、起源、职责、社区对比、仓库位置）。
4. **所有正文章节的结构必须为：正文全部 → 练习全部 → 自检 → 参考文献**。不得在练习和自检之间、自检和参考文献之间、参考文献之后出现教学正文。
5. **正文标题不得带有中文/阿拉伯数字序号**（如 `## 一、Foo`、`## 1. Foo`、`### 1.1 Bar`），序号由右侧目录 CSS 自动生成。

## 后续建议

### 第二阶段语义质检
- 40 章全部完成后，应完整执行一次 Phase 2 rubric 审校（按 `references/course-rubric.md`）
- 需要完整的 Humanizer 评分（所有中文正文目标 ≥ 45/50）

### 第三阶段浏览器验证
- 需在可启动 HTTP 服务器的环境中验证所有 40 个 HTML 页面的渲染效果
- 检查 Mermaid 图表渲染（部分章节有 Mermaid 图）
- 检查移动端 390px 响应式布局
- 检查主题切换和代码复制功能

### 课程元数据更新
- `course.json` 中 `status` 仍为 `"in-progress"`，可在全部验收通过后改为 `"completed"`
- `progressNote` 和 `description` 可能需要更新以反映 40 章全部完成的最终状态

### 课程发布
- 尚未创建 git commit
- 整个 `courses/fbs-fullstack-landing/` 目录为未跟踪目录
- `assets/fbs/`、`output/` 等为既有未跟踪内容，不要清理

## 关键文件路径

| 文件 | 用途 |
| --- | --- |
| `courses/fbs-fullstack-landing/course.json` | 课程元数据（40 章） |
| `courses/fbs-fullstack-landing/workspace/MISSION.md` | 课程任务定义 |
| `courses/fbs-fullstack-landing/workspace/COURSE-GENERATION-SPEC.md` | 生成规格与防复发规则 |
| `courses/fbs-fullstack-landing/workspace/NOTES.md` | 课程笔记与约束 |
| `courses/fbs-fullstack-landing/workspace/COURSE-BLUEPRINT.md` | 40 章蓝图 |
| `courses/fbs-fullstack-landing/workspace/CHAPTER-TEMPLATE-MAP.md` | 逐章模板映射 |
| `courses/fbs-fullstack-landing/workspace/RESOURCES.md` | 来源包与审阅快照 |
| `courses/fbs-fullstack-landing/lessons/*.md` | 40 章 Markdown 源文件 |
| `courses/fbs-fullstack-landing/lessons/*.html` | 40 章 HTML 产物 |
| `courses/fbs-fullstack-landing/quality/` | 各阶段质检报告 |
| `.agents/skills/teach-generator/SKILL.md` | 课程生成 Skill（已被修改） |
| `.agents/skills/humanizer-zh/SKILL.md` | 中文润色 Skill |
| `scripts/build-static-course.mjs` | 静态课程构建脚本（已被修改，新增了 inline code 换行规则） |

## 建议调用的 Skill

下个会话开始前建议读取：
- `teach-generator`：课程生成流程与质检规则
- `humanizer-zh`：中文润色闸门

## 重要约束（来自课程 spec）

- 只关注 8 个指定仓库 + `assets/fbs/`，不处理其他仓库内容
- 6 个业务仓库事实基线均为 2026-07-20 的 `release` 分支
- `fbs-kb` 只做业务校准，不向学员讲仓库结构
- 不讲发版平台/SOP，只提示按团队通用流程
- 不保存账号、token、密钥、真实 PII、本机路径
- 未执行的命令（构建、数据库 EXPLAIN、HTTP/gRPC 联调等）正文中明确标注为授权环境验收项
- 字符数不足时必须补缺失知识层并融合进正文，严禁章末补字数
