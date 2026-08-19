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

首页主视觉或高度修正出现问题时，同时回退 `public/persona-atlas.html` 与 `public/hero-personas.png`，避免 HTML
引用新资产但发布包缺图。回退后至少以一个宽屏和一个窄屏视口确认没有底部白区。

Three.js Driver 出现黑屏、GPU 兼容或性能问题时，优先回退 `app/page.tsx`、`app/globals.css`、
`app/driver-scene.tsx`、`package.json` 与 `package-lock.json` 到上一公开版本；旧图鉴静态资产无需删除。
回退提交完成后重新构建并部署历史兼容版本，不在生产环境临时改用 CDN。

## 紧急下线

如果公开内容出现隐私、版权或错误数据风险，应先将 Sites 访问权限收紧或停止公开部署，再调查源码。
本版本只有虚构数据，正常情况下不需要删除任何访客数据。
