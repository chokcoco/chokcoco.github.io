背景 `background` 可以说是 CSS 中，最为大放异彩的一个属性了。

想要真正掌握 `background`，我们需要明确一点，它不仅仅只是一个可以设置背景色那么简单的属性。

整个 `background` 家族，其实囊括了非常多的东西，可以完成的事情也五花八门，下面罗列的是 CSS background 中最为基础的内容。

-   `background` 设置纯色或者图片，譬如 `background: #000`、`background: url(image.png)`。

-   `background` 设置渐变，包含了：

    -   线性渐变 `background: linear-gradient(#fff, #000)` ；
    -   径向渐变 `background: radial-gradient(#fff, #000)` ；
    -   角向渐变 `background: conic-gradient(#fff, #000)` ；
    -   重复渐变 `background: repeating-linear-gradient`、`repeating-radial-gradient`、`repeating-conic-gradient`。

在日常中，与 background 相关的，我们使用最多的应该就是下面 4 种：背景基础、线性渐变、径向渐变和角向渐变。虽然基础，但并不代表容易，接下来就让我们一起学习这 4 种 background 以及相关的核心技巧。这就开始本节的学习之旅吧，Let's go！

  


## 背景基础

-   纯色背景 `background: #000`：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9aba6c3578a449eb86ccdcd30c002f3~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

-   线性渐变 `background: linear-gradient(#fff, #000)` ：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fb37bdce31cb46af958bfc8c0c725e16~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

-   径向渐变 `background: radial-gradient(#fff, #000)` ：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6f588796c9c743f6a80a66a9e4dad69c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

-   角向渐变 `background: conic-gradient(#fff, #000)` ：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ae5ddad6069d4dee9696dee7d18bd30b~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

对于 background，我们需要注意以下几点。

-   background 不仅仅用于展示图片，或者是展示单个颜色，它的渐变部分语法，才是整个 background 的核心。
-   background 是支持多重渐变的叠加的，这一点非常重要，它不仅仅只能是单个的线性渐变或者单个的径向渐变，是可以将它们组合在一起使用的。
-   复杂场景下，灵活使用 `repeating-linear-gradeint`（`repeating-radial-gradeint`），它能减少很多代码量。
-   CSS 中存在一种透明色`transparent` ，在渐变中，学会使用透明色非常重要。

下面，从 `linear-gradient` 开始，我们一步一步深入背景。

## `linear-gradient` 线性渐变

`linear-gradient` 为线性渐变。最常见的就是一种颜色到另外一种颜色的变化：

