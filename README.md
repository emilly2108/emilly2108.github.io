현재 이 홈페이지는 llm을 활용하여 관리하고 있습니다.

# 학습 자료 → 기술 블로그 에이전트

`txt`, `md`, `pdf`, `docx`, `hwp`, `hwpx` 등의 학습 자료를 읽어 한국어 기술 블로그 글로 편집하고, GitHub Pages 사이트의 글 목록과 상세 페이지를 자동으로 갱신합니다.

## 코드 프로젝트 자동 게시

Codex가 코드를 분석해 프로젝트명과 설명을 만들고, README와 `.gitignore`를 정리한 뒤 `emilly2108` 계정에 새 공개 저장소를 생성합니다. 코드를 push한 다음 `codes.json`  카드를 추가하고 이 웹사이트도 `origin/main`에 게시합니다.

## Codex 자동 게시 에이전트

이 저장소를 Codex 작업공간으로 연 뒤 자료 파일을 첨부하고 게시 요청합니다.
또는 아래 다섯 글자만 보내도 기술 블로그 자동 게시가 시작됩니다.

```text
기술 블로그
```

자료가 완성된 글일 필요는 없습니다. 메모, 글머리표, 코드, 로그, 강의 기록, TXT, PDF, DOCX, HWP/HWPX와 이미지도 사용할 수 있습니다. 에이전트는 글 작성, 상세 HTML 생성, `posts.json` 갱신, 검증, `git add .`, 커밋, `git push origin main`을 순서대로 수행합니다.

이 방식은 Codex가 직접 글을 작성하므로 OpenAI Platform API 키를 사용하지 않습니다.

## 댓글 기능 설정

댓글은 참고 사이트와 같은 Giscus 방식으로 구성되어 있습니다. Giscus는 GitHub Discussions에 댓글을 저장하므로 별도의 댓글 서버나 데이터베이스가 필요하지 않습니다.

1. GitHub 저장소의 `Settings → General → Features → Discussions`를 켭니다.
2. [Giscus 앱](https://github.com/apps/giscus)을 `emilly2108/emilly2108.github.io` 저장소에 설치합니다.
3. [giscus.app/ko](https://giscus.app/ko)에 저장소를 입력하고 `Announcements` 카테고리를 선택합니다.
4. 생성된 `data-repo-id`와 `data-category-id`를 [site-config.js](site-config.js)의 `giscus` 설정에 입력합니다.

ID를 입력하기 전에는 글 하단에 설정 안내가 표시되고, 입력한 뒤에는 글별 댓글·반응 위젯이 표시됩니다. 댓글 작성자는 GitHub 계정으로 로그인해야 합니다.

## 방문자 수와 검색 노출

페이지별 조회수 배지는 개인정보를 수집하지 않는 [Hits](https://hits.sh/docs/)를 사용합니다. 이는 순 방문자 수가 아니라 페이지 조회(hit) 수이므로 새로고침도 증가시킬 수 있습니다.

`robots.txt`와 `sitemap.xml`을 추가했고, 홈 화면의 글 링크는 검색엔진이 읽을 수 있는 정적 HTML로 제공합니다. GitHub Pages에 push한 뒤 Google Search Console에서 도메인을 등록하고 `https://emilly2108.github.io/sitemap.xml`을 제출하면 색인 생성을 요청할 수 있습니다.

## 디자인 참고

이 블로그의 디자인과 구성은 [HeekangPark/HeekangPark.github.io](https://github.com/HeekangPark/HeekangPark.github.io) 저장소를 참고했습니다.

