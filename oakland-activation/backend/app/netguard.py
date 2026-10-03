"""Block non-local network sockets while DEMO_MODE is on."""

from __future__ import annotations

import socket

_INSTALLED = False
_ORIGINAL = socket.create_connection


def install_demo_network_guard() -> None:
    global _INSTALLED
    if _INSTALLED:
        return

    def guarded(address, *args, **kwargs):
        host = address[0] if isinstance(address, tuple) else address
        if host in {"127.0.0.1", "localhost", "::1"}:
            return _ORIGINAL(address, *args, **kwargs)
        raise RuntimeError(f"DEMO_MODE blocks outbound network to {host}")

    socket.create_connection = guarded
    _INSTALLED = True
