# 第 35 章　JVM 类加载、运行时内存与垃圾回收

> 学习提示：先建立"class 文件如何变成运行中的代码和数据"这一条主线，再逐步理解堆、栈、方法区的分工和垃圾回收的判断依据。不要求记忆 GC 参数。
> 一句话总结：JVM 把 class 文件加载为运行时的类和对象；堆存放对象实例，栈存放方法调用的局部变量，方法区存放类元数据；垃圾回收通过可达性分析自动释放不再使用的对象，OOM 是内存不足的信号而非"程序写错了"。

第 3 章用 `javac` 编译源码生成 class 文件，用 `java` 运行它。从 class 文件到可执行程序，中间发生了类加载、内存分配、执行和垃圾回收。理解 JVM 的运行模型，能帮助解释"内存占用为什么增长""为什么有些对象不会自动消失""OutOfMemoryError 是什么意思"。

## 一、JVM 在操作系统中的位置

[[JVM]]（Java Virtual Machine）是运行 Java class 文件的虚拟计算机。它不是一个物理硬件，而是一个在操作系统上运行的进程。JVM 屏蔽了底层操作系统的差异：Windows 和 Linux 上的 JVM 都执行相同的 class 文件，输出相同的结果。

```text
Java 源码 (*.java)
  → javac 编译
class 文件 (*.class) — 独立于操作系统的字节码
  → JVM 加载、验证、解释/编译
操作系统（Windows / macOS / Linux）
```

JVM 的主要职责分三块：

1. **类加载**：把 class 文件读入内存，解析为 JVM 能理解的数据结构。
2. **内存管理**：为对象和方法分配内存，并在不再需要时释放。
3. **执行**：解释执行或 JIT 编译 class 文件中的字节码。

## 二、类加载：从 class 文件到运行时可用的类

### 2.1 类加载的三个步骤

类加载不是一次性完成的，而是按需进行的懒加载。一个类从 class 文件到 JVM 中可以使用，经历三个阶段：

```text
加载（Loading）
  → 通过类的全限定名（如 studio.aicourse.UserService）找到 class 文件
  → 把字节流转换为方法区的运行时数据结构
  → 在堆中创建 java.lang.Class 对象（代表这个类）

链接（Linking）
  → 验证：检查 class 文件的字节码合法性（没有非法跳转、类型安全）
  → 准备：为类的静态字段分配内存，并设为默认值（int=0，对象=null）
  → 解析：把常量池中的符号引用替换为直接引用（如"调用 UserService 的 findById 方法"→ 指向方法区的确切内存地址）

初始化（Initialization）
  → 执行静态字段赋值和 static {} 代码块
  → 初始化按代码顺序执行，且 JVM 保证多线程环境下的初始化安全
```

### 2.2 类加载器层次

JVM 使用多个[[类加载器]]（ClassLoader），按父子关系组织：

```text
Bootstrap ClassLoader（启动类加载器）
  → 加载核心库：java.lang.*、java.util.* 等（JDK 中 rt.jar 或 modules）
  ↓
Platform ClassLoader（平台类加载器，原 Extension ClassLoader）
  → 加载 JDK 扩展模块
  ↓
Application ClassLoader（应用类加载器）
  → 加载 classpath 上的用户类
```

这种层次使用[[双亲委派模型]]：一个类加载器收到加载请求时，先委托给父加载器，父加载器找不到时才自己尝试加载。好处是：

- 核心类（`java.lang.String`）只能被 Bootstrap ClassLoader 加载，防止用户自定义 `java.lang.String` 替代核心类（安全）。
- 同一个类在全限定名相同的情况下，不会重复加载。

### 2.3 类在何时被加载

JVM 规范不强制规定类加载的具体时间，但要求必须在这个类**首次主动使用**之前完成加载和初始化。触发类初始化的常见场景：

- 创建类的实例（`new UserService()`）
- 访问类的静态字段（`UserService.DEFAULT_TIMEOUT`）
- 调用类的静态方法（`UserService.getInstance()`）
- 通过反射访问类（`Class.forName("studio.aicourse.UserService")`）

声明类变量或通过子类访问父类静态字段不会触发当前类初始化——只会初始化真正定义了该静态字段的类。

## 三、运行时内存区域

JVM 把管理的内存划分为几个区域。其中最重要的三个：

