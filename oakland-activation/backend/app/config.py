import os


def demo_mode() -> bool:
    return os.environ.get("DEMO_MODE", "true").lower() in {"1", "true", "yes"}


def workforce_mode() -> str:
    return os.environ.get("WORKFORCE_SOURCE_MODE", "DEMO").upper()


def gemini_enabled() -> bool:
    return bool(os.environ.get("GEMINI_API_KEY")) and os.environ.get("GEMINI_ENABLED", "").lower() == "true"
