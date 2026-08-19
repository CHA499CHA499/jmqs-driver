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
立绘出现问题时，同时回退 `public/personas/`、人物数据中的 `image` 字段与卡面图片 CSS；禁止只删图片留下失效路径。

首页主视觉或高度修正出现问题时，同时回退 `public/persona-atlas.html` 与 `public/hero-personas.png`，避免 HTML
引用新资产但发布包缺图。回退后至少以一个宽屏和一个窄屏视口确认没有底部白区。

Three.js Driver 出现黑屏、GPU 兼容或性能问题时，优先回退 `app/page.tsx`、`app/globals.css`、
`app/driver-scene.tsx`、`package.json` 与 `package-lock.json` 到上一公开版本；旧图鉴静态资产无需删除。
回退提交完成后重新构建并部署历史兼容版本，不在生产环境临时改用 CDN。

音频出现浏览器兼容、音量或误播放问题时，可单独回退 `app/driver-audio.ts` 与 `app/page.tsx` 的声音调用，
保留 Three.js Driver 和 DOM 工作台。禁止用影视原声音频文件替代合成层。

## 紧急下线

如果公开内容出现隐私、版权或错误数据风险，应先将 Sites 访问权限收紧或停止公开部署，再调查源码。
本版本只有公开 Skill 摘要和浏览器会话状态，正常情况下不需要删除任何访客数据。
