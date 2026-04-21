#!/usr/bin/env python3
"""Load DEMO_EMAIL_* from .env.local and try IMAP LOGIN (stdlib only).

Exits 0 on success, 1 on failure. Does not print the password.
"""
from __future__ import annotations

import imaplib
import re
import sys
from pathlib import Path


def load_demo_email(root: Path) -> tuple[str, str]:
    env_path = root / ".env.local"
    if not env_path.is_file():
        print(f"missing {env_path}", file=sys.stderr)
        sys.exit(1)
    user: str | None = None
    pw: str | None = None
    text = env_path.read_text(encoding="utf-8-sig")
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("DEMO_EMAIL_USER="):
            user = line.split("=", 1)[1].strip().strip('"').strip("'").strip("\u201c\u201d")
        if line.startswith("DEMO_EMAIL_PASS="):
            raw = line.split("=", 1)[1].strip().strip('"').strip("'").strip("\u201c\u201d")
            pw = re.sub(r"\s+", "", raw)
    if not user or not pw:
        print("DEMO_EMAIL_USER and DEMO_EMAIL_PASS must be set in .env.local", file=sys.stderr)
        sys.exit(1)
    return user, pw


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    user, pw = load_demo_email(root)
    print(f"IMAP test: {user} (password length {len(pw)})")
    if len(pw) != 16:
        print(
            "Hint: Google app passwords are 16 characters. Check .env.local for extra spaces or a truncated paste.",
            file=sys.stderr,
        )
    try:
        m = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        m.login(user, pw)
        m.logout()
    except imaplib.IMAP4.error as e:
        print("IMAP_LOGIN: FAIL", e)
        print(
            "Hint: The 16-character value is shown only once when you click Create on "
            "https://myaccount.google.com/apppasswords — copy it then. "
            "The list of names (e.g. “Jarvis HUD”) is not the password. "
            "Create a new app password while signed in as the same address as DEMO_EMAIL_USER.",
            file=sys.stderr,
        )
        sys.exit(1)
    print("IMAP_LOGIN: OK — Gmail accepted these credentials.")


if __name__ == "__main__":
    main()
