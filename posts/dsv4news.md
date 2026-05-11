---
title: Redis 之父为 DeepSeek V4 Flash 造了一条"专属高速公路"：ds4.c 技术深扒
date: 2026-05-11
column: 闲言碎语
---

Redis 之父 Salvatore Sanfilippo（antirez）于 2026 年 5 月 7 日在 GitHub 发布了 ds4.c——一个专为 DeepSeek V4 Flash 打造的本地推理引擎。这不是又一个 llama.cpp 的 wrapper，而是一个"故意做窄"的极端优化项目：只跑一个模型，只支持 Apple Silicon，只走 Metal 路径。antirez 在 README 中开宗明义："这不是通用 GGUF 加载器，不是框架，不是包装层。"

## 为什么值得单独造一条"高速公路"？

DeepSeek V4 Flash 发布于 2026 年 4 月 24 日，总参数 284B，激活参数仅 13B，上下文窗口 100 万 token。antirez 将其定位为"准前沿"（quasi-frontier）模型，理由很具体：

1. **思考模式可控**：在 thinking 模式下，V4 Flash 的思考链长度仅为其他模型的 1/5，且与问题复杂度成正比——这在其他模型上几乎无法实用
2. **知识边界更深**：284B 参数在边缘知识采样时明显优于 27B/35B 密集模型
3. **多语言能力突出**：英语和意大利语写作质量显著优于同档模型
4. **KV Cache 压缩率极高**：支持磁盘持久化，为长上下文本地推理提供了物理基础
5. **QAT 训练友好**：模型原生支持激进量化，2-bit 下仍能保持工具调用可靠性

这种"准前沿"定位意味着它既不像 70B 密集模型那样"勉强够用"，也不像 405B 模型那样对硬件要求苛刻到无法本地运行。antirez 的原话是："这是第一次，我感觉自己的电脑上跑着一个前沿模型。"

## 三大工程杀招

### 1. 非对称 2-bit 量化：只压"该压"的地方

业界对 2-bit 量化的普遍担忧是模型会开始幻觉、工具调用崩坏。ds4.c 的解法不是"全压"，而是**只量化路由 MoE 专家层**：

- **压缩区**：路由专家的上/门控投影用 `IQ2_XXS`，下投影用 `Q2_K`——这些占模型权重的绝对大头
- **保真区**：共享专家、投影层、路由层、嵌入层全部保持 `Q8` 精度

效果：Q2 量化后模型约 76GB，可在 128GB 统一内存的 MacBook Pro M3 Max 上运行，且通过官方 API logits 比对验证，数值偏差在可用范围内。antirez 在 Hacker News 上解释，这很大程度上归功于 DeepSeek 的 QAT（Quantization-Aware Training）训练——量化误差被直接纳入学习过程。

这种"非对称"策略与业界通行的"全模型统一量化"思路截然不同。通用框架为了兼容性，必须对所有模型一视同仁；而 ds4.c 因为只服务一个模型，可以精确知道哪些层对精度敏感、哪些层可以激进压缩。这是"专属高速公路"的第一个具象化体现。

### 2. KV Cache 磁盘化：SSD 作为"一等公民"

这是 ds4.c 最具架构野心的设计。当前 LLM Agent 客户端（如 Claude Code）基本都是无状态的：每次请求把完整对话历史重发一遍，服务端从头做 prefill。对于一个 25K token 的系统提示，本地硬件上这意味着几十秒的首次 token 延迟。

ds4.c 的做法是：**预填充完成后，将 KV 状态序列化到磁盘，键值为 token ID 序列的 SHA1 哈希**。下次请求若前缀匹配，直接从磁盘加载 checkpoint，跳过 prefill。README 中的原话是："The KV cache is actually a first class disk citizen."

这不是"内存不够了换到磁盘"的被动 swap，而是主动架构设计——现代 MacBook 的 SSD 速度足够快，而 DeepSeek V4 的 KV Cache 压缩率极高，加上 Agent 场景"相同系统提示 + 变化尾部"的访问模式，磁盘 KV 的命中率天然很高。

更令人惊讶的是，这种设计在通用框架中几乎不可能实现。KV Cache 的格式、压缩率、序列化方式因模型而异，通用引擎为了兼容数百个模型，无法针对单一模型的磁盘 I/O 特性做深度优化。ds4.c 的"模型锁定"在这里反而成了优势。

### 3. Metal-Only：拒绝抽象层的性能税

代码语言分布很有意思：59.2% C，27.6% Objective-C，12.6% Metal Shading Language。六个主文件，零外部依赖，直接调用系统工具链编译。

- `ds4.c`：推理引擎核心
- `ds4_metal.m`：GPU 加速层
- `ds4_cli.c`：终端交互界面
- `ds4_server.c`：HTTP 服务器（同时兼容 OpenAI `/v1/chat/completions` 和 Anthropic `/v1/messages` 协议）
- `ds4_test.c`：logits 数值保真度测试

CPU 路径在代码中存在，但仅用于内核正确性验证——antirez 警告，近期 macOS 版本存在虚拟内存管理 bug，大工作集下 CPU 推理会直接崩溃。所以生产路径必须是 Metal-only。

