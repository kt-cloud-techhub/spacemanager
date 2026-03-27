# UX Rules

## Language

- All user-facing messages (welcome, questions, approvals, completion): **Korean**
- Internal AI instructions and rule file references: English
- Foreign word notation: 로컬(local), 서버(server), 데이터베이스(database), 컨테이너(container), 쿠버네티스(Kubernetes)

---

## Question Format

- Multiple choice → AskUserQuestion popup
- Free text → chat input
- Never create question `.md` files — record answers in `aidlc-docs/audit.md`

---

## Stage Completion Format

**CRITICAL**: Never tell users to open a file. Instead:

1. **Show key content in chat** — structured as tables, lists, or sections.
2. **Save files in background** — full documents go to `aidlc-docs/`. Do not say "please check the file."
3. **Request approval via AskUserQuestion popup** — immediately after showing content.

**Briefing principle**: After each stage, the user must be able to understand the context from chat alone — without reading any file.

- Show actual content, not just number summaries ("3 personas, 9 stories" is not enough).
- Show titles, key descriptions, and structure for each item.
- Detail is in the file; chat must be sufficient to understand.

**Completion message format** (all stages):

```markdown
# [Stage Name] 완료

[Key output content — structured as tables, lists, or cards — not prose]

---
다음은 **[Next Stage Name]** 단계입니다.
[1–2 sentences explaining what happens next]
```

Immediately followed by AskUserQuestion popup:

```yaml
AskUserQuestion:
  question: "위 [단계명] 결과를 승인하고 [다음 단계명]으로 진행할까요?"
  header: "승인"
  options:
    - label: "승인"
      description: "[다음 단계명]으로 진행합니다"
    - label: "변경 요청"
      description: "수정할 내용을 채팅으로 알려주세요"
```

**Output format by type**:
- API list → table (Method | Path | Description)
- DB tables → table (Column | Type | Description | Constraints)
- Feature list → numbered list + brief description
- User scenarios → card structure (title, description, acceptance criteria)
- Design results → sections (Backend / Frontend / DB) with tables or lists
- No long prose blocks — always structure content

**Prohibited**:
- ❌ "파일을 확인해주세요: `aidlc-docs/...`"
- ❌ "산출물을 검토해주세요"
- ❌ Long prose paragraphs
- ✅ Tables, lists, sections
- ✅ AskUserQuestion for approval
- ✅ Explain what the next stage does

---

## Progress Display

Show overall progress at the **top** of every stage completion message.

Format (only include stages in the confirmed execution plan):

```
착수: ✅ 환경분석 → ✅ 요구사항 → ✅ 시나리오 → ✅ 실행계획 → ⬜ 설계
구축: ⬜ 코드 생성 → ⬜ 빌드 & 테스트
```

Legend:
- ✅ = completed
- 🔵 = currently in progress
- ⬜ = not yet started
- Skipped stages are not shown

Example — during code generation:

```
착수: ✅ 환경분석 → ✅ 요구사항 → ✅ 시나리오 → ✅ 실행계획 → ✅ 설계
구축: 🔵 코드 생성 → ⬜ 빌드 & 테스트
```

Example — /dev:improve cycle:

```
개선: ✅ 분석 → 🔵 스펙 업데이트 → ⬜ 코드 수정 → ⬜ 테스트
```

---

## Terminology Mapping

### Stage Names

| Internal name | User-facing (Korean) |
|---|---|
| Workspace Detection | 환경 분석 |
| Reverse Engineering | 기존 코드 분석 |
| Requirements Analysis | 요구사항 분석 |
| User Stories | 사용자 시나리오 |
| Workflow Planning | 실행 계획 수립 |
| Application Design | 애플리케이션 설계 |
| Units Generation | 작업 단위 나누기 |
| Functional Design | 상세 기능 설계 |
| NFR Requirements | 기술 스택 및 품질 요구사항 |
| NFR Design | 성능·보안 설계 |
| Infrastructure Design | 배포 환경 설계 |
| Code Generation | 코드 생성 |
| Build and Test | 빌드 & 테스트 |

