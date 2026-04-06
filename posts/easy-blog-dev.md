---
title: 简单复盘一下本站的开发
date: 2026-04-05
column: 技术随笔
---

在上一篇文章里，我谈到了在 2026 年坚持写博客的意义。而要把这种意义落地，首先需要一个属于自己的、足够纯粹的工具。

市面上有很多成熟的静态博客生成器，比如 Hexo、Hugo 或者 VuePress。但我最终决定自己从零开始写一个。原因很简单：我不需要那些臃肿的插件系统，也不想要复杂的配置。我只想要一个能把 Markdown 转成 HTML，且能保证 URL 永久不动的工具。

这篇文章我会详细拆解 `easy-blog` 的开发全过程，包括核心代码的实现逻辑。

## 一、 项目结构设计

一个好的项目，结构应该是直观的。`easy-blog` 的目录设计如下：

- `posts/`：存放所有的 Markdown 源文件。
- `templates/`：存放 EJS 模板。
- `dist/`：生成的静态 HTML 站点，直接部署这个文件夹。
- `database.json`：存放文章哈希值的数据库，用于保证 URL 稳定。
- `build.js`：核心构建脚本。

## 二、 核心构建逻辑：build.js 的实现

`build.js` 是整个系统的发动机。它使用 Node.js 的原生 API 结合几个轻量级库来实现。

### 1. 环境准备与依赖加载
首先，我们需要加载必要的模块。这里我选择了 `ejs` 处理模板，`marked` 处理 Markdown，`front-matter` 处理文章头部的元数据。

```javascript
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { marked } = require('marked');
const fm = require('front-matter');
const crypto = require('crypto');

const postsDir = path.join(__dirname, 'posts');
const templatesDir = path.join(__dirname, 'templates');
const distDir = path.join(__dirname, 'dist');
```

### 2. 核心难点：如何保证 URL 永久不变？
这是我最看重的功能。在很多系统中，如果你修改了文件名（比如从 `01.md` 改成 `my-article.md`），生成的链接就会变，这会导致 SEO 权重丢失和死链。

我的解决方案是：**MD5 哈希值持久化**。

在 `build.js` 中，我设计了这样一段逻辑：
1. 构建时读取 `database.json`。
2. 如果一篇文章的文件名在数据库里已经存在，就直接使用记录过的哈希值。
3. 如果是新文章，就对文件名进行 MD5 加密，取前 7 位作为哈希值，并存入数据库。

```javascript
const dbPath = path.join(__dirname, 'database.json');
let db = { posts: {} };
if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

// 生成 7 位哈希值
function getHash(str) {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 7);
}

// 处理文章时
let hash = db.posts[file] ? db.posts[file].hash : getHash(file);
db.posts[file] = { hash, title: attributes.title }; // 保存回数据库
```

这样做的好处是，即便我后来微调了文件名或文章内容，只要文件名这个“键”还在，生成的 HTML 文件名（即 URL）就永远是那 7 位固定的字符。

### 3. Markdown 的解析与渲染
我使用了 `marked` 库，并配合 `highlight.js`（后来更换为 `Prism.js`）来处理代码高亮。

```javascript
const content = fs.readFileSync(filePath, 'utf-8');
const { attributes, body } = fm(content); // 提取前言和正文
const htmlContent = marked.parse(body);   // 转为 HTML
```

## 三、 页面模板化：layout.ejs 的全局调度

我不希望每个页面都写一遍相同的 `<head>` 或 `<footer>`。所以我使用了 EJS 的布局思想，通过一个 `layout.ejs` 包装所有的页面内容。

### 1. 顶栏的智能显隐逻辑
你可能注意到了，首页的顶栏是滚动后才出现的，而文章页是常驻的。这在 `layout.ejs` 中是通过一个 `isHome` 变量来控制的：

```html
<!-- layout.ejs -->
<body class="<%= isHome ? 'home' : 'not-home' %>">
    <header class="s-h <%= !isHome ? 'v' : '' %>" id="sh">
        <!-- 导航内容 -->
    </header>
```

在 `build.js` 渲染时，我会显式地传入这个变量：
```javascript
// 生成首页时
ejs.render(layoutTemplate, { body: indexHtml, isHome: true });
// 生成文章页时
ejs.render(layoutTemplate, { body: postHtml, isHome: false });
```

### 2. 粘性顶栏的 JS 实现
为了让顶栏在滚动时滑出，我用了一段很精简的原生 JS，避免引入 jQuery 或其他框架：

```javascript
const sh = document.getElementById('sh');
if (isHome) {
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 250) {
            sh.classList.add('v'); // v 类控制 transform: translateY(0)
        } else {
            sh.classList.remove('v');
        }
    }, { passive: true });
}
```

## 四、 功能模块的细节实现

### 1. 全部文章搜索
在 `archive.ejs` 中，我实现了一个实时搜索框。由于文章数量目前并不多，我直接让浏览器在客户端处理搜索，速度极快。

实现原理是：在渲染 HTML 时，把文章标题存入 DOM 的 `data-title` 属性。

```javascript
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.i');
    items.forEach(item => {
        const title = item.getAttribute('data-title');
        item.style.display = title.includes(query) ? 'block' : 'none';
    });
});
```

### 2. 代码高亮的迁移：从 Highlight.js 到 Prism.js
最初我尝试在服务器端做代码高亮，但发现效果不如预期。后来我决定把高亮逻辑交给客户端的 `Prism.js`。

在 `layout.ejs` 中引入了 Prism 的 CDN 链接，并针对我的极简风格做了 CSS 适配：
```css
/* 代码块容器样式 */
.post-content pre {
    padding: 1.2rem;
    border-radius: 12px;
    background: #2d2d2d !important; /* 强制使用深色背景 */
    overflow-x: auto;
}
```

## 五、 开发心得与后续

整个项目从构思到完全跑通，花费了大约一天的时间。代码加起来不到 300 行，但它完美解决了我的所有痛点：

1. **绝对稳定**：URL 由数据库哈希值控制，永不失效。
2. **绝对快速**：全站静态 HTML，没有任何数据库查询。
3. **绝对自主**：我想加一个专栏，只需要修改 `build.js` 的一行配置；我想改样式，只需要动一下 `layout.ejs`。

很多人觉得自己写系统是“重复造轮子”，但在我看来，这是一种对底层细节的复习。当你在代码里亲自处理文件系统、处理字符串哈希、处理 CSS 盒模型的时候，你对“ Web 究竟是如何运作的”会有更深刻的理解。

这不仅是一个博客，这是我根据自己的审美和逻辑，在数字世界里盖的一座小房子。

---
*本文有站长编写，但由于写的太短了，后又交给Gemini CLI完善。*
