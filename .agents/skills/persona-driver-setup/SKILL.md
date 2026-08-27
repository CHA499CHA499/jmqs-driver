---
name: persona-driver-setup
description: Internal Persona Driver setup implementation referenced by the project-root SKILL.md. Use only when maintaining the bundled installer; YouNavi users import and activate the root persona-driver Skill instead.
exposure: manual
---

# Persona Driver Setup

Internal implementation note: the public YouNavi entry is `../../../SKILL.md` at the project root. Do not ask users to import this nested directory by itself.

Use the deterministic setup script instead of recreating installation steps manually.

## Assumptions

- The request runs inside an already authenticated YouNavi environment. Do not add a login flow or inspect credentials.
- Four approved interview transcripts and `create-soul` are bundled with the project.
- The five public Persona Skills are bundled from their pinned source commits and copied locally only when missing; first-run setup does not access GitHub.

## Workflow

1. Resolve the project root containing `package.json` with `name=persona-driver`.
2. Resolve the YouNavi Skills directory from `PERSONA_NAVI_SKILLS_DIR` or this Skill's installed sibling directory. If neither is available, ask only for the Skills directory.
3. Run the read-only diagnosis first:

   ```bash
   node .agents/skills/persona-driver-setup/scripts/setup.mjs doctor --project <project> --skills-dir <skills-dir>
   ```

4. For an explicit install/repair/start request, run:

   ```bash
   node .agents/skills/persona-driver-setup/scripts/setup.mjs install --project <project> --skills-dir <skills-dir> --no-start --no-open
   ```

   This validates the bundled materials and five bundled Persona Skill fingerprints, installs only missing Skills without GitHub access, writes the three Persona paths to ignored `.env.local`, and runs `npm ci` plus tests.

5. Start `npm run dev` as the Agent's long-running shell task. Use direct Agent tool calls—not a nested script—to verify `http://localhost:3000/` and `http://127.0.0.1:8766/health`, then open the page. This avoids false failures in sandboxes that block child-process loopback access.
6. For an already installed project, `doctor` can be followed directly by the same start/health/open sequence.

## Safety and stopping conditions

- Never overwrite a pre-existing Skill directory whose `SKILL.md` declares a different name; report the exact path and stop.
- Do not search the user's home directory for transcripts or credentials.
- Do not modify YouNavi authentication.
- Do not fetch Persona Skills from the network. If a bundled fingerprint fails, report the bundled Skill and pinned commit rather than downloading another version.
- A successful handoff requires HTTP 200 from the page and Bridge health plus all six Skills and four bundled materials verified.

Report the project root, Skills root, installed/kept Skills, material verification, test result, Web/Bridge health, and opened URL.
