# Modular Persona Driver Models

原创 Persona Driver 的网页模型资产。四个 GLB 必须保持独立加载和独立动画，不在构建阶段合并。

- `belt.glb`：空载腰带本体；包含 `MainCardSlot_Root`、`LeftRodDock_Pivot`、`RightRodDock_Pivot`。
- `persona-card.glb`：人物主卡；根节点 `PersonaCard_Root`。
- `energy-rod.glb`：青色能量棒；根节点 `EnergyRod_Root`。
- `skill-rod.glb`：琥珀色技能棒；根节点 `SkillRod_Root`。

静态资产全部由项目自有 Blender 脚本生成，无外部纹理、品牌标识或第三方模型。`app/driver-scene.tsx` 使用同源
`GLTFLoader` 并行加载；加载失败时保留原程序化 Three.js Driver，不中断人物卡主流程。
