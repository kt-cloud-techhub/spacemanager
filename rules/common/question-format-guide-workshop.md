# Question Format Guide (Workshop)

> This overrides the upstream `question-format-guide.md` for workshop environments.

## Rules

| Question type | Method | Create .md file? |
|---|---|---|
| Multiple choice | AskUserQuestion popup | ❌ |
| Free text | Chat input | ❌ |
| Record answers | Append to `audit.md` | ✅ |

**Never create question `.md` files. Never use `[Answer]:` tags.**

---

## Multiple Choice → AskUserQuestion Popup

- Max 4 questions per popup
- 2–4 options per question (automatically include "Other" option)
- Question text in Korean
- Header: 12 characters or fewer

```yaml
AskUserQuestion:
  question: "사용자 인증 방식은 어떻게 할까요?"
  header: "인증"
  options:
    - label: "로그인 없음"
      description: "팀 내부용이라 인증 불필요"
    - label: "간단한 인증"
      description: "이름만 입력하는 수준"
    - label: "계정 기반"
      description: "아이디/비밀번호로 로그인"
```

## Free Text → Chat Input

- One question at a time
- Include an example answer to guide the user

```
이 서비스를 누가, 어떤 상황에서 사용하나요?
예: "팀원 10명이 장애 발생 시 티켓을 등록하고, 팀장이 배정하는 방식"
```

---

## Question Flow

1. Collect all questions needed for the stage.
2. Send multiple-choice questions first via AskUserQuestion (max 4 at a time).
3. Then ask free-text questions one at a time via chat.
4. Record all answers in `audit.md`.

```markdown
## [Stage Name] - 질문 응답
**Timestamp**: [ISO timestamp]
**질문과 답변**:
- Q: [question]
- A: [answer]
---
```

---

## Ambiguity Resolution

**Contradiction detected** → AskUserQuestion popup:
```yaml
AskUserQuestion:
  question: "'로그인 없음'을 선택하셨는데 담당자 배정도 원하십니다. 담당자는 어떻게 구분할까요?"
  options:
    - label: "이름만 입력"
      description: "텍스트로 이름만 적는 방식"
    - label: "담당자 목록에서 선택"
      description: "미리 등록된 팀원 목록에서 선택"
```

**Vague answer** → Chat follow-up:
```
"최대한 간단하게"라고 하셨는데, 꼭 있어야 하는 기능이 무엇인가요?
예: "티켓 생성과 상태 변경만 있으면 돼"
```
