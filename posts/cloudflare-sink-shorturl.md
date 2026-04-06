---
title: 使用 Cloudflare 搭建 Sink 短链接｜榨干大善人
date: 2026-04-05
column: 技术随笔
---

Sink 是一个基于 Cloudflare 的带访问数据统计的短链系统，也可以自定义链接有效期，然后他的 UI 也是我非常非常喜欢的，还支持多语言。
Sink 支持如下特色功能：
- URL 缩短：将您的网址压缩到最短长度。
- 分析：监控链接分析并收集有洞察力的统计数据。
- 无服务器：无需传统服务器即可部署，可以免费部署在 Cloudflare 上。
- 自定义别名：支持自定义个性化的别名。
- AI Slug：利用 AI 自动生成 Slug。
- 链接过期：为您的链接设置过期日期。
而 Cloudflare 是公认的互联网大善人、提供多项免费且量大管饱的服务，~~虽然速度有点慢~~
**为什么需要短链接系统**
> 短链接系统帮助站长：①缩短冗长链接，提升传播效率；②追踪点击数据，优化营销策略；③自定义品牌标识，增强信任感；④避免平台屏蔽长链，保障跳转稳定性。
> ---来自 DeepSeek
**准备阶段**
1. 一个 CloudFlare 账号、一个 Github 账号。
2. 一台能上网访问网页的设备
3. 脑子和手
你至少需要会使用 Github 基本操作，如提交代码、Fork 仓库和登陆注册。
不会的可以看我的《Git 终端使用笔记、手册、帮助及 Github 相关》这篇文章，讲了 Git 命令行的基本使用方法和 Github 的使用方法。
这里给出文章地址：https://
## 开始搭建
先访问 Sink 的 Github 仓库：https://github.com/ccbikai/sink
点击 Fork 按钮来 Fork 仓库到自己账号：
![Screenshot_2025-04-16-20-38-50-11_40deb401b9ffe8e1df2f1cc5ba480b12.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/Screenshot_2025-04-16-20-38-50-11_40deb401b9ffe8e1df2f1cc5ba480b12.jpg)
Fork 成功之后呢就访问 CloudFlare，登陆注册这里不多说了，访问控制台，依次点击**Workers 和 Pages** > **Pages** > **连接到 Git**，选择你刚刚 Fork 的 Sink 仓库。
![20250416_210517_807.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/20250416_210517_807.jpg)
![20250416_211029_197.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/20250416_211029_197.jpg)
这俩给个小建议，就是如果你一直卡在"CloudFlare 面板加载中"界面的话尽量别刷新！越刷新越慢，最好就是等，实在等不住了再刷新。
![Screenshot_2025-04-16-21-00-48-22_40deb401b9ffe8e1df2f1cc5ba480b12.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/Screenshot_2025-04-16-21-00-48-22_40deb401b9ffe8e1df2f1cc5ba480b12.jpg)
导入仓库后会要求你输入设置和环境变量，模板选**Nuxt.js**不要错选成 Next.js 了，这俩很多人会选错。因为 Sink 就是基于 Nuxt.js 开发的，下面的 Build command（构建命令）和 Build output directory（输出目录）都会自动带出来，就按照默认的 npm run build、dist 就可以。
环境变量可选的好多：
- NUXT_SITE_TOKEN: 网站登录的管理密码，不少为 8 个字符
- NUXT_CF_ACCOUNT_ID: Cloudflare 账号 ID，获取方式 [Cloudflare ID](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/)，是找一个域名进入，找到 Account ID，不同域名进入的 Account ID 都是一样的
- NUXT_CF_API_TOKEN: 打开链接 [Cloudflare API Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)，之后点击 Create Token，之后选择 Edit zone DNS Use template
- NUXT_REDIRECT_STATUS_CODE:重定向状态码，默认是 301
- NUXT_AI_MODEL:AI 模型，可以直接写 Cloudlare AI 中的模型
- NUXT_AI_PROMPT：AI 模型使用的提示词
- NUXT_HOME_URL:网站主页地址
- NUXT_PUBLIC_SLUG_DEFAULT_LENGTH:短链 ID 长度，默认 5
- NUXT_PUBLIC_PREVIEW_MODE：是否预览模式，生成的链接 24 小时过期
我这边设置了三个，分别是 NUXT_SITE_TOKEN、NUXT_CF_API_TOKEN、NUXT_CF_ACCOUNT_ID，这三个也都是必选的，其他的都可选。
![20250416_212802_454.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/20250416_212802_454.jpg)
接下来会开始首次部署，首次部署成功是无效的，因为我们还有东西没设置，当然也要等到部署完成之后才设置；部署过程中的**正在构建应用程序**步骤可能需要等待 2m30s 左右，正常情况，首次**部署到 CloudFlare 全球网络**也需要大概 2m30s 左右，首次总部署时间会在六分钟上下，不要着急。
![Screenshot_2025-04-16-21-41-51-35_40deb401b9ffe8e1df2f1cc5ba480b12.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/Screenshot_2025-04-16-21-41-51-35_40deb401b9ffe8e1df2f1cc5ba480b12.jpg)
部署完成之后会自动转跳至 Start 界面，可选三个配置，目前我们需要绑定资源，所以先点击**浏览资源**按钮来创建资源同时绑定到项目。
![20250416_214814_291.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/20250416_214814_291.jpg)
在转跳的页面上找到绑定部分，并按照如下格式绑定对应的 KV 数据库和 Analytics Engine。
先新建一个，选**KV 命名空间**，命名空间写 `KV`，然后再新建一个，选**Analytics Engine**，变量名称写 `ANALYTICS`，数据集写 `sink`。
![Screenshot_2025-04-16-22-00-03-31_40deb401b9ffe8e1df2f1cc5ba480b12.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/Screenshot_2025-04-16-22-00-03-31_40deb401b9ffe8e1df2f1cc5ba480b12.jpg)
接下来配置好了就可以前往**部署**界面重新部署了。
> 前往**Workers 和 Pages** > **Sink** > **部署** > 选择最新的历史部署记录 点右边的三个点，选择**重试部署**按钮，部署完成之后即可访问了。
部署完成之后就可以绑定自己的域名了，这里不过多赘述。
![Screenshot_2025-04-16-22-02-58-51_40deb401b9ffe8e1df2f1cc5ba480b12.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/Screenshot_2025-04-16-22-02-58-51_40deb401b9ffe8e1df2f1cc5ba480b12.jpg)
## 如何修改站点信息
到上一步其实就可以正常访问了，当然有的人就问了，那怎么修改这些界面的标题和 Logo 呢
这俩就讲一下怎么去修改这些信息。
**克隆你自己的仓库**
```sh
git clone 你的仓库链接.git
```
克隆好仓库之后，进入文件夹仓库目录，打开 `app.config.ts` 文件，修改对应的信息就行了，这是我的代码：
```typescript
export default defineAppConfig({
  title: 'MzURL',
  email: 'administer@mengze.vip',
  github: 'https://github.com/MornZe/',
  twitter: 'https://mzurl.xyz/kakmge',
  telegram: 'https://t.me/MornZe',
  mastodon: 'https://mzurl.xyz/',
  blog: 'https://mzurl.xyz/kf5gq9',
  description: '简单/快速/安全的链接缩短器，可进行分析，100% 在 Cloudflare 上运行。',
  image: 'https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/1f94e9c693374150b1f8dfd8de0fcce1.jpeg',
  previewTTL: 300, // 5 minutes
  slugRegex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
  reserveSlug: [
    'dashboard',
  ],
})
```
配置修改完成之后，返回 CloudFlare 控制台，不需要手动部署，会自动开始重新部署，等待部署完成之后，访问你的链接就正常辣！
![Screenshot_2025-04-16-22-14-05-90_40deb401b9ffe8e1df2f1cc5ba480b12.jpg](https://fastly.jsdelivr.net/gh/MornZe/Blog-Static-Resource@main/images/Screenshot_2025-04-16-22-14-05-90_40deb401b9ffe8e1df2f1cc5ba480b12.jpg)
那么总体教程到这里就完成了，学会的记得关注点赞哦，评论区欢迎留言！
