현재 이 홈페이지는 llm을 활용하여 관리하고 있습니다.

# 학습 자료 → 기술 블로그 에이전트

`txt`, `md`, `pdf`, `docx`, `hwp`, `hwpx` 등의 학습 자료를 읽어 한국어 기술 블로그 글로 편집하고, GitHub Pages 사이트의 글 목록과 상세 페이지를 자동으로 갱신합니다.

## 코드 프로젝트 자동 게시

Codex가 코드를 분석해 프로젝트명과 설명을 만들고, README와 `.gitignore`를 정리한 뒤 `emilly2108` 계정에 새 공개 저장소를 생성합니다. 코드를 push한 다음 `codes.json`  카드를 추가하고 이 웹사이트도 `origin/main`에 게시합니다.

## Codex 자동 게시 에이전트

이 저장소를 Codex 작업공간으로 연 뒤 자료 파일을 첨부하고 개시 요청합니다.


자료가 완성된 글일 필요는 없습니다. 메모, 글머리표, 코드, 로그, 강의 기록, TXT, PDF, DOCX, HWP/HWPX와 이미지도 사용할 수 있습니다. 에이전트는 글 작성, 상세 HTML 생성, `posts.json` 갱신, 검증, `git add .`, 커밋, `git push origin main`을 순서대로 수행합니다.

이 방식은 Codex가 직접 글을 작성하므로 OpenAI Platform API 키를 사용하지 않습니다.

