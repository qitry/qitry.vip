---
title: 解决使用 Tailwind CSS v4 时 Shadcn-Vue CLI 初始化项目的 tsconfig 配置问题
date: 2026-04-12
column: 技术随笔
---

在使用 Tailwind CSS v4 配合 Shadcn-Vue CLI 初始化 Vite 项目时，很多人会遇到一个隐蔽的配置陷阱。CLI 在验证阶段会明确报错：`No import alias found in your tsconfig.json file`，但检查文件时却发现 `tsconfig.json` 明明存在。

问题的根源在于现代 Vite 模板的配置结构变化。早期 Vite 项目通常只有一个 `tsconfig.json`，但现在官方模板采用多文件引用模式：`tsconfig.json` 作为入口，通过 `references` 指向 `tsconfig.app.json` 和 `tsconfig.node.json`。Shadcn-Vue 的验证逻辑需要在这些文件中找到 `compilerOptions.paths` 配置，而默认的 Vite + Vue 模板为了简洁，往往只保留最基础的编译选项。

具体到 Tailwind CSS v4 的场景，配置方式本身已经简化——不再需要 `tailwind.config.js`，也不再需要 PostCSS 配置，CSS 入口文件只需一行 `@import "tailwindcss"`。但这种简化反而让人更容易忽略 TypeScript 路径别名的必要性。Shadcn-Vue 的组件生成机制重度依赖 `@/` 别名指向 `src` 目录，如果缺失，CLI 会直接中断初始化流程。

这个问题我已经在 UnoVue/Shadcn-Vue 提出 Issue 了：https://github.com/unovue/shadcn-vue/issues/1761

修复方法是在两个关键位置同时补充配置。首先是 `tsconfig.app.json`，它继承自 `@vue/tsconfig/tsconfig.dom.json`，需要在 `compilerOptions` 中显式添加 `baseUrl` 和 `paths`：

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

其次是 `tsconfig.json`，即使它只负责引用子配置，也需要独立的 `compilerOptions` 块来满足 CLI 的解析需求：

```json
{
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Vite 配置同样需要同步，在 `vite.config.ts` 中使用 `path.resolve` 建立别名映射：

```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

对于 Yarn 4 PnP 用户，还需注意模块解析的完整性。如果 `@vue/tsconfig` 包因 PnP 的严格依赖管理而无法正确加载，CLI 可能无法读取继承的基配置，此时需要运行 `yarn dlx @yarnpkg/sdks` 确保编辑器 SDK 和 TypeScript 解析器对齐。

完成上述修改后重新执行 `npx shadcn-vue@latest init`，验证流程应能顺利通过。这个配置陷阱的本质是工具链演进不同步：Vite 模板追求最小化配置，Shadcn-Vue 依赖传统路径别名机制，而 Tailwind CSS v4 的简化又让人误以为整个工具链都进入了"零配置"时代。
