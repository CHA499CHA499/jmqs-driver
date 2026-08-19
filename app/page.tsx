"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  playActivationSequence,
  playCardInsertSound,
  playCardSelectSound,
  playCommandSelectSound,
  stopDriverAudio,
} from "./driver-audio";
import type { DriverPhase } from "./driver-scene";

const DriverScene = lazy(() =>
  import("./driver-scene").then((module) => ({ default: module.DriverScene })),
);

interface Persona {
  id: string;
  name: string;
  role: string;
  code: string;
  color: string;
  image: string;
  summary: string;
  tags: string[];
}

const PERSONAS: Persona[] = [
  {
    id: "naval",
    name: "纳瓦尔",
    role: "长期主义策略师",
    code: "LEVERAGE ARCHITECT",
    color: "#d8b25c",
    image: "/personas/naval.jpg",
    summary: "从长期复利、杠杆和独立判断出发，检查任务是否值得持续投入。",
    tags: ["长期主义", "杠杆", "判断"],
  },
  {
    id: "musk",
    name: "埃隆·马斯克",
    role: "第一性原理工程师",
    code: "FIRST PRINCIPLE",
    color: "#ef3048",
    image: "/personas/elon-musk.jpg",
    summary: "把复杂问题拆回物理约束、成本边界和可执行工程步骤。",
    tags: ["第一性原理", "工程", "速度"],
  },
  {
    id: "jobs",
    name: "史蒂夫·乔布斯",
    role: "产品体验主理人",
    code: "FOCUS EDITOR",
    color: "#d7dde5",
    image: "/personas/steve-jobs.jpg",
    summary: "聚焦用户真正感知的价值，删掉多余功能，强化产品叙事与整体体验。",
    tags: ["产品", "审美", "聚焦"],
  },
  {
    id: "trump",
    name: "唐纳德·特朗普",
    role: "注意力谈判者",
    code: "DEAL MAKER",
    color: "#e86836",
    image: "/personas/donald-trump.jpg",
    summary: "从筹码、声量和谈判位置出发，判断如何获得更主动的局面。",
    tags: ["谈判", "传播", "筹码"],
  },
  {
    id: "pg",
    name: "Paul Graham",
    role: "创业问题诊断师",
    code: "FOUNDER SIGNAL",
    color: "#7ba6d9",
    image: "/personas/paul-graham.jpg",
    summary: "识别真正的问题和用户信号，避免用复杂方案掩盖尚未成立的需求。",
    tags: ["创业", "写作", "用户"],
  },
];

const MATERIALS = [
  { id: "roadmap", name: "产品路线图.md", meta: "12 KB · 产品" },
  { id: "feedback", name: "用户反馈汇总.txt", meta: "28 KB · 研究" },
  { id: "meeting", name: "首次体验评审纪要.md", meta: "19 KB · 会议" },
  { id: "metrics", name: "转化指标口径.csv", meta: "8 KB · 数据" },
];

const COMMANDS = [
  { id: "explain", label: "解释", code: "EXPLAIN", description: "补齐背景和历史逻辑" },
  { id: "review", label: "评审", code: "REVIEW", description: "检查方案与明显风险" },
  { id: "decide", label: "决策", code: "DECIDE", description: "比较选项和代价" },
  { id: "action", label: "行动", code: "ACTION", description: "整理下一步与责任" },
];

const OUTPUTS: Record<string, string[]> = {
  explain: ["当前方案试图一次完成建卡、组队和执行，用户第一分钟认知负担较高。", "建议先让用户完成一次单人召唤，再逐步出现多卡能力。"],
  review: ["中央 Driver 已成为明确主操作，但素材台和卡盒需要更强的状态反馈。", "首版应锁定单人卡 + 单指令卡，暂不加入多人辩论。", "所有判断都要能返回所选素材证据。"],
  decide: ["方案 A：保持卡片画廊，开发成本低但任务感弱。", "方案 B：中央 Driver 工作台，仪式感和任务闭环更强。", "建议选择方案 B，并控制 3D 只服务插卡和启动。"],
  action: ["确定 Driver 原创几何和音效语法。", "接入 YouNavi FileItem 多选素材投影。", "增加 Persona Card 与 Command Card 运行记录。"],
};

