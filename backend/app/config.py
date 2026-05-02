from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://agenthub:changeme@localhost:5432/agenthub"
    KEYCLOAK_URL: str = "https://keycloak.internal"
    KEYCLOAK_REALM: str = "hynix"
    KEYCLOAK_CLIENT_ID: str = "agent-hub"
    KEYCLOAK_CLIENT_SECRET: str = ""
    CORS_ORIGINS: str = "http://localhost:8080,https://agent-hub.internal"
    UPLOAD_DIR: str = "/data/uploads"

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.KEYCLOAK_URL}/realms/{self.KEYCLOAK_REALM}"

    @property
    def keycloak_jwks_url(self) -> str:
        return f"{self.keycloak_issuer}/protocol/openid-connect/certs"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
