#!/usr/bin/env python3
"""Package an explicitly selected, clean studio commit and its fresh Vite build.

Python standard library only. Does not build, install, publish, or upload anything.
See docs/DELIVERY.md for the final-build and fresh-extraction verification steps.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
import zipfile


WRAPPER = "Taewon-Seo-Milky-Studio"
CHUNK = 1024 * 1024
EXCLUDED_PARTS = frozenset({
    ".git", ".claude", ".codex", ".agents", ".herdr", ".orca", ".vscode",
    ".idea", ".worktrees", "node_modules", "__pycache__", ".pytest_cache",
    ".DS_Store", "tmp", "temp", "private", "private-photos", "research-logs",
})
RAW_CAMERA_FILE = re.compile(r"^\d{8}_\d{6}\.(?:jpe?g|png|heic|mov|mp4)$", re.I)


@dataclass(frozen=True)
class Entry:
    source: Path
    archive_path: str
    group: str
    size: int
    sha256: str


def git(source: Path, *args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(source), *args], stderr=subprocess.PIPE)


def digest(path: Path) -> tuple[int, str]:
    size, hasher = 0, hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(CHUNK), b""):
            size += len(chunk)
            hasher.update(chunk)
    return size, hasher.hexdigest()


def exclusion(relative: PurePosixPath) -> str | None:
    if relative.is_absolute() or ".." in relative.parts or "\\" in str(relative):
        raise ValueError(f"Unsafe relative path: {relative}")
    if any(part in EXCLUDED_PARTS for part in relative.parts):
        return "local configuration, dependencies, temporary files, or private material"
    if any(part.startswith(".env") for part in relative.parts):
        return "environment configuration"
    if relative.suffix.lower() in {".pem", ".key", ".p12", ".pfx"}:
        return "private key material"
    if RAW_CAMERA_FILE.match(relative.name):
        return "private camera original"
    return None


def is_linked(root: Path, relative: PurePosixPath) -> bool:
    current = root
    for part in relative.parts:
        current /= part
        if current.is_symlink():
            return True
    return False


def files_under(root: Path):
    """Yield regular directory entries without traversing any symlink."""
    for current, directories, filenames in os.walk(root, followlinks=False):
        directories[:] = sorted(name for name in directories if not (Path(current) / name).is_symlink())
        for name in sorted(filenames):
            yield (Path(current) / name).relative_to(root).as_posix()


def collect(source: Path, logos: Path) -> tuple[list[Entry], list[dict[str, str]]]:
    entries: list[Entry] = []
    excluded: list[dict[str, str]] = []

    def add(root: Path, relative: str, destination: str, group: str) -> None:
        rel = PurePosixPath(relative)
        reason = exclusion(rel)
        if is_linked(root, rel):
            reason = "symlink (not followed)"
        if reason:
            excluded.append({"group": group, "path": relative, "reason": reason})
            return
        path = root.joinpath(*rel.parts)
        if not path.is_file():
            raise ValueError(f"Required regular file is missing: {path}")
        size, sha256 = digest(path)
        entries.append(Entry(path, f"{WRAPPER}/{destination}", group, size, sha256))

    tracked = git(source, "ls-files", "-z").decode("utf-8").split("\0")
    for relative in sorted(filter(None, tracked)):
        if PurePosixPath(relative).parts[0] == "dist":
            continue  # The freshly built dist is collected once, below.
        add(source, relative, f"project/{relative}", "source")
    for relative in files_under(source / "dist"):
        add(source / "dist", relative, f"project/dist/{relative}", "build")
    for relative in files_under(logos):
        add(logos, relative, f"logos/{relative}", "logos")
    for name in ("milky-a-favicon.png", "milky-a-apple-touch.png"):
        add(source / "public", name, f"logos/active-icons/{name}", "active-icons")
    add(source, "START-HERE.md", "START-HERE.md", "instructions")
    if not any(entry.group == "logos" for entry in entries):
        raise ValueError("The standalone logo folder is empty.")
    names = [entry.archive_path for entry in entries]
    if len(names) != len(set(names)):
        raise ValueError("Duplicate archive paths were found.")
    return sorted(entries, key=lambda entry: entry.archive_path), excluded


def zip_info(name: str, epoch: int) -> zipfile.ZipInfo:
    # Zip stores no timezone and cannot represent dates before 1980 or after 2107.
    date = datetime.fromtimestamp(max(315532800, min(epoch, 4354819198)), timezone.utc)
    info = zipfile.ZipInfo(name, date.timetuple()[:6])
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    return info


def verify(archive: Path, entries: list[Entry], manifest_bytes: bytes) -> None:
    expected = {entry.archive_path: (entry.size, entry.sha256) for entry in entries}
    expected[f"{WRAPPER}/MANIFEST.json"] = (len(manifest_bytes), hashlib.sha256(manifest_bytes).hexdigest())
    with zipfile.ZipFile(archive) as zipped:
        if zipped.testzip() is not None:
            raise ValueError("ZIP CRC verification failed.")
        if len(zipped.infolist()) != len(expected) or set(zipped.namelist()) != set(expected):
            raise ValueError("ZIP entry count or names differ from the manifest.")
        for info in zipped.infolist():
            path = PurePosixPath(info.filename)
            if path.is_absolute() or ".." in path.parts or "\\" in info.filename or path.parts[0] != WRAPPER:
                raise ValueError(f"Unsafe ZIP entry: {info.filename}")
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f"ZIP contains a symlink: {info.filename}")
            size, hasher = 0, hashlib.sha256()
            with zipped.open(info) as stream:
                for chunk in iter(lambda: stream.read(CHUNK), b""):
                    size += len(chunk)
                    hasher.update(chunk)
            if (size, hasher.hexdigest()) != expected[info.filename] or info.file_size != size:
                raise ValueError(f"ZIP file verification failed: {info.filename}")


def require_clean(source: Path, expected_sha: str) -> str:
    sha = git(source, "rev-parse", "HEAD").decode().strip()
    if sha != expected_sha:
        raise ValueError(f"HEAD is {sha}; explicitly requested final SHA was {expected_sha}.")
    if git(source, "status", "--porcelain", "--untracked-files=no").strip():
        raise ValueError("Tracked changes remain. Commit the finished source before packaging.")
    return sha


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True, help="Final integrated Git worktree")
    parser.add_argument("--logos", type=Path, required=True, help="Complete standalone Milky logo folder")
    parser.add_argument("--output", type=Path, required=True, help="Destination .zip path")
    parser.add_argument("--expected-sha", required=True, help="Full final commit SHA, after all work is integrated")
    args = parser.parse_args()
    source, logos = args.source.resolve(), args.logos.resolve()
    output_requested = args.output.expanduser().absolute()
    output = output_requested.parent.resolve() / output_requested.name
    if output.suffix.lower() != ".zip":
        raise ValueError("The output filename must end in .zip.")
    if not source.is_dir() or not logos.is_dir():
        raise ValueError("Source and logo directories must already exist.")
    if Path(git(source, "rev-parse", "--show-toplevel").decode().strip()).resolve() != source:
        raise ValueError("--source must name the Git worktree root.")
    if output.is_relative_to(source) or output.is_relative_to(logos):
        raise ValueError("Write the delivery ZIP outside the source and logo folders.")
    sha = require_clean(source, args.expected_sha)
    if not (source / "dist/index.html").is_file() or is_linked(source, PurePosixPath("dist/index.html")):
        raise ValueError("A fresh regular dist/index.html is required; run npm run build first.")
    for required in ("START-HERE.md", "public/milky-a-favicon.png", "public/milky-a-apple-touch.png"):
        if is_linked(source, PurePosixPath(required)) or not (source / required).is_file():
            raise ValueError(f"Required delivery file must be a regular file: {required}")
    epoch = int(git(source, "show", "-s", "--format=%ct", "HEAD").decode().strip())
    entries, excluded = collect(source, logos)
    manifest = {
        "format": 1,
        "project": "Taewon Seo — After Hours / Milky Studio",
        "source_commit": sha,
        "source_commit_utc": datetime.fromtimestamp(epoch, timezone.utc).isoformat(),
        "primary_logo": "A — happy Milky, white ears",
        "payload_file_count": len(entries),
        "payload_bytes": sum(entry.size for entry in entries),
        "hash_algorithm": "SHA-256",
        "manifest_note": "File hashes cover every payload file, including dist. MANIFEST.json excludes its own hash.",
        "build_note": "dist is supplied by the final npm run build; this packager does not rebuild it.",
        "exclusions": excluded,
        "policy": "Tracked project files plus dist and the logo folder only. No symlinks, dependencies, local agent settings, env files, private camera originals, or untracked research logs.",
        "files": [{"path": entry.archive_path.removeprefix(f"{WRAPPER}/"), "group": entry.group,
                   "bytes": entry.size, "sha256": entry.sha256} for entry in entries],
    }
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode()
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temp_name = tempfile.mkstemp(prefix=f".{output.stem}-", suffix=".tmp", dir=output.parent)
    os.close(descriptor)
    temporary = Path(temp_name)
    backup: Path | None = None
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as zipped:
            for entry in entries:
                with entry.source.open("rb") as original, zipped.open(zip_info(entry.archive_path, epoch), "w", force_zip64=True) as dest:
                    shutil.copyfileobj(original, dest, CHUNK)
            zipped.writestr(zip_info(f"{WRAPPER}/MANIFEST.json", epoch), manifest_bytes)
        verify(temporary, entries, manifest_bytes)
        require_clean(source, sha)  # Do not publish an archive if integration changed during packaging.
        for entry in entries:
            if digest(entry.source) != (entry.size, entry.sha256):
                raise ValueError(f"A source/build/logo file changed during packaging: {entry.source}")
        if output.exists() or output.is_symlink():
            suffix = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
            backup = output.with_name(f"{output.stem}.previous-{suffix}{output.suffix}")
            output.rename(backup)
        temporary.replace(output)
        size, sha256 = digest(output)
        print(json.dumps({"archive": str(output), "source_commit": sha, "bytes": size,
                          "sha256": sha256, "entries": len(entries) + 1, "verified": True,
                          "previous_archive": str(backup) if backup else None}, ensure_ascii=False, indent=2))
    except BaseException:
        if backup and not output.exists() and not output.is_symlink():
            backup.rename(output)
        raise
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(f"Packaging stopped: {error}") from error
