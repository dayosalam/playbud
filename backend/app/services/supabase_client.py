from __future__ import annotations

from typing import Optional

from supabase import Client, create_client

from ..core.config import get_settings

_settings = get_settings()
_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    global _client
    if _client is not None:
        return _client

    if not _settings.supabase_url or not _settings.supabase_service_role_key:
        return None

    try:
        _client = create_client(_settings.supabase_url, _settings.supabase_service_role_key)
    except Exception:
        _client = None

    return _client
