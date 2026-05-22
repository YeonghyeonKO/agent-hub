"""Shared helpers."""


def bump_version(current: str | None, bump: str = "patch") -> str:
    """Increment a version string like 'v1.2.3'.

    `bump` is one of 'major' / 'minor' / 'patch' (unknown values fall back to
    'patch'). Missing or non-numeric segments default to 0 (major to 1), so a
    blank or malformed version still yields a sane next value.
    """
    ver = (current or "v1.0.0").lstrip("v")
    parts = ver.split(".")
    major = int(parts[0]) if len(parts) > 0 and parts[0].isdigit() else 1
    minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
    patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0

    if bump == "major":
        major, minor, patch = major + 1, 0, 0
    elif bump == "minor":
        minor, patch = minor + 1, 0
    else:  # patch
        patch += 1

    return f"v{major}.{minor}.{patch}"