```text
JVM 进程内存
├── 堆（Heap）：对象实例。所有线程共享。GC 主要工作区域。
├── 方法区（Method Area / Metaspace）：类元数据、静态字段、常量池。所有线程共享。
├── 栈（Stack）：每个线程一个。局部变量、操作数栈、方法调用帧。线程私有。
└── 本地方法栈 / 程序计数器 / 直接内存（课程暂不展开）
```

### 3.1 堆：对象存放的地方

所有 `new` 出来的对象都在堆上分配（JDK 17 主线）。第 6 章中的对象引用图和"变量保存引用、对象在堆上"就是在这个模型下画的：

```java
String text = new String("hello");
// text（局部变量）→ 在栈上
// String 对象 → 在堆上
```

堆是所有线程共享的。当堆中没有足够空间分配新对象时，JVM 抛出 [[OutOfMemoryError]]。

### 3.2 栈：方法调用的现场

每次方法调用，JVM 在当前线程的栈上创建一个[[栈帧]]（Stack Frame）。栈帧包含：

- **局部变量表**：方法内部的局部变量，包括 `this`（实例方法隐含的第一个参数）。
- **操作数栈**：字节码执行时的临时计算栈。
- **方法返回地址**：方法调用完成后的返回位置。

方法返回时，该栈帧弹出并销毁。栈帧内的局部变量不再被任何引用指向。这也是"局部变量在方法返回后不可访问"的底层原因。

```java
void example() {
    String name = "Ada";    // name 在栈帧的局部变量表
    int length = 5;         // length 在栈帧的局部变量表
    calculate(length);      // 创建新的栈帧
}
// 方法返回，栈帧销毁，name 和 length 不再存在
```

### 3.3 方法区：类的描述信息

JDK 8 之前叫永久代（PermGen），JDK 8 及之后改为[[元空间]]（Metaspace）。方法区保存：

- 类的结构信息（字段名和类型、方法名和签名）
- 方法字节码
- 常量池（类中的字面量和符号引用）
- 静态字段的值

方法区也会发生 OOM。如果应用动态生成了大量类（如通过代理、反射或 Groovy 脚本），元空间可能被撑满，抛出 `OutOfMemoryError: Metaspace`。

## 四、对象生命周期与垃圾回收

### 4.1 垃圾的定义

[[垃圾]]（Garbage）是"不再被任何活跃引用指向的对象"。判断标准是[[可达性分析]]：

```text
从 GC Roots 出发，沿着引用链可以到达的对象 → 存活
从 GC Roots 出发无法到达的对象 → 垃圾，可以回收
```

[[GC Root]]包括：

- 栈帧中局部变量表指向的对象
- 静态字段指向的对象
- JNI 引用（本地方法持有的对象）
- 活跃线程对象

```java
public class Reachability {
    public static void main(String[] args) {
        Person p = new Person("Ada");  // p 是 GC Root → 对象可达
        p = null;                       // p 不再指向对象 → 对象不可达 → 垃圾
    }
}
```

注意：`p = null` 后对象变成不可达，但 JVM 不立即回收它。GC 在它认为合适的时候回收。

### 4.2 垃圾回收的过程

[[垃圾回收]]（Garbage Collection，简称 GC）自动回收不可达对象占用的内存。它分两步：

**标记**：从 GC Roots 出发遍历引用图，标记所有可达对象。

**清除**：回收未标记（不可达）对象占用的内存。

```text
标记之前：
堆: [A] [B] [C] [D] [E]
GC Roots → A → B    D → E
C 没有任何引用链到达

标记之后：
A(存活) B(存活) C(垃圾) D(存活) E(存活)

清除之后：
A, B, D, E 保留。C 的内存被回收。
```

### 4.3 对象晋升与分代

大多数对象在创建后很快变成垃圾；少数对象存活很长时间。HotSpot JVM 把堆划分为不同的[[代]]（Generation），对不同代使用不同的回收策略：

```text
新生代（Young Generation）
├── Eden 区：新对象首先分配在这里。Eden 区满时触发 Minor GC
├── Survivor 0（S0）：Minor GC 后存活的对象被复制到这里
└── Survivor 1（S1）：下一次 Minor GC 时 S0 存活对象复制到 S1
    对象在 S0 和 S1 之间反复复制，每存活一次"年龄"增加

老年代（Old Generation / Tenured）
  ← 对象在新生代达到晋升阈值（默认 15 次 GC 后仍存活）
    老年代空间大，回收频率低。Major GC / Full GC 时检查
```

