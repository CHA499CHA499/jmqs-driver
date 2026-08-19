# INTERFACE

## 调用方

- 任何获得生产链接的浏览器访客。
- Sites 平台负责构建、托管和公开访问。

## 输入

- 无服务端输入。
- 访客只能操作站内固定公开 Skill 摘要与浏览器内临时 UI 状态。
- 固定卡组只读取构建时写入的 5 个公开 GitHub Skill 摘要，不在运行时访问 GitHub。

## 输出

- 根路由 `/`：Persona Driver 工作台，包含演示素材、指令卡、人物卡盒和角色实例面板。
- 人物卡进入 `locked` 后必须显示可见、可聚焦的「启动 Persona Driver」按钮；按钮是唯一必需的变身入口。
- 静态资产 `/persona-atlas.html`：假面骑事交互体验。
- 静态资产 `/personas/*.jpg`：五张原创人物角色立绘。
- 首页主入口分流为「打开卡包」与「构建卡片」。
- 「打开卡包」只操作本地固定五人数据：开包、逐张揭晓、收下卡牌。
- 静态资产 `/hero-personas.png`：首页响应式人物卡背景。
- 静态资产 `/og.png`：链接分享封面。

## 3D 运行合同

- `app/driver-scene.tsx` 是唯一 Three.js 边界，只接收 Driver phase、人物卡颜色与归一化把手进度。
- `app/page.tsx` 的人物卡盒读取 `/personas/*.jpg`，卡片姓名继续作为可访问文本，图片使用空替代避免重复朗读。
- phase 只允许 `idle / ready / inserting / locked / activated`。
- 页面不支持 WebGL 2 时必须保留完整 DOM 工作台，并显示静态 Driver。
- Three.js、材质和几何体由 Vite 打包；运行时不从 CDN 获取 3D 代码或模型。
- 页面卸载时必须停止动画、断开 ResizeObserver、释放 geometry/material/renderer。

## 变身把手输入合同

- `app/page.tsx` 持有归一化的 `handleProgress`，范围固定为 `0..1`；左右把手向中心拖动都会增加进度。
- `DriverScene` 只把进度映射到外壳、导轨、光环、核心的位置与能量强度，不改变既有 phase 状态机。
- 进度达到 `0.72` 后进入 `activated`；不足阈值时回到 `0`。单击或键盘激活任一把手时直接完成闭合并触发同一启动函数。
- Pointer Capture 保证拖出按钮后仍能完成手势；`touch-action: none` 避免触控拖动被页面滚动抢占。

## 音效运行合同

- `app/driver-audio.ts` 是唯一声音边界；公开环境继续只使用 Web Audio API 与系统 TTS，不读取外部音频文件。
- 只在用户点击选卡、指令卡、插卡或启动按钮后创建或恢复 AudioContext。
- 仅在页面 host 为 `localhost` 或 `127.0.0.1` 时，启动按钮按「英文角色卡名 → 英文指令 → 随机候选音效」串行播放；不会自动连播，也不会连续重复上一段候选。
- 角色名与指令是预生成本机片段，必须共用同一音色、语速、口音和处理链；Donald 的播报文本固定为 `Donald John Trump`，ACTION 的播报文本固定为 `Action`。
- 16 段候选保持原文件音调与速度，不做运行时变调、拉伸或拼接。
- 本机候选只用于开发试听，不复制进 `public/`、`dist/` 或 Sites；本地服务缺失或播放失败时回退原创合成启动音。
- 选卡、指令卡与插卡只触发原有合成提示音，不会读取本机候选。
- `PERSONA RIDE` 使用浏览器系统 TTS，声音与可用语言随访客操作系统变化。
- 静音时停止本机候选与 TTS，后续交互不再产生声音事件。
- 禁止加入假面骑士原版音频、采样、台词节奏或其他受保护音效资产。

## 读写路径

- 源码读取：当前工具目录。
- 构建输出：`dist/`。
- 浏览器临时状态：访客自己的 sessionStorage。
- 本机开发音频只读：`outputs/bilibili-audio/decade-candidates/`，其中 `announcer/` 是角色名和指令播报；由独立 `127.0.0.1:8765` 静态服务提供，不属于站点构建输入。
- 不读写 CHA499 的 `brain/`、`thalamus/` 或 `vault/`。

## 环境与依赖

- Node.js 22.13 或更高版本。
- npm 依赖 `three`，只在构建期安装，访客零安装。
- Sites vinext starter 与 Cloudflare Worker 兼容构建。
- 不需要 API key、OAuth、飞书凭证、数据库或对象存储。

## 安全合同

- 站点公开，人物内容是公开 Skill 摘要，不代表本人观点。
- 外部内容不会进入 Cinder 四层记忆系统。
- 发布凭证只在 Sites 交付命令中短暂使用，不写入源码、Git 配置或 URL。
