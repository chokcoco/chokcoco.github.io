在上一章节，我们详细描述了在 CSS 中，绘制不同类型的阴影的不同方式。

而本章，我们将基于 CSS 的 `box-shadow` 属性，深入探讨利用它们的一些其他高阶技巧！

在上一章，我们的核心是：**有的时候看起来是阴影，但是它不一定是用 3 种阴影属性实现的。**

而本章的核心刚好相反，`box-shadow`**阴影属性有的时候并不一定只能用于实现阴影。**

> 由于 `filter: drop-shadow` 也是常见的实现阴影的属性，但是关于 `filter: drop-shadow` 的技巧会在滤镜章节进行描述。本章节将聚焦于 `box-shadow` 属性。



## 技巧一：利用阴影复制自身图形

关于阴影 `box-shadow` 的第一个核心技巧就是复制自身。

首先，我们需要知道**阴影是可以设置多个（多重阴影）的**。

另外还有一个技巧，当阴影的模糊半径和阴影的扩张半径都为 0 的时候，能得到一个和元素本身一样大小的阴影效果，不过此时，我们是看不到阴影效果的，因为阴影被元素本身挡住了。当然，我们可以轻松地通过 X 偏移值和 Y 偏移值将其移动出来。

综上，CSS 代码如下：

```CSS
div {
    width: 80px;
    height: 80px;
    border: 1px solid #333;
    box-sizing: border-box;
    box-shadow: 80px 80px 0 0 #000;
}
```

得到如下结果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/97d0238343164463bb2d08bc1d5fb7d9~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

利用这个技巧，当我们遇到一些需要重复自身的图形时，可以运用上这个技巧。

譬如下述这个图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fcee5e0c532a47baad45853fe1e4b4f9~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

我们就不需要实现 6 个点，其实只画 2 个即可，左右两边各画一个，剩下的通过 `box-shadow` 复制得到：

```HTML
<p>标题</p>
```

```CSS
p {
    position: relative;
    
    &::before,
    &::after {
        content: "";
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #000;
        left: -20px;
        top: 50%;
        transform: translate(0, -50%);
        box-shadow: -20px 0 #000, -40px 0 #000;
    }
    
    &::after {
        left: unset;
        right: -20px;
        box-shadow: 20px 0 #000, 40px 0, #000;
    }
}
```

又譬如，我们想实现一朵云朵，像是这样：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2c4503356736409dbc8a35692d86738a~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

其实，利用上述技巧，使用 `box-shadow` 即可轻松实现：

```HTML
<div></div>
```

```CSS
div{
  width:100px;
  height:100px;
  margin:50px auto;
  background:#999;
  border-radius:50%;
  box-shadow:
    120px 0px 0 -10px #999,
    95px 20px 0 0px #999,
    30px 30px 0 -10px #999,
    90px -20px 0 0px #999,
    40px -40px 0 0px #999;
}
```

通过一张 Gif，我们会更好理解：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d9b8dec61eaa4725bbd14ecab7d27041~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

