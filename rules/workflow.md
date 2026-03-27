# Workflow Rules

## Adaptive Workflow Principle

The workflow adapts to the work, not the other way around.

Assess what stages are needed based on:
1. User's stated intent and clarity
2. Existing codebase state
3. Complexity and scope
4. Risk and impact

---

## Extensions Enforcement

- Extension rules are hard constraints, not optional guidance.
- At each stage, enforce only rules applicable to that stage's context.
- Non-applicable rules → mark N/A in compliance summary.
- Non-compliance with any applicable rule is a **blocking finding**.
- Check `aidlc-docs/aidlc-state.md` → `## Extension Configuration` for enabled/disabled status before enforcing.
- Default: enforced if no configuration exists. Extensions without `## Applicability Question` are always enforced.

---

## Plan-Level Checkbox Enforcement

1. Never complete any work without updating plan checkboxes.
2. Immediately after completing any step in a plan file, mark that step `[x]`.
3. This must happen in the same interaction where the work is completed.
4. No exceptions: every plan step completion must be tracked.

Two-level tracking:
- **Plan-level**: detailed execution progress within each stage.
- **Stage-level**: overall workflow progress in `aidlc-state.md`.

---

## INCEPTION PHASE

**Purpose**: Planning, requirements gathering, architectural decisions.
**Focus**: Determine WHAT to build and WHY.

### Workspace Detection (ALWAYS)
1. Log initial user request in `audit.md` with complete raw input.
2. Load steps from `inception/workspace-detection.md`.
3. Check for existing `aidlc-state.md` (resume if found). Scan workspace. Determine brownfield or greenfield.
4. Determine next stage: Reverse Engineering (brownfield, no artifacts) OR Requirements Analysis.
5. Log findings in `audit.md`. Present completion message. Proceed automatically.

### Reverse Engineering (CONDITIONAL — brownfield only)
Execute if: existing codebase detected AND no previous reverse engineering artifacts.
Skip if: greenfield OR artifacts already exist.

1. Log start in `audit.md`.
2. Load steps from `inception/reverse-engineering.md`.
3. Analyze packages, components, business transactions, architecture, APIs, tech stack, dependencies.
4. **Wait for explicit approval** before proceeding. Log user response.

### Requirements Analysis (ALWAYS — adaptive depth)
Depth: minimal (simple request) / standard (normal) / comprehensive (complex, high-risk).

1. Log user input in `audit.md`.
2. Load steps from `inception/requirements-analysis.md`.
3. Analyze intent, determine depth, assess requirements, ask clarifying questions if needed.
4. **Wait for explicit approval** before proceeding. Log user response.

### User Stories (ALWAYS)
Two parts within one stage:
- **Part 1 — Planning**: story plan + questions → collect answers → analyze ambiguities → get approval.
- **Part 2 — Generation**: execute approved plan to generate stories and personas.

1. Log user input in `audit.md`.
2. Load steps from `inception/user-stories.md`.
3. Perform intelligent assessment (Step 1 in user-stories.md).
4. Execute Part 1, then Part 2.
5. **Wait for explicit approval** before proceeding. Log user response.

### Workflow Planning (ALWAYS)
1. Log user input in `audit.md`.
2. Load steps from `inception/workflow-planning.md` and `common/content-validation.md`.
3. Load all prior context (reverse engineering, intent, requirements, user stories).
4. Determine which phases to execute and at what depth.
5. If NFR is skipped, show auto-selected tech stack from `tech-stack-defaults.md` and confirm with user.
6. Validate all content before file creation.
7. **Wait for explicit approval** — emphasize user can override recommendations. Log user response.

### Application Design (CONDITIONAL — confirm with user)

| Architecture | Example | Design needed? |
|---|---|---|
| Full-Stack Web App | Service desk, board, shop | **Required** — API/DB/UI design |
| API Service (API + DB) | REST backend, microservice | **Required** — API/DB design |
| CLI / TUI | Command-line tool | Skippable |
| Library / SDK | npm package, Python lib | Skippable |
| Slack Bot / Discord Bot | Messaging automation | Skippable |

Decision: AI recommends based on above, then confirms via AskUserQuestion popup.
User always makes the final decision — AI never skips unilaterally.

