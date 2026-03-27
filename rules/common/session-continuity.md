# Session Continuity

## On Project Resume

When an existing `aidlc-state.md` is detected, present this prompt in Korean:

```markdown
**다시 오셨군요! 진행 중인 AI-DLC 프로젝트가 있습니다.**

aidlc-state.md를 기반으로 현재 상태를 안내드립니다:
- **프로젝트**: [project-name]
- **현재 단계**: [착수/구축/운영]
- **현재 스테이지**: [Stage Name]
- **마지막 완료**: [Last completed step]
- **다음 작업**: [Next step to work on]

**오늘은 어떻게 진행할까요?**
A) 이어서 진행 ([Next step description])
B) 이전 단계 검토 ([Show available stages])

[Answer]:
```

## Artifact Loading by Stage

Before resuming any stage, load all relevant prior artifacts:

| Stage | Artifacts to load |
|---|---|
| Reverse Engineering | architecture.md, code-structure.md, api-documentation.md |
| Requirements Analysis | requirements.md, requirement-verification-questions.md |
| User Stories | stories.md, personas.md, story-generation-plan.md |
| Application Design | components.md, component-methods.md, services.md |
| Units | unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md |
| Per-Unit Design | functional-design.md, nfr-requirements.md, nfr-design.md, infrastructure-design.md |
| Code Stages | All of the above + all existing code files |

## Rules

1. Always read `aidlc-state.md` first when detecting an existing project.
2. Load all relevant prior artifacts before resuming — never resume cold.
3. After loading, provide a brief Korean summary of what was loaded.
4. Log the continuity prompt in `audit.md` with timestamp.
5. Show specific next steps, not generic descriptions.
6. Questions during resumption → AskUserQuestion popup or chat (see `question-format-guide-workshop.md`). Never create `.md` question files.
