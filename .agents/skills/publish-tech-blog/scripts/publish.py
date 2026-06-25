from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


BLOCKED_PATH_PARTS = {
    ".venv",
    "__pycache__",
    "node_modules",
}
BLOCKED_FILENAMES = {
    ".env",
    "id_rsa",
    "id_ed25519",
}
SECRET_PATTERNS = (
    re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b"),
    re.compile(
        r"OPENAI_API_KEY\s*=\s*[\"']?"
        r"(?!(?:your_api_key_here|your_openai_api_key)\b)[^\s\"']+",
        re.IGNORECASE,
    ),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
)


def run(
    repo: Path, *args: str, capture: bool = True
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=repo,
        check=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=capture,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Stage the whole blog repository, commit, and push origin/main."
    )
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    parser.add_argument("--message", required=True)
    return parser.parse_args()


def assert_repository(repo: Path) -> None:
    top = Path(run(repo, "rev-parse", "--show-toplevel").stdout.strip()).resolve()
    if top != repo:
        raise RuntimeError(f"--repo must be the Git repository root: {top}")

    branch = run(repo, "branch", "--show-current").stdout.strip()
    if branch != "main":
        raise RuntimeError(f"Publishing is allowed only from main, not '{branch}'.")

    remotes = run(repo, "remote").stdout.split()
    if "origin" not in remotes:
        raise RuntimeError("Git remote 'origin' is missing.")


def assert_safe_paths(paths: list[str]) -> None:
    blocked: list[str] = []
    for value in paths:
        path = Path(value)
        lowered_parts = {part.lower() for part in path.parts}
        if lowered_parts & BLOCKED_PATH_PARTS:
            blocked.append(value)
            continue
        name = path.name.lower()
        if name in BLOCKED_FILENAMES or (
            name.startswith(".env.") and name != ".env.example"
        ):
            blocked.append(value)

    if blocked:
        raise RuntimeError(
            "Refusing to commit sensitive or generated paths:\n"
            + "\n".join(f"- {item}" for item in blocked)
        )


def assert_no_secrets(repo: Path) -> None:
    diff = run(repo, "diff", "--cached", "--no-ext-diff", "--unified=0").stdout
    for pattern in SECRET_PATTERNS:
        if pattern.search(diff):
            raise RuntimeError(
                "A likely API key or access token was found in the staged diff."
            )


def assert_no_secrets_in_files(repo: Path, paths: list[str]) -> None:
    for value in paths:
        path = repo / value
        if not path.is_file() or path.stat().st_size > 5_000_000:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(content):
                raise RuntimeError(f"A likely secret was found in '{value}'.")


def main() -> int:
    args = parse_args()
    repo = args.repo.resolve()
    try:
        assert_repository(repo)
        candidates = run(
            repo,
            "ls-files",
            "--cached",
            "--others",
            "--modified",
            "--deleted",
            "--exclude-standard",
        ).stdout.splitlines()
        assert_safe_paths(candidates)
        assert_no_secrets_in_files(repo, candidates)
        run(repo, "add", ".")
        staged = run(repo, "diff", "--cached", "--name-only").stdout.splitlines()
        if not staged:
            print("No changes to publish.")
            return 0

        assert_safe_paths(staged)
        assert_no_secrets(repo)
        run(repo, "diff", "--cached", "--check")
        run(repo, "commit", "-m", args.message, capture=False)
        run(repo, "push", "origin", "main", capture=False)
        commit = run(repo, "rev-parse", "--short", "HEAD").stdout.strip()
        print(f"Published commit {commit} to origin/main.")
        return 0
    except subprocess.CalledProcessError as exc:
        print(f"Git command failed with exit code {exc.returncode}.", file=sys.stderr)
        if exc.stderr:
            print(exc.stderr.strip(), file=sys.stderr)
        return exc.returncode or 1
    except Exception as exc:
        print(f"Publish blocked: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
