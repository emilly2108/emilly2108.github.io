from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path


OWNER = "emilly2108"
MAX_FILE_SIZE = 95 * 1024 * 1024
BLOCKED_PARTS = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    ".idea",
    ".vscode",
}
BLOCKED_FILENAMES = {
    ".env",
    "id_rsa",
    "id_ed25519",
    "credentials.json",
    "service-account.json",
}
SECRET_PATTERNS = (
    re.compile(r"\bsk-[A-Za-z0-9_-]{16,}\b"),
    re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(
        r"(?:OPENAI_API_KEY|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY)"
        r"\s*=\s*[\"']?(?!your_|example|placeholder)[^\s\"']+",
        re.IGNORECASE,
    ),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a GitHub code repository and add it to codes.json."
    )
    parser.add_argument("--site-repo", type=Path, required=True)
    parser.add_argument("--project-dir", type=Path, required=True)
    parser.add_argument("--repo-name", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--hero-label", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--owner", default=OWNER)
    parser.add_argument("--gh", default="gh", help="GitHub CLI executable")
    parser.add_argument(
        "--website-message",
        default=None,
        help="Website commit message; defaults to Add code project: <title>",
    )
    return parser.parse_args()


def command(
    args: list[str],
    *,
    cwd: Path | None = None,
    check: bool = True,
    capture: bool = True,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=cwd,
        check=check,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=capture,
    )


def git(
    repo: Path, *args: str, check: bool = True, capture: bool = True
) -> subprocess.CompletedProcess[str]:
    return command(
        ["git", *args], cwd=repo, check=check, capture=capture
    )


def normalize_repo_name(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if not normalized or normalized != value:
        raise ValueError(
            "--repo-name must already be lowercase ASCII kebab-case."
        )
    return normalized


def assert_site(site: Path) -> None:
    required = (
        site / "index.html",
        site / "codes.json",
        site / ".agents/skills/publish-tech-blog/scripts/publish.py",
    )
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "Website repository is missing required files:\n"
            + "\n".join(missing)
        )
    top = Path(git(site, "rev-parse", "--show-toplevel").stdout.strip()).resolve()
    if top != site:
        raise RuntimeError(f"--site-repo must be the repository root: {top}")
    branch = git(site, "branch", "--show-current").stdout.strip()
    if branch != "main":
        raise RuntimeError(f"Website must be on main, not '{branch}'.")


def resolve_gh(gh: str) -> str:
    candidates = [
        shutil.which(gh) if Path(gh).name == gh else gh,
        r"C:\Program Files\GitHub CLI\gh.exe",
        r"C:\Program Files (x86)\GitHub CLI\gh.exe",
    ]
    executable = next(
        (
            str(Path(candidate))
            for candidate in candidates
            if candidate and Path(candidate).is_file()
        ),
        None,
    )
    if not executable:
        raise RuntimeError(
            "GitHub CLI is not installed. Run: "
            "winget install --id GitHub.cli"
        )
    result = command([executable, "auth", "status"], check=False)
    if result.returncode != 0:
        raise RuntimeError("GitHub CLI is not authenticated. Run: gh auth login")
    return executable


def assert_project(project: Path) -> None:
    if not project.is_dir():
        raise FileNotFoundError(project)
    if (project / ".git").exists():
        raise RuntimeError(
            "The prepared project directory must not already contain .git."
        )
    files = [path for path in project.rglob("*") if path.is_file()]
    if not files:
        raise RuntimeError("The prepared project directory is empty.")
    if not (project / "README.md").is_file():
        raise RuntimeError("README.md is required before publishing.")

    blocked: list[str] = []
    for path in files:
        relative = path.relative_to(project)
        lowered = {part.lower() for part in relative.parts}
        name = path.name.lower()
        if lowered & BLOCKED_PARTS:
            blocked.append(str(relative))
            continue
        if name in BLOCKED_FILENAMES or (
            name.startswith(".env.") and name != ".env.example"
        ):
            blocked.append(str(relative))
            continue
        if path.stat().st_size >= MAX_FILE_SIZE:
            blocked.append(f"{relative} (95 MB or larger)")
            continue
        if path.is_symlink():
            blocked.append(f"{relative} (symlink)")
            continue
        if path.stat().st_size <= 5_000_000:
            try:
                content = path.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            if any(pattern.search(content) for pattern in SECRET_PATTERNS):
                blocked.append(f"{relative} (likely secret)")

    if blocked:
        raise RuntimeError(
            "Unsafe project files detected:\n"
            + "\n".join(f"- {value}" for value in blocked)
        )


