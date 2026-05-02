# AgentHub — Kubernetes Deployment

## Prerequisites

- `kubectl` configured for your cluster
- `helm` v3.12+
- A namespace created: `kubectl create namespace agent-hub`
- TLS secret for ingress (or disable TLS in values)

## Quick Start

```bash
# From repo root
cd infra/helm

# Install
helm install agent-hub ./agent-hub \
  --namespace agent-hub \
  --create-namespace \
  --set postgresql.auth.password=YOUR_SECURE_PASSWORD \
  --set backend.env.KEYCLOAK_CLIENT_SECRET=YOUR_SECRET

# Run migrations
kubectl exec -it deploy/agent-hub-backend -n agent-hub -- alembic upgrade head
```

## Customization

Override values with a file:

```bash
helm install agent-hub ./agent-hub -n agent-hub -f my-values.yaml
```

Key overrides:
- `ingress.host` — your domain
- `postgresql.auth.password` — database password
- `backend.env.KEYCLOAK_URL` — your Keycloak instance
- `backend.image.tag` / `frontend.image.tag` — pin to a release

## Upgrade

```bash
helm upgrade agent-hub ./agent-hub -n agent-hub
```

## Rollback

```bash
helm rollback agent-hub -n agent-hub
```

## Uninstall

```bash
helm uninstall agent-hub -n agent-hub
```

> Note: PVCs are retained after uninstall. Delete manually if needed.
