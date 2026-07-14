# 第 34 章　线程安全、线程池与异步执行

> 学习提示：先创建两个简单的线程观察它们交替执行，再故意让它们共享一个变量观察竞态；线程池的参数不是越多越好，需要证据支撑。
> 一句话总结：线程让多个任务在同一个 JVM 中交替执行；共享可变状态是并发错误的主要来源，`AtomicInteger` 和 `synchronized` 是两种基本的保护手段；线程池复用线程避免频繁创建销毁，`CompletableFuture` 表达异步任务的组合关系。

前面 20 多章中，所有代码都是同步顺序执行的——一行完成后再执行下一行。当服务需要同时处理多个请求，或者在后台执行耗时任务时，需要创建多个执行线程。

## 一、线程是什么

[[进程]]是操作系统分配资源（内存、文件句柄）的基本单位。一个 Java 程序启动后就是一个进程。[[线程]]是进程中的执行单元，一个进程可以同时运行多个线程。线程之间共享进程的内存空间（堆），但每个线程有自己的调用栈。

```text
进程（JVM 实例）
├── 线程 1（main）
├── 线程 2（处理 HTTP 请求）
├── 线程 3（处理 HTTP 请求）
└── 线程 4（后台日志写入）
```

Spring Boot 的嵌入式 Tomcat 默认有一个线程池，每个 HTTP 请求分配一个线程处理。这就是为什么多个请求可以"同时"被处理——实际上是多个线程在交替或并行执行。

## 二、创建和观察线程

### 2.1 创建线程

```java
public class ThreadDemo {
    public static void main(String[] args) {
        Thread thread = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                System.out.println("新线程: " + i);
                sleep(100);
            }
        });
        thread.start(); // 启动新线程

        for (int i = 0; i < 5; i++) {
            System.out.println("主线程: " + i);
            sleep(100);
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

运行后输出类似（每次运行的交替顺序不同）：

```text
主线程: 0
新线程: 0
新线程: 1
主线程: 1
主线程: 2
新线程: 2
...
```

关键观察：

- 两个线程的输出交替出现，不是"先执行完新线程再执行主线程"。
- `thread.start()` 启动线程后立即返回，不等新线程执行完。
- `Thread.sleep(100)` 让当前线程暂停 100 毫秒，给其他线程执行机会。
- `InterruptedException` 的捕获和处理方式——调用 `interrupt()` 恢复线程中断状态。

### 2.2 线程不等于任务

`new Thread(任务)` 把任务和线程绑定。频繁创建线程开销很大——每个线程在操作系统内核中占用资源，创建和销毁都需要时间。在现代 Java 中，更推荐的做法是：**把任务提交给线程池，线程池管理线程的复用。**

### 2.3 Thread 与 Runnable 的关系

`Thread` 是表示一个执行线程的类，`Runnable` 是描述要执行的任务的接口。`new Thread(runnable)` 创建线程并赋予任务。更清晰的分离是：`Runnable task = () -> doWork();` 定义任务，然后 `executor.submit(task)` 提交给线程池。

## 三、共享状态与竞态条件

### 3.1 竞态的发生

两个线程操作同一个变量，没有同步保护：

```java
public class RaceCondition {
    private static int counter = 0;