def repository_exists(gh: str, full_name: str) -> bool:
    result = command(
        [gh, "repo", "view", full_name, "--json", "name"],
        check=False,
    )
    return result.returncode == 0


def initialize_project(project: Path, owner: str, message: str) -> None:
    git(project, "init", "-b", "main")
    name = git(project, "config", "--get", "user.name", check=False).stdout.strip()
    email = git(
        project, "config", "--get", "user.email", check=False
    ).stdout.strip()
    if not name:
        git(project, "config", "user.name", owner)
    if not email:
        git(project, "config", "user.email", f"{owner}@users.noreply.github.com")
    git(project, "add", ".")
    staged = git(project, "diff", "--cached", "--name-only").stdout.splitlines()
    if not staged:
        raise RuntimeError("No project files were staged.")
    git(project, "diff", "--cached", "--check")
    git(project, "commit", "-m", message, capture=False)


def create_remote(
    gh: str,
    project: Path,
    full_name: str,
    description: str,
) -> str:
    command(
        [
            gh,
            "repo",
            "create",
            full_name,
            "--public",
            "--source",
            str(project),
            "--remote",
            "origin",
            "--push",
            "--description",
            description,
        ],
        cwd=project,
        capture=False,
    )
    result = command(
        [gh, "repo", "view", full_name, "--json", "url", "--jq", ".url"]
    )
    url = result.stdout.strip()
    if not url.startswith("https://github.com/"):
        raise RuntimeError("Could not verify the new repository URL.")
    return url


def update_codes(
    codes_path: Path,
    *,
    title: str,
    summary: str,
    tag: str,
    hero_label: str,
    url: str,
) -> None:
    data = json.loads(codes_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("codes.json must contain a JSON array.")
    if any(item.get("url", "").rstrip("/") == url.rstrip("/") for item in data):
        raise RuntimeError("codes.json already contains this repository URL.")
    record = {
        "title": title.strip(),
        "summary": summary.strip(),
        "tag": tag.strip(),
        "heroLabel": hero_label.strip(),
        "url": url,
    }
    data.insert(0, record)
    codes_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def publish_site(site: Path, title: str, message: str | None) -> None:
    publisher = site / ".agents/skills/publish-tech-blog/scripts/publish.py"
    commit_message = message or f"Add code project: {title}"
    command(
        [
            sys.executable,
            str(publisher),
            "--repo",
            str(site),
            "--message",
            commit_message,
        ],
        cwd=site,
        capture=False,
    )


def main() -> int:
    args = parse_args()
    site = args.site_repo.resolve()
    project = args.project_dir.resolve()
    try:
        repo_name = normalize_repo_name(args.repo_name)
        full_name = f"{args.owner}/{repo_name}"
        assert_site(site)
        gh = resolve_gh(args.gh)
        assert_project(project)
        if repository_exists(gh, full_name):
            raise RuntimeError(
                f"Repository already exists; refusing to overwrite: {full_name}"
            )

        initialize_project(project, args.owner, f"Initial commit: {args.title}")
        url = create_remote(gh, project, full_name, args.description)
        update_codes(
            site / "codes.json",
            title=args.title,
            summary=args.summary,
            tag=args.tag,
            hero_label=args.hero_label,
            url=url,
        )
        publish_site(site, args.title, args.website_message)
        project_commit = git(project, "rev-parse", "--short", "HEAD").stdout.strip()
        site_commit = git(site, "rev-parse", "--short", "HEAD").stdout.strip()
        print(f"Project repository: {url}")
        print(f"Project commit: {project_commit}")
        print(f"Website commit: {site_commit}")
        return 0
    except subprocess.CalledProcessError as exc:
        print(
            f"Command failed with exit code {exc.returncode}.",
            file=sys.stderr,
        )
        if exc.stderr:
            print(exc.stderr.strip(), file=sys.stderr)
        return exc.returncode or 1
    except Exception as exc:
        print(f"Code publication blocked: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
