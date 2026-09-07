import os
import sys
import tempfile
from pathlib import Path

# Make `import api`, `import stego`, `import database` resolve the same way
# they do when the app itself is run (`cd backend && uvicorn api:app`), even
# if pytest is invoked from the repo root instead of from inside backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Point the whole test session at a throwaway SQLite file instead of the real
# backend/hideout.db, so running the test suite never touches real data. This
# must be set before anything imports `api` (which seeds/loads the DB at
# import time), so it happens here at conftest module load, not in a fixture.
_test_db_dir = tempfile.mkdtemp(prefix="hideout_test_")
os.environ.setdefault("HIDEOUT_DB_PATH", str(Path(_test_db_dir) / "test.db"))
