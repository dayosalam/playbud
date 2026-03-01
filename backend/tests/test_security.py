
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core import security



def test_password_hash_roundtrip():
    password = "super-secret"
    password_hash = security.hash_password(password)
    assert security.verify_password(password, password_hash)
    assert not security.verify_password("wrong-password", password_hash)


def test_access_token_subject_roundtrip():
    subject = "user-123"
    token = security.create_access_token(subject)
    decoded = security.get_subject_from_token(token)
    assert decoded == subject
