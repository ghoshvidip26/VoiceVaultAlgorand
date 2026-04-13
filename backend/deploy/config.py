"""
Application configuration management.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./v3labs.db"
    
    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:8000"
    
    # Application
    app_name: str = "V3Labs"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Public API URL
    public_api_url: str = "ws://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
