from __future__ import annotations

import time
from dataclasses import dataclass
from email.utils import parsedate_to_datetime
from typing import Any, Dict, Optional

import requests

from . import __version__
from .i18n import t

DEFAULT_BASE_URL = "https://salta7-store.ngrok.app"
DEFAULT_TIMEOUT = 30.0
RETRYABLE_STATUS = {429, 500, 502, 503, 504}


class CLIError(RuntimeError):
    """Expected, user-facing CLI error."""


@dataclass(frozen=True)
class RetryConfig:
    attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 10.0


class Salta7Client:
    def __init__(
        self,
        base_url: str,
        token: Optional[str],
        timeout: float = DEFAULT_TIMEOUT,
        retry: RetryConfig = RetryConfig(),
        session: Optional[requests.Session] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout = timeout
        self.retry = retry
        self.session = session or requests.Session()
        self.session.headers.update({"User-Agent": f"salta7-cli/{__version__}"})

    def _headers(self, auth: bool) -> Dict[str, str]:
        if not auth:
            return {}
        if not self.token:
            raise CLIError(t("client.token_required"))
        return {"Authorization": f"Bearer {self.token}"}

    @staticmethod
    def _retry_after_seconds(response: requests.Response) -> Optional[float]:
        value = response.headers.get("Retry-After")
        if not value:
            return None
        try:
            return max(0.0, float(value))
        except ValueError:
            try:
                dt = parsedate_to_datetime(value)
                return max(0.0, dt.timestamp() - time.time())
            except (TypeError, ValueError, OverflowError):
                return None

    def request(
        self,
        method: str,
        path: str,
        *,
        auth: bool = True,
        params: Optional[Dict[str, Any]] = None,
        body: Optional[Dict[str, Any]] = None,
    ) -> Any:
        method = method.upper()
        # GETs are safe to retry. /buy is also safe because the CLI always supplies client_tx_id.
        retryable = method in {"GET", "HEAD"} or (method == "POST" and path == "/buy")
        attempts = max(1, self.retry.attempts if retryable else 1)

        last_network_error: Optional[Exception] = None
        for attempt in range(attempts):
            try:
                response = self.session.request(
                    method,
                    f"{self.base_url}{path}",
                    headers=self._headers(auth),
                    params=params,
                    json=body,
                    timeout=self.timeout,
                )
            except requests.RequestException as exc:
                last_network_error = exc
                if attempt + 1 >= attempts:
                    raise CLIError(t("client.network_error", error=exc)) from exc
                delay = min(self.retry.base_delay * (2**attempt), self.retry.max_delay)
                time.sleep(delay)
                continue

            if response.status_code in RETRYABLE_STATUS and attempt + 1 < attempts:
                retry_after = self._retry_after_seconds(response)
                delay = retry_after if retry_after is not None else self.retry.base_delay * (2**attempt)
                time.sleep(min(delay, self.retry.max_delay))
                continue

            try:
                data = response.json()
            except ValueError:
                text = response.text.strip()
                data = text if text else None

            if not response.ok:
                detail = data.get("detail") if isinstance(data, dict) and "detail" in data else data
                raise CLIError(t("client.http_error", status=response.status_code, detail=detail))
            return data

        raise CLIError(t("client.network_error", error=last_network_error))

    def prices(self) -> Any:
        return self.request("GET", "/prices", auth=False)

    def stock(self, account: str) -> Any:
        return self.request("GET", "/stock", auth=False, params={"account": account})

    def balance(self) -> Any:
        return self.request("GET", "/balance")

    def buy(self, account: str, amount: int, client_tx_id: str) -> Any:
        return self.request(
            "POST",
            "/buy",
            params={"account": account, "amount": amount, "client_tx_id": client_tx_id},
        )

    def history(self) -> Any:
        return self.request("GET", "/history")

    def history_items(self, tx_id: str) -> Any:
        return self.request("GET", "/history/items", params={"tx_id": tx_id})

    def task_create(self, payload: Dict[str, Any]) -> Any:
        return self.request("POST", "/task/create", body=payload)

    def task_status(self, job_id: str) -> Any:
        return self.request("GET", "/task/status", params={"job_id": job_id})

    def task_history(self, task: Optional[str], limit: int) -> Any:
        params: Dict[str, Any] = {"limit": limit}
        if task:
            params["task"] = task
        return self.request("GET", "/task/history", params=params)

    def task_quote(self) -> Any:
        return self.request("GET", "/task/quote", auth=False)

    def task_products(self, tool: Optional[str]) -> Any:
        return self.request("GET", "/task/products", params={"tool": tool} if tool else None)

    def task_items(self, job_id: str, byot: bool) -> Any:
        path = "/task/byot/items" if byot else "/task/items"
        return self.request("GET", path, params={"job_id": job_id})

    def task_byot_quote(self, tokens: list[str], boosts_needed: int = 0, humanize: bool = False) -> Any:
        return self.request(
            "POST",
            "/task/byot/quote",
            body={"tokens": tokens, "boosts_needed": boosts_needed, "humanize": humanize},
        )

    def task_active(self) -> Any:
        return self.request("GET", "/task/active")
