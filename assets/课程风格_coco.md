本文，将向大家介绍 CSS 规范中，最新的 Anchor Positioning，翻译为**锚点定位**。

Anchor Position 的出现，极大的丰富了 CSS 的能力，虽然语法稍显复杂，但是有了它，能够实现非常多之前实现起来非常困难，或者压根无法使用纯 CSS 实现的功能。

Anchor Position 当前仍属于实验室功能，新版本 Chrome 开启该功能：

1. 浏览器 URL 输入框输入： chrome://flags/  
2. 找到 Experimental Web Platform features 选项，开启该功能

## 何为 Anchor Positioning？

那么，什么是 Anchor Positioning 呢？

Anchor Positioning 由规范 [CSS Anchor Positioning](https://www.w3.org/TR/css-anchor-position-1/) 提出定义。

规范是这么描述的：CSS absolute positioning allows authors to place elements anywhere on the page, without regard to the layout of other elements besides their containing block. This flexibility can be very useful, but also very limiting—often you want to position relative to some other element. Anchor positioning (via the anchor functions anchor() and anchor-size()) allows authors to achieve this, "anchoring" an absolutely-positioned element to one or more other elements on the page, while also allowing them to try several possible positions to find the "best" one that avoids overlap/overflow.

简单翻译一下，其核心就在于，Anchor Positioning（锚点定位） 用于**增强元素的绝对定位的能力**。Anchor Positioning（锚点定位）允许我们基于其它锚点元素的位置和尺寸去定位上下文，而不是传统意义上的基于父元素去进行绝对定位。

整个 Anchor Positioning 到底是干啥的？其重点总结如下：

1.  首先，锚点定位，需要我们通过新的锚点名称（`anchor-name`）来标记元素，允许我们使用这些经过了标记的元素作为我们绝对定位的基准目标；
2.  其次，我们可以在绝对定位的元素上，通过新的语法 `anchor()` 或者 `anchor-size()` 来锚定上述被标记了的元素，并且可以使用被标记元素的相应属性（譬如被标记元素的 top、left、right、bottom 等）
3.  并且，还有一些更高级的用法，譬如锚点定位的 Fallback 机制，也就是可以设置多套不同的锚点定位规则，以适应更为复杂的页面布局情况

下面，我们通过一个最简单的例子，快速理解，到底什么是锚点定位。

假设，我们有如下代码结构：

```HTML
<div class="g-container">
    <div class="g-use-anchor"></div>  
    <div class="g-anchor-element"></div>  
</div>
```

```CSS
.g-container {
    position: relative;
    width: 50vw;
    height: 50vh;
    border: 2px solid #666;
    display: flex;
    
    .g-anchor-element {
        width: 25vw;
        height: 25vh;
        border: 2px dashed #333;
        margin: auto;
    }
    
    .g-use-anchor {
        position: absolute;
        width: 20px;
        height: 20px;
        background: #fc0;
        border-radius: 50%;
    }
}
```

整个，会是这么个效果：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230819908-1268457710.png)


需要简单解读一下这个结构：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230826831-379392776.png)


这个很好理解，**注意，此时此刻，`.g-use-anchor` 由于是绝对定位，是相对于它的父容器 `.g-container` 进行定位的**。

而 Anchor Positioning 锚点定位，就允许我们，在上述情况下，改变 `.g-use-anchor` 的绝对定位的基准元素，允许它在绝对定位下，不再相对于父容器定位，而是相对于设定了 `anchor-name` 的锚点元素进行定位。

所以，下面，我们尝试将 `.g-anchor-element` 变成一个锚点元素。

代码如下：

```CSS
.g-container {
    position: relative;
    width: 50vw;
    height: 50vh;
    border: 2px solid #666;
    display: flex;
    
    .g-anchor-element {
        width: 25vw;
        height: 25vh;
        border: 2px dashed #333;
        margin: auto;
        anchor-name: --target;
    }
    
    .g-use-anchor {
        position: absolute;
        width: 20px;
        height: 20px;
        background: #fc0;
        border-radius: 50%;
        top: anchor(--target top);
        left: anchor(--target left);
    }
}
```