export default function Home() {
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>(["roadmap", "feedback", "meeting"]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedCommandId, setSelectedCommandId] = useState("review");
  const [phase, setPhase] = useState<DriverPhase>("idle");
  const [manifested, setManifested] = useState(false);
  const [task, setTask] = useState("评审假面骑事工作台的首次使用路径");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<number | null>(null);

  const selectedPersona = PERSONAS.find((persona) => persona.id === selectedPersonaId) ?? null;
  const selectedCommand = COMMANDS.find((command) => command.id === selectedCommandId) ?? COMMANDS[1];

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      stopDriverAudio();
    };
  }, []);

  function choosePersona(personaId: string) {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setSelectedPersonaId(personaId);
    setPhase("ready");
    setManifested(false);
    if (soundEnabled) playCardSelectSound();
  }

  function insertPersona(personaId = selectedPersonaId) {
    if (!personaId) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setSelectedPersonaId(personaId);
    setManifested(false);
    setPhase("inserting");
    if (soundEnabled) playCardInsertSound();
    timerRef.current = window.setTimeout(() => setPhase("locked"), 920);
  }

  function activateDriver() {
    if (!selectedPersona || phase !== "locked") return;
    setPhase("activated");
    if (soundEnabled) {
      playActivationSequence(selectedPersona.role, selectedPersona.name, selectedCommand.label);
    }
    timerRef.current = window.setTimeout(() => setManifested(true), 900);
  }

  function resetDriver() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setSelectedPersonaId(null);
    setPhase("idle");
    setManifested(false);
    stopDriverAudio();
  }

  function toggleMaterial(id: string) {
    setSelectedMaterialIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <main className="driver-workbench">
      <header className="workbench-header">
        <div className="workbench-brand">
          <span className="workbench-mark" aria-hidden="true">人</span>
          <div><strong>假面骑事</strong><small>PERSONA DRIVER WORKBENCH</small></div>
        </div>
        <label className="mission-field">
          <span>当前任务</span>
          <input value={task} onChange={(event) => setTask(event.target.value)} />
        </label>
        <button
          className={soundEnabled ? "sound-toggle enabled" : "sound-toggle"}
          type="button"
          aria-pressed={soundEnabled}
          onClick={() => {
            if (soundEnabled) stopDriverAudio();
            setSoundEnabled((value) => !value);
          }}
        >
          {soundEnabled ? "音效开启" : "音效关闭"}
        </button>
        <a className="gallery-link" href="/persona-atlas.html">打开旧图鉴</a>
      </header>

      <div className="workbench-grid">
        <aside className="material-tray">
          <div className="panel-title"><span>01</span><div><strong>原始素材</strong><small>来自 YouNavi 侧边栏的演示投影</small></div></div>
          <div className="material-list">
            {MATERIALS.map((material) => (
              <label className={selectedMaterialIds.includes(material.id) ? "material selected" : "material"} key={material.id}>
                <input
                  type="checkbox"
                  checked={selectedMaterialIds.includes(material.id)}
                  onChange={() => toggleMaterial(material.id)}
                />
                <span className="file-glyph" aria-hidden="true">▤</span>
                <span><strong>{material.name}</strong><small>{material.meta}</small></span>
              </label>
            ))}
          </div>
          <div className="material-summary">
            <span>{selectedMaterialIds.length} 份素材已授权</span>
            <small>当前仅为演示数据，不读取本机文件</small>
          </div>

          <div className="command-section">
            <div className="panel-title compact"><span>02</span><div><strong>指令卡</strong><small>定义本次操作</small></div></div>
            <div className="command-grid">
              {COMMANDS.map((command) => (
                <button
                  className={selectedCommandId === command.id ? "command-card selected" : "command-card"}
                  type="button"
                  key={command.id}
                  onClick={() => {
                    setSelectedCommandId(command.id);
                    if (soundEnabled) playCommandSelectSound();
                  }}
                >
                  <small>{command.code}</small><strong>{command.label}</strong><span>{command.description}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section
          className={`driver-stage phase-${phase}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            insertPersona(event.dataTransfer.getData("persona-id"));
          }}
        >
          <div className="driver-stage-head">
            <span className="stage-status">{phase.toUpperCase()}</span>
            <span>{selectedPersona ? selectedPersona.code : "NO PERSONA CARD"}</span>
          </div>
          <Suspense fallback={<div className="driver-loading">正在装载 Persona Driver</div>}>
            <DriverScene phase={phase} cardColor={selectedPersona?.color ?? "#ef3048"} />
          </Suspense>
          {selectedPersona && phase !== "idle" && (
            <div className="inserted-card-label">
              <small>PERSONA CARD</small><strong>{selectedPersona.name}</strong><span>{selectedPersona.role}</span>
            </div>
          )}
          <div className="driver-controls">
            {!selectedPersona && <p>从下方卡盒选择一张人物卡</p>}
            {selectedPersona && phase === "ready" && (
              <button className="insert-button" type="button" onClick={() => insertPersona()}>插入 Persona Card</button>
            )}
            {phase === "inserting" && <p>正在读取人物能力数据</p>}
            {phase === "locked" && (
              <button className="activate-button" type="button" onClick={activateDriver}>启动 Persona Driver</button>
            )}
            {phase === "activated" && <p className="activation-caption">PERSONA RIDE · {selectedPersona?.role} · {selectedPersona?.name}</p>}
            {selectedPersona && phase !== "inserting" && (
              <button className="reset-driver" type="button" onClick={resetDriver}>退出当前卡片</button>
            )}
          </div>
        </section>

        <aside className={manifested && selectedPersona ? "role-instance manifested" : "role-instance"}>
          <div className="panel-title"><span>03</span><div><strong>角色实例</strong><small>Driver 实体化结果</small></div></div>
          {!manifested || !selectedPersona ? (
            <div className="instance-empty">
              <span className="instance-sigil" aria-hidden="true">◇</span>
              <strong>等待召唤</strong>
              <p>插入人物卡并启动 Driver 后，角色能力将在这里展开。</p>
            </div>
          ) : (
            <div className="instance-content">
              <div className="instance-identity">
                <span>{selectedPersona.name.slice(0, 1)}</span>
                <div><small>MANIFESTED PERSONA</small><h2>{selectedPersona.name}</h2><p>{selectedPersona.role}</p></div>
              </div>
              <p className="instance-summary">{selectedPersona.summary}</p>
              <div className="instance-tags">{selectedPersona.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <dl>
                <div><dt>当前指令</dt><dd>{selectedCommand.label} / {selectedCommand.code}</dd></div>
                <div><dt>授权素材</dt><dd>{selectedMaterialIds.length} 份</dd></div>
                <div><dt>当前任务</dt><dd>{task}</dd></div>
              </dl>
              <section className="output-section">
                <h3>角色输出</h3>
                <ol>
                  {OUTPUTS[selectedCommand.id].map((output) => <li key={output}>{output}</li>)}
                </ol>
              </section>
              <p className="instance-footnote">演示输出基于公开人物 Skill 摘要，不代表本人观点或背书。</p>
            </div>
          )}
        </aside>
      </div>

      <section className="card-case" aria-label="人物卡盒">
        <div className="case-title"><span>CARD CASE</span><strong>选择或拖动人物卡插入 Driver</strong></div>
        <div className="persona-cards">
          {PERSONAS.map((persona, index) => (
            <button
              className={selectedPersonaId === persona.id ? "workbench-card selected" : "workbench-card"}
              type="button"
              draggable
              key={persona.id}
              onDragStart={(event) => event.dataTransfer.setData("persona-id", persona.id)}
              onClick={() => choosePersona(persona.id)}
            >
              <span className="workbench-card-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="workbench-card-art" style={{ "--persona-color": persona.color } as React.CSSProperties}>
                <img className="workbench-card-art-image" src={persona.image} alt="" />
              </span>
              <small>{persona.code}</small><strong>{persona.name}</strong><span>{persona.role}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