>完整代码，戳这里： [CodePen Demo -- 利用多重阴影实现云朵](https://codepen.io/Chokcoco/pen/KMMZER)



### 利用阴影模拟多层边框

那么，利用阴影可以复制自身的能力，我们可以运用在什么地方呢？

考虑这么一个场景，我们希望元素实现多层边框效果，但是由于 `border` 的限制，只能设置单层的边框，这个时候，阴影就可以派上用场。

而利用 `box-shadow` 的多重特性，可以使用元素的外阴影或者内阴影来模拟多层的边框效果。

```CSS
div {
  margin: 50px auto;
  width: 200px;
  height: 100px;
  background: deeppink;
  box-shadow: 
    inset 0 0 0 6px #fff,
    0 0 0 10px #333, 
    0 0 0 15px #aaa, 
    0 2px 5px 15px #666;
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/45a54493ef674de8a604d97226ac3d18~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

可以看到，这里通过使用 `box-shadow` 属性，设置了三层边框以及最外层模糊的阴影，由内而外分别为白、黑、灰三种颜色，并且最终还可以再设置一层盒阴影效果，也就是 `0 2px 5px 15px #666` 这一句。

此外，元素设置了多重阴影的话，具有层叠关系，最先定义的阴影优先级最高，然后依次递减。通过代码可以方便地理解这一点。

需要注意的是：

-   阴影并不是实际的边框，它们不占据元素的空间（也就是不属于盒子模型的一部分），也不能被 `box-sizing` 属性所控制。但是，我们可以通过使用内边距或者外边距（取决于阴影是内部的还是外部的）来模拟它们所占据的额外空间。
-   在这个示例中，模拟的边框位于元素的外部。因此，它无法捕获类似悬停或点击等鼠标事件。如果这些事件很重要，则可以通过添加关键字 inset 将阴影放置在元素的内部。但请注意，此时可能需要添加额外的内边距来扩展空间。


### 利用阴影从内部复制自身

除了外阴影外，`box-shadow` 还有一个非常有趣的关键字 `inset`，表示内阴影。

上一章节中也有提及到，最常见的内阴影作用就是用来给元素塑造立体感，像是这样：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ba14076adfc64c84a71fe8a58577c129~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

但是，内阴影的作用仅仅只是这样吗？不，在 CSS 中，它还有一种非常有意思的技巧：**从内部复制自身**。

当然，这里的复制自身与外阴影整个复制不同，这里的复制只能是复制部分元素的自身。

有点绕，我们来看一个实际的例子，思考一下，如下这样一个按钮，你会如何实现：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0dee579c6e02468293ed1278a661b84e~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

方法当然非常之多，但是，你能快速想到，利用内阴影，是最快的实现方式吗?

核心代码如下：

```HTML
<div></div>
```

```CSS
div {
    width: 200px;
    height: 64px;
    background: #fc0;
    border-radius: 20px;
    border: 5px solid #333;
}
```

基于上述的代码，我们能得到这样一个图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7b1ab19b752c4855b3a2c4d29c421a27~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

接着，利用两层内阴影，我们就能得到上述的效果：

```CSS
div {
    width: 200px;
    height: 64px;
    background: #fc0;
    border-radius: 20px;
    box-shadow: 
       inset 0 -5px 0 #aaa,
       inset 0 -10px 0 #000;
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5ed3cb0ae5ba4b069224a344bff56c69~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

我们拆解一下过程，其实是这样的：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e81005b8608b46d480b9d756f9648358~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

这里有个很重要的点，内阴影也是可以不设置模糊半径的，这样，阴影的内容将会实色而不带模糊效果。

利用这个点，我们就可以在内部勾勒出图形本身的部分形状！

> 完整的代码，你可以戳这里：[CodePen Demo -- Inset Shadow Button](https://codepen.io/Chokcoco/pen/yLQLQww)

好，再来看一个有意思的案例，现在，希望你使用纯 CSS 绘制一个 IE 的图标 LOGO，类似于这样：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1bc5983f2b2f47b68a8dc1c57c2de496~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

抛开 E 字使用 CSS 的实现之外，想象下，E 字外面的外环，应该如何实现呢？也就是这么一个图形：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8189a87760e04c07b954555bcd1c23da~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

好，想必同学们马上能够通过上面的内容进行举一反三！没错，这里也是利用了内阴影，代码也非常简单：

```HTML
<div></div>
```

```CSS
div {
    width: 285px;
    height: 122px;
    border-radius: 100%;
    box-shadow: inset 0 12px 0 13px #09c;
    transform: rotate(-35deg);
}
```

利用这个技巧，我们得到了粗细不一的月牙一样的图案效果。

> 完整的代码，你可以戳这里：[CodePen Demo -- 单标签借助 inset shdow 实现 IE LOGO](https://codepen.io/Chokcoco/pen/rqgGqR)


### 利用阴影实现任意图片的转换

这个技巧属于 `box-shadow` 的终极绝招，我觉得是 CSS 中非常有趣的一个技巧。

如前所述，使用阴影 `box-shadow` 可以实现自我复制。由于 `box-shadow` 具有多重性，也就是不论层数有多少都可以。因此，理论上任何一张图片的每个像素点都可以用一个 `1px*1px` 的 box-shadow 来表示。 

为了实现这个目标，我们可以借助 `Canvas` 提供的 `CanvasRenderingContext2D.getImageData` 方法，它可以获取图片的每个像素点的 RGBA 值。因此，将一张图片转换为完全由 `box-shadow` 表示的图片是完全可行的。 

为此，我们可以尝试编写一个小插件，将任意图片转换为由一个 div 标签表示的 box-shadow 图片。

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a7a7cbfd099740ab99a1806f220fe43c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> [Demo – 戳我体验一下](http://chokcoco.github.io/demo/img2div/html/)

当然，可以这么说，这个功能我觉得除了看似厉害之外，实际毫无实用之处。

在 CSS 中，`box-shadow` 属于耗性能样式，绘制阴影消耗的性能会比普通样式更大些。

而即便是一个 `100px x 100px` 的图片，转化之后都有多达 `10000` 重的阴影，因此，转换后的代码无论是对性能还是可读性而言，都是毁灭性的。

当然，不妨碍这个技巧的确非常有意思~


### 利用 box-shadow 绘制曲线等复杂图形

基于上述的技巧，我们知道了，利用 `box-shadow` 能够复制自身的特性，其实是可以用于绘图作画的。只是坐标参数这些是经由 Canvas 帮忙计算出来的。

其实到今天，我们也有能力利用 `box-shadow`，仅仅基于 CSS 绘制一些通常而言 CSS 无法绘制的图形。

譬如，很困难的曲线。假设我们要实现这样一条曲线：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e0d1d9da3ab24fbb8aad5f543c4d0afe~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

在过往，CSS 中是非常难以实现这样的曲线效果的。

可能的一些办法是 `clip-path`，或者一些奇技淫巧，使用 `text-decoration` 里的波浪下划线 `wavy`，或者是使用渐变叠加。

当然，还有一种办法就是利用本文提到的多重 `box-shadow` 及配合 CSS 最新支持的三角函数方法。

CSS 从 Chrome 111 版本开始，原生支持数学函数里面的 cos()/sin()/tan() 等三角函数方法。

回顾下三角函数里面的最为经典的 `sin` 和 `cos` 的函数曲线：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7161c70fd4e745fbbc24ec6ebe982b89~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

基于上述利用 `box-shadow` 实现任意图片转换的思路，我们实现一个初始的圆形，并且利用它的多重阴影的能力，使阴影的方向按照三角函数中正弦/余弦函数的图像一样排列分布，连起来就可以得到一条曲线。

代码其实也非常简单，需要简单地借助 SASS/LESS 等预处理器，辅助快速构建 `box-shadow` 的代码：

```HTML
<div></div>
<div></div>
<div></div>
```

```CSS
@function shadowSet($vx, $vy, $color) {
    $shadow : 0 0 0 0 $color;
    
    @for $i from 0 through 50 { 
        $x: calc(2 * sin(#{$i * 15 * 1deg}) * #{$vy});
        $y: $i * $vy;
        
        $shadow: $shadow, #{$x} #{$y} 0 0 $color;
    }
    
    @return $shadow;
}

div {
    margin:auto;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    animation: move 3s infinite linear;
    background: #f00;
    box-shadow: shadowSet(3px, 3px, #f00);
}
div:nth-child(2) {
    width: 6px;
    height: 6px;
    background: #fc0;
    box-shadow: shadowSet(3px, 3px, #fc0);
}
div:nth-child(3) {
    width: 4px;
    height: 4px;
    background: #000;
    box-shadow: shadowSet(2px, 2px, #000);
}
```

我们简单封装了一个 `shadowSet` 的 SASS 函数，利用它实现了一个 50 重的 `box-shadow` 效果，基于此可以快速绘制曲线效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d2bf10dc35234bc385f9ef9db8226c93~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

选取其中一个查看源代码，其实核心还是多重 `box-shadow`：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/05f65ddb42d74aefb5e6744495ede63e~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> 完整的代码，你可以戳这里：[CodePen Demo - CSS Cos/Sin Math And box-shadow](https://codepen.io/Chokcoco/pen/oNPaayq)






## 技巧二：遮罩模拟，利用阴影模拟半透明遮罩层

思考下面这样一个场景：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c7b0bc66ffcf4b6fb022a3120b284f31~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

在一些 UI 设计中，我们常常需要使用类似于上图的遮罩层，通过半透明的遮罩层来调暗背景色，并突出某些 UI 部件，从而提升用户体验。

通常实现这种效果的方法是增加一个额外的元素作为遮罩层，或者使用伪元素 `::before` 或 `::after`。然而，你肯定没想过，其实这种布局，使用 `box-shadow` 也可以模拟出遮罩层的效果。

看看代码：

```CSS
 #foo{
  width:200px;
  line-height:200px;
  text-align:center;
  background:#fff;
  margin:50px auto;
  box-shadow: 0 0 0 1920px rgba(0, 0, 0, .5);
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4519fd5e088c43d591d3c5623830313c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

>完整代码，戳这里：[CodePen Demo -- 利用阴影模拟半透明遮罩层](https://codepen.io/Chokcoco/pen/pbbpNW)

我们只需要将 `box-shadow` 的第四个参数扩散半径设置得特别大（足够覆盖整个页面即可）。同时，使用这个技巧，还可以实现类似于这样的技巧：

```HTML
<p>使用 box-shadow 实现半透明遮罩，在某些特殊场景下能发挥很好的作用</p><div>Hover Me</div>
```

```CSS
div {
    position: absolute;
    width: 200px;
    height: 60px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all .2s;
}
div:hover {
    box-shadow: 0 0 0 50vmax rgba(0, 0, 0, .5);
}
```

效果如下：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/770c020256ca4fa0b4cbc26065c4573c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> 完整代码，戳这里：[CodePen Demo -- 利用阴影模拟半透明遮罩层 2](https://codepen.io/Chokcoco/pen/KGQVLr)


当然，这里也有一些注意事项：

-   为了确保 `box-shadow` 生成的阴影在所有浏览器视口大小下都能覆盖整个页面，可能需要将阴影的尺寸，也就是阴影的扩散半径（第四个数字参数值）设置得很大；
-   使用 `box-shadow` 生成的阴影，它是无法阻止它背后元素的交互事件的，譬如阴影后面的元素还是可以被 `hover` 和 `click`，使用这种方式时，需要配合 `pointer-event` 一起，禁止掉元素的点击相关事件；
-   从性能角度而言，`box-shadow` 属于耗性能样式，不同样式在消耗性能方面也有所不同，`box-shadow` 在渲染方面更加耗费性能，因为它的绘制代码执行时间较长，因此在实际使用时仍需要仔细考虑此方案的优缺点。

当然，在相对简单的页面，或者不是对性能有极致要求的页面，其实这个方案是非常简便的。实际使用的时候，做好调研。



## 技巧三：光效动画，使用阴影实现霓虹氖灯效果

氖光效果，英文名叫 Neon，在各类 CSS 效果网站中，是出镜率最多的效果之一。

氖光效果的原理非常简单，但产生的效果非常酷炫。本质上是大范围的 `box-shadow` 过渡动画与文字颜色的动态变化的叠加：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd502d7d316c45f896ef59f681afc82a~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

我们只需要设置 3~n 层阴影效果，每一层的模糊半径（文字阴影的第三个参数）间隔较大，并且每一层的阴影颜色相同即可。

```CSS
p {
    color: #fff;
    text-shadow: 
        0 0 10px #0ebeff,
        0 0 20px #0ebeff,
        0 0 50px #0ebeff,
        0 0 100px #0ebeff,
        0 0 200px #0ebeff
}
```

当然，通常运用 Neon 效果时，背景底色都是偏黑色。

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9f2751e39c0040d485d476eee96f356c~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

合理运用 Neon 效果，就可以制作非常多有意思的动效。譬如，作用于鼠标 hover 上去的效果：

```CSS
p {
    transition: .2s;
 
    &:hover {
        text-shadow: 
            0 0 10px #0ebeff,
            0 0 20px #0ebeff,
            0 0 50px #0ebeff,
            0 0 100px #0ebeff,
            0 0 200px #0ebeff;
    }
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/357f7405f0114e87939365ff54188c69~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> 完整代码，戳这里：[CodePen Demo -- Neon Demo](https://codepen.io/Chokcoco/pen/ZEBaJer)

再换个花样，通过更换选择不同的字体，配合渐进的动画控制，实现一种非常有意思的依次亮灯效果：

```HTML
<p>
  <span id="n">n</span>
  <span id="e">e</span>
  <span id="o">o</span>
  <span id="n2">n</span>
</p>
```

```CSS
p:hover span {
  animation: flicker 1s linear forwards;
}
p:hover #e {
  animation-delay: .2s;
}
p:hover #o {
  animation-delay: .5s;
}
p:hover #n2 {
  animation-delay: .6s;
}

@keyframes flicker {
  0% {
    color: #333;
  }
  5%, 15%, 25%, 30%, 100% {
    color: #fff;
    text-shadow: 
      0px 0px 5px var(--color),
      0px 0px 10px var(--color),
      0px 0px 20px var(--color),
      0px 0px 50px var(--color);
      
  }
  10%, 20% {
    color: #333;
    text-shadow: none;
  }
}
```

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1544e31292e64e868ec3d3d9ef61c33a~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> 完整的代码，你可以点击这里：[CodePen Demo -- Neon Demo](https://codepen.io/Chokcoco/pen/zYoEaaq)



## 技巧四：阴影动画优化技巧

在 CSS 中，阴影其实属于耗性能样式。所谓的耗性能样式，即是我们如果对这些样式进行一些动画、过渡效果，是非常容易导致页面渲染帧率下降，最终形成掉帧、卡顿的。

假设，我们有下面这样一个盒子，设置了一个简单的阴影效果：

```CSS
div {
    width: 100px;
    height: 100px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

需求是希望当元素被 hover 的时候，盒阴影从 `box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3)` 变化过渡到 `box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3)`。

-   变化前：`box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3)`。
-   变化后：`box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3)`。

最简单的方法当然是直接修改阴影代码：

```CSS
div:hover {
    width: 100px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
```

由于过渡动画是在两个不同的盒阴影状态之间发生的，因此在动画过程中，浏览器需要不断地重新绘制盒阴影。然而，盒阴影属于耗性能样式，所以这种动画可能会给人一些卡顿的感觉。

下面介绍一种特殊的优化技巧：**核心在于使用元素的两个伪元素进行透明度的变化实现动画的优化。**

1.  首先，给元素添加一个伪元素，其大小与父 div 一致，并且提前给这个元素添加好所需要的最终的 `box-shadow` 阴影状态，但是设置元素的透明度为 0。

```CSS
div {
    position: relative;
    width: 100px;
    height: 100px;
}
div::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    opacity: 0;
}
```

2.  其次，再使用另外一个伪元素，也给这个伪元素一个盒阴影，而这个盒阴影就是原本设置给元素的阴影，设置透明度为 1。

```CSS
div {
    position: relative;
    width: 100px;
    height: 100px;
}
div::before {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    opacity: 0;
}
div::after {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
}
```

最终，当然元素被 hover 时，只需要对两个伪元素进行一显一隐的变换操作即可，保证每次只有一个阴影效果被展示，这样，就变相实现了原本直接对阴影进行过渡变化的效果。

```CSS
div:hover::before {
    opacity: 1;
}
div:hover::after {
    opacity: 0;
}
```

并且，由于这种方式没有阴影的变换，只有元素的显示和隐藏，因此能够较好地提升阴影过渡动画的性能效果：

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ada49bff371541e5a0ca5f3f9d942960~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

为什么对透明度 `opacity` 进行动画要比对 `box-shadow` 进行动画性能更好呢？可以看看这里这张表格，列举了不同属性变换对页面重排、重绘的影响，也可以看看这篇文章的描述 [very few CSS properties](https://csstriggers.com/)。

<p align=center><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/826512bcc6c84c9da8b5bc555b5a8f04~tplv-k3u1fbpfcp-zoom-1.image" alt=""  /></p>

> 完整代码，戳这里：[CodePen Demo -- 优化 box-shadow 动画](https://codepen.io/Chokcoco/pen/zYObVRJ)



## 总结

在本文，基于 `box-shadow` 的特性，我们列举了 `box-shadow` 在实际开发中，可能运用得上的一些技巧：

1.  技巧一：利用阴影复制自身图形；
1.  技巧二：遮罩模拟，利用阴影模拟半透明遮罩层；
1.  技巧三：光效动画，使用阴影实现霓虹氖灯效果；
1.  技巧四：阴影动画优化技巧。

我们需要掌握这些技巧的原理，以便在恰当的时候、合适的场合利用它们更好地进行页面的样式重构，或是有效地提升页面样式重构的效率。

好的，本章节到此结束，大伙还有什么疑问，可以在评论区一起讨论。