上面的代码，有哪些改动呢？

1.  我们给 `.g-anchor-element` 添加了一句 CSS 代码，`anchor-name: --target`，其含义为，将此元素设定为一个锚点元素，它的名字是 `--target`。
2.  在 `.g-use-anchor` 中，新增了两句代码

*   `top: anchor(--target top)`：这里的意思是，使用 name 为 `--target` 的锚点元素作为定位基准，并且将元素的顶部（top）对齐到锚点元素的顶部（top）
*   `left: anchor(--target left)`：同理，使用 name 为 `--target` 的锚点元素作为定位基准，并且将元素的左边（left）对齐到锚点元素的左边（left）

如此一来，我们就得到了这么一个效果：


![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230834809-723792577.png)

也就是这么一层关系：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230839725-929498817.png)


完整的代码，你可以戳这里：[CodePen Demo -- Anchor Positioning Demo](https://codepen.io/Chokcoco/pen/JjegrBN?editors=1100)

到这里，聪明的你应该能够深刻体会到，上面我们说的这一句话的含义了：

Anchor Positioning（锚点定位） 用于**增强元素的绝对定位的能力**。Anchor Positioning（锚点定位）允许我们基于其它锚点元素的位置和尺寸去定位上下文，而不是传统意义上的基于父元素去进行绝对定位。

## Anchor Positioning 锚点定位实战 -- 弹出框定位

可以说，很多之前无法使用 CSS 实现的功能，因为 Anchor Positioning，迎来了新的转机。

首先，我们来看这么一个功能点，我们的页面有很多需要 Hover 的时候弹出的 Popover 或者 Tooltip，像是这样：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230847908-169379575.gif)

每次 Hover 的时候，弹出框的位置，其实都是需要实时通过 JavaScript 进行计算的。但是在有了 `Anchor Positioning` 后，我们可以把每一个被 Hover 需要弹出弹出框的元素，都设置成一个**锚点元素**，而我们的弹出框，只需要在 Hover 的时候，基于当前的锚点元素进行定位即可。

听起来很复杂，我们来实现一遍试试：

```HTML
<p class="g-container">
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod, porro, <span>facere</span>, et incidunt error aliquam fugit pariatur eos labore ipsum voluptate magni culpa reiciendis optio at accusantium non! Quis, laboriosam.
    Lorem ipsum dolor sit, <span>amet consectetur</span> adipisicing elit. Error commodi sequi perspiciatis ipsa veniam, aut, aliquam maiores quasi <span>adipisci tenetur </span>reiciendis dolor nihil aperiam labore, sunt qui ullam aspernatur <span>voluptate</span>.
</p>
```

在 `<p>` 元素下，被包裹了 `<span>` 的文字就是需要 Hover 的时候弹出内容的元素。

```CSS

p {
    position: relative;
    
    span {
        color: deeppink;
    }
    
    &::before,
    &::after {
        position: absolute;
        transition: 0;
        opacity: 0;
    }
    
    &::before {
        content: "";
        top: calc(anchor(var(--target) top) + 10px);
        left: calc(anchor(var(--target) left) + 5px);
        border: 8px solid transparent;
        border-bottom: 8px solid #000;
    }
    &::after {
        content: "Alert Tips!";
        width: 80px;
        padding: 2px 4px;
        font-size: 14px;
        background: #fff;
        border: 2px solid #000;
        top: calc(anchor(var(--target) top) + 24px);
        left: anchor(var(--target) left);
        right: anchor(var(--target) right);
    }
}

p span:nth-child(1) {
    anchor-name: --anchor-1;
}
p span:nth-child(2) {
    anchor-name: --anchor-2;
}
p span:nth-child(3) {
    anchor-name: --anchor-3;
}
p span:nth-child(4) {
    anchor-name: --anchor-4;
}

p:has(span:nth-child(1):hover) {
    --target: --anchor-1;
}
p:has(span:nth-child(2):hover) {
    --target: --anchor-2;
}
p:has(span:nth-child(3):hover) {
    --target: --anchor-3;
}
p:has(span:nth-child(4):hover) {
    --target: --anchor-4;
}

p:has(span:hover)::before,
p:has(span:hover)::after{
    opacity: 1;
}
```

