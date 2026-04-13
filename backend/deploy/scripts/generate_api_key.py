"""
API key generation script.

Generate deploy or consumer API keys for users.
"""
import asyncio
import sys
from pathlib import Path
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from database import async_session, APIKey
from database.models import APIKeyType
from auth.api_key import generate_api_key, hash_api_key


async def create_api_key(user_id: str, key_type: str, name: str = None):
    """
    Create a new API key.
    
    Args:
        user_id: User ID to associate with the key
        key_type: Type of key ('deploy' or 'consumer')
        name: Optional friendly name for the key
    """
    # Generate API key
    if key_type == "deploy":
        prefix = "v3labs_deploy"
        key_type_enum = APIKeyType.DEPLOY
    else:
        prefix = "v3labs_consumer"
        key_type_enum = APIKeyType.CONSUMER
    
    api_key = generate_api_key(prefix)
    key_hash = hash_api_key(api_key)
    
    # Store in database
    async with async_session() as db:
        db_key = APIKey(
            key_hash=key_hash,
            key_type=key_type_enum,
            user_id=user_id,
            name=name,
            is_active=True,
        )
        db.add(db_key)
        await db.commit()
    
    print(f"\n✓ API Key created successfully!")
    print(f"  Type: {key_type}")
    print(f"  User ID: {user_id}")
    if name:
        print(f"  Name: {name}")
    print(f"\n  API Key: {api_key}")
    print(f"\n⚠️  IMPORTANT: Save this key securely. It cannot be retrieved again.")
    
    if key_type == "deploy":
        print(f"\n  Use this key in the header: V3LABS_DEPLOY_KEY: {api_key}")
    else:
        print(f"\n  Use this key in the header: V3LABS_API_KEY: {api_key}")


async def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Generate V3Labs API keys")
    parser.add_argument("user_id", help="User ID to associate with the key")
    parser.add_argument(
        "key_type",
        choices=["deploy", "consumer"],
        help="Type of API key to generate"
    )
    parser.add_argument("--name", help="Optional friendly name for the key")
    
    args = parser.parse_args()
    
    await create_api_key(args.user_id, args.key_type, args.name)


if __name__ == "__main__":
    asyncio.run(main())
