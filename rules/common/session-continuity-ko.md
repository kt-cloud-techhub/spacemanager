---
description: 세션 연속성 유지를 위한 이전 작업 요약 및 다음 단계 가이드
---

# 세션 연속성 가이드: SpaceManager

## 1. 이전 세션 요약
*   **목표**: 사내 좌석 배치 최적화 시스템 'SpaceManager'의 기획 완료 및 초기 빌드.
*   **기획**: PRD, SDD, User Stories 완료 (`aidlc-docs/inception/`).
*   **백엔드**: Kotlin/Spring Boot (Maven 기반), PostgreSQL(Docker), JPA 엔티티 및 조직 API 구현 완료.
*   **프론트엔드**: Vite/React 기초 스캐폴딩 완료.
*   **인프라**: GitHub (`kt-cloud-techhub/spacemanager`) 레포지토리 생성 및 푸시 완료.

## 2. 현재 상태 및 주요 파일
*   **빌드 시스템**: `apps/spacemanager/backend/pom.xml` (Maven 사용 권장)
*   **DB**: `apps/spacemanager/backend/docker-compose.yml` (프로젝트명: `space-manager`)
*   **핵심 로직**: `SimulationEngine.kt` (자리 배치 알고리즘 초안), `OrganizationService.kt` (계층형 조직 관리)
*   **테스트**: `mvn test`를 통해 로직 검증 완료.

## 3. 다음 작업 (Context for Next Session)
*   **UI 개발**: `apps/spacemanager/frontend`에서 `react-konva`를 사용하여 실제 층별 맵 렌더링 시작.
*   **API 연동**: 프론트엔드에서 백엔드 `/api/organizations` 등 호출 로직 구현.
*   **알고리즘 심화**: `SimulationEngine`에서 팀별 다각형 영역(Polygon) 내 좌석 필터링 및 오버플로우 처리 구현.

## 4. 특이사항
*   로컬 환경에 `gradle`이 없으나 `mvn`과 `docker`는 가용함.
*   GitHub Actions CI가 설정되어 있어 푸시 시 자동 빌드됨.
