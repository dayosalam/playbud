from datetime import datetime

from app.schemas.auth import GoogleAuthRequest, UserCreate
from app.services import auth_service
from app.services import email_service
from app.services.user_repository import UserRecord


def _user_record(*, email: str, name: str = "Test User") -> UserRecord:
    return UserRecord(
        id="user-123",
        email=email,
        name=name,
        password_hash="hashed-password",
        organiser_id="organiser-123",
        created_at=datetime.utcnow(),
    )


def _stub_tokens(monkeypatch):
    monkeypatch.setattr(auth_service.security, "hash_password", lambda password: f"hashed-{password}")
    monkeypatch.setattr(auth_service.security, "create_access_token", lambda subject: f"access-{subject}")
    monkeypatch.setattr(auth_service.security, "create_refresh_token", lambda subject: f"refresh-{subject}")


def test_password_signup_sends_welcome_email(monkeypatch):
    sent_emails = []
    created_user = _user_record(email="new@example.com", name="New Player")

    _stub_tokens(monkeypatch)
    monkeypatch.setattr(auth_service.user_repository, "get_user_by_email", lambda email: None)
    monkeypatch.setattr(auth_service.user_repository, "create_user", lambda **kwargs: created_user)
    monkeypatch.setattr(
        auth_service.email_service,
        "send_welcome_email",
        lambda **kwargs: sent_emails.append(kwargs) or True,
    )

    response = auth_service.signup(
        UserCreate(email="new@example.com", password="secret-password", name="New Player")
    )

    assert response.user.email == "new@example.com"
    assert sent_emails == [{"recipient": "new@example.com", "name": "New Player"}]


def test_new_google_signup_sends_welcome_email(monkeypatch):
    sent_emails = []
    created_user = _user_record(email="google@example.com", name="Google Player")

    _stub_tokens(monkeypatch)
    monkeypatch.setattr(
        auth_service,
        "_verify_google_id_token",
        lambda token: {
            "email": "google@example.com",
            "email_verified": True,
            "name": "Google Player",
            "picture": "https://example.com/avatar.png",
        },
    )
    monkeypatch.setattr(auth_service.user_repository, "get_user_by_email", lambda email: None)
    monkeypatch.setattr(auth_service.user_repository, "create_user", lambda **kwargs: created_user)
    monkeypatch.setattr(
        auth_service.email_service,
        "send_welcome_email",
        lambda **kwargs: sent_emails.append(kwargs) or True,
    )

    response = auth_service.login_with_google(GoogleAuthRequest(id_token="google-token"))

    assert response.user.email == "google@example.com"
    assert sent_emails == [{"recipient": "google@example.com", "name": "Google Player"}]


def test_existing_google_login_does_not_send_welcome_email(monkeypatch):
    sent_emails = []
    existing_user = _user_record(email="existing@example.com", name="Existing Player")

    _stub_tokens(monkeypatch)
    monkeypatch.setattr(
        auth_service,
        "_verify_google_id_token",
        lambda token: {
            "email": "existing@example.com",
            "email_verified": True,
            "name": "Existing Player",
        },
    )
    monkeypatch.setattr(auth_service.user_repository, "get_user_by_email", lambda email: existing_user)
    monkeypatch.setattr(auth_service.user_repository, "update_user_fields", lambda user_id, fields: existing_user)
    monkeypatch.setattr(
        auth_service.email_service,
        "send_welcome_email",
        lambda **kwargs: sent_emails.append(kwargs) or True,
    )

    response = auth_service.login_with_google(GoogleAuthRequest(id_token="google-token"))

    assert response.user.email == "existing@example.com"
    assert sent_emails == []


def test_welcome_email_html_includes_welcome_text(monkeypatch):
    sent_payload = {}

    monkeypatch.setattr(
        email_service,
        "_send_email",
        lambda **kwargs: sent_payload.update(kwargs) or True,
    )

    assert email_service.send_welcome_email(recipient="new@example.com", name="New Player") is True

    assert sent_payload["subject"] == "Welcome to PlayBud"
    assert "I am Adedayo the CEO of PlayBud!" in sent_payload["text_body"]
    assert "I am Adedayo the CEO of PlayBud!" in sent_payload["html_body"]
    assert "Jump into Find Game" in sent_payload["html_body"]
    assert "The PlayBud Team" in sent_payload["html_body"]
