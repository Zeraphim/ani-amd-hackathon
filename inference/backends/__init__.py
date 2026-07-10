"""Swappable inference backends: stub (default), fireworks, mi300x.

Selected by the ANI_BACKEND env var. The web tier never changes when you switch;
it only ever calls /grade and /match.
"""
import os

BACKEND = os.getenv("ANI_BACKEND", "langgraph").lower()


def get_backend():
    if BACKEND == "fireworks":
        from . import fireworks
        return fireworks
    if BACKEND == "mi300x":
        # Same OpenAI-compatible client as fireworks, different base_url/model.
        # Point ANI_BASE_URL at your vLLM endpoint on the MI300X.
        from . import fireworks as mi300x  # identical interface
        return mi300x
    if BACKEND == "langgraph":
        from . import langgraph_backend
        return langgraph_backend
    from . import stub
    return stub
