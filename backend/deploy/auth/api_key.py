"""
API key generation and validation utilities.
"""
import secrets
import hashlib
import hmac

# Simple secret for hashing (in production, use a proper secret)
SECRET_SALT = "v3labs-secret-salt-change-in-production"


def generate_api_key(prefix: str = "v3labs") -> str:
    """
    Generate a secure random API key.
    
    Args:
        prefix: Prefix for the API key (e.g., 'v3labs_deploy', 'v3labs_consumer')
    
    Returns:
        str: Generated API key
    """
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key for secure storage.
    
    Args:
        api_key: Plain text API key
    
    Returns:
        str: Hashed API key
    """
 #hmac dene seh better utf-8 aur api_key sync hota hai
    return hmac.new(
        SECRET_SALT.encode('utf-8'),
        api_key.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """
    Verify an API key against its hash.
    
    Args:
        plain_key: Plain text API key to verify
        hashed_key: Hashed API key from database
    
    Returns:
        bool: True if key matches, False otherwise
    """
    expected_hash = hash_api_key(plain_key)
    return hmac.compare_digest(expected_hash, hashed_key)
