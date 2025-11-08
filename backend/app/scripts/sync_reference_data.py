from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, Iterable, List


from ..services.metadata_repository import DEFAULT_REFERENCE_DATA, REFERENCE_FILE
from ..services.supabase_client import get_supabase_client

import os

from supabase import create_client, Client

supabase_url: str = os.environ.get("SUPABASE_URL")
supabase_service_role_key: str = os.environ.get("SUPABASE_KEY")
# supabase: Client = create_client(supabase_url, supabase_service_role_key)





TABLE_NAMES = ("cities", "sports", "abilities", "genders")


def _load_local_payload() -> Dict[str, Any]:
    if REFERENCE_FILE.exists():
        with REFERENCE_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    return DEFAULT_REFERENCE_DATA


def _ensure_list(payload: Dict[str, Any], key: str) -> List[Dict[str, Any]]:
    value = payload.get(key, [])
    if isinstance(value, list):
        return value
    raise ValueError(f"Expected list for '{key}', found {type(value).__name__}")


def _push_to_supabase(client: Client, payload: Dict[str, Any]) -> None:
    for table in TABLE_NAMES:
        records = _ensure_list(payload, table)
        if not records:
            continue
        client.table(table).upsert(records, on_conflict="id").execute()

    print("Reference data pushed to Supabase.")


def _fetch_table(client: Client, table: str) -> Iterable[Dict[str, Any]]:
    response = client.table(table).select("*").execute()
    return response.data or []


def _pull_from_supabase(client: Client) -> Dict[str, Any]:
    payload = {table: list(_fetch_table(client, table)) for table in TABLE_NAMES}
    with REFERENCE_FILE.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2, ensure_ascii=False)
    print(f"Reference data pulled from Supabase into {REFERENCE_FILE}.")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync reference data with Supabase.")
    parser.add_argument(
        "direction",
        choices=("push", "pull"),
        help="push = send local reference_data.json to Supabase; pull = download from Supabase.",
    )
    args = parser.parse_args()

    client = get_supabase_client()
    if not client:
        print(
            "Supabase credentials are not configured. "
            "Set SUPABASE_URL and SUPABASE_KEY in backend/.env before syncing.",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.direction == "push":
        payload = _load_local_payload()
        _push_to_supabase(client, payload)
    else:
        _pull_from_supabase(client)


if __name__ == "__main__":
    main()
