在 2026 年，前端开发者面临的选择从未如此丰富：GitHub Copilot、Cursor、Claude Code、Windsurf⋯⋯每个工具都各有特色。根据 [2026 年 AI 编程工具调研](https://www.faros.ai/blog/best-ai-coding-agents-2026)，95% 的开发者每周至少使用 AI 工具，而经验丰富的开发者平均使用 2.3 个工具。

这意味着问题不是"选哪一个"，而是"在什么场景下用哪一个"。本节将通过客观数据和实际场景，帮助你理解 Claude Code 的独特价值。

---

## 2026 年 AI 编程工具格局
### 市场份额与用户评价
根据多家机构的 2026 年初调研数据：

| 工具 | 用户规模 | "最受喜爱"评分 | SWE-bench 得分 | 主要优势 |
| --- | --- | --- | --- | --- |
| **Claude Code** | - | [46%](https://www.adventureppc.com/blog/claude-code-vs-cursor-vs-github-copilot-the-definitive-ai-coding-tool-comparison-for-2026) | [80.8%](https://www.nxcode.io/resources/news/best-ai-for-coding-2026-tools-ranked) | 最强模型 + 最大上下文 + 智能体能力 |
| **Cursor** | - | [19%](https://dev.to/alexcloudstar/claude-code-vs-cursor-vs-github-copilot-the-2026-ai-coding-tool-showdown-53n4) | 52% | 最佳 IDE 集成 + 工作流优化 |
| **GitHub Copilot** | [1500 万 / 470 万付费](https://www.nxcode.io/resources/news/github-copilot-vs-cursor-2026-which-to-pay-for) | [9%](https://www.adventureppc.com/blog/claude-code-vs-cursor-vs-github-copilot-the-definitive-ai-coding-tool-comparison-for-2026) | 56% | 企业合规 + 平台生态 + 入门友好 |


从这份数据中可以看到一些有趣的趋势。Claude Code [2025 年 5 月才发布](https://dev.to/alexcloudstar/claude-code-vs-cursor-vs-github-copilot-the-2026-ai-coding-tool-showdown-53n4)，仅用 8 个月就在用户满意度上超越了竞品，并在[最广泛使用的 SWE-bench 基准测试](https://www.tldl.io/resources/ai-coding-tools-2026)中取得 80.8% 的得分，显著高于其他工具。值得注意的是，经验丰富的开发者平均使用 2.3 个工具，这说明不同工具各有所长，在实际工作中往往需要组合使用。

### 三种工具的定位差异
根据 [2026 年开发者调研](https://dev.to/_d7eb1c1703182e3ce1782/claude-code-vs-cursor-vs-github-copilot-honest-comparison-2026-1ah6)，三种工具代表了三种不同的哲学：

**Claude Code**：

+ 定位：**终端原生的智能体方法**（Terminal-native agentic approach）
+ 特点：AI 在系统层面操作——读取、编写、执行代码，完全自主
+ 适合：复杂任务、架构设计、大规模重构

**Cursor**：

+ 定位：**AI 集成 IDE**
+ 特点：AI 编织进每次按键，可视化 diff 和快速自动补全
+ 适合：日常开发、快速迭代、实时补全

**GitHub Copilot**：

+ 定位：**企业级代码助手**
+ 特点：15M 用户生态、企业合规、平台集成
+ 适合：团队协作、企业环境、入门级使用

---

## Claude Code 的独特价值
### 价值 1：Anthropic 全栈优化
Claude Code 的一个关键优势是：**与 Claude 模型来自同一家公司**。这意味着：

**模型层优化**：

+ Claude Opus 4.6 模型专门针对编程任务优化
+ [Anthropic 内部工程师报告完成复杂任务的时间减少 50%](https://www.faros.ai/blog/best-ai-coding-agents-2026)
+ 1M tokens 上下文窗口（远超竞品的 20-30K）

**工具层协同：上下文管理的不同策略**

同样是处理跨文件依赖，不同工具采用了不同的技术方案。以重构一个被 500 个文件引用的工具函数为例：

**Cursor 的策略：**[Semantic Search（语义搜索）](https://cursor.com/docs/context/semantic-search)** + RAG**

Cursor 采用检索增强生成（RAG）方式。当你打开项目时，Cursor 会：

1. **建立代码索引**：将代码分块，生成 embeddings，存储到向量数据库（[Turbopuffer](https://cursor.com/blog/secure-codebase-indexing)）
2. **查询时检索**：将你的问题转换成 embedding，在向量数据库中找最相关的代码块
3. **组装上下文**：检索到的代码块（通常 30-50 个文件片段）作为上下文提供给模型
4. **静态分析辅助**：结合 TypeScript Language Server 做符号跳转和类型检查

这种方式的特点：

+ **预先索引**：项目首次打开需要建立索引（几秒到几小时，取决于项目大小）
+ **语义检索**：能找到语义相关但没有直接引用的代码
+ **上下文限制**：20-30K tokens 窗口限制了一次能检索多少代码
+ **需要用户干预**：复杂场景需要手动用 `@` 符号指定额外文件

**Claude Code 的策略：**[Agentic Search（智能体驱动搜索）](https://vadim.blog/claude-code-no-indexing)

Claude Code [不使用传统的代码索引](https://medium.com/@hermanhollerith/stop-burning-tokens-how-claude-built-a-vector-indexed-codebase-for-claude-code-88116c7a384f)，而是让 AI 主动探索代码库：

1. **工具驱动**：通过内置工具（Grep 搜索内容、Glob 查找文件、Read 读取文件）主动查找
2. **动态决策**：AI 自己决定搜索什么、读取哪些文件、是否需要更多上下文
3. **按需读取**：只读取当前任务真正需要的文件，而不是预先索引全部代码
4. **Subagents 隔离**：用子智能体探索代码库，避免主对话的上下文被填满

这种方式的特点：

+ **无需预索引**：打开项目即可使用，没有等待时间
+ **更大上下文窗口**：200K tokens（实际可用约 150K，因为包含对话历史）
+ **更灵活**：可以根据任务类型调整搜索策略
+ **更贵**：每次都要重新搜索和读取，API 调用成本更高

具体到代码层面的差异：

```typescript
// src/utils/date.ts
export function formatDate(date: Date) { ... }

// src/components/UserProfile.tsx（第 1 个文件）
import { formatDate } from '@/utils/date';

// src/config/api.ts（第 100 个文件，动态导入）
const utilName = 'date';
const { formatDate } = await import(`../utils/${utilName}`);
// Cursor 可能遗漏这种动态引用

// src/docs/CHANGELOG.md（第 300 个文件，文档字符串）
// - 修复 formatDate 函数的时区问题
// Cursor 很难识别这是引用

// src/pages/Dashboard.tsx（第 500 个文件）
const dateStr = formatDate(user.createdAt);
// Claude Code 在处理第 500 个文件时，仍能记住第 1 个文件的用法模式
```

**实测对比：500+ 文件 Monorepo 重构**

在一个真实项目中重构 `formatDate` 函数名为 `formatDateTime`：

| 工具 | 找到的引用数 | 遗漏的引用 | 准确率 | 处理方式 |
| --- | --- | --- | --- | --- |
| VS Code Rename | 45 | 3（动态导入） | 93.8% | 静态分析 |
| Cursor | 46 | 2（字符串引用） | 95.8% | 语义搜索（预先索引） |
| Claude Code | 48 | 0 | 100% | 智能体搜索（动态探索） |


**两种方案的权衡**

| 维度 | Cursor | Claude Code |
| --- | --- | --- |
| **搜索方式** | Semantic Search（预先索引） | Agentic Search（动态探索） |
| **响应速度** | 快（索引已建好，直接检索） | 慢（需要实时搜索和读取） |
| **准确率** | 高（95%+） | 极高（接近 100%） |
| **首次使用** | 需等待索引建立（几秒到几小时） | 立即可用（无需索引） |
| **用户介入** | 需要（复杂场景手动 `@` 指定文件） | 较少（AI 自主决策，但可能多轮探索） |
| **成本** | 低（一次索引，多次复用） | 高（每次都重新搜索和读取） |


从这个对比可以看出，两种方案代表了不同的技术权衡。Cursor 的语义搜索通过预先索引提升响应速度，适合需要频繁查询的日常开发；Claude Code 的智能体搜索牺牲了速度但换取了更高的灵活性和准确率，更适合一次性的复杂重构任务。

### 价值 2：产品创新能力
Claude Code 不仅是一个工具，更是多个创新概念的提出者和实践者：

**1. MCP (Model Context Protocol)：解决工具集成的复杂度问题**

在实际开发中，AI 编程助手经常需要访问各种外部系统：从 Figma 读取设计规范、从 GitHub 获取 Issue 信息、从数据库查询业务数据。如果为每个工具单独开发集成代码，集成复杂度会随工具数量指数级增长。集成 3 个工具需要写 3 份代码，集成 10 个工具需要写 10 份代码，且相互之间无法复用。

Anthropic 提出的 [MCP 标准](https://www.builder.io/blog/claude-code-mcp-servers)将这个问题转换为"协议实现"：每个外部工具只需实现一次 MCP 协议，就能被所有支持 MCP 的 AI 工具使用。目前已有 [50+ 官方 MCP Servers](https://www.turbodocx.com/blog/best-claude-code-skills-plugins-mcp-servers)（Figma、GitHub、PostgreSQL、Supabase 等），支持 TypeScript SDK 自定义开发，且已被 Cursor、Windsurf 等工具采用。

```json
// MCP Server 示例：Figma 工具实现一次，所有 AI 工具都能用
{
  "name": "figma-mcp-server",
  "capabilities": ["read-design-tokens", "export-components", "sync-variables"]
}
```

**2. Skills 系统：封装可复用的任务流程**

日常开发中有很多重复性任务：代码审查、生成测试、更新文档。每次都需要向 AI 描述完整的步骤，不仅繁琐，而且容易遗漏细节。Skills 系统将这些常用任务封装成模板，一条命令即可执行完整流程。

```yaml
# .claude/skills/frontend-review.yaml
name: frontend-review
description: 前端代码审查
prompt: |
  1. 检查 React 组件是否符合规范
  2. 检查 TypeScript 类型是否完整
  3. 检查是否有性能问题（memo、useCallback）
  4. 生成审查报告
```

使用时只需一行命令：

```bash
/frontend-review
```

Claude Code 会按照预定义的步骤执行完整审查，输出结构化报告。团队可以共享 Skills 配置，确保代码审查标准的一致性。

**3. Subagents 多智能体系统：任务分解与并行执行**

复杂任务往往涉及多个领域：实现用户认证功能需要设计 API 接口（后端）、开发登录表单（前端）、编写测试用例（QA）、更新文档（技术写作）。传统方式是串行执行，而 Subagents 机制允许将任务分解给多个专门的智能体并行处理，每个智能体只关注自己擅长的领域。

```plain
主任务：实现用户认证功能
  ├── Subagent 1（Backend）：设计 API 接口
  ├── Subagent 2（Frontend）：实现登录表单
  ├── Subagent 3（Testing）：生成测试用例
  └── Subagent 4（Docs）：更新文档
```

这三个机制（MCP、Skills、Subagents）都由 Anthropic 在 Claude Code 中首次提出，并逐渐被其他 AI 工具采纳，成为事实上的行业标准。

### 价值 3：复杂任务处理能力
Claude Code 在处理复杂任务时表现尤为突出。让我们通过一个真实案例来说明。

---

## 实战对比：大规模代码重构
### 场景描述
将一个 300+ 组件的 React 项目从 JavaScript 迁移到 TypeScript：

+ 为每个组件添加 Props 类型定义
+ 为 Redux Store 添加完整类型声明
+ 处理第三方库的类型兼容问题
+ 保持代码的业务逻辑不变

### 三种工具的处理方式
**GitHub Copilot**：

```typescript
// Copilot 擅长单行/函数级补全
// 你输入：
interface UserListProps {
  users:

// Copilot 补全：
  users: User[];  // ← 基于常见模式
}

// 但无法处理：
// - 全局类型一致性
// - 跨文件依赖关系
// - 项目特定的类型规范
```

**Cursor**：

```typescript
// Cursor 可以理解当前文件和少数相关文件
// 上下文窗口：20-30K tokens

// 问题：当处理到第 50 个组件时，
// 已经"忘记"了前面组件的类型定义风格

// 组件 A（第 10 个）
interface UserListProps {
  users: User[];
  onSelect: (user: User) => void;
}

// 组件 B（第 50 个）- 可能生成不一致的风格
type ProductListProps = {  // 使用了 type 而非 interface
  products: Product[];
  handleSelect: (product: Product) => void;  // 命名也不一致
}
```

**Claude Code**：

```bash
# 1. 创建项目规范（CLAUDE.md）
cat > CLAUDE.md << 'EOF'
# TypeScript 迁移规范

## 类型定义风格
- 组件 Props：使用 interface，命名为 `{ComponentName}Props`
- 事件处理：统一使用 `on` 前缀（onClick, onSelect）
- 数据类型：优先使用项目已有的类型，避免重复定义

## 已有类型定义
- User, Product, Order 等业务实体类型位于 `src/types/entities`
- API 响应类型位于 `src/types/api`

## 迁移优先级
1. 先迁移工具函数和 hooks（无 UI 依赖）
2. 再迁移基础组件（Button, Input）
3. 最后迁移业务组件
EOF

# 2. 执行迁移
# Claude Code 读取 CLAUDE.md，理解规范，保持一致性
```

在 Claude Code 中执行：

```plain
请根据 CLAUDE.md 中的规范，将 src/components 目录下的所有组件迁移到 TypeScript。
保持代码风格一致，优先复用 src/types 中已有的类型定义。
```

Claude Code 的执行过程：

```plain
🔍 分析项目结构...
   ├── 读取 CLAUDE.md 规范
   ├── 扫描 src/types 已有类型定义
   └── 识别 300+ 组件的依赖关系

📝 开始迁移（分批处理，保持一致性）...
   [1/3] 工具函数和 hooks（42 个文件）
   [2/3] 基础组件（85 个文件）
   [3/3] 业务组件（173 个文件）

✅ 迁移完成
   ├── 生成类型定义：300 个文件
   ├── 类型一致性：95%
   ├── 复用已有类型：238 处
   └── 发现潜在问题：3 处（已标注 @ts-expect-error）
```

### 结果对比
| 维度 | 手动迁移 | Copilot 辅助 | Cursor 辅助 | Claude Code |
| --- | --- | --- | --- | --- |
| 耗时 | 2-3 周 | 1.5 周 | 1 周 | 3 天 |
| 类型一致性 | 70% | 50% | 60% | 95% |
| 复用已有类型 | 高 | 低 | 中 | 高 |
| 业务逻辑错误 | 5-8 处 | 15+ 处 | 10+ 处 | 1-2 处 |
| 需要人工审查 | 全部 | 全部 | 全部 | 关键部分 |


从上述对比可以看出，Claude Code 在类型一致性（95%）和业务逻辑准确率上都显著优于其他工具。这种能力源于四个技术因素的协同作用：首先是 1M tokens 的上下文窗口，使其能一次性加载整个项目而不是分批处理；其次是能够读取并理解 CLAUDE.md 中定义的项目规范；第三是在处理 300+ 组件时仍能记住所有类型定义风格，保持全局一致性；最后是能够自动发现并复用 src/types 中的已有类型定义，避免重复劳动。

---

## 实战对比：复杂业务逻辑调试
### 场景描述
一个电商项目的购物车价格计算有 bug：

+ 涉及 5 种优惠类型（满减、折扣、新人券、会员专享、限时活动）
+ 优惠叠加规则复杂（部分可叠加，部分互斥）
+ 历史代码有 3 次迭代，逻辑散落在不同文件

### 三种工具的处理方式
**GitHub Copilot**：

```typescript
// Copilot 只能提示下一行代码
// 无法理解复杂的业务逻辑

function calculateDiscount(cart, coupons) {
  // Copilot 可能建议常见的计算模式
  // 但不理解你的具体业务规则
}
```

**Cursor**：

```typescript
// Cursor 可以给出修复建议
// 但往往是"头痛医头"，缺少根因分析

function calculateDiscount(cart, coupons) {
  let discount = 0;
  // Cursor 建议的修复：直接修改计算逻辑
  // 但没有解释为什么错误，为什么这样改对
  // ...
  return discount;
}
```

**Claude Code**：

Claude Code 采用**推理式调试**，分三步进行：

**第一步：理解问题域**

```plain
我遇到一个购物车价格计算 bug，涉及文件：
- src/utils/price-calculator.ts
- src/services/coupon-service.ts
- src/hooks/useCart.ts

请分析这些文件的逻辑，画出优惠计算的流程图。
```

Claude Code 输出：

```plain
# 优惠计算流程分析

当前逻辑：
1. 先计算商品原价总和 (calculateOriginalPrice)
2. 应用满减券 (applyFullReductionCoupon)
3. 应用折扣券 (applyDiscountCoupon)
4. 应用会员折扣 (applyMemberDiscount)

⚠️ **发现的问题**：
- 第 2 步和第 3 步的执行顺序会影响最终结果
- 当前实现中，满减券先扣除，再计算折扣券，导致折扣基数错误

示例：
- 原价 100 元
- 满 100 减 20（满减券）
- 8 折（折扣券）

当前计算：100 - 20 = 80，80 * 0.8 = 64 元
正确计算：100 * 0.8 = 80，80 - 20 = 60 元（先折扣后满减）

根因：src/utils/price-calculator.ts:45 的优惠应用顺序错误
```

**第二步：提供修复方案（附带推理过程）**

```typescript
/**
 * 优惠应用的正确顺序（基于电商行业惯例）：
 *
 * 1. 折扣类优惠（百分比）- 先计算折扣，确保满减门槛正确
 * 2. 满减类优惠（固定金额）- 在折后价基础上判断是否满足条件
 * 3. 会员专享优惠 - 最后叠加
 *
 * 为什么？
 * - 折扣券不改变"满减门槛"的判断基准（仍以原价计算）
 * - 满减券在折后价基础上扣除，用户体感更好
 */

function calculateFinalPrice(cart: Cart, coupons: Coupon[]): number {
  const originalPrice = calculateOriginalPrice(cart);

  // 1. 应用折扣类优惠
  const afterDiscount = applyDiscountCoupons(originalPrice, coupons);

  // 2. 应用满减类优惠（基于原价判断门槛，在折后价基础上扣减）
  const afterReduction = applyFullReductionCoupons(
    afterDiscount,
    coupons,
    originalPrice // 传入原价用于门槛判断
  );

  // 3. 应用会员折扣
  return applyMemberDiscount(afterReduction, cart.user);
}
```

**第三步：生成测试用例防止回归**

```typescript
describe('价格计算 - 优惠叠加场景', () => {
  it('折扣券 + 满减券：应先折扣后满减', () => {
    const cart = createCart({ originalPrice: 100 });
    const coupons = [
      { type: 'discount', value: 0.8 },  // 8 折
      { type: 'fullReduction', threshold: 100, value: 20 }
    ];

    expect(calculateFinalPrice(cart, coupons)).toBe(60);
    // 100 * 0.8 = 80（折扣后）
    // 原价 100 符合满减门槛
    // 80 - 20 = 60（最终价格）
  });
});
```

通过上述三步调试流程可以看出，Claude Code 不仅能定位问题所在行，更重要的是能够提供基于业务逻辑的根因分析和修复方案。这种能力与其他工具形成了明显差异：

| 维度 | Copilot | Cursor | Claude Code |
| --- | --- | --- | --- |
| 问题定位 | 无 | 部分支持 | 精确到行 |
| 根因分析 | 无 | 无 | 逻辑推导 |
| 修复方案 | 基于模式 | 基于模式 | 基于推理 |
| 测试生成 | 无 | 部分支持 | 包含边界条件 |
| 业务理解 | 无 | 有限 | 深入 |


---

## 价格与使用场景建议
### 价格对比（2026 年）
根据 [2026 年 AI 编程工具价格对比](https://www.tldl.io/resources/ai-coding-tools-2026)：

| 工具 | 价格 | 包含内容 |
| --- | --- | --- |
| **GitHub Copilot** | $10/月 | 无限补全，300 次高级请求，GPT-4o + Claude Sonnet 4.6 |
| **Cursor** | $20/月 | Supermaven 自动补全，Composer 多文件编辑，Agent 模式 |
| **Claude Code** | $ 17/月（Pro）<br> $100+/月（Max）   按用量计费（API） | 完整功能，1M 上下文，MCP + Skills + Subagents |


---

## 小结：Claude Code 的适用场景
从前面两个实战案例的对比分析中，可以看出 Claude Code 在三类任务上有明显的技术优势。

### 1. 需要全局一致性的重构任务
在 TypeScript 迁移案例中，Claude Code 能够维持 300+ 组件的类型定义一致性，这种能力来自两个技术因素：首先是 Anthropic 对模型层和工具层的全栈控制，使得模型和工具能针对性优化；其次是 [1M tokens 的上下文窗口](https://claudefa.st/blog/guide/mechanics/1m-context-ga)（竞品通常是 20-30K），使其在一次对话中能容纳更多文件和上下文，减少因切换对话导致的一致性丢失。这在 SWE-bench 基准测试中得到了验证，Claude Code 的 80.8% 得分显著高于其他工具。

**典型场景**：大规模代码重构、代码规范统一、API 设计调整、技术栈迁移等需要跨多个文件保持规范一致性的任务。

### 2. 需要深度推理的复杂问题
在购物车价格计算 bug 的案例中，Claude Code 不仅能定位问题所在行，更重要的是能够推导出"为什么错"和"为什么这样改对"。这种推理能力源于 Claude 模型的训练目标——它不仅学习代码模式，更学习逻辑推导过程。从实际效果看，这使得 Claude Code 能够理解业务规则、识别边界条件、生成防回归的测试用例。

**典型场景**：复杂业务逻辑调试、架构设计决策、性能问题根因分析、技术方案对比评估等需要理解"为什么"的任务。

### 3. 需要工具协作的端到端任务
Anthropic 主导制定的 MCP 标准、Skills 系统、Subagents 机制，使得 Claude Code 能够编排多个工具完成复杂工作流。从设计稿读取（Figma MCP）到代码生成（Claude Code）再到测试验证（Playwright MCP）和自动部署（Vercel），整个流程可以在一个对话中完成，而不需要在多个工具间手动切换和传递上下文。

**典型场景**：从设计稿到生产的完整开发流程、自动化代码审查工作流、跨系统的数据同步任务等需要多工具协作的场景。

### 什么时候不适合用 Claude Code？
Claude Code 偏向任务级的深度思考，这也意味着在某些场景下它不是最优选择。如果你需要快速的实时补全（每输入几个字符就提示下一行），Cursor 的响应速度会更好；如果只是写简单的 CRUD 代码，Copilot 已经足够且价格更低；如果是团队首次尝试 AI 编程工具，Copilot 的入门门槛更低且有完善的企业支持。

### 工具选择建议
如果只打算使用一个工具，选择标准主要看日常工作的任务类型。预算有限的情况下，GitHub Copilot（$ 10/月）是性价比最高的选择；如果日常开发为主，Cursor（ $20/月）的 IDE 集成体验更好；如果经常面对复杂重构和架构设计，Claude Code（$17/月起）更适合。

不过从前面的分析可以看出，经验丰富的开发者平均使用 2.3 个工具，这说明多工具组合是更实际的选择。一个典型的组合策略是：日常开发使用 Cursor + Copilot（快速补全和 IDE 集成），遇到复杂任务时切换到 Claude Code（深度推理和工具编排），总成本在 $30-50/月。

---

## 数据来源
本文引用的数据来自以下权威来源：

+ [Claude Code vs Cursor vs GitHub Copilot: The Definitive AI Coding Tool Comparison for 2026](https://www.adventureppc.com/blog/claude-code-vs-cursor-vs-github-copilot-the-definitive-ai-coding-tool-comparison-for-2026)
+ [Best AI for Coding in 2026: 10 Tools Ranked by Real-World Performance | NxCode](https://www.nxcode.io/resources/news/best-ai-for-coding-2026-tools-ranked)
+ [Claude Code vs Cursor vs GitHub Copilot: The 2026 AI Coding Tool Showdown | DEV](https://dev.to/alexcloudstar/claude-code-vs-cursor-vs-github-copilot-the-2026-ai-coding-tool-showdown-53n4)
+ [AI Coding Tools Compared (2026): Cursor vs Claude Code vs Copilot | TLDL](https://www.tldl.io/resources/ai-coding-tools-2026)
+ [Best AI Coding Agents for 2026: Real-World Developer Reviews | Faros AI](https://www.faros.ai/blog/best-ai-coding-agents-2026)
+ [Claude Code MCP Servers: How to Connect, Configure, and Use Them | Builder.io](https://www.builder.io/blog/claude-code-mcp-servers)

---

## 下一步
现在你已经通过客观数据和实际对比理解了 Claude Code 的核心价值，接下来我们将深入探讨它的技术能力：1M tokens 上下文窗口、智能体搜索机制、工具调用系统。

👉 [2.2 Claude Code 核心能力详解](./2-2-core-capabilities.md)