这里的代码，有点长，简单解释一下：

1.  通过 `<p>` 元素的两个伪元素 `::before` 和 `::after`，实现了弹出框的框体和一个小三角形
2.  给每个 `<span>` 都设置了成了锚点，也就是这么一段代码：`p span:nth-child(1) {anchor-name: --anchor-1;}`
3.  关键来了，利用了 `:has` 选择器，实现了当哪个 `<span>` 被 hover，则设置 `--target` 变量为当前元素的 `anchor-name`，也就是实现了锚点元素的动态变换
4.  最终，只需要让弹出框（也就是两个伪元素），基于 `--target` 进行定位即可，而 `--target` 元素，就是我们每次 Hover 的文字元素，那么弹框也就实现了动态定位

> 知识补充，`:has` 选择器变相让 CSS 拥有了父选择器的能力，此选择器用于选择包含指定子元素的父元素，而本例中，利用了 `:has` 选择器甚至能选择包含指定伪类状态的能力，实现了 `--target` 的动态切换。

这样，我们就成功了实现了上述的功能：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230859033-609070580.gif)

当然，这里还需要继续补充一个基于 `anchor()` 方法的基础知识，`anchor()` 方法的值也能与 `calc` 搭配使用，因此，需要理解如下的表达式：

*   `top: calc(anchor(var(--target) top) + 10px)`：将弹框元素的顶部（top）对齐到锚点元素的顶部（top），再加上 `10px` 的向上间距
*   `left: calc(anchor(var(--target) left) + 5px)`：将弹框元素的左边（left）对齐到锚点元素的左边（left），再加上 `5px` 的左间距

还有，如果页面内有 100个 `<span>` 那下面这样的代码将会是噩梦性的重复工作：

```CSS
p span:nth-child(1) {
    anchor-name: --anchor-1;
}
p span:nth-child(2) {
    anchor-name: --anchor-2;
}
p span:nth-child(3) {
    anchor-name: --anchor-3;
}
p span:nth-child(4) {
    anchor-name: --anchor-4;
}

p:has(span:nth-child(1):hover) {
    --target: --anchor-1;
}
p:has(span:nth-child(2):hover) {
    --target: --anchor-2;
}
p:has(span:nth-child(3):hover) {
    --target: --anchor-3;
}
p:has(span:nth-child(4):hover) {
    --target: --anchor-4;
}
```

因此，我们需要借助 SCSS/SASS/LESS 等预处理简化代码，譬如这样：

```SCSS
@for $i from 1 to 100 {
    p:has(span:nth-child(#{$i}):hover) {
        --target: --anchor-#{$i};
    }
    p span:nth-child(#{$i}) {
        anchor-name: --anchor-#{$i};
    }
}
```

合理利用预处理器的循环等功能，能有效提升我们的编码效率。

OK，完整的代码，你可以戳这里：

[CodePen Demo -- Anchor Positioning Demo](https://codepen.io/Chokcoco/pen/wvQVoXO)

## Anchor Positioning 锚点定位实战 -- Tab 切换下划线跟随效果

OK，我们继续，再来一个有意思的实战演练。

基于 Anchor Positioning，能否实现这样一个 TAB 切换时候的，下划线跟随效果呢？

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230910889-551932555.gif)

