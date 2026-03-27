# Audit Logging Rules

## Core Requirements

- Log EVERY user input (prompts, questions, responses) with timestamp in `audit.md`.
- Capture user's COMPLETE RAW INPUT exactly as provided — never summarize or paraphrase.
- Log every approval prompt with timestamp before asking the user.
- Record every user response with timestamp after receiving it.
- ALWAYS append to `audit.md` — never overwrite its contents.
- Use ISO 8601 format for timestamps: `YYYY-MM-DDTHH:MM:SSZ`
- Include stage context for each entry.

## Correct Tool Usage

- CORRECT: Read `audit.md`, then append/edit to add new content.
- WRONG: Read `audit.md`, then completely overwrite it with old + new content combined.

## Log Entry Format

```markdown
## [Stage Name or Interaction Type]
**Timestamp**: [ISO 8601 timestamp]
**User Input**: "[Complete raw user input — never summarized]"
**AI Response**: "[AI's response or action taken]"
**Context**: [Stage, action, or decision made]

---
```
