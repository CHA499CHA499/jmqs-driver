# 假面骑事公开测试站

把已验证的「人物图鉴」交互 Demo 发布为所有人可访问的公开测试站。站内使用固定的公开人物 Skill 摘要和模拟交互，
不连接飞书、不读取本机资料、不保存访客输入，也不代表人物本人观点。

固定卡组为纳瓦尔、埃隆·马斯克、史蒂夫·乔布斯、唐纳德·特朗普和 Paul Graham，卡片内容来自对应公开 GitHub Skill。
点击首页主按钮后先选择「打开卡包」或「构建卡片」；前者进入固定卡组，后者沿用原模拟构建流程。
打开卡包时先点击密封卡包，再逐张点击翻开五张人物卡，全部揭晓后进入图鉴。
五位人物均使用项目自有生成立绘：动态漫画姿势、原创特摄假面和角色专属配色，不复用参考图像素或第三方角色设计。
每张背面卡首次揭晓时会播放对应的 4 秒动态出场：大幅人物动作、激烈运镜和粒子冲击，随后缩回原卡位并完成翻卡。
动画支持「跳过出场」和 Escape；系统启用 reduced motion 或视频加载失败时直接揭晓静态卡，不阻塞收集流程。

## 本地运行

```bash
npm install
npm run dev
```

需要真实创建 YouNavi 对话时，另开一个终端启动仅监听 localhost 的 Bridge：

```bash
pnpm navi:bridge
```

页面仍从 `http://localhost:3000` 打开；公开 Sites 不会调用 Bridge。

## 验证

```bash
npm test
```

测试会重新构建 Sites 产物，并确认根页面、公开 Demo 资产和正式标题都存在。

## 目录

- `app/`：Sites 外壳、页面元数据与公开 Demo iframe。
- `public/persona-atlas.html`：可交互 Demo。
- `public/hero-personas.png`：首页三人物卡主视觉，左侧标题由 HTML 实时渲染。
- `public/personas/`：五张人物角色立绘的网页压缩资产。
- `public/personas-motion/`：五段 4 秒 H.264 出场视频与首帧海报；只在卡包首次揭晓时播放。
- `public/models/persona-driver/`：原创模块化腰带本体、人物卡、能量棒与技能棒 GLB。
- `public/og.png`：链接分享封面。
- `.openai/hosting.json`：Sites 项目绑定，只保存公开项目 ID，不含凭证。
- `INTERFACE.md`：调用与数据边界。
- `ROLLBACK.md`：发布失败时的回退步骤。

## 隐私边界

- 所有人拿到链接都能打开。
- 只展示固定公开 Skill 的摘要与模拟交互。
- 没有登录、数据库、文件上传、第三方连接器或模型调用。
- Demo 的本地状态仅存在于访客浏览器会话。

## 页面尺寸

首页与各交互状态使用动态视口高度 `100dvh`，不再依赖 720/760/780px 固定高度。根页面只保留一层 iframe，
内部页面负责铺满视口，避免高屏幕下露出外层白底。

## Persona Driver v1

根页面升级为工作台：左侧演示素材与指令卡、中央 Three.js Persona Driver、底部人物卡盒、右侧角色实例面板。
第一版支持待机呼吸、人物卡插入、锁定、核心旋转点亮、原创 Web Audio 提示音和系统 TTS 播报。
底部人物卡盒直接展示 `public/personas/` 的五张角色立绘，不再使用字母与几何人形占位。
Three.js 由 Vite 打包进站点，访客无需安装依赖；不支持 WebGL 2 时显示静态 Driver。
人物卡锁定后始终显示明确的「启动 Persona Driver」主按钮；实验性交互不能替代主操作。
卡片锁定后，用户可把左右机械把手向中心拖动；拖动进度会同步驱动 3D 外壳、导轨、光环与核心闭合，超过阈值后进入 `PERSONA RIDE`。单击任一把手是键盘和触控场景的等价启动入口，未达到阈值则自动弹回。
中央 Driver 优先加载四件原创模块化 GLB：空载腰带、人物主卡、青色能量棒和琥珀色技能棒。人物卡保持独立插入动画，两根棒与左右插座随闭合进度旋转；模型请求失败时自动保留原程序化几何回退。

音效层由 `app/driver-audio.ts` 运行时合成：选卡金属音、指令卡双脉冲、插卡滑轨与锁扣、启动扫描脉冲、
能量升频和低频冲击。最后使用系统 TTS 播报原创 `PERSONA RIDE` 文案；不包含影视原版采样。

本机开发时存在一个明确隔离的试听覆盖：仅当页面运行于 `localhost` 或 `127.0.0.1`，点击「启动 Persona Driver」
才按「英文角色卡名 → 英文指令 → 随机候选音效」串行播放。角色名和指令使用同一固定本机音色与处理链；
`candidate-01..16.m4a` 不变调、不变速。所有本机音频均来自 `127.0.0.1:8765`，不进入 `public/`、构建产物或公开部署；
服务不可用时自动回退到系统播报加原创合成音。选卡、指令卡和插卡不会触发这条启动序列。

## Persona Navi Bridge

本机版启动 Driver 后会把人物卡、指令卡、当前任务、选中素材说明和输出合同组装为
`persona.navi-run/v1`，提交到 `http://localhost:8766`。Bridge 先打开 YouNavi，等待本机后端与认证就绪，
再用 `agent-cli chat send` 创建独立 conversation。首条用户消息以 `/skill-name` 显式激活 Skill；页面保存
task/conversation 回执，支持按需检查结果和再次打开 YouNavi。

| 卡片 | YouNavi Skill |
|---|---|
| Naval | `naval-perspective` |
| Elon Musk | `elon-musk-perspective` |
| Steve Jobs | `steve-jobs-perspective` |
| Donald John Trump | `trump-perspective` |
| Paul Graham | `paul-graham-perspective` |

运行前必须把五个完整 Skill 目录安装到 `/Users/zqnw/navi-ai/CHA499/skills/`。Bridge 只接受服务端白名单中的
persona/command，不接受网页传入 Skill 路径、命令或落盘目录；CLI 使用数组参数调用，不经过 shell。
运行证据写在 gitignored `.persona-runs/<runId>/`，不进入 Sites、brain 或人物卡。
四项素材由 Bridge 固定映射到本机预设目录中的同名 Markdown；默认目录是项目下 `presets/`，也可通过
`PERSONA_NAVI_PRESET_ROOT` 指向其他明确目录。网页只提交素材 ID，不能提交或扩大读取路径；预设缺失时停止创建任务并显示错误。