Minor GC 回收新生代，速度快、频率高。Major GC/Full GC 回收老年代（通常也伴随回收新生代），速度较慢。如果 Full GC 后仍没有足够空间，抛出 `OutOfMemoryError: Java heap space`。

### 4.4 JDK 17 默认的 GC

JDK 17 默认使用 G1 GC（Garbage-First）。它不再严格按照物理上的"新生代/老年代"划分，但逻辑上仍保留代的概念。G1 把堆划分为多个大小相等的 Region，每次 GC 选择回收收益最高（垃圾最多）的 Region，"Garbage First"由此得名。

不需要在初学阶段记忆 GC 参数。理解两个基本原则即可：

1. GC 自动运行，不需要手动调用 `System.gc()`。
2. 频繁的 Full GC 说明堆内存不足以支撑当前的活跃对象量，需要排查内存泄漏或调整堆大小。

## 五、JIT 编译与执行模式

Java 程序以解释模式启动——JVM 逐条解释执行字节码。当某段代码频繁执行（热点代码，HotSpot 名字的由来），JIT（Just-In-Time）编译器把它编译成本地机器码，后续直接执行机器码而不是字节码，速度大幅提升。

```text
初始阶段：解释执行（慢，但启动快）
检测到热点代码 → JIT 编译为本地代码
后续执行：直接执行本地机器码（快）
```

这就是 Java"先慢后快"的原因：刚启动时解释执行，运行一段时间后热点代码被编译，性能逐渐提升。

### 4.5 常用 GC 算法对比

JDK 历史上出现过多款垃圾回收器，各自适用不同场景。JDK 17 默认 G1，以下对比帮助阅读旧项目或选择回收器时参考：

| 回收器 | 目标 | 暂停特点 | 适用场景 |
| --- | --- | --- | --- |
| Serial GC | 单线程回收 | Stop-The-World，暂停明显 | 客户端应用、小堆（<100MB） |
| Parallel GC（JDK 8 默认） | 吞吐量优先 | Stop-The-World，多线程并行回收 | 批处理、后台任务 |
| G1 GC（JDK 17 默认） | 平衡吞吐与延迟 | 分 Region 增量回收，可设暂停目标 | 大多数服务端应用（堆 4GB-64GB） |
| ZGC（JDK 15 稳定） | 超低延迟 | 暂停 <1ms（JDK 17 为实验性，JDK 21 正式） | 对延迟极敏感的服务 |
| Shenandoah（JDK 17 稳定） | 低延迟 | 与运行线程并发回收 | 大堆应用 |

GC 选择的核心权衡：**吞吐量 vs 暂停时间**。Parallel GC 追求高吞吐但暂停长；G1、ZGC 追求低延迟但总吞吐略低。JDK 17 默认 G1 对多数后端服务是合适的起点。

可通过 JVM 参数切换回收器：`-XX:+UseG1GC`（G1）、`-XX:+UseParallelGC`（Parallel）、`-XX:+UseZGC`（ZGC）。生产环境不要随意切换回收器——先在测试环境验证切换后的吞吐和暂停变化。

## 六、常见 OOM 与排查信号

### 6.1 三种常见 OOM

| 类型 | 原因 | 堆栈信息 |
| --- | --- | --- |
| 堆空间不足 | 存活对象太多，堆放不下 | `java.lang.OutOfMemoryError: Java heap space` |
| 元空间不足 | 大量动态生成类 | `java.lang.OutOfMemoryError: Metaspace` |
| GC 开销超限 | GC 频繁但每次回收的内存很少 | `java.lang.OutOfMemoryError: GC overhead limit exceeded` |

"堆空间不足"最常见。可能原因：内存泄漏（对象被无意中持续引用）、堆配置过小、业务数据量增长超出预期。

### 6.2 排查的第一步

不是直接调大堆内存。先问：

1. 是"内存慢慢涨上去的"（泄漏）还是"突发大量分配"（正常但配置不足）？
2. 哪些类的实例最多？

使用 `jcmd` 查看堆信息（第 36 章详述）：

```bash
# 查看堆中各类对象的数量和大小
jcmd <pid> GC.class_histogram
```

输出类似：

```text
 num     #instances         #bytes  class name
   1:       1500000       36000000  java.lang.String
   2:        200000       16000000  [B
```

如果 String 实例有 150 万个、占用 36MB 堆，而业务逻辑中不应该有这么多 String，这就是排查的起点。

### 6.3 不是所有 OOM 都需要修复代码

