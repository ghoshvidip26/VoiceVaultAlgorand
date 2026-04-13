"""
Shelby storage implementation (local file-based for development)

In production, this would integrate with actual Shelby RPC endpoints.
For development, we use local file storage organized by:
storage/shelby/{account}/{namespace}/{voiceId}/{filename}
"""

import re
import hashlib
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent

# Local storage directory for Shelby (development only)
STORAGE_ROOT = BACKEND_DIR / "storage" / "shelby"


class FileNotFoundError(Exception):
    """Custom error class for file not found errors."""
    def __init__(self, message):
        super().__init__(message)
        self.code = "ENOENT"


def _ensure_storage_dir(account, namespace, voice_id):
    """Ensure storage directory exists."""
    dir_path = STORAGE_ROOT / account / namespace / voice_id
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def upload_to_shelby(account, namespace, voice_id, bundle_files):
    """
    Upload bundle to Shelby (local file storage for development)

    In production, this would use Shelby's actual RPC protocol.
    For development, we store files locally in a structured directory.
    """
    try:
        uri = f"shelby://{account}/{namespace}/{voice_id}"
        storage_dir = _ensure_storage_dir(account, namespace, voice_id)

        total_size = 0

        for filename, buffer in bundle_files.items():
            file_path = storage_dir / filename
            data = buffer if isinstance(buffer, (bytes, bytearray)) else bytes(buffer)
            file_path.write_bytes(data)
            total_size += len(data)
            print(f"[Shelby] Stored {filename} ({len(data) / 1024:.2f} KB)")

        # Generate content hash for immutability (simplified)
        hash_obj = hashlib.sha256()
        for buffer in bundle_files.values():
            data = buffer if isinstance(buffer, (bytes, bytearray)) else bytes(buffer)
            hash_obj.update(data)
        cid = hash_obj.hexdigest()

        print(f"[Shelby] Upload complete: {uri} ({total_size / 1024:.2f} KB total)")

        return {
            "uri": uri,
            "cid": f"0x{cid}",
            "size": total_size,
            "uploadedAt": int(time.time() * 1000),
        }
    except Exception as error:
        print(f"[Shelby] Upload error: {error}")
        raise


def download_from_shelby(uri, filename):
    """
    Download file from Shelby (local file storage for development)

    In production, this would download from Shelby RPC.
    For development, we read from local file storage.
    """
    try:
        match = re.match(r"^shelby://([^/]+)/([^/]+)/(.+)$", uri)
        if not match:
            raise ValueError(f"Invalid Shelby URI: {uri}")

        account, namespace, voice_id = match.group(1), match.group(2), match.group(3)
        file_path = STORAGE_ROOT / account / namespace / voice_id / filename

        if not file_path.exists():
            not_found_error = FileNotFoundError(f"File not found: {filename} in {uri}")
            print(f"[Shelby] File not found, throwing FileNotFoundError: {not_found_error}")
            raise not_found_error

        buffer = file_path.read_bytes()
        print(f"[Shelby] Downloaded {filename} from {uri} ({len(buffer) / 1024:.2f} KB)")
        return buffer
    except FileNotFoundError:
        raise
    except Exception as error:
        print(f"[Shelby] Download error: name={type(error).__name__}, message={error}")
        raise


def delete_from_shelby(uri, account):
    """
    Delete voice bundle from Shelby (local file storage for development)

    In production, this would use Shelby's actual RPC protocol for deletion.
    For development, we delete files from local file storage.
    """
    try:
        match = re.match(r"^shelby://([^/]+)/([^/]+)/(.+)$", uri)
        if not match:
            raise ValueError(f"Invalid Shelby URI: {uri}")

        owner_account, namespace, voice_id = match.group(1), match.group(2), match.group(3)

        # Verify the account matches the owner
        if owner_account.lower() != account.lower():
            raise PermissionError("Unauthorized: Only the owner can delete their voice from Shelby")

        voice_dir = STORAGE_ROOT / owner_account / namespace / voice_id

        if not voice_dir.exists():
            print(f"[Shelby] Voice bundle not found (already deleted?): {uri}")
            return {
                "success": True,
                "uri": uri,
                "message": "Voice bundle not found (may have been already deleted)",
            }

        # Delete all files in the directory
        for file_path in voice_dir.iterdir():
            if file_path.is_file():
                file_path.unlink()
                print(f"[Shelby] Deleted file: {file_path.name}")

        # Remove the directory
        voice_dir.rmdir()
        print(f"[Shelby] Deleted voice bundle: {uri}")

        return {
            "success": True,
            "uri": uri,
            "deletedAt": int(time.time() * 1000),
        }
    except Exception as error:
        print(f"[Shelby] Delete error: {error}")
        raise


def verify_access(uri, requester_account):
    """
    Check if account has access to a Shelby resource
    """
    try:
        match = re.match(r"^shelby://([^/]+)/([^/]+)/(.+)$", uri)
        if not match:
            print(f"[API DEBUG verify_access] Regex match failed for uri={uri}")
            return False

        owner_account = match.group(1)
        print(f"[API DEBUG verify_access] Regex match passed. owner={owner_account}, requester={requester_account}")

        # Owner always has access
        if owner_account.lower() == str(requester_account).lower():
            print(f"[API DEBUG verify_access] Owner matched requester")
            return True

        # For MVP, we trust frontend localStorage tracking
        print(f"[API DEBUG verify_access] Allowing access as fallback for MVP")
        return True
    except Exception as error:
        print(f"[Shelby] Access verification error: {error}")
        return False
