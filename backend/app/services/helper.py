import re
from datetime import datetime, time

def _normalize_iso_dt(s: str) -> str:
    """Pad/truncate fractional seconds to 6 digits and normalize Z."""
    if not s:
        return s
    s = s.replace("Z", "+00:00")
    # Find fraction between '.' and timezone/end, pad/truncate to 6 digits
    m = re.search(r'(T\d{2}:\d{2}:\d{2})(\.(\d+))?([+-]\d{2}:\d{2})?$', s)
    if not m:
        return s
    frac = m.group(3) or ""
    tz = m.group(4) or ""
    if frac:
        if len(frac) < 6:
            frac = frac.ljust(6, "0")
        else:
            frac = frac[:6]
        fixed_tail = m.group(1) + "." + frac + tz
    else:
        fixed_tail = m.group(1) + tz
    # Replace only the matched tail
    return s[:m.start(1)] + fixed_tail

def parse_iso_datetime(s: str) -> datetime:
    return datetime.fromisoformat(_normalize_iso_dt(s))

def parse_iso_time(t: str) -> time:
    """Accept 'HH:MM', 'HH:MM:SS[.fff...]', optional timezone, or a full datetime."""
    if "T" in t:
        t = t.split("T", 1)[1]
    t = re.sub(r'(Z|[+-]\d{2}:\d{2})$', '', t)
    # ensure at least HH:MM:SS
    parts = t.split(":")
    if len(parts) == 2:
        t = f"{parts[0]}:{parts[1]}:00"
    # normalize fractional seconds if present
    if "." in t:
        hhmmss, frac = t.split(".", 1)
        frac = (frac + "000000")[:6]
        t = f"{hhmmss}.{frac}"
    return time.fromisoformat(t)
