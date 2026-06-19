from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://agenthub:changeme@localhost:5432/agenthub"
    KEYCLOAK_URL: str = "https://keycloak.internal"
    KEYCLOAK_REALM: str = "hynix"
    KEYCLOAK_CLIENT_ID: str = "agent-hub"
    KEYCLOAK_CLIENT_SECRET: str = ""
    KEYCLOAK_EMPLOYEE_CLAIM: str = "preferred_username"  # JWT claim for employee number
    CORS_ORIGINS: str = "http://localhost:8080,http://localhost:3000,https://agent-hub.internal"
    UPLOAD_DIR: str = "/data/uploads"
    DEV_MODE: bool = True  # Skip Keycloak auth, use dev user
    LANGFLOW_URL_PATTERN: str = ""  # e.g. http://agentbuilder-{empno}.example.com
    # 배포 대상(Agent Builder) HTTPS 검증 정책. 사내 CA(/etc/ssl/certs/corporate-ca.crt)가
    # 마운트돼 있으면 그것으로 검증하고, 없을 때의 폴백 동작을 이 값으로 정한다(기본: 비활성).
    LANGFLOW_VERIFY_SSL: bool = False

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
