"""
Database initialization script.

Run this script to create all database tables.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database import init_db


async def main():
    """Initialize database tables."""
    print("Initializing database...")
    await init_db()
    print("✓ Database initialized successfully!")
    print("✓ All tables created")


if __name__ == "__main__":
    asyncio.run(main())
