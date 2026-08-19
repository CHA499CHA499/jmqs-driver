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
- 静态资产 `/persona-atlas.html`：假面骑事交互体验。
- 静态资产 `/personas/*.jpg`：五张原创人物角色立绘。
- 首页主入口分流为「打开卡包」与「构建卡片」。
- 「打开卡包」只操作本地固定五人数据：开包、逐张揭晓、收下卡牌。
- 静态资产 `/hero-personas.png`：首页响应式人物卡背景。
- 静态资产 `/og.png`：链接分享封面。

## 3D 运行合同

- `app/driver-scene.tsx` 是唯一 Three.js 边界，只接收 Driver phase 与人物卡颜色。
- `app/page.tsx` 的人物卡盒读取 `/personas/*.jpg`，卡片姓名继续作为可访问文本，图片使用空替代避免重复朗读。
- phase 只允许 `idle / ready / inserting / locked / activated`。
- 页面不支持 WebGL 2 时必须保留完整 DOM 工作台，并显示静态 Driver。
- Three.js、材质和几何体由 Vite 打包；运行时不从 CDN 获取 3D 代码或模型。
- 页面卸载时必须停止动画、断开 ResizeObserver、释放 geometry/material/renderer。

## 音效运行合同

- `app/driver-audio.ts` 是唯一声音边界；公开环境继续只使用 Web Audio API 与系统 TTS，不读取外部音频文件。
- 只在用户点击选卡、指令卡、插卡或启动按钮后创建或恢复 AudioContext。
- 仅在页面 host 为 `localhost` 或 `127.0.0.1` 时，启动按钮会从本机 `127.0.0.1:8765` 的 16 段候选中随机播放一段；不会自动连播，也不会连续重复上一段。
- 本机候选只用于开发试听，不复制进 `public/`、`dist/` 或 Sites；本地服务缺失或播放失败时回退原创合成启动音。
- 选卡、指令卡与插卡只触发原有合成提示音，不会读取本机候选。
- `PERSONA RIDE` 使用浏览器系统 TTS，声音与可用语言随访客操作系统变化。
- 静音时停止本机候选与 TTS，后续交互不再产生声音事件。
- 禁止加入假面骑士原版音频、采样、台词节奏或其他受保护音效资产。

## 读写路径

- 源码读取：当前工具目录。
- 构建输出：`dist/`。
- 浏览器临时状态：访客自己的 sessionStorage。
- 本机开发音频只读：`outputs/bilibili-audio/decade-candidates/`，由独立 `127.0.0.1:8765` 静态服务提供，不属于站点构建输入。
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
