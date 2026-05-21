"""Compatibility entrypoint.

The real backend lives in backend/app/main.py. This file is kept so running
`uvicorn app:app` from the repository root still works after the project split.
"""

from backend.app.main import app
