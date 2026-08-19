# 假面骑事公开测试站

把已验证的「人物图鉴」交互 Demo 发布为所有人可访问的公开测试站。站内只使用虚构人物和模拟数据，
不连接飞书、不读取本机资料、不保存访客输入。

## 本地运行

```bash
npm install
npm run dev
```

## 验证

```bash
npm test
```

测试会重新构建 Sites 产物，并确认根页面、公开 Demo 资产和正式标题都存在。

## 目录

- `app/`：Sites 外壳、页面元数据与公开 Demo iframe。
- `public/persona-atlas.html`：可交互 Demo。
- `public/hero-personas.png`：首页三人物卡主视觉，左侧标题由 HTML 实时渲染。
- `public/og.png`：链接分享封面。
- `.openai/hosting.json`：Sites 项目绑定，只保存公开项目 ID，不含凭证。
- `INTERFACE.md`：调用与数据边界。
- `ROLLBACK.md`：发布失败时的回退步骤。

## 隐私边界

- 所有人拿到链接都能打开。
- 只展示虚构演示数据。
- 没有登录、数据库、文件上传、第三方连接器或模型调用。
- Demo 的本地状态仅存在于访客浏览器会话。

## 页面尺寸

首页与各交互状态使用动态视口高度 `100dvh`，不再依赖 720/760/780px 固定高度。根页面只保留一层 iframe，
内部页面负责铺满视口，避免高屏幕下露出外层白底。

## Persona Driver v1

根页面升级为工作台：左侧演示素材与指令卡、中央 Three.js Persona Driver、底部人物卡盒、右侧角色实例面板。
第一版支持待机呼吸、人物卡插入、锁定、核心旋转点亮、原创 Web Audio 提示音和系统 TTS 播报。
Three.js 由 Vite 打包进站点，访客无需安装依赖；不支持 WebGL 2 时显示静态 Driver。

音效层由 `app/driver-audio.ts` 运行时合成：选卡金属音、指令卡双脉冲、插卡滑轨与锁扣、启动扫描脉冲、
能量升频和低频冲击。最后使用系统 TTS 播报原创 `PERSONA RIDE` 文案；不包含影视原版采样。