### General Technical Terms

| Technical term | Plain Korean |
|---|---|
| NFR (Non-Functional Requirements) | 기술 스택 및 품질 요구사항 |
| Acceptance Criteria | 완료 조건 |
| Persona | 사용자 유형 |
| Domain Model / Entity | 데이터 구조 |
| Business Rule | 처리 규칙 |
| Endpoint / API | 기능 주소 (API) |
| Schema | 테이블 구조 |
| Unit of Work | 작업 단위 |
| Brownfield / Greenfield | 기존 프로젝트 / 새 프로젝트 |
| INCEPTION / CONSTRUCTION / OPERATIONS | 착수 / 구축 / 운영 |

---

## Workflow Planning Completion Format

```markdown
# 실행 계획 완료

다음 순서로 진행합니다:

1. **[Stage]** — [one-line description]
2. **[Stage]** — [one-line description]
```

Immediately followed by AskUserQuestion for optional stage inclusion.
AI never unilaterally announces skipped stages — always ask: "추가로 진행할 수 있는 단계가 있습니다. 포함하시겠습니까?"

Optional stage question example:

```yaml
question: "추가로 진행할 수 있는 단계가 있습니다. 포함하시겠습니까?"
header: "추가 단계"
options:
  - label: "바로 진행"
    description: "위 계획대로 진행합니다"
  - label: "상세 기능 설계 추가"
    description: "비즈니스 로직을 더 구체적으로 설계합니다"
  - label: "품질 요구사항 추가"
    description: "성능/보안 목표를 상세하게 정의합니다"
multiSelect: true
```

**Prohibited in workflow planning output**:
- ❌ Mermaid diagrams or complex flowcharts
- ❌ Internal terms: "EXECUTE", "SKIP", "CONDITIONAL"
- ❌ Exposing technical stage names (NFR, Units Generation, etc.)
- ❌ Long rationale explanations
- ❌ AI unilaterally announcing "Skipping: ..."
- ✅ Simple numbered list: "진행 순서"
- ✅ AskUserQuestion for optional stages
- ✅ One-line description of what each stage does

---

## Security Extension Display

**CRITICAL**: Never show security compliance summaries to users.

- ❌ Do not list SECURITY-01 ~ SECURITY-15 rule IDs
- ❌ Do not include "Security Compliance" section in completion messages
- ✅ Validate security rules internally; show only results to users
- ✅ Only notify when there is an issue: "보안 관련 수정이 필요합니다: [specific content]"
- ✅ If no issues, proceed without mentioning security

---

## Output Detail Standards

Outputs must be concrete enough for actual development. Too abstract = poor code generation quality.

**Requirements Analysis**:
- Feature table: Feature | Description | Priority
- Non-functional requirements with specific numbers (e.g., "10 concurrent users", "response within 1 second")
- Constraints explicitly stated (e.g., "file-based, no DB server", "single container")

**User Scenarios**:

```markdown
### 시나리오 N: [Title]
**사용자**: [User type]
**상황**: [When this happens]
**행동**: [What the user does]
**결과**: [What happens as a result]

**완료 조건**:
- [ ] [Condition 1]
- [ ] [Condition 2]
```

- Minimum 3–5 scenarios
- Each scenario must include acceptance criteria
- Define user types (personas) concretely: name, role, key actions

**Application Design**:

API table:
```
| 메서드 | 경로 | 설명 | 요청 바디 | 응답 |
```

DB table:
```
| 컬럼 | 타입 | 설명 | 제약조건 |
```

UI layout: describe key components per screen (filters, lists, buttons, forms).

---

## Welcome Message

**CRITICAL**: At the start of any software development request, load and display the welcome message from `common/welcome-message-workshop.md`.
Do this only ONCE at the start of a new workflow. Do not reload in subsequent interactions.
