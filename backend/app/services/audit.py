"""
audit.py  —  tamper-evident-ish audit logging for PHI access
============================================================
Records WHO did WHAT to WHICH report and WHEN. Required for healthcare
compliance (HIPAA §164.312(b) audit controls / GDPR accountability).

Rules:
  • Log identifiers only (user_id, report_id — both UUIDs) + action + ip.
  • NEVER log health values, file names, file contents, or tokens here.
  • Emitted on the dedicated "audit" logger at INFO so it can be routed to a
    separate sink / shipped to a WORM store in production.

Actions (keep stable — they're queried):
  report_upload, report_analyze, report_view, report_list,
  report_delete, chat_query, authz_denied
"""

import json
import time
import logging

audit_logger = logging.getLogger("audit")


def audit(
    action: str,
    *,
    user_id: str | None = None,
    report_id: str | None = None,
    ip: str | None = None,
    status: str = "ok",
    **extra,
) -> None:
    """Emit one structured audit record. `extra` must contain NO PHI."""
    record = {
        "ts": time.time(),
        "action": action,
        "user_id": user_id,
        "report_id": report_id,
        "ip": ip,
        "status": status,
    }
    if extra:
        record.update(extra)
    audit_logger.info("AUDIT %s", json.dumps(record, default=str))


def client_ip(request) -> str:
    """Best-effort client IP, honouring a single proxy hop (X-Forwarded-For)."""
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
