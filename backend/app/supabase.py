import json
import os
from urllib import error, request


class SupabaseClient:
    @staticmethod
    def url() -> str:
        return (os.getenv("SUPABASE_URL") or "").strip()

    @staticmethod
    def anon_key() -> str:
        return (os.getenv("SUPABASE_ANON_KEY") or "").strip()

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.url()) and bool(cls.anon_key())

    @classmethod
    def build_headers(cls) -> dict[str, str]:
        return {
            "apikey": cls.anon_key(),
            "Authorization": f"Bearer {cls.anon_key()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    @classmethod
    def request_table(cls, table_name: str, method: str = "GET", payload=None, params=None):
        if not cls.is_configured():
            raise RuntimeError("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.")

        url = f"{cls.url().rstrip('/')}/rest/v1/{table_name}"
        if params:
            query = "&".join(f"{key}={value}" for key, value in params.items())
            url = f"{url}?{query}"

        data = None if payload is None else json.dumps(payload).encode("utf-8")
        req = request.Request(url, data=data, headers=cls.build_headers(), method=method)

        try:
            with request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                return json.loads(body) if body else []
        except error.HTTPError as exc:
            message = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Supabase request failed for {table_name}: {message}") from exc

    @classmethod
    def push_record(cls, table_name: str, record: dict):
        if not cls.is_configured():
            return None

        try:
            return cls.request_table(table_name, method="POST", payload=record)
        except Exception as exc:
            print(f"Supabase sync warning for {table_name}: {exc}")
            return None

    @classmethod
    def pull_records(cls, table_name: str):
        if not cls.is_configured():
            return []

        try:
            return cls.request_table(table_name, method="GET", params={"select": "*"})
        except Exception as exc:
            print(f"Supabase fetch warning for {table_name}: {exc}")
            return []


SUPABASE_URL = SupabaseClient.url()
SUPABASE_ANON_KEY = SupabaseClient.anon_key()


def is_configured() -> bool:
    return SupabaseClient.is_configured()


def build_headers() -> dict[str, str]:
    return SupabaseClient.build_headers()


def request_table(table_name: str, method: str = "GET", payload=None, params=None):
    return SupabaseClient.request_table(table_name, method=method, payload=payload, params=params)


def push_record(table_name: str, record: dict):
    return SupabaseClient.push_record(table_name, record)


def pull_records(table_name: str):
    return SupabaseClient.pull_records(table_name)