```css
{
    background: linear-gradient(#fff, #000);
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/177f773fbedb4d97afd6d33ef3b5a9b4~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>


### 技巧一：渐变的颜色可以是透明色（transparent）

我们改造一下代码：

```css
{
    background: linear-gradient(#fff, transparent);
}
```

将底色设置为一个非透明颜色，棕色，这样明显一点，看一下效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6983a86c53c24915844a0978fc85fdc0~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

那么设置为透明色有什么作用呢？看看这样一张图：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/72705e06aa19457ea9d122c39ddf82fa~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

  


当我们需要实现这样一种遮罩效果的时候，就可以使用从白色到透明色的渐变，通过叠加在元素上方的方式，实现该效果。核心代码如下：

```html
<div class="g-container">
  <ul>
    <li>Button</li>
    <li>Button</li>
    <li>Button</li>
    <li>Button</li>
    <li>Button</li>
    <li>Button</li>
  </ul>
</div>
```

```css
.g-container {
    ...
    
    &::before {
        content: "";
        position: absolute;
        right: 0;
        bottom: 0;
        top: 0;
        width: 100px;
        background: linear-gradient(90deg, transparent, #fff);
    }
}
```

这样，我们就可以轻松实现这样的效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/08f1c8f17c0f45468758dc59852c758c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>


这里的核心在于，**透明色或者带透明度的颜色有助于展示出元素下方的内容，当看到一些渐变消失、递进消失的** **UI** **时，就可以考虑是否能够利用到带透明的渐变效果来实现。**

> 完整的代码你可以戳这里：[CodePen Demo -- Linear Gradient Mask & Pointer-event](https://codepen.io/Chokcoco/pen/dyZJXEp)

  


### 技巧二：渐变可以是从一种颜色直接到另外一种颜色

渐变不仅可以是渐变过渡，也可以是实色过渡，也就是一个颜色直接过渡到第二种颜色。

```css
{
    border: 2px solid #000;
    background: linear-gradient(#fff 0%, #fff 50%, #f00 50%, #f00 100%);
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/44284950e3ae457b80c6a1759f6763ae~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

这里设置了前 50% 为白色，后 50% 为红色。

利用这个技巧，可以做的事情就非常多了。譬如利用渐变实现一个三角形图形，我们可以给上述渐变效果增加一个 45° 的角度，并且结合技巧一，将其中一种颜色设置为**透明**：

```css
{
    background: linear-gradient(45deg, #f00 0%, #f00 50%, transparent 50%, transparent 100%);
}
```

这样，我们就得到了一个三角形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d7ad15c3bc3c468d9477ae34ed308fdb~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

### 技巧三：渐变是可以叠加多层的

基于上述的利用渐变实现三角形这个技巧继续，如果我们在一个图形的四个角，都利用上这个技巧呢？

这里就可以引入渐变的第三个技巧，**渐变是可以叠加多层的**。

我们在同一个 div 叠加 4 层线性渐变：

```css
.notching { 
    width: 200px; 
    height: 120px; 
    background: 
        linear-gradient(135deg, transparent 15px, deeppink 0), 
        linear-gradient(-135deg, transparent 15px, deeppink 0), 
        linear-gradient(-45deg, transparent 15px, deeppink 0), 
        linear-gradient(45deg, transparent 15px, deeppink 0); 
    background-size: 50% 50%, 50% 50%, 50% 50%, 50% 50%; 
    background-position: top left, top right, bottom right, bottom left;
    background-repeat: no-repeat; 
}
```

这样，我们就能得到一个内切角图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8dc26bcc476745f3a62f1c136ed3fd12~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

这样的语法看着复杂，其实很好理解：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/00501c4d2eb84858ab20af438cf6104a~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

依次类推，第二组渐变的组成方式：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b9148fae26e64a4a9edbe35f3d14c23e~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

第三、第四组同理。当一些属性完全相同的时候，可以省略使用简写，譬如 `background-size: 50% 50%, 50% 50%, 50% 50%, 50% 50%`，由于每一组的 `background-size` 的值都是 `50% 50%`，所以可以简写成 `background-size: 50% 50%`。

关于渐变的语法不做过多赘述，对于这些基础，大家在阅读的时候遇到障碍，可以去 MDN 补一补基础。

### 技巧四：利用 repeating-linear-gradient 节省代码

有的时候，我们需要用到不断重复的渐变。这个时候，除了 `background-repeat: repeat` 之外，官方还提供了一个 `repeating-linear-gradient`，可以创建一个由线性渐变重复组成的图形。

常见于实现进度条形状的图形：

```css
{
    background: 
        repeating-linear-gradient(
            45deg, 
            #f06a0e, 
            #f06a0e 11px, 
            transparent 11px, 
            transparent 20px
        );
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e9c10495b78a4bbda27e7bf7d6298364~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

我们看下，如果不是 `repeating-linear-gradient`，是什么形状：

```css
{
    background: 
        linear-gradient(
            45deg, 
            #f06a0e, 
            #f06a0e 11px, 
            transparent 11px, 
            transparent 20px
        );
}
```

仅仅是这样而已：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5a3588ab21ed4b10b3389b17ddfbafb8~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

`repeating-linear-gradient` 做了什么事情呢？其实是按照每 11px 安排一段 `#f06a0e`，每 9px 安排一段 `transparent`。

如果只用 `linear-gradient`，想要实现上述图形，我们多补充几段：

```css
{
    background: 
        linear-gradient(
            45deg, 
            #f06a0e, 
            #f06a0e 11px, 
            transparent 11px, 
            transparent 20px, 
            #f06a0e 20px, 
            #f06a0e 31px, 
            transparent 31px, 
            transparent 40px,
            #f06a0e 40px, 
            #f06a0e 51px, 
            transparent 51px, 
            transparent 60px
        );
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/18a0b1558fa440b8921a5dec9dc8482b~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

分析一下代码，`repeating-linear-gradient` 只是在根据长度规律，不断重复一个片段：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5123d7eb4675467c9896e17e44c04722~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

好，通过线性渐变，我们可以得到 CSS 渐变的几个特点，简单总结一下：

1.  渐变的颜色可以是透明色；
1.  渐变可以是从一种颜色直接到另外一种颜色，不需要有过渡状态；
1.  渐变是可以叠加多层的；
1.  利用 repeating-linear-gradient 节省代码，实现片段的重复。

## `radial-gradient` 径向渐变

好，接下来我们讲讲 `radial-gradient` 径向渐变，其实上述 4 个技巧放在径向渐变也是适用的，所以，这里我们讲一些不同的。

### 技巧五：预留衔接空间消除渐变产生的锯齿

在使用渐变生成不同颜色的直接过渡时，非常容易就会产生锯齿效果。

看下面这样一种场景：

```css
div {
    width: 400px;
    height: 400px;
    background: radial-gradient(#9c27b0 0%, #9c27b0 47%, #ffeb3b 47%, #ffeb3b 100%);
}
```

使用 `radial-gradient(#9c27b0 0%, #9c27b0 47%, #ffeb3b 47%, #ffeb3b 100%)` 生成的一个图形，从一种颜色直接到另外一种颜色，但是，仔细看看衔接处，会发现有非常明显的锯齿效果。

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/df1cf335ccb5491f8e27cc2590e00f45~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

遇到此类问题的解决方案是：**在衔接处，适当留出一些渐变空间**。我们简单改造一下上述代码：

```css
div {
    width: 400px;
    height: 400px;
    background: radial-gradient(#9c27b0 0%, #9c27b0 47%, #ffeb3b 47.3%, #ffeb3b 100%);
}
```

仔细看上面的代码，将从 47% 到 47% 的一个变化，改为了 从 47% 到 47.3%，这多出来的 0.3% 就是为了消除锯齿的，实际改变后的效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8515a06773204962a72e14280e7d6272~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>


> 完整的代码你可以戳这里：[CodePen Demo -- Remove aliasing from gradients](https://codepen.io/Chokcoco/pen/wvPErBo)

当然，这里的 `0.3%` 不是写死的，需要根据具体使用的情况灵活调试，可以多调试选取既不会看出模糊，又能尽可能消除锯齿的一个范围幅度。


### 技巧六：利用多层渐变组合图形

这是渐变当中比较耗费脑力的一个技巧。

上面我们讲了，渐变可以叠加多层，那么，除了利用多层渐变图形，实现所需图形的各个部分，拼接成完整的图形。也可以在此基础上，利用它们的重叠效果，叠加出我们要的图形。（**差异点在于多层渐变图层之间，是否有重叠关系**。）

此技巧多用于实现优惠券边框。

在 CSS 中，想要实现波浪效果，波浪边框是比较复杂的。其中，利用多层径向渐变叠加，是一种方法。假设我们想使用 CSS 实现如下造型：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f10d7302a69748e6ad629901c90179e6~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

难点就在于，右侧的波浪边框的实现，这里，其实运用的是两层径向渐变的叠加实现。如何叠加实现波浪边框呢？看看代码：

```css
body {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(180deg, #607d8b, #673ab7), rgba(0, 0, 0, .5);
    background-size: 100% 50px;
    background-repeat: no-repeat;
    animation: moveC 10s linear infinite;
    
    &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 40px;
        right: 0;
        background-repeat: repeat-x;
        height: 10px;
        background-size: 20px 20px;
        background-image: radial-gradient(circle at 10px -5px, transparent 12px, #fff 13px, #fff 20px);
            
    }
    
    &::after {
        content: "";
        position: absolute;
        left: 0;
        top: 35px;
        right: 0;
        background-repeat: repeat-x;
        height: 15px;
        background-size: 40px 20px;
        background-image: radial-gradient(circle at 10px 15px, white 12px, transparent 13px);
    }
}
```

这里我制作了一个简单的 Gif 示意图：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f64d38380f6944e18a76fa93d267b2c6~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

利用这个技巧，我们还可以实现波浪下划线：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/32b1972c8b8a4115b56c2dc13628180b~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

嗯，没错，它其实也是两层径向渐变实现的。拆解一下，就是这样：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/20f96478076e48af8b2b5c617e275e51~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

这里，我用两种颜色区分两段渐变，应该非常好理解了。

相较于使用 `text-decoration` 实现的下划线而言，使用渐变实现的优势是它的下划线可以再添加上动画，像是这样：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d8f4a914c1864d9db2fb3406d0b2e602~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

这里利用的是 `background-position` 的变化，实现的 hover 效果。伪代码如下：

```css
.flow-wave {
    background: 
        radial-gradient(circle at 10px -7px, transparent 8px, currentColor 8px, currentColor 9px, transparent 9px) repeat-x,
        radial-gradient(circle at 10px 27px, transparent 8px, currentColor 8px, currentColor 9px, transparent 9px) repeat-x;
    background-size: 20px 20px;
    background-position: -10px calc(100% + 16px), 0 calc(100% - 4px);
}
.flow-wave:hover {
    animation: waveFlow 1s infinite linear;
}
@keyframes waveFlow {
    from { background-position-x: -10px, 0; }
    to { background-position-x: -30px, -20px; }
}
```

> 完整的代码，你可以戳这里：
>
> -   [CodePen Demo -- 优惠券波浪造型(coupon)](https://codepen.io/Chokcoco/pen/vQLQXp)
> -   [CodePen Demo -- 渐变实现波浪下划线及动画](https://codepen.io/Chokcoco/pen/vMyBQe)

总结一下，这里我们又得到了两个技巧：

1.  预留衔接空间消除渐变产生的锯齿；
1.  利用多层渐变的组合，重叠在一起拼出想要的图形。

## `conic-gradient` 角向渐变（圆锥渐变）

OK，接下来，我们再聊聊比较晚进入大家视野的 `conic-gradient` 角向渐变，在更早之前，它也被翻译成圆锥渐变。

看看它最简单的 API：

```css
{
    background: conic-gradient(deeppink, yellowgreen);
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/feb923df74134bc1ad33e3513c0a0881~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

那么它和另外两个渐变的区别在哪里呢？

-   `linear-gradient` 线性渐变的方向是一条直线，可以是任何角度。
-   `radial-gradient` 径向渐变是从圆心点以椭圆形状向外扩散。

而角向渐变从**渐变的圆心**、**渐变起始角度**以及**渐变方向**上来说，是这样的：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9af0b09aabe1476aa37b14d11dc16f36~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>



这里要划重点啦！从图中可以看到，角向渐变的起始圆心点、起始角度和渐变方向为：

-   起始点是图形中心；
-   默认渐变角度 0deg 是从上方垂直于圆心的；
-   渐变方向以顺时针方向绕中心实现。

当然，我们也可以控制角向渐变的**起始角度**以及**角向渐变的圆心**。稍微改一下上述代码：

```css
{
    background: conic-gradient(from 270deg at 50px 50px, deeppink, yellowgreen);
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b58dd65a19624a11b2c8e29d0f67b97c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

我们改变了**起始角度**以及**角向渐变的圆心**：通过 `from 270deg at 50px 50px`，我们设定了角向渐变的圆心为图案的 `50px 50px` 处，设定了初始角度为 `270deg`。

当然，上述的 6 个技巧对于角向渐变而言，也是一样适用的。在继续讨论渐变的技巧之前，由于大部分同学对角向渐变还比较陌生，因此这里我们再好好学习学习角向渐变的**一些特性**。

  


### 使用 `conic-gradient` 实现颜色表盘

从上面了解了 `conic-gradient` 最简单的用法，我们使用它实现一个最简单的**颜色表盘**。

`conic-gradient` 不仅仅只是从一种颜色渐变到另一种颜色，与另外两个渐变一样，可以实现多颜色的过渡渐变。

由此，想到了彩虹，我们可以依次列出 `赤橙黄绿青蓝紫` 七种颜色：`conic-gradient: (red, orange, yellow, green, teal, blue, purple)`。

上面表示，在角向渐变的过程中，颜色从设定的第一个 `red` 开始，渐变到 `orange` ，再到 `yellow` ，一直到最后设定的 `purple` 。并且每一个区间是等分的。

我们再给加上 `border-radius: 50%` ，假设我们的 CSS 如下：

```css
{
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(red, orange, yellow, green, teal, blue, purple);
}
```

看看效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9ea913134d0847a08d0723314156173a~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

Wow，已经有了初步形状了。但是，总感觉哪里不大自然。

问题出在哪里呢？一是颜色不够丰富不够明亮，二是起始处与结尾处衔接不够自然。再稍微调整一下。

我们知道，表示颜色的方法，除了 `rgb()` 颜色表示法之外，还有 `hsl()` 表示法。

> `hsl()` 被定义为色相-饱和度-明度（Hue-Saturation-Lightness）。

-   色相（H）是色彩的基本属性，就是平常所说的颜色名称，如红色、黄色等。
-   饱和度（S）是指色彩的纯度，越高色彩越纯，低则逐渐变灰，取 0~100% 的数值。
-   明度（V），亮度（L），取 0～100%。

这里，我们通过改变色相得到一个较为明亮完整的颜色色系。

也就是采用这样一个过渡 `hsl(0%, 100%, 50%)` --> `hsl(100%, 100%, 50%)`，中间只改变色相，生成 20 个过渡状态。借助 SCSS ，CSS 语法如下：

```scss
$colors: ();
$totalStops:20;

@for $i from 0 through $totalStops{
    $colors: append($colors, hsl($i *(360deg/$totalStops), 100%, 50%), comma);
}

.colors {
    width: 200px;
    height: 200px;
    background: conic-gradient($colors);
    border-radius: 50%;
}
```

得到如下效果图，这次的效果很好：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/21ed1427c8e54322916fb8889542f057~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> 完整代码戳这里：[CodePen Demo -- conic-gradinet colors](https://codepen.io/Chokcoco/pen/LLLWEy)

### 角向渐变配合百分比使用

当然，我们可以更加具体地指定角向渐变每一段的比例，**配合百分比**，可以很轻松地实现饼图。

假设我们有如下 CSS：

```css
{
    width: 200px;
    height: 200px;
    background: conic-gradient(deeppink 0, deeppink 30%, yellowgreen 30%, yellowgreen 70%, teal 70%, teal 100%);
    border-radius: 50%;
}
```

上图，我们分别指定了 0~30%、30%~70%、70%~100% 三个区间的颜色分别为 `deeppink（深红）`、`yellowgreen（黄绿）` 以及 `teal（青）` ，可以得到如下饼图：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f4ab0b7cdb09437cbfabd1296416ccd7~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

当然，上面只是百分比的第一种写法，还有另一种写法也能实现：

```css
{
    background: conic-gradient(deeppink 0 30%, yellowgreen 0 70%, teal 0 100%);
}
```

这里表示：

1.  0～30% 的区间使用 `deeppink`；
1.  0～70% 的区间使用 `yellowgreen`；
1.  0～100% 的区间使用 `teal`。

而且，先定义的颜色的层叠在后定义的颜色之上。

> 完整的代码你可以戳这里：[CodePen Demo -- use proportion in conic-gradient](https://codepen.io/Chokcoco/pen/awwGQy)

### 角向渐变配合 `background-size` 使用

使用了百分比控制了区间，再配合使用 `background-size` 就可以实现各种贴图啦。

我们首先实现一个基础角向渐变图形，如下：

```css
{
    width: 250px;
    height: 250px;
    margin: 50px auto;
    background: conic-gradient(#000 12.5%, #fff 0 37.5%, #000 0 62.5%, #fff 0 87.5%, #000 0);
}
```

效果图：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd3d3167310e40929c025e6b4a91999f~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

再加上 `background-size: 50px 50px;`，也就是：

```css
{
    width: 250px;
    height: 250px;
    margin: 50px auto;
    background: conic-gradient(#000 12.5%, #fff 0 37.5%, #000 0 62.5%, #fff 0 87.5%, #000 0);
    background-size: 50px 50px;
}
```

得到：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1017366f1ab84792afad7f45685915d0~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

  


> 完整代码戳这里：[CodePen Demo -- conic-gradient wallpaper](https://codepen.io/Chokcoco/pen/dRRKqB)

  


### 重复角向渐变 `repeating-conic-gradient`

与线性渐变及径向渐变一样，角向渐变也是存在重复角向渐变 `repeat-conic-gradient` 的。

我们假设希望不断重复的片段是 0~30° 的一个片段，它的 CSS 代码是 `conic-gradient(deeppink 0 15deg, yellowgreen 0 30deg)`。

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1d4f62b439754eba879d4cd070fea1cf~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

那么，使用了 `repeating-conic-gradient` 之后，会自动填充满整个区域，CSS 代码如下：

```css
{
    width: 200px;
    height: 200px;
    background: repeating-conic-gradient(deeppink 0 15deg, yellowgreen 0 30deg);
    border: 1px solid #000;
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f663c47cd4424592a6347bd97adbac8d~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>




> 完整代码戳这里：[CodePen Demo -- repeating-conic-gradient](https://codepen.io/Chokcoco/pen/ZyyMBG)


### 技巧七：利用角向渐变 repeat 配合 position 完成特殊图案

好，我们回归渐变的技巧。上面我们有利用角向渐变，实现这样一个图形：

```css
{
    background: conic-gradient(from 270deg at 50px 50px, deeppink, yellowgreen);
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/358c0dcd17334ec3a72cb3c52e8db377~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

我们改变了**起始角度**以及**角向渐变的圆心**：通过 `from 270deg at 50px 50px`，我们设定了角向渐变的圆心为图案的 `50px 50px` 处，设定了初始角度为 `270deg`。



好，简单改造一下代码：

```css
div {
    margin: auto;
    width: 200px;
    height: 200px;
    background: conic-gradient(from 270deg at 50px 50px, deeppink 0%, deeppink 90deg, transparent 90deg, transparent 
 360deg);
    border: 1px solid #000;
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dfa8896013ad44c78e3e8a1f0e4a853e~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

**起始角度**以及**角向渐变的圆心**没有改变，但是只让前 `90deg` 的图形为粉色，而后 `270deg` 的图形，设置为了透明色。


我们利用角向渐变，在图像内部，又实现了一个小的矩形！

  


接下来，我们再给上述图形，增加一个 `background-position: -25px, -25px`：

```css
div {
    margin: auto;
    width: 200px;
    height: 200px;
    background: conic-gradient(from 270deg at 50px 50px, deeppink 0%, deeppink 90deg, transparent 90deg, transparent 
 360deg);
    background-position: -25px -25px;
    border: 1px solid #000;
}
```



这样，我们就神奇地得到了这样一个图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c16161ea98a74076919289cb51c09d26~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

为什么会有这样一种现象？如果我们在代码中加入 `background-repeat: no-repeat`：

```css
div {
    margin: auto;
    width: 200px;
    height: 200px;
    background: conic-gradient(from 270deg at 50px 50px, deeppink 0%, deeppink 90deg, transparent 90deg, transparent 
 360deg);
    background-position: -25px -25px;
    background-repeat: no-repeat;
    border: 1px solid #000;
}
```

那么就只会剩下左上角一个角：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/03ccea5d6f194c568764e367e8382fcd~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

因此，**这里实际上利用了渐变图形默认会 repeat 的特性，去掉** **`background-repeat: no-repeat`** **实际上是这么个意思**：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f907cf72c6af45ef8429adce55de3feb~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

理解了这张图，也就理解了这个技巧的核心所在！



利用渐变图案默认 repeat 的特性，配合 `background-position` 对图形进行一个位移，使其可以在图形的其他侧边出现，以完成特殊图案！

好，上述的技巧，我们再演练一次。现在，我们需要实现这样一个图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e18168097f444e469ef3c1eccdaa28ec~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

可以实现的方式有很多，譬如：

1.  两个矩形进行叠加；
1.  使用 `clip-path`实现。



当然都是可以的，但是，我们借助上面提到的角向渐变这个技巧，应该怎么做呢？


也是一样的，首先，利用角向渐变实现这样一个图形：

```css
div {
    width: 100px;
    height: 100px;
    background: conic-gradient(from 270deg at 40px 40px, #fff 0, #fff 90deg, transparent 90deg, transparent 360deg) #000;
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/804838d3c3ff4470ad9b366c5b12866a~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

左上角的白色块，就是利用了 `conic-gradient(from 270deg at 40px 40px, #fff 0, #fff 90deg, transparent 90deg, transparent 360deg)`实现的。

  


最后，只需要将左上角利用角向渐变实现的白色块，继续往左上角位移，即可让其在其他 3 个端点出现！

```css
div {
    width: 100px;
    height: 100px;
    background: conic-gradient(from 270deg at 40px 40px, #fff 0, #fff 90deg, transparent 90deg, transparent 360deg) #000;
    background-position: -20px -20px;
}
```

这样，就完美实现了我们想要的图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b883f2b853934e638ffafc6d8b90e866~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>


完整代码戳这里：[CodePen Demo - Conic Gradient Skill](https://codepen.io/Chokcoco/pen/xxQGpwK)

### 技巧八：利用小单位实现造型迥异的图案

这里介绍一种利用一些极小的单位，只需短短几行代码，即可产生出美妙而又有意思的背景效果的方式。

首先，我们使用 `repeating-conic-gradient` 多重角向渐变实现一个简单的图形，代码示意如下：

```html
<div></div>
```

```css
div {
    width: 100vw;
    height: 100vh;
    background: repeating-conic-gradient(#fff, #000, #fff 30deg);
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/551f03ae53064d8289b980ad2b0c74ca~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>


#### 将 `30deg` 替换为 `0.1deg`

然后，我们用一个非常小的值去替换上述代码中的 `30deg`，类似于这样：

```css
{
    background: repeating-conic-gradient(#fff, #000, #fff 0.1deg);
}
```

这是什么玩意？脑补一下，这行代码绘制出来的图形会是什么样子？

看看效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cb54c98a112546d9bc59438ceff821a7~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

Wow，不可思议。这里 `0.1deg` 非常关键，这里的角度越小（小于 1deg 为佳），图形越酷炫，也就是我们说的数量级对背景图形的影响。



> 完整的代码戳这里：[CodePen -- One Line CSS Pattern](https://codepen.io/Chokcoco/pen/yLajLaM)


#### 多重径向渐变 & 多重角向渐变，配合小单位实现有意思的背景

利用上述的一些小技巧，我们利用多重径向渐变（repeating-radial-gradient）、多重角向渐变（repeating-conic-gradient）就可以生成一些非常有意思的背景图片。

再简单罗列一些：

```css
div {
    background-image: repeating-radial-gradient(
        circle at center center,
        rgb(241, 43, 239),
        rgb(239, 246, 244) 3px
    );
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6f4ef4cd86464780b0e19aa88c467c20~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

```css
div {
    background-image: repeating-radial-gradient(
        circle at 15% 30%,
        rgb(4, 4, 0),
        rgb(52, 72, 197),
        rgb(115, 252, 224),
        rgb(116, 71, 5),
        rgb(223, 46, 169),
        rgb(0, 160, 56),
        rgb(234, 255, 0) 2px
    );
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c6ffc602f6274965b44b5f360ecf6ae5~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

```css
div {
    background-image: repeating-radial-gradient(
        circle at center center,
        rgb(81, 9, 72),
        rgb(72, 90, 223),
        rgb(80, 0, 34),
        rgb(34, 134, 255),
        rgb(65, 217, 176),
        rgb(241, 15, 15),
        rgb(148, 213, 118) 0.1px
    );
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5a9446c317474b53a8938b8fa2f1e985~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

```css
div {
    background-image: repeating-radial-gradient(
        ellipse at center center,
        rgb(75, 154, 242),
        rgb(64, 135, 228),
        rgb(54, 117, 214),
        rgb(43, 98, 200),
        rgb(33, 79, 185),
        rgb(22, 60, 171),
        rgb(12, 42, 157),
        rgb(1, 23, 143) 0.01px
    );
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d41318bd07064bd08d7c7e80af59f317~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

看，利用小单位实现的图形，视觉上别有一番意思，当然，更多有意思的图形可以下来自己尝试尝试。

  


> 完整的 Demo 代码，你可以戳进这里看看：[CodePen Demo -- Magic Gradient Art](https://codepen.io/Chokcoco/pen/MWJXKXE)

  


## 总结一下

OK，本文篇幅已经非常之长了。我们再来归纳一下在背景中关于渐变的一些技巧。

1.  渐变的颜色可以是透明色。
1.  渐变可以是从一种颜色直接到另外一种颜色，不需要有过渡状态。
1.  渐变是可以叠加多层的。
1.  利用 repeating-linear-gradient 节省代码，实现片段的重复。
1.  预留衔接空间消除渐变产生的锯齿。
1.  利用多层渐变的组合，重叠在一起拼出想要的图形。
1.  利用角向渐变 Repeat 配合 position 完成特殊图案。
1.  利用小单位实现造型迥异的图案。

关于 CSS 背景还有非常多有意思的知识点没有讲完，背景家族的 `background-clip`、`mask` 等都还没有登场，我们将会再下一章节讲述更多关于背景的技巧，将会结合实战呈现 CSS 背景更有意思的一面！

好的，本章节到此结束，大伙还有什么疑问，可以在评论区一起讨论。