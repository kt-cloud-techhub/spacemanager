# AI-DLC 워크플로우 다이어그램

> 단계 설명 및 실행 로직 → `rules/workflow-ko.md` 참조

## 3단계 개요

- **착수 (INCEPTION)**: 계획 및 아키텍처 — 무엇을, 왜 만들지 결정
- **구축 (CONSTRUCTION)**: 설계, 구현, 빌드 및 테스트 — 어떻게 만들지 결정
- **운영 (OPERATIONS)**: 향후 배포 및 모니터링 워크플로우를 위한 플레이스홀더

## 워크플로우 다이어그램

```mermaid
flowchart TD
    Start(["사용자 요청"])

    subgraph INCEPTION["🔵 착수 단계"]
        WD["환경 분석<br/><b>항상</b>"]
        RE["기존 코드 분석<br/><b>조건부</b>"]
        RA["요구사항 분석<br/><b>항상</b>"]
        Stories["사용자 시나리오<br/><b>조건부</b>"]
        WP["실행 계획 수립<br/><b>항상</b>"]
        AppDesign["애플리케이션 설계<br/><b>조건부</b>"]
        UnitsG["작업 단위 나누기<br/><b>조건부</b>"]
    end

    subgraph CONSTRUCTION["🟢 구축 단계"]
        FD["상세 기능 설계<br/><b>조건부</b>"]
        NFRA["기술 스택 및 품질 요구사항<br/><b>조건부</b>"]
        NFRD["성능·보안 설계<br/><b>조건부</b>"]
        ID["배포 환경 설계<br/><b>조건부</b>"]
        CG["코드 생성<br/><b>항상</b>"]
        BT["빌드 & 테스트<br/><b>항상</b>"]
    end

    subgraph OPERATIONS["🟡 운영 단계"]
        OPS["운영<br/><b>플레이스홀더</b>"]
    end

    Start --> WD
    WD -.-> RE
    WD --> RA
    RE --> RA
    RA -.-> Stories
    RA --> WP
    Stories --> WP
    WP -.-> AppDesign
    WP -.-> UnitsG
    AppDesign -.-> UnitsG
    UnitsG --> FD
    FD -.-> NFRA
    NFRA -.-> NFRD
    NFRD -.-> ID
    WP --> CG
    FD --> CG
    NFRA --> CG
    NFRD --> CG
    ID --> CG
    CG -.->|다음 단위| FD
    CG --> BT
    BT -.-> OPS
    BT --> End(["완료"])

    style WD fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RA fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style WP fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style CG fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style BT fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style OPS fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style RE fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style Stories fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style AppDesign fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style UnitsG fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style FD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style NFRA fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style NFRD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style ID fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style INCEPTION fill:#BBDEFB,stroke:#1565C0,stroke-width:3px,color:#000
    style CONSTRUCTION fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px,color:#000
    style OPERATIONS fill:#FFF59D,stroke:#F57F17,stroke-width:3px,color:#000
    style Start fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000
    style End fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000
```

**범례**: 실선 테두리 = 항상 실행 · 점선 테두리 = 조건부 실행
