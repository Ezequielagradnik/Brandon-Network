# Seguridad — Brandon Latam Network

Guía para escanear la seguridad del proyecto y el checklist que seguimos.
Cualquiera del equipo puede correr esto.

## Herramientas

Dos skills de Claude Code (guías) más el binario de Semgrep (el que escanea).

| Skill | Para qué | Fuente |
|-------|----------|--------|
| `semgrep` (`semgrep-skills-semgrep`) | Escaneo estático: busca vulnerabilidades (inyecciones, secrets, malas prácticas) y crea reglas custom | Marketplace LobeHub |
| `security-review` | Checklist completo de seguridad (auth, input, XSS, CSRF, deps, etc.) | Repo GitHub `affaan-m/ECC` |

## Instalación (proyecto o máquina nueva)

Prerequisito, una vez por máquina:

```bash
brew install semgrep
```

Skills, parado en la carpeta del proyecto:

```bash
# semgrep (LobeHub). Las credenciales quedan registradas una vez por máquina.
npx -y @lobehub/market-cli skills install semgrep-skills-semgrep --agent claude-code

# security-review (GitHub)
npx skills add https://github.com/affaan-m/ECC --skill security-review
```

Se instalan en `.claude/skills/`. Reiniciá Claude Code para que las tome.

Para dejar la de semgrep global (disponible en todos tus proyectos), agregá `-g`:

```bash
npx -y @lobehub/market-cli skills install semgrep-skills-semgrep --agent claude-code -g
```

## Cómo escanear

```bash
# Escaneo rápido (reglas auto)
semgrep scan --config auto src

# Escaneo profundo (OWASP + Next + React + secrets)
semgrep scan --config p/security-audit --config p/owasp-top-ten \
  --config p/nextjs --config p/react --config p/secrets src

# Vulnerabilidades en dependencias
npm audit --omit=dev
```

## Checklist de seguridad

1. **Secrets**: en variables de entorno, nunca en el código. `.env` fuera de git. En Vercel para producción. Si una key se expone, rotarla.
2. **Validación de input**: schemas con `zod`. Para archivos: validar tamaño, tipo y extensión.
3. **SQL injection**: siempre el query builder de Supabase (parametrizado). Nunca concatenar SQL.
4. **Auth y autorización**: sesión en cookies httpOnly (no localStorage). Chequear rol antes de operaciones sensibles. El cliente service-role siempre detrás de un check de rol u ownership. RLS activo en todas las tablas.
5. **XSS**: sanitizar HTML de usuario. Sin `dangerouslySetInnerHTML` sin sanitizar. CSP con nonce en scripts.
6. **CSRF**: chequeo de `Origin` en las mutaciones (POST/PATCH/DELETE). Cookies con SameSite.
7. **Rate limiting**: en los endpoints que cuestan (IA, email, APIs pagas) para evitar abuso de costo.
8. **Exposición de datos**: no loguear secretos. Errores genéricos al cliente; el detalle solo en logs del server.
9. **Dependencias**: `npm audit`. Parchear transitivas con `overrides` en `package.json`.
   Al actualizar o agregar deps, esperar al menos una semana desde el publish de
   la versión nueva antes de adoptarla: los ataques de supply chain se detectan
   en horas o días, y las versiones recién publicadas son las riesgosas
   (chequear la fecha con `npm view <paquete> time`). Instalar siempre con
   `npm ci` cuando no se cambian deps. El `.npmrc` del repo tiene
   `ignore-scripts=true` para que ninguna dependencia ejecute código al
   instalarse; no borrarlo.
10. **Headers**: `X-Frame-Options: DENY`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

## Estado actual (auditoría del 2026-08-02, revalidada 2026-08-05)

- **2026-08-05**: verificado contra el supply chain attack de `keyv` y
  relacionados (4 de agosto). Ninguno de los paquetes comprometidos está en el
  lockfile ni en `node_modules`, cero hooks de `postinstall` en dependencias,
  lockfile 100% apuntando a `registry.npmjs.org`. Se agregó `.npmrc` con
  `ignore-scripts=true`.

- `npm audit`: **0 vulnerabilidades**.
- Semgrep (auto + OWASP + Next + React + secrets): **0 findings**.
- Implementado: CSP con nonce, CSRF por Origin, headers de hardening, errores
  genéricos al cliente, `zod` en feedback y email, `next` validado en el
  callback, regex del parser de noticias sin ReDoS, deps parcheadas
  (`sharp` >= 0.35.3, `postcss` >= 8.5.18).

### Pendiente

- **Rate limiting** en `/api/email-summary`, `/api/article`, `/api/followups`
  y `/api/preview-quotes`.
- **Rotar** cualquier key que se haya compartido en desarrollo.

## Variables de entorno requeridas

Solo los nombres (los valores van en `.env` local y en Vercel):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
FINNHUB_API_KEY
WORLD_NEWS_API_KEY
FRED_API_KEY
API_DATA_GOV_KEY          # OCC
USCIS_CLIENT_ID
USCIS_CLIENT_SECRET
USCIS_BASE
RESEND_API_KEY
EMAIL_FROM
COURTLISTENER_API_TOKEN   # opcional
CRON_SECRET               # opcional, cron de companies/sync
```