1. Log user input in `audit.md`.
2. Load steps from `inception/application-design.md`.
3. Execute at appropriate depth.
4. **Wait for explicit approval** before proceeding. Log user response.

### Units Generation (CONDITIONAL)
Execute if: system needs decomposition into multiple units / multiple services or modules required.
Skip if: single simple unit / straightforward single-component implementation.

1. Log user input in `audit.md`.
2. Load steps from `inception/units-generation.md`.
3. Execute at appropriate depth.
4. **Wait for explicit approval** before proceeding. Log user response.

---

## CONSTRUCTION PHASE

**Purpose**: Detailed design, NFR implementation, code generation.
**Focus**: Determine HOW to build it.

Each unit is completed fully (design + code) before moving to the next unit.

### Functional Design (CONDITIONAL, per-unit)
Execute if: new data models, complex business logic, or business rules need detailed design.
Skip if: simple logic changes, no new business logic.

1. Log user input in `audit.md`.
2. Load steps from `construction/functional-design.md`.
3. Execute functional design for this unit.
4. Present standardized **2-option** completion message (as defined in functional-design.md). **No emergent 3-option behavior.**
5. **Wait for explicit approval**. Log user response.

### NFR Requirements (CONDITIONAL, per-unit)
Execute if: performance requirements, security considerations, scalability concerns, or tech stack selection needed.
Skip if: no NFR requirements or tech stack already determined.

1. Log user input in `audit.md`.
2. Load steps from `construction/nfr-requirements.md`.
3. Execute NFR assessment.
4. Present standardized **2-option** completion message. **No emergent behavior.**
5. **Wait for explicit approval**. Log user response.

### NFR Design (CONDITIONAL, per-unit)
Execute if: NFR Requirements was executed.
Skip if: NFR Requirements was skipped.

1. Log user input in `audit.md`.
2. Load steps from `construction/nfr-design.md`.
3. Execute NFR design.
4. Present standardized **2-option** completion message. **No emergent behavior.**
5. **Wait for explicit approval**. Log user response.

### Infrastructure Design (CONDITIONAL, per-unit)
Execute if: infrastructure services need mapping, deployment architecture required, cloud resources need specification.
Skip if: no infrastructure changes, already defined, or local development only.

1. Log user input in `audit.md`.
2. Load steps from `construction/infrastructure-design.md`.
3. Execute infrastructure design.
4. Present standardized **2-option** completion message. **No emergent behavior.**
5. **Wait for explicit approval**. Log user response.

### Code Generation (ALWAYS, per-unit)
Two parts within one stage:
- **Part 1 — Planning**: detailed code generation plan with explicit steps → get approval.
- **Part 2 — Generation**: execute approved plan to generate code, tests, and artifacts.

1. Log user input in `audit.md`.
2. Load steps from `construction/code-generation.md`.
3. Execute Part 1, then Part 2.
4. Present standardized **2-option** completion message. **No emergent behavior.**
5. **Wait for explicit approval**. Log user response.

### Build and Test (ALWAYS — after all units complete)
1. Log user input in `audit.md`.
2. Load steps from `construction/build-and-test.md`.
3. Generate: build instructions, unit test instructions, integration test instructions, performance test instructions (if applicable).
4. Create files in `build-and-test/` subdirectory.
5. Ask: "빌드 및 테스트 지침이 완료되었습니다. Operations 단계로 진행할까요?" — **Wait for explicit approval**. Log user response.

---

## OPERATIONS PHASE

Placeholder for future deployment and monitoring workflows.
Current state: all build and test activities are handled in the CONSTRUCTION phase.

---

## Key Principles

- **Adaptive Execution**: Only execute stages that add value.
- **Transparent Planning**: Always show execution plan before starting.
- **User Control**: User can request stage inclusion/exclusion.
- **Progress Tracking**: Update `aidlc-state.md` with executed and skipped stages.
- **Complete Audit Trail**: Log ALL user inputs and AI responses in `audit.md` with timestamps. Never summarize user input.
- **Quality Focus**: Complex changes get full treatment, simple changes stay efficient.
- **Content Validation**: Always validate content before file creation per `content-validation.md`.
- **NO EMERGENT BEHAVIOR**: Construction phases MUST use standardized 2-option completion messages. Do NOT create 3-option menus or other emergent navigation patterns.
