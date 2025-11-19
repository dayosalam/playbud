from __future__ import annotations

import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from threading import Timer
from typing import Optional

from ..core.config import get_settings
from ..schemas.games import Game

settings = get_settings()


def _event_datetime(game: Game) -> datetime:
    date_value = game.date if isinstance(game.date, datetime) else datetime.fromisoformat(str(game.date))
    start_time = getattr(game, "start_time", None)
    if start_time:
        if isinstance(start_time, str):
            time_obj = datetime.fromisoformat(f"1970-01-01T{start_time}").time()
        else:
            time_obj = start_time
        date_value = date_value.replace(
            hour=time_obj.hour,
            minute=time_obj.minute,
            second=time_obj.second,
            microsecond=time_obj.microsecond,
        )
    return date_value


def _can_send() -> bool:
    return all([settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.mail_from])


def _send_email(*, subject: str, recipient: str, text_body: str, html_body: str) -> bool:
    if not _can_send():
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.mail_from
    message["To"] = recipient
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
            server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"Email send failure ({subject}): {exc}")
        return False


def _hero_html(title: str, body: str, button_text: str, button_link: str, footer: Optional[str] = None) -> str:
    footer_text = footer or f"© {datetime.utcnow().year} PlayBud."
    return f"""
    <!DOCTYPE html>
    <html lang=\"en\">
      <head>
        <meta charset=\"UTF-8\" />
        <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
        <title>{title}</title>
      </head>
      <body style=\"margin:0;padding:0;background-color:#141414;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;\">
        <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:#141414;padding:32px 16px;\">
          <tr>
            <td align=\"center\">
              <table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#1c1c1c;border-radius:16px;overflow:hidden;\">
                <tr>
                  <td style=\"padding:32px;text-align:center;\">
                    <p style=\"margin:0;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#ffaa4d;\">PlayBud</p>
                    <h1 style=\"margin:16px 0 8px;font-size:28px;color:#ffffff;\">{title}</h1>
                    <p style=\"margin:0;color:#9ca3af;font-size:16px;line-height:1.5;\">{body}</p>
                  </td>
                </tr>
                <tr>
                  <td style=\"padding:0 48px 32px;text-align:center;\">
                    <a href=\"{button_link}\" style=\"display:inline-block;background:#ff4800;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:600;\">{button_text}</a>
                  </td>
                </tr>
                <tr>
                  <td style=\"padding:16px 32px;background:#111111;text-align:center;color:#6b7280;font-size:12px;\">
                    {footer_text}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


def send_welcome_email(*, recipient: str, name: str | None = None) -> bool:
    greeting = f"Hi {name}," if name else "Hi there,"
    text_body = (
        f"{greeting}\n\nWelcome to PlayBud! You're now part of a community that loves organising and joining social games."
        "\nJump into Find Game to book your next session or create one in Add Game.\n\nSee you on court!\nThe PlayBud Team"
    )
    html_body = _hero_html(
        "You're in!",
        f"{greeting}<br/>Thanks for joining the community. Here’s what you can do next.",
        "Find games",
        "https://playbud.site/find-game",
    )
    return _send_email(subject="Welcome to PlayBud", recipient=recipient, text_body=text_body, html_body=html_body)


def send_beta_invite_email(*, recipient: str, name: str | None = None, link: str = "https://playbud.site") -> bool:
    greeting = f"Hi {name}," if name else "Hi,"
    text_body = (
        f"{greeting}\n\nI’ve been heads-down building the PlayBud MVP for the last month and would love your help as a beta tester."
        "\nJump in, take it for a spin, and feel free to share it with friends or your community."
        f"\n\nHere’s the link: {link}\n\nAny feedback is gold. Thank you for being part of the very first testers!"
        "\n\n— Dayo Salam, Builder of PlayBud For Ballerz☄️"
    )
    html_body = _hero_html(
        "You're invited to test PlayBud",
        f"{greeting}<br/>I’ve been building PlayBud for the last month. I’d love for you to try the MVP, kick the tires, and share it with anyone who might enjoy it.<br/><br/><strong>Dayo Salam</strong><br/>Builder, PlayBud",
        "Open the MVP",
        link,
    )
    return _send_email(
        subject="Beta test the PlayBud MVP",
        recipient=recipient,
        text_body=text_body,
        html_body=html_body,
    )


def send_organizer_review_email(*, recipient: str, name: str | None = None) -> bool:
    greeting = f"Hi {name}," if name else "Hi organiser,"
    text_body = (
        f"{greeting}\n\nThanks for sharing your organiser details. Our team is reviewing everything to keep games safe "
        "and trusted on PlayBud. We’ll let you know as soon as you’re approved."
        "\n\nYou can always update your info from the organiser dashboard."
    )
    html_body = _hero_html(
        "You're almost set",
        f"{greeting}<br/>We’re taking a quick look at your organiser profile. Expect an update from us soon.",
        "View organiser hub",
        "https://playbud.site/add-game",
    )
    return _send_email(
        subject="Your PlayBud organiser profile is under review",
        recipient=recipient,
        text_body=text_body,
        html_body=html_body,
    )


def send_game_pending_review_email(*, game: Game, organiser_name: str | None, organiser_email: str) -> bool:
    event_dt = _event_datetime(game)
    text_body = (
        f"Hi {organiser_name or 'organiser'},\n\n"
        f"We received your request to list \"{game.name}\" on {event_dt:%A, %d %B %Y at %H:%M}."
        "\nOur team is reviewing the details to keep listings trusted. We'll email you again once it's approved."
    )
    html_body = _hero_html(
        "We’re reviewing your game",
        f"Thanks for submitting <strong>{game.name}</strong>. We’ll confirm once it’s ready for players.",
        "Track status",
        "https://playbud.site/add-game",
    )
    return _send_email(
        subject="Thanks! Your game is pending approval",
        recipient=organiser_email,
        text_body=text_body,
        html_body=html_body,
    )


def send_game_approved_email(*, game: Game, organiser_name: str | None, organiser_email: str) -> bool:
    event_dt = _event_datetime(game)
    text_body = (
        f"Hi {organiser_name or 'organiser'},\n\n"
        f"Great news — \"{game.name}\" has been approved and is now visible to players for {event_dt:%A, %d %B %Y at %H:%M}."
        "\nShare your listing and get players booked in."
    )
    html_body = _hero_html(
        "Your game is live",
        f"<strong>{game.name}</strong> is approved and ready to fill. Share it with your community and keep an eye on bookings.",
        "Manage game",
        f"https://playbud.site/games/{game.id}",
    )
    return _send_email(
        subject="Your PlayBud game is approved",
        recipient=organiser_email,
        text_body=text_body,
        html_body=html_body,
    )


def send_game_rejected_email(*, game: Game, organiser_name: str | None, organiser_email: str) -> bool:
    event_dt = _event_datetime(game)
    text_body = (
        f"Hi {organiser_name or 'organiser'},\n\n"
        f"Your submission for \"{game.name}\" on {event_dt:%A, %d %B %Y at %H:%M} wasn't approved this time."
        "\nGive the details another look (venue, pricing, description) and resubmit when you're ready."
    )
    html_body = _hero_html(
        "A quick tweak needed",
        "This game wasn’t approved yet. Tighten up the details and submit again — we’re happy to take another look.",
        "Review listing",
        "https://playbud.site/add-game",
    )
    return _send_email(
        subject="Your PlayBud game needs an update",
        recipient=organiser_email,
        text_body=text_body,
        html_body=html_body,
    )


def send_game_half_full_email(
    *,
    game: Game,
    organiser_name: str | None,
    organiser_email: str,
    current_count: int,
) -> bool:
    event_dt = _event_datetime(game)
    text_body = (
        f"Hi {organiser_name or 'organiser'},\n\n"
        f"\"{game.name}\" on {event_dt:%A, %d %B %Y at %H:%M} has reached {current_count} players — halfway to capacity."
        "\nKeep sharing the link so it fills up fast."
    )
    html_body = _hero_html(
        "Halfway there",
        f"<strong>{game.name}</strong> now has {current_count} players booked. Give it a final push!",
        "Share listing",
        f"https://playbud.site/games/{game.id}",
    )
    return _send_email(
        subject="Your PlayBud game is halfway booked",
        recipient=organiser_email,
        text_body=text_body,
        html_body=html_body,
    )


def send_game_full_email(*, game: Game, organiser_name: str | None, organiser_email: str) -> bool:
    event_dt = _event_datetime(game)
    text_body = (
        f"Hi {organiser_name or 'organiser'},\n\n"
        f"Great news — \"{game.name}\" for {event_dt:%A, %d %B %Y at %H:%M} just hit full capacity."
        "\nYou can manage the roster and comms from your organiser dashboard."
    )
    html_body = _hero_html(
        "Fully booked",
        f"<strong>{game.name}</strong> is full. Time to prep for a great session!",
        "View roster",
        f"https://playbud.site/games/{game.id}",
    )
    return _send_email(
        subject="Your PlayBud game is full",
        recipient=organiser_email,
        text_body=text_body,
        html_body=html_body,
    )


def send_booking_confirmation_email(*, game: Game, participant_name: str | None, participant_email: str) -> bool:
    event_dt = _event_datetime(game)
    greeting = f"Hi {participant_name}," if participant_name else "Hi player,"
    text_body = (
        f"{greeting}\n\nYou're confirmed for '{game.name}' on {event_dt:%A, %d %B %Y at %H:%M}."
        "\nArrive 10 minutes early and bring the right kit.\n\nSee you soon!"
    )
    html_body = _hero_html(
        "You're booked in",
        f"{greeting}<br/>You're confirmed for <strong>{game.name}</strong> on <strong>{event_dt:%A, %d %B}</strong> at <strong>{event_dt:%H:%M}</strong>.",
        "View details",
        f"https://playbud.site/games/{game.id}",
    )
    return _send_email(subject="You're in for the game", recipient=participant_email, text_body=text_body, html_body=html_body)


def _send_game_reminder_email(*, game: Game, recipient: str, name: str | None) -> None:
    event_dt = _event_datetime(game)
    greeting = f"Hi {name}," if name else "Hi,"
    text_body = (
        f"{greeting}\n\nReminder: '{game.name}' starts at {event_dt:%H:%M} today."
        "\nPlease let the organiser know if anything changes."
    )
    html_body = _hero_html(
        "Game starts soon",
        f"{greeting}<br/>This is a reminder that <strong>{game.name}</strong> starts at <strong>{event_dt:%H:%M}</strong> today.",
        "View game",
        f"https://playbud.site/games/{game.id}",
    )
    _send_email(subject="Your game starts in 6 hours", recipient=recipient, text_body=text_body, html_body=html_body)


def schedule_game_reminder_email(*, game: Game, recipient: str, name: str | None = None) -> None:
    event_dt = _event_datetime(game)
    send_at = event_dt - timedelta(hours=6)
    delay = (send_at - datetime.utcnow()).total_seconds()
    if delay <= 0:
        _send_game_reminder_email(game=game, recipient=recipient, name=name)
        return

    timer = Timer(delay, _send_game_reminder_email, kwargs={"game": game, "recipient": recipient, "name": name})
    timer.daemon = True
    timer.start()


def send_password_reset_email(*, recipient: str, name: str | None, reset_link: str) -> bool:
    greeting = f"Hi {name}," if name else "Hi,"
    text_body = (
        f"{greeting}\n\nWe received a request to reset your PlayBud password."
        f"\nUse the link below to continue: {reset_link}\n\nIf you didn't request this, you can ignore this email."
    )
    html_body = _hero_html(
        "Reset your password",
        f"{greeting}<br/>We received a request to reset your password. Use the button below to continue.",
        "Reset password",
        reset_link,
    )
    return _send_email(subject="Reset your PlayBud password", recipient=recipient, text_body=text_body, html_body=html_body)