    public static void main(String[] args) throws Exception {
        Runnable task = () -> {
            for (int i = 0; i < 10_000; i++) {
                counter++; // 这不是一个原子操作！
            }
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start();
        t2.start();
        t1.join(); // 等待 t1 结束
        t2.join(); // 等待 t2 结束

        System.out.println("期望: 20000, 实际: " + counter);
        // 输出: 期望: 20000, 实际: 18742（每次不同，通常小于 20000）
    }
}
```

为什么 `counter++` 不是原子的？它实际由三个步骤组成：

```text
1. 从主内存读取 counter 的当前值 → 线程本地缓存
2. 在本地缓存中计算 counter + 1
3. 把新值写回主内存
```

两个线程可能同时读到同一个值：

```text
时间线：
线程1: 读取 counter=100 → 计算 101 → 准备写回
线程2: 读取 counter=100 → 计算 101 → 写回 counter=101
线程1: 写回 counter=101

两次 ++ 只增加了一次！
```

这就是[[竞态条件]]——多个线程同时访问共享可变数据，结果取决于线程的调度顺序。

### 3.2 可见性问题

即使只有一个线程写、一个线程读，也不能保证读线程能看到写线程的最新值。JVM 可能将变量缓存在 CPU 寄存器或线程本地缓存中：

```java
private static boolean running = true;

// 线程1：设置 running = false
// 线程2：while (running) { ... }
// 线程2 可能永远看不到 running 的变化！
```

`volatile` 关键字解决可见性：标记为 `volatile` 的变量，修改后立即写回主内存，读取时总是从主内存获取最新值。但它不能解决计数器竞态（因为 `count++` 涉及读-改-写三步）。

## 四、同步与原子操作

### 4.1 synchronized

`synchronized` 保证一段代码在同一时刻只被一个线程执行：

```java
private static int counter = 0;
private static final Object lock = new Object();

// 同步代码块
synchronized (lock) {
    counter++;
}
```

每个 Java 对象都可以作为锁。线程进入 `synchronized` 块前必须先获取锁，如果锁被其他线程持有则等待。锁释放后，等待的线程竞争获取。

`synchronized` 同时解决原子性和可见性：进入 `synchronized` 块时，从主内存刷新变量值；退出 `synchronized` 块时，将修改写回主内存。

在方法上使用：

```java
public synchronized void increment() {
    counter++;
}
```

实例方法锁定的是 `this` 对象。静态方法锁定的是类的 `Class` 对象。实例方法和静态方法使用不同的锁，不互斥。

### 4.2 AtomicInteger

`java.util.concurrent.atomic` 包提供无锁的原子类：

```java
private static AtomicInteger counter = new AtomicInteger(0);

counter.incrementAndGet(); // 原子递增并返回新值
counter.get();              // 读取当前值
counter.compareAndSet(expected, newValue); // CAS 操作
```

`AtomicInteger` 使用[[CAS]]（Compare-And-Swap）CPU 指令实现原子操作——在修改前检查值是否与预期相同，相同才更新。不需要锁，性能通常优于 `synchronized`。CAS 的缺点是循环重试在高竞争下会消耗 CPU，对于极高的写入竞争（数十个线程同时修改一个变量），`synchronized` 或 `LongAdder`（JDK 8+）可能更适合。

### 4.3 选择指南

- 单个变量递增/递减 → `AtomicInteger`、`AtomicLong`
- 多步修改需要原子性（先查再改） → `synchronized` 或 `ReentrantLock`
- 集合的并发访问 → `ConcurrentHashMap`（第 20 章已在 Repository 中使用）
- 只读共享数据 → 不需要同步

尽量减少同步范围。锁内的代码越多，其他线程等待时间越长。

## 五、线程池

### 5.1 为什么需要线程池

```java
// 不推荐：每个任务创建一个新线程
new Thread(() -> handleRequest(request)).start();
```

如果每秒有 1000 个请求，创建 1000 个线程——每个线程占用约 1MB 栈空间（可配置），仅栈空间就需要 1GB 内存，还不包括创建和销毁的开销。

[[线程池]]维护一组可复用的线程，任务提交到队列，空闲线程从队列取出任务执行：

```java
ExecutorService executor = Executors.newFixedThreadPool(4);

executor.submit(() -> processOrder(order1)); // 提交任务，不等待
executor.submit(() -> processOrder(order2));

executor.shutdown(); // 不再接受新任务，等待已有任务完成
```

`newFixedThreadPool(4)` 创建固定包含 4 个线程的池。提交 100 个任务，最多 4 个同时执行，其余排队等待。

### 5.2 线程池参数

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                    // 核心线程数：常驻线程
    8,                    // 最大线程数：峰值允许的最大线程数
    60, TimeUnit.SECONDS, // 非核心线程的空闲存活时间
    new LinkedBlockingQueue<>(100), // 任务队列
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
);
```

- **核心线程数**：池中保持活跃的最小线程数。即使空闲也不回收。通常设为 CPU 核心数或 CPU 核心数+1 对于计算密集型任务最为合适。
- **最大线程数**：池中允许的最大线程数。超过核心数的线程在空闲超过存活时间后回收。I/O 密集型任务可设大于核心数，因为线程大部分时间在等待 I/O 而非计算。
- **队列**：任务多于线程时，多余任务进入队列等待。有界队列（如 `LinkedBlockingQueue<>(100)`）防止无限积压。
- **拒绝策略**：队列满且线程数达到最大时，新任务的处理方式：

| 策略 | 行为 |
| --- | --- |
| `AbortPolicy`（默认） | 抛 `RejectedExecutionException` |
| `CallerRunsPolicy` | 由提交任务的线程直接执行 |
| `DiscardPolicy` | 静默丢弃新任务 |
| `DiscardOldestPolicy` | 丢弃队列中最早的未处理任务 |

具体选择拒绝策略依赖于业务场景：不能被丢弃的任务用 `AbortPolicy`；可降级的用 `CallerRunsPolicy`；统计和日志用 `DiscardPolicy`（配合监控）。

### 5.3 根据证据设置参数

- **不要猜**。用监控数据（线程使用率、队列长度、拒绝次数）指导调参。
- **CPU 密集型任务**（计算、加密、压缩）的线程数接近 CPU 核心数。
- **I/O 密集型任务**（数据库查询、HTTP 调用、文件读写）的线程数可以多些，但不要设为"无限"——I/O 操作在执行时 CPU 可以切换到其他线程，看起来 I/O 线程像在"等待"，实际执行时间闲置让 CPU 可处理更多线程。将利用率从 CPU 监控（如 `top` 或 `vmstat`）和线程等待时间综合判断，而不是仅凭"I/O 操作多"就盲目堆高线程数。
- **混布线程池**：不同类型的任务使用不同的线程池，避免慢任务占满所有线程，导致快任务也无法执行。

Spring Boot 的 Tomcat 默认线程池用于 HTTP 请求处理，业务代码中如果需要异步执行，应使用独立的线程池。

### 5.4 ThreadLocal

线程池中的线程被多个任务复用。如果需要在同一个请求的整个处理链路中传递上下文（如当前用户、traceId），不能通过方法参数逐层传递——这会使每个方法都多一个参数。

`ThreadLocal` 为每个线程提供独立的变量副本，线程间互不干扰：

```java
public class RequestContext {
    private static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();

    public static void setUser(String username) { CURRENT_USER.set(username); }
    public static String getUser() { return CURRENT_USER.get(); }
    public static void clear() { CURRENT_USER.remove(); }
}
```

在 Filter 或 Interceptor 中设置 `RequestContext.setUser(username)`，Service 和 Repository 中通过 `RequestContext.getUser()` 获取，不需要层层传递参数。

Spring Security 的 `SecurityContextHolder` 默认就是通过 `ThreadLocal` 存储认证信息（第 30 章已使用）。

**关键规则**：使用 `ThreadLocal` 后必须调用 `remove()`。线程池中的线程被复用，如果不清理，下一个请求可能读到上一个请求残留的数据。在 Filter 的 `finally` 块中调用 `remove()` 是最安全的方式。

## 六、CompletableFuture 异步编排

[[CompletableFuture]] 是 Java 8 引入的异步任务编排工具。它比 `Future` 更强大：可以链式组合多个异步操作，处理异常，等待多个结果合并。

```java
CompletableFuture<Product> productFuture = CompletableFuture.supplyAsync(
    () -> productService.getById(productId), executor
);

CompletableFuture<List<Review>> reviewsFuture = CompletableFuture.supplyAsync(
    () -> reviewService.findByProductId(productId), executor
);

// 等待两个都完成，组合结果
CompletableFuture<ProductDetail> detailFuture = productFuture
    .thenCombine(reviewsFuture, (product, reviews) ->
        new ProductDetail(product, reviews)
    );

ProductDetail detail = detailFuture.join();
```

关键方法：

| 方法 | 含义 |
| --- | --- |
| `supplyAsync(fn, executor)` | 异步执行并返回结果 |
| `thenApply(fn)` | 前一步完成后，同步转换结果 |
| `thenCompose(fn)` | 前一步完成后，返回新的 CompletableFuture（避免嵌套） |
| `thenCombine(other, fn)` | 两个 CompletableFuture 都完成后，合并结果 |
| `allOf(...)` | 等待多个 CompletableFuture 全部完成 |
| `exceptionally(fn)` | 处理异常并返回降级值 |
| `join()` | 等待完成并返回结果（受检异常包装为 CompletionException） |

`join()` 与 `get()` 的区别：`get()` 抛出受检异常（`InterruptedException`、`ExecutionException`），而 `join()` 抛出未受检异常（`CompletionException`），在 Lambda 中更易使用。

## 七、JDK 21 虚拟线程旁路

JDK 21 引入了[[虚拟线程]]（Virtual Threads），它们是由 JVM 而非操作系统管理的轻量级线程。主要优势：创建成本极低（约 200 字节而非 1MB 栈空间），可以创建百万量级。

在 JDK 21+ 环境中，可以这样创建：

```java
// JDK 21+
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> processOrder(order));
}
```

虚拟线程适合 I/O 密集型任务——大量线程大部分时间在等待 I/O，虚拟线程的轻量特性正好匹配。对于 CPU 密集型任务，虚拟线程不会有额外收益。

本课程主线为 JDK 17，虚拟线程仅在旁路说明。如果你的项目已升级到 JDK 21，可以考虑使用虚拟线程替代固定线程池处理大量并发 I/O 任务。

## 八、练习与验收

### 练习 1：复现并修复竞态

用 `int counter` 实现一个计数器，两个线程各循环 10,000 次执行 `counter++`。验证：

1. 不加任何同步，最终值小于 20,000。
2. 用 `synchronized` 保护后，值始终为 20,000。
3. 用 `AtomicInteger` 替代后，值始终为 20,000。

### 练习 2：线程池拒绝策略

创建一个 `ThreadPoolExecutor`，核心 1、最大 2、有界队列 2。提交 5 个任务，每个任务运行 2 秒。分别使用 `AbortPolicy` 和 `CallerRunsPolicy`，观察不同策略下的行为差异。将任务提交包装在 try-catch 中观察 `RejectedExecutionException`。

### 练习 3：CompletableFuture 并行查询

用 `CompletableFuture.supplyAsync` 同时查询三个独立的远程服务（模拟为 `Thread.sleep`），等待全部完成后组合结果。比较同步顺序执行和异步并行执行的总耗时。

完成标准：异步并行版本的总耗时接近三个中最慢的一个，而不是三者之和。

## 常见误区

### 线程数越多越快

每个线程占用栈空间，过多的线程竞争 CPU 时间片。CPU 密集型任务，线程数超过核心数后性能反而下降（上下文切换的开销大于并行带来的收益）。

### 忘记关闭线程池

`ExecutorService` 不关闭会导致 JVM 无法退出（非守护线程保持运行）。即使应用停止处理，后台线程池中的空闲线程会让主线程 wait 无法自然结束。使用 `shutdown()` + `awaitTermination()` 或在 Spring 中配置 Bean 的 `destroyMethod`。

### 在同步块中调用外部方法

```java
synchronized (lock) {
    httpClient.callExternalApi(); // 外面的人也要等
}
```

同步块内的代码，其他线程无法进入。在其中调用耗时操作（HTTP、数据库查询）会长时间持有锁。保持同步块尽可能短。

### 把 volatile 当作原子操作

`volatile int i = 0; i++` 仍然不是原子的——`i++` 包括"读-改-写"三步。`volatile` 只解决可见性，不解决原子性。

## 本章小结

线程让多个任务在同一个 JVM 中交替执行。共享可变状态在并发访问时产生竞态条件——`synchronized` 通过锁保护临界区，`AtomicInteger` 使用 CAS 实现无锁原子操作。线程池复用线程避免频繁创建销毁，参数根据 CPU/IO 密集度和监控数据设定。`CompletableFuture` 表达异步任务的链式和并行组合。JDK 21 虚拟线程适合 I/O 密集型的大量并发。下一章进入 JVM：理解 class 文件如何加载到内存、对象如何在堆上分配、垃圾回收如何判断对象可回收。

## 快速自测

1. `counter++` 为什么不是原子操作？
2. `synchronized` 和 `AtomicInteger` 各自适合什么场景？
3. 线程池的核心线程数和最大线程数的区别是什么？
4. 线程池队列满后的四种拒绝策略各是什么行为？
5. `volatile` 能解决什么问题，不能解决什么问题？

参考答案：涉及"读-改-写"三步，多线程可交叉执行；synchronized 适合多步原子操作，AtomicInteger 适合单变量递增递减；核心线程数常驻不回收，最大线程数是允许的上限，超出核心的部分在空闲超时后回收；AbortPolicy 抛异常、CallerRunsPolicy 提交线程自执行、DiscardPolicy 静默丢弃、DiscardOldestPolicy 丢弃最旧任务；解决可见性（写后立即对其他线程可见），不能解决原子性（如 i++ 仍然不是原子的）。

## 参考文献

- Oracle. [Java SE 17 API: Thread](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Thread.html).
- Oracle. [Java SE 17 API: java.util.concurrent](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/package-summary.html).
- OpenJDK. [JEP 444：Virtual Threads](https://openjdk.org/jeps/444).
- Goetz, Brian. Java Concurrency in Practice. 2006. Chapters 1-8.
