# ROLLBACK

## 生产回退

1. 在 Sites 版本列表中选择上一条已验证版本。
2. 将上一版本重新部署为公开生产版本。
3. 回读生产链接，确认根页面与人物卡交互恢复。

## 源码回退

1. 在当前独立 Git 仓库中定位上一条可用提交。
2. 新建回退提交，恢复 `app/`、`public/persona-atlas.html` 与 `public/og.png`。
3. 运行 `npm test`。
4. 保存并部署新的 Sites 版本，禁止直接覆盖或删除历史版本。

固定五人卡组出现内容错误时，只回退 `public/persona-atlas.html` 与对应测试；首页主视觉未变，不随卡组回退。
入口分流出现问题时，回退 `choice` 页面与 `begin/open-pack/build-cards/back-choice` 四个动作，恢复原 `begin → scope`。
开包动效出现问题时，回退 `pack` 页面、`crackPack/revealPackCard/resetPackOpening` 和对应 CSS，恢复 `open-pack → atlas`。
动态出场层出现加载、性能或焦点问题时，回退 `atlas-entrance` DOM/CSS、`playPackEntrance/closePackEntrance/finishPackReveal` 和人物数据中的 `motion/motionPoster` 字段，再删除 `public/personas-motion/`；原静态卡包与 `public/personas/` 不受影响。
立绘出现问题时，同时回退 `public/personas/`、人物数据中的 `image` 字段与卡面图片 CSS；禁止只删图片留下失效路径。
首页卡盒立绘出现问题时，回退 `app/page.tsx` 的 `Persona.image` 与 `workbench-card-art-image`，恢复原几何占位卡面。

首页主视觉或高度修正出现问题时，同时回退 `public/persona-atlas.html` 与 `public/hero-personas.png`，避免 HTML
引用新资产但发布包缺图。回退后至少以一个宽屏和一个窄屏视口确认没有底部白区。

Three.js Driver 出现黑屏、GPU 兼容或性能问题时，优先回退 `app/page.tsx`、`app/globals.css`、
`app/driver-scene.tsx`、`package.json` 与 `package-lock.json` 到上一公开版本；旧图鉴静态资产无需删除。
回退提交完成后重新构建并部署历史兼容版本，不在生产环境临时改用 CDN。

锁定态主按钮再次消失时，先恢复 `phase === "locked"` 分支中的 `.activate-button` 和 `activateDriver` 点击绑定；
不允许只留下图标、拖拽手势或说明文字作为唯一启动入口。

机械把手交互异常时，移除 `app/page.tsx` 的 `handleProgress` 与 `.driver-handle-control`，恢复 locked 阶段的单一启动按钮；同时从 `DriverScene` props 和动画循环移除把手进度映射。该回退不会影响卡片插入、音效或角色实例状态。

音频出现浏览器兼容、音量或误播放问题时，可单独回退 `app/driver-audio.ts` 与 `app/page.tsx` 的声音调用，
保留 Three.js Driver 和 DOM 工作台。禁止用影视原声音频文件替代合成层。

本机随机候选覆盖出现问题时，停止 `127.0.0.1:8765` 静态服务即可立即恢复原创合成音；源码回退只需删除
`localActivationClipUrls`、`playRandomLocalActivationClip` 和 `stopDriverAudio` 中的本机播放器清理，不需要改动或删除候选源文件。
公开版本不携带候选音频，因此无需执行 Sites 回退。

三段串行播报出现顺序、发音或音色问题时，可单独回退 `localPersonaAnnouncementUrls`、
`localCommandAnnouncementUrls`、`playLocalClip` 与 `playLocalActivationSequence`，恢复为启动按钮直接随机候选；
`announcer/` 源文件可保留用于重新选音，不影响站点构建。

Persona Navi Bridge 出现误创建、重复任务或本机调用问题时：

1. 先停止 `pnpm navi:bridge`；页面会显示 Bridge 不可用，公开站不受影响。
2. 回退 `scripts/persona-navi-bridge*.mjs`、`app/page.tsx` 的 Navi 状态与请求、`app/globals.css` 的 `.navi-run-*` 样式。
3. 保留 `.persona-runs/` 作为审计证据，不删除已创建的 YouNavi conversation；需要归档/删除时由用户在 YouNavi 明确操作。
4. 五个已安装 Skill 与站点无运行耦合，可以保留；如需卸载，逐一移出 `/Users/zqnw/navi-ai/CHA499/skills/`，不要删除其他用户 Skill。
5. request 存在但 receipt 缺失时不得手工补 receipt 或自动重发；先用 YouNavi 会话历史核对是否已创建任务。

若角色面板变化再次触发 ResizeObserver 错误，保留 `scheduleResize` 的 animation-frame 合并和相同尺寸短路；
只回退该逻辑前必须在开发模式反复展开/收起 Navi 状态面板验证没有错误浮层。

## 紧急下线

如果公开内容出现隐私、版权或错误数据风险，应先将 Sites 访问权限收紧或停止公开部署，再调查源码。
本版本只有公开 Skill 摘要和浏览器会话状态，正常情况下不需要删除任何访客数据。
