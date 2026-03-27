# 세션 연속성

## 프로젝트 재개 시

기존 `aidlc-state.md`가 감지되면 다음 프롬프트를 한국어로 표시합니다:

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

## 단계별 산출물 로딩

단계를 재개하기 전에 관련된 이전 산출물을 모두 로드합니다:

| 단계 | 로드할 산출물 |
|---|---|
| 기존 코드 분석 | architecture.md, code-structure.md, api-documentation.md |
| 요구사항 분석 | requirements.md, requirement-verification-questions.md |
| 사용자 시나리오 | stories.md, personas.md, story-generation-plan.md |
| 애플리케이션 설계 | components.md, component-methods.md, services.md |
| 작업 단위 | unit-of-work.md, unit-of-work-dependency.md, unit-of-work-story-map.md |
| 단위별 설계 | functional-design.md, nfr-requirements.md, nfr-design.md, infrastructure-design.md |
| 코드 단계 | 위 모든 파일 + 기존 코드 파일 전체 |

## 규칙

1. 기존 프로젝트 감지 시 `aidlc-state.md`를 가장 먼저 읽습니다.
2. 재개 전 관련 이전 산출물을 모두 로드합니다 — 컨텍스트 없이 재개하지 않습니다.
3. 로드 후 무엇을 로드했는지 한국어로 간략히 요약합니다.
4. 연속성 프롬프트를 타임스탬프와 함께 `audit.md`에 기록합니다.
5. 일반적인 설명이 아닌 구체적인 다음 단계를 보여줍니다.
6. 재개 중 질문 → AskUserQuestion 팝업 또는 채팅 사용 (`question-format-guide-workshop.md` 참조). `.md` 질문 파일 생성 금지.