`OutOfMemoryError` 是资源不足信号，不一定是代码缺陷。业务数据增长超出初始预期、第三方库缓存膨胀、一次性查询结果集过大——这些都可能需要调整配置或优化设计，而不一定是"某个地方写了死循环"。

## 七、练习与验收

### 练习 1：画引用图与可达性

给出以下代码，画出方法进入时和 `p = null` 后的对象引用图。标出 GC Root 和不可达对象：

```java
Person p = new Person("Ada");
Person q = p;
p = null;
// q 是否还指向对象？对象是否可达？
System.out.println(q.getName());
```

### 练习 2：观察类加载

编写一个小程序，运行时添加 JVM 参数 `-verbose:class`，观察加载了哪些类。统计输出中出现了多少个 `java.` 和 `studio.` 开头的类。解释为什么 `java.lang.String` 在 `main` 方法执行前就已经被加载了。

### 练习 3：手动触发 OOM

编写代码不断向一个 `List<String>` 添加字符串，直到抛出 `OutOfMemoryError: Java heap space`。记录抛出异常时的 List 大小。然后修改 JVM 参数 `-Xmx256m` 和 `-Xmx512m` 分别测试，观察不同堆大小下的 OOM 触发点差异。

完成标准：能解释 -Xmx 参数的作用；能区分"代码缺陷 OOM"和"配置过小 OOM"。

## 常见误区

### 手动调用 System.gc()

`System.gc()` 是"建议"JVM 运行 GC，不是"命令"。JVM 可能忽略这个调用。依赖手动 GC 释放内存说明设计有问题。

### 把 GC 当作"程序卡顿的罪魁祸首"

GC 是必要的内存管理机制。如果没有 GC，开发者需要手动分配和释放所有内存（如 C 语言的 malloc/free），错误率更高。GC 导致的暂停（Stop-The-World）在合理的堆大小和对象分配速率下通常只有毫秒级。排查性能问题时不把"GC 暂停"当作唯一的解释。

### 以为"对象不再使用"就等于"对象可以回收"

可达性分析是客观的，不是基于"你不再用它了"。一个对象只要被 GC Root 引用链上的某个对象引用，就是可达的，不会被回收。忘记移除监听器、未关闭的资源引用、静态集合中的元素都可能造成意外的"可达但不再使用的对象"。

### 把所有内存问题都归类为"内存泄漏"

内存持续增长不一定都是泄漏。缓存设计为逐步填充、业务数据量自然增长都是正常现象。泄漏的判断标准是：GC 后仍然存活的对象数量持续且无界地增长。

## 本章小结

JVM 是运行 class 文件的虚拟计算机。类加载器按双亲委派模型加载类，首次主动使用时触发初始化。堆存放对象实例（所有线程共享），栈存放方法调用的局部变量（线程私有），方法区（元空间）存放类元数据。垃圾回收通过可达性分析标记不可达对象并释放内存，GC Root 是可达性分析的起点。堆分为新生代和老年代，新对象在 Eden 区分配，存活多次 GC 的对象晋升到老年代。JIT 编译器将热点代码编译为本地机器码提升性能。OOM 是资源不足信号，排查先看类实例直方图而不是直接调大内存。下一章是课程的最后一章——如何将前面 35 章的知识综合起来诊断 Web 后端的实际故障。

## 快速自测

1. JVM 堆、栈、方法区分别存放什么？
2. 对象从"被创建"到"被 GC 回收"之间经历了哪些阶段？
3. GC Root 有哪几种？
4. 类加载的双亲委派模型解决了什么问题？
5. `OutOfMemoryError: Java heap space` 和 `OutOfMemoryError: Metaspace` 分别指向哪类问题？

参考答案：堆存放对象实例，栈存放方法调用局部变量，方法区存放类元数据；Eden 区创建→Minor GC 存活进入 Survivor→多次存活晋升老年代→可达性不可达后被 GC 回收；栈帧局部变量、静态字段、JNI 引用、活跃线程；防止核心类被用户自定义的类替换（安全），避免同一全限定名类被重复加载；堆空间不足指向存活对象过多或堆配置过小，Metaspace 指向动态生成类过多。

## 参考文献

- Oracle. [Java SE 17 JVM Specification](https://docs.oracle.com/javase/specs/jvms/se17/html/).
- Oracle. [Java SE 17 Troubleshooting Guide](https://docs.oracle.com/en/java/javase/17/troubleshoot/).
- OpenJDK. [JEP 248：Make G1 the Default Garbage Collector](https://openjdk.org/jeps/248).
