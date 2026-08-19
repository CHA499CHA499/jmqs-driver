# INTERFACE

## 调用方

- 任何获得生产链接的浏览器访客。
- Sites 平台负责构建、托管和公开访问。

## 输入

- 无服务端输入。
- 访客只能操作站内虚构演示数据与浏览器内临时 UI 状态。

## 输出

- 根路由 `/`：承载公开 Demo 的应用外壳。
- 静态资产 `/persona-atlas.html`：假面骑事交互体验。
- 静态资产 `/og.png`：链接分享封面。

## 读写路径

- 源码读取：当前工具目录。
- 构建输出：`dist/`。
- 浏览器临时状态：访客自己的 sessionStorage。
- 不读写 CHA499 的 `brain/`、`thalamus/` 或 `vault/`。

## 环境与依赖

- Node.js 22.13 或更高版本。
- Sites vinext starter 与 Cloudflare Worker 兼容构建。
- 不需要 API key、OAuth、飞书凭证、数据库或对象存储。

## 安全合同

- 站点公开，但演示内容全部虚构。
- 外部内容不会进入 Cinder 四层记忆系统。
- 发布凭证只在 Sites 交付命令中短暂使用，不写入源码、Git 配置或 URL。
