# 학습 자료 → 기술 블로그 에이전트

`txt`, `md`, `pdf`, `docx`, `hwp`, `hwpx` 등의 학습 자료를 읽어 한국어 기술 블로그 글로 편집하고, GitHub Pages 사이트의 글 목록과 상세 페이지를 자동으로 갱신합니다.

## Codex 자동 게시 에이전트

이 저장소를 Codex 작업공간으로 연 뒤 자료 파일을 첨부하고 다음처럼 요청합니다.

```text
$publish-tech-blog 이 파일을 기술 블로그 글로 만들어서 게시해줘.
```

자료가 완성된 글일 필요는 없습니다. 메모, 글머리표, 코드, 로그, 강의 기록, TXT, PDF, DOCX, HWP/HWPX와 이미지도 사용할 수 있습니다. 에이전트는 글 작성, 상세 HTML 생성, `posts.json` 갱신, 검증, `git add .`, 커밋, `git push origin main`을 순서대로 수행합니다.

이 방식은 Codex가 직접 글을 작성하므로 OpenAI Platform API 키를 사용하지 않습니다. “초안만 만들어줘” 또는 “미리보기만 해줘”라고 요청하면 GitHub에는 push하지 않습니다.

## 동작 방식

1. 입력 자료를 읽거나 OpenAI Files API에 임시 업로드합니다.
2. OpenAI Responses API의 Structured Outputs로 제목, 태그, 요약, 본문을 생성합니다.
3. `{slug}.html` 상세 페이지를 생성합니다.
4. `posts.json`에 목록 정보를 추가합니다.
5. `--publish`를 사용한 경우 생성된 두 파일만 커밋하고 GitHub에 push합니다.

기존에 stage된 Git 변경 사항이 있으면 다른 작업이 함께 커밋되는 것을 막기 위해 자동 게시를 중단합니다. OpenAI에 업로드한 임시 파일은 글 생성이 끝나면 자동 삭제합니다. 민감한 자료는 업로드 전에 외부 전송 가능 여부를 확인하세요.

## 설치

Windows PowerShell 기준:

```powershell
cd path\to\emilly2108.github.io
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
$env:OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
```

PowerShell을 다시 열어도 API 키를 유지하려면 사용자 환경 변수로 저장할 수 있습니다.

```powershell
[Environment]::SetEnvironmentVariable(
  "OPENAI_API_KEY",
  "YOUR_OPENAI_API_KEY",
  "User"
)
```

API 키는 `.env`나 코드에 커밋하지 마세요.

## 글 생성

자료 한 개:

```powershell
py blog_agent.py "C:\study\ros2-notes.txt"
```

자료 여러 개를 하나의 글로 합치기:

```powershell
py blog_agent.py `
  "C:\study\lecture.pdf" `
  "C:\study\experiment-notes.txt"
```

제목, 태그, URL을 직접 지정하기:

```powershell
py blog_agent.py "C:\study\yolo.pdf" `
  --title "YOLO 객체 탐지 구조 이해하기" `
  --tag "AI" `
  --slug "yolo-object-detection"
```

생성 후 바로 GitHub Pages에 게시하기:

```powershell
py blog_agent.py "C:\study\ros2-notes.txt" --publish
```

기본 모델은 `gpt-5.5`입니다. 다른 모델을 쓰려면 `--model` 또는 `BLOG_AGENT_MODEL` 환경 변수를 사용하세요. 같은 slug의 글을 수정할 때만 `--overwrite`를 추가하세요.

## 미리보기

`index.html`은 `posts.json`을 불러오므로 파일을 직접 더블클릭하지 말고 로컬 서버로 확인합니다.

```powershell
py -m http.server 8000
```

브라우저에서 <http://localhost:8000>을 엽니다.

## 지원 형식

- 직접 텍스트 추출: `txt`, `md`, 일반 코드 파일, `hwp`, `hwpx`
- OpenAI 파일 입력: `pdf`, `doc`, `docx`, `rtf`, `odt`, `ppt`, `pptx`, `csv`, `xls`, `xlsx`

오래된 HWP 파일은 HWP 5.x 형식을 지원합니다. 암호화된 문서나 추출이 되지 않는 파일은 한컴오피스에서 HWPX 또는 PDF로 저장한 뒤 사용하세요.

## API 없이 렌더링 테스트

다음 형식의 JSON 파일이 있다면 API 호출 없이 HTML 생성 부분만 테스트할 수 있습니다.

```json
{
  "title": "테스트 글",
  "slug": "test-post",
  "tag": "TEST",
  "hero_label": "TEST",
  "summary": "목록에 표시할 요약입니다.",
  "body_markdown": "## 첫 번째 절\n\n본문입니다."
}
```

```powershell
py blog_agent.py --from-json sample-post.json
```
