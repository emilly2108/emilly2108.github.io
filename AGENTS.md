# Repository guidance

- When the user supplies study material and asks to add, upload, deploy, or publish it to the blog, use `$publish-tech-blog`.
- When the user's complete trimmed message is exactly `코드 작성` and code files, a code folder, or a code archive are attached or referenced, use `$publish-code-project`. Treat the phrase as explicit authorization to create a new public repository under `emilly2108`, upload the prepared code, add a pendulum-style entry to `codes.json`, commit, and push both repositories.
- Do not activate the `코드 작성` shortcut when those words appear inside a longer question or sentence.
- When the user's complete trimmed message is exactly `기술 블로그` and a file is attached or source material is otherwise provided, interpret it as: use `$publish-tech-blog`, create the post, validate it, commit all repository changes, and push to `origin/main`.
- Do not activate the shortcut when `기술 블로그` is only part of a longer question or sentence.
- Accept rough notes, bullet lists, code, logs, transcripts, TXT, Markdown, PDF, DOCX, HWP/HWPX, images, and mixed files; the source does not need to be article-shaped.
- Draft or preview requests must remain local. Push to GitHub only when the user explicitly requests publication.
- Never store or commit API keys, `.env`, credentials, virtual environments, caches, or downloaded private source documents.
