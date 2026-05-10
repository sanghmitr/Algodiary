from functools import lru_cache
from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://user:pass@localhost/preptracker"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = Field(default="change-me-change-me-change-me-32")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    frontend_url: str = "http://localhost:5173"
    frontend_urls: str = ""
    environment: str = "development"

    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claim_email: str = "your@email.com"
    brevo_smtp_key: str = ""
    brevo_smtp_user: str = "apikey"
    brevo_smtp_host: str = "smtp-relay.brevo.com"
    brevo_smtp_port: int = 587

    r2_bucket: str = ""
    r2_endpoint: str = ""
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_public_url: str = ""
    upload_dir: str = "uploads"
    max_upload_mb: int = 8

    @property
    def vapid_claims(self) -> dict[str, str]:
        return {"sub": f"mailto:{self.vapid_claim_email}"}

    @property
    def cors_origins(self) -> list[str]:
        origins = [origin.strip().rstrip("/") for origin in self.frontend_url.split(",") if origin.strip()]
        origins.extend(origin.strip().rstrip("/") for origin in self.frontend_urls.split(",") if origin.strip())
        if self.environment == "development":
            origins.extend(
                [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:5174",
                    "http://127.0.0.1:5174",
                ]
            )
        return sorted(set(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
