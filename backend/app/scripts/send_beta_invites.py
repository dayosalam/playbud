from __future__ import annotations

import argparse

from ..services import email_service

BETA_TESTERS = [
    "adeoluwaamori@gmail.com",
    "aududavid31@gmail.com",
    "gbolajide54@gmail.com",
    "efunkunleolabode@gmail.com",
    "efunkunlejeminat@gmail.com",
    "emmanuelusoro2002@gmail.com",
    "mitahir004@gmail.com",
    "asiatabiola1@gmail.com",
    "yourschoolfriend@unilorin.com",
    "specialdivergent@gmail.com",
    "salamimoshood60@yahoo.com",
    "unactivelana0@gmail.com",
    "abubakaralamin2002@gmail.com",
    "fagbemibabs18@gmail.com",
    "dayosalamboi@gmail.com",
    "abioyeemmanuel99@gmail.com",
    "ayushau77@gmail.com",
    "kosiso5050@gmail.com",
]


def send_invites(*, dry_run: bool = False, link: str = "https://playbud.site") -> None:
    for email in BETA_TESTERS:
        if dry_run:
            print(f"[DRY-RUN] Would send beta invite to {email}")
            continue
        sent = email_service.send_beta_invite_email(recipient=email, link=link)
        status = "sent" if sent else "failed"
        print(f"{status.upper()}: {email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Send PlayBud beta invite emails.")
    parser.add_argument(
        "--link",
        type=str,
        default="https://playbud.site",
        help="MVP link to include in the invite.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print recipients without sending emails.",
    )
    args = parser.parse_args()
    send_invites(dry_run=args.dry_run, link=args.link)


if __name__ == "__main__":
    main()