此类效果，在之前，一定是需要 JavaScript 的介入才可能实现的。在很久之前，我尝试使用 CSS 实现过类似的效果：[不可思议的CSS导航栏下划线跟随效果](https://github.com/chokcoco/iCSS/issues/33)，效果上有很多瑕疵。

而有了 Anchor Positioning 后，我们将可以完美的实现 Tab 切换过程中的下划线跟随效果。

假设，我们的 TAB 的结构如下：

```HTML
<ul>
    <li>下</li>
    <li>划</li>
    <li>线</li>
    <li>跟</li>
    <li>随</li>
    <li>动</li>
    <li>画</li>
</ul>
```

其核心流程和上面的弹出框流程非常类似：

1.  下划线通过 `<ul>`元素的伪元素实现
2.  给每个 `<li>` 都设置了成了锚点
3.  利用了 `:has` 选择器，实现当任意一个 `<li>` 被 hover，则设置 `--target` 锚点变量为当前的 `<li>` 元素，也就是实现了锚点元素的动态变换
4.  最终，只需要让下划线，基于动态的锚点进行定位即可，也就是我们每次 Hover 的 li 元素，那么弹框也就实现下划线动态定位
5.  给下划线的 `left` 设置过渡效果 `transition`，实现跟随动画效果

让我们一起来看看代码，看似复杂，代码量也很少：

```CSS
ul {
    position: relative;
    width: 700px;
    display: flex;
    
    li {
        flex-grow: 1;
    }
    
    &::before {
        position: absolute;
        content: "";
        height: 5px;
        background: transparent;
        bottom: 0;
        left: anchor(var(--target) left);
        right: anchor(var(--target) right);
        transition: .3s all;
        transform: scaleX(5);
    }
}

ul:hover::before {
    background: #000;
    transform: scaleX(1);
}

@for $i from 1 to 8 {
    ul:has(li:nth-child(#{$i}):hover) {
        --target: --anchor-#{$i};
    }
    li:nth-child(#{$i}) {
        anchor-name: --anchor-#{$i};
    }
}
```

需要好好理解一下这段代码，其本质就在于，**Hover 的时候，利用 `:has` 动态改变了 `--target` 锚点元素，让伪元素实现的下划线的宽度，设置为锚点的宽度**。

并且，这里还加了一个 hover 过程中 `transform: scaleX(5)` 到 `transform: scaleX(1)` 的变化，属于锦上添花，删掉不影响最终效果。

当然，也利用了 SCSS 循环，减少了代码量。最终的效果就如我们上面 Gif 图演示般：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230950233-352898833.gif)

并且，可以做到适配 Flex 弹性布局各种情况。

这样，我们就实现了在之前，完全不敢想象能够由 CSS 独立实现的功能，完整的代码，你可以戳这里：[CodePen Demo -- Anchor Positioning Demo](https://codepen.io/Chokcoco/pen/JjegMRq)


## 兼容性

OK，大家肯定非常关系如此强大的功能的兼容性。

目前，Anchor Positioning 还处于较早期的版本，甚至乎我在 Can i Use 上还查不到它的兼容性：

![](https://img2023.cnblogs.com/blog/608782/202308/608782-20230814230956837-532231612.png)

但是，目前我使用的 Chrome 115.0.5790.102 是能够跑通上面的所有代码。

Anchor Position 当前仍属于实验室功能，新版本 Chrome 开启该功能：

1. 浏览器 URL 输入框输入： chrome://flags/  
2. 找到 Experimental Web Platform features 选项，开启该功能

并且，Anchor Positioning 还有非常多的语法以及有意思的实战技巧，在本文是没有放出来的。我会在 Anchor Positioning 兼容性更加明朗后，补充一篇更为详细的教学文章。只能说，未来可期。

## 最后

好了，本文到此结束，希望对你有帮助 :)

想 Get 到最有意思的 CSS 资讯，千万不要错过我的公众号 -- iCSS前端趣闻 😄

<img width=160 src="https://raw.githubusercontent.com/chokcoco/chokcoco/main/gzh_style.png">

更多精彩 CSS 技术文章汇总在我的 [Github -- iCSS](https://github.com/chokcoco/iCSS) ，持续更新，欢迎点个 star 订阅收藏。

如果还有什么疑问或者建议，可以多多交流，原创文章，文笔有限，才疏学浅，文中若有不正之处，万望告知。