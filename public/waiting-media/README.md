# Waiting media

`decade-all-riders-waiting-v1-480p.mp4` is the local runtime asset used by the Persona Driver Run panel. It contains the middle six minutes of the source (`00:05:18.311`–`00:11:18.311`). Full-length 720p and 480p versions are outside the source repository under `CHA499/artifacts/persona-driver-convergence/2026-08-21/history/public/waiting-media/`.

- Source: https://www.bilibili.com/video/BV1Cu4y1U7BT/
- Runtime version: 854×480, 30fps, H.264 High/yuv420p + AAC stereo 96 kbps, 360 seconds, faststart.
- Runtime size: 53,341,596 bytes (about 50.9 MiB); SHA-256 `5d7514209ca2f4c440a0f7f7760d2a66a9830125f58c305f4168198ed87bd052`.
- Archived full 480p version: 114,994,656 bytes; SHA-256 `a2786b68523cbff74ad1c6bd12c997794bc2cfabfe1186da19ca3f2f2bb976f1`.
- Archived backup: 1280×720, 30fps, H.264 + AAC; SHA-256 `1e1c999c8669a7217856b1cf124d2baec2af79cece7fab85a8c95253e0f0cd77`.
- Captions: `waiting-v1.zh-Hans.vtt` is mounted as the local `<track kind="captions">` resource.
- Runtime boundary: the waiting panel renders only on the local Persona runtime; it must not be published or used as a public page asset.
- 仅供本地测试，禁止公开部署。
- The panel is informational only. Closing or minimizing it never cancels a Run.
- A successful receipt opens the panel for `pending`/`running`; terminal/error states close it. YouNavi only opens after an explicit user action.
