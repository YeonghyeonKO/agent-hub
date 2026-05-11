{{- define "agent-hub.fullname" -}}
agent-hub-{{ required "instanceName is required" .Values.instanceName }}
{{- end }}

{{- define "agent-hub.labels" -}}
app.kubernetes.io/name: agent-hub
app.kubernetes.io/instance: {{ include "agent-hub.fullname" . }}
{{- end }}

{{- define "agent-hub.backendSelectorLabels" -}}
app.kubernetes.io/name: agent-hub
app.kubernetes.io/instance: {{ include "agent-hub.fullname" . }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "agent-hub.frontendSelectorLabels" -}}
app.kubernetes.io/name: agent-hub
app.kubernetes.io/instance: {{ include "agent-hub.fullname" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{- define "agent-hub.secretName" -}}
{{- if .Values.keycloak.existingSecret -}}
{{ .Values.keycloak.existingSecret }}
{{- else -}}
{{ include "agent-hub.fullname" . }}-secret
{{- end }}
{{- end }}

{{- define "agent-hub.host" -}}
{{- if .Values.ingress.host -}}
{{ .Values.ingress.host }}
{{- else -}}
{{ include "agent-hub.fullname" . }}.{{ .Values.ingress.domain }}
{{- end }}
{{- end }}

{{- define "agent-hub.databaseUrl" -}}
{{- if .Values.postgresql.internal -}}
postgresql+asyncpg://{{ .Values.postgresql.username }}:$(DATABASE_PASSWORD)@{{ include "agent-hub.fullname" . }}-postgresql:{{ .Values.postgresql.port }}/{{ .Values.postgresql.database }}
{{- else -}}
postgresql+asyncpg://{{ .Values.postgresql.username }}:$(DATABASE_PASSWORD)@{{ .Values.postgresql.host }}:{{ .Values.postgresql.port }}/{{ .Values.postgresql.database }}
{{- end }}
{{- end }}

{{- define "agent-hub.dbSecretName" -}}
{{- if .Values.postgresql.existingSecret -}}
{{ .Values.postgresql.existingSecret }}
{{- else -}}
{{ include "agent-hub.fullname" . }}-secret
{{- end }}
{{- end }}

{{- define "agent-hub.dbSecretKey" -}}
{{- if .Values.postgresql.existingSecret -}}
{{ .Values.postgresql.existingSecretKey }}
{{- else -}}
postgresql-password
{{- end }}
{{- end }}

{{- define "agent-hub.imagePullSecrets" -}}
{{- if .Values.imageRegistry.enabled }}
- name: {{ include "agent-hub.fullname" . }}-registry
{{- else if .Values.imagePullSecrets }}
{{- toYaml .Values.imagePullSecrets }}
{{- end }}
{{- end }}

{{- define "agent-hub.sslVolume" -}}
{{- if .Values.ssl.existingConfigMap -}}
configMap:
  name: {{ .Values.ssl.existingConfigMap }}
{{- else if .Values.ssl.existingSecret -}}
secret:
  secretName: {{ .Values.ssl.existingSecret }}
{{- else -}}
configMap:
  name: {{ include "agent-hub.fullname" . }}-ca-cert
{{- end }}
{{- end }}