这种"去抽象层"的思路与通用框架背道而驰。llama.cpp 为了支持 CUDA、Metal、Vulkan、CPU 等多种后端，不得不在算子层面做大量通用封装；ds4.c 则直接针对 M3 Max/Ultra 的 GPU 架构写死计算图，每个 kernel 的 tile 大小、shared memory 分配、warp 调度都是手工调参。通用框架覆盖 95% 场景，ds4.c 追求那 5% 的极致。

## 实测性能数据

| 硬件 | 量化 | 上下文 | 预填充 | 生成速度 |
|------|------|--------|--------|----------|
| MacBook Pro M3 Max (128GB) | Q2 | 短 prompt | 58.52 tok/s | **26.68 tok/s** |
| MacBook Pro M3 Max (128GB) | Q2 | 11,709 tokens | 250.11 tok/s | 21.47 tok/s |
| Mac Studio M3 Ultra (512GB) | Q2 | 短 prompt | 84.43 tok/s | **36.86 tok/s** |
| Mac Studio M3 Ultra (512GB) | Q4 | 12,018 tokens | 448.82 tok/s | 26.62 tok/s |

数据来源：ds4.c 官方 README 及社区实测。作为参照，一个 284B MoE 模型在笔记本上跑出 26 tok/s 的生成速度，半年前这还是数据中心 GPU 的活。

功耗方面，M3 Max 峰值约 50W——与普通笔记本工作负载持平，连续 Agent 会话平均功耗约 30W，每小时电费几毛钱级别。这意味着你不仅能在本地跑前沿模型，还能在咖啡馆里用电池跑。

## 生态对接：不是玩具，是生产工具

ds4.c 内置了 OpenAI 和 Anthropic 双协议兼容层，支持 tool calling。README 直接提供了三个 Agent 客户端的配置示例：

- **Claude Code**：通过 `--api` 指向本地 ds4-server
- **opencode**：开源 Agent IDE，原生支持
- **Pi**：个人 AI 助手客户端

这意味着它不是"能跑起来看看"的 demo，而是可以直接接入现有 Agent 工作流的推理后端。你不需要重写任何客户端代码，只需要把 API endpoint 从 `api.openai.com` 换成 `localhost:8080`。

## 争议与边界

**alpha 质量**：antirez 明确标注代码和 GGUF 文件均为 alpha 状态，"推理和模型服务是复杂领域，这一切只存在了几天"，预计需要数月才能达到更稳定形态。

**Metal 独占**：没有 CUDA，没有 AMD，没有 CPU 回退。这是设计选择，不是技术债务。antirez 认为，一旦决定只支持一个模型，GGML 的通用调度机制就成了死重——不如写一个针对特定计算图的静态优化器。

**模型锁定**：不支持其他 GGUF 文件，tensor layout、量化混合策略、metadata、可选 MTP 状态都是硬编码的。换模型就需要换引擎。

这些限制在"通用框架"的视角下都是缺陷，但在"专属高速公路"的视角下是 trade-off。antirez 的赌注是：DeepSeek V4 Flash 的独特性（极端稀疏、QAT 友好、长上下文）值得这种程度的定制化投入。

## 行业信号：从"通用框架"到"模型专属引擎"？

ds4.c 的出现可能标志着一个趋势拐点。过去本地推理的叙事是"一个引擎跑所有模型"（llama.cpp、vLLM、MLX）。但 antirez 提出了另一种哲学：**通用引擎为了兼容性必须做抽象，抽象意味着妥协；而 deliberately narrow 的代码库可以把一件事做到极致**。

他在 X 上的致谢也很有意思——没有 llama.cpp 和 GGML 社区的工作，ds4.c 不可能存在，但 ds4.c 选择不链接 GGML，而是把其工程经验内化为一个专用 Metal 计算图。LICENSE 中保留了对 GGML 作者的署名致谢。

这是否意味着未来每个"特性足够独特"的模型都会催生一个专属引擎？antirez 的答案是：通用项目覆盖 95% 场景，而像 V4 Flash 这样具有极端稀疏性和 QAT 友好性的模型，值得那 5% 的手工优化投入。

更深层的信号在于，本地推理正在从"边缘爱好者的玩具"向"生产力基础设施"进化。当 284B 模型能在笔记本上以 26 tok/s 生成、支持 100 万 token 上下文、兼容现有 Agent 生态时，"本地"与"云端"的边界开始模糊。开发者不再需要为了"能用"而忍受通用框架的妥协，也不需要为了"极致"而雇佣专门的 CUDA 工程师——一个专注的 C 程序员加上对单一模型的深度理解，就能造出可用的生产级引擎。

对于仍在评估本地推理方案的开发者来说，这次变动或许是一个警示——在评估任何推理框架时，不仅要看它支持多少模型，更要审视其优化深度是否与你的核心模型匹配。通用性是广度，专属是深度，而 ds4.c 证明，在特定场景下，深度可以碾压广度。

---

**项目地址**：https://github.com/antirez/ds4  
**模型权重**：https://huggingface.co/antirez/deepseek-v4-gguf  
**编译依赖**：Xcode Command Line Tools + curl，零第三方库

如果你有一台 128GB 内存的 Apple Silicon Mac，现在就可以 `./download_model.sh q2 && make` 跑起来。antirez 的原话是："这是第一次，我感觉自己的电脑上跑着一个前沿模型。"