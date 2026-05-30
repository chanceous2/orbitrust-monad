# Desplegar OrbiTrust en Vercel

Guía para publicar el frontend Next.js (y las API routes del relayer) en Vercel. El contrato en Monad Testnet se despliega aparte con `npm run deploy` desde tu máquina.

## Requisitos

- Cuenta en [Vercel](https://vercel.com)
- Repositorio Git (GitHub, GitLab o Bitbucket) **o** CLI de Vercel
- **MongoDB Atlas** (u otro cluster accesible desde internet) para login de vendedores y wallets custodiales
- Wallet de relayer con MON en Monad Testnet si querés gas patrocinado en producción

## 1. Verificar build local

```bash
npm install
npm run build
```

Si falla, corregí errores antes de subir a Vercel.

## 2. Subir el código

### Opción A — Git + import en Vercel (recomendado)

```bash
git init
git add .
git commit -m "Initial OrbiTrust"
# Creá un repo vacío en GitHub y:
git remote add origin https://github.com/TU_USUARIO/orbitrust.git
git push -u origin main
```

En [vercel.com/new](https://vercel.com/new) → **Import Project** → elegí el repo. Vercel detecta Next.js automáticamente:

| Campo | Valor |
| --- | --- |
| Framework Preset | Next.js |
| Build Command | `npm run build` (default) |
| Output Directory | *(vacío — Next.js)* |
| Install Command | `npm install` (default) |
| Root Directory | `.` |

### Opción B — CLI sin Git

```bash
npx vercel login
npx vercel          # primer deploy (preview)
npx vercel --prod   # producción
```

## 3. Variables de entorno en Vercel

En el proyecto → **Settings → Environment Variables**. Configurá al menos estas para **Production** (y Preview si querés probar ahí):

### Públicas (cliente)

| Variable | Ejemplo / notas |
| --- | --- |
| `NEXT_PUBLIC_ORBITRUST_CONTRACT_ADDRESS` | `0x34C02DCcC46A681bA78Cf8c02E3216FF6d298a8a` (o la de tu deploy; también sirve `lib/contract/deployment.json` en el repo) |
| `NEXT_PUBLIC_CHAIN_ID` | `10143` |
| `NEXT_PUBLIC_MONAD_RPC_URL` | `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_APP_URL` | `https://tu-proyecto.vercel.app` (URL final de producción) |

### Servidor — relayer y órdenes

| Variable | Notas |
| --- | --- |
| `RELAYER_PRIVATE_KEY` | Clave del pool que paga gas. **Solo en Vercel, nunca en el repo.** |
| `ORDER_TOKEN_SECRET` | 32 bytes hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `MONAD_RPC_URL` | `https://testnet-rpc.monad.xyz` |
| `SPONSORED_TX_DAILY_LIMIT` | Opcional, default `100` |
| `ORDER_TOKEN_TTL_DAYS` | Opcional, default `7` |

En Vercel **no uses** rutas `./data/*.json` para tenants/órdenes: el filesystem del runtime es efímero. Si no definís `TENANT_STORE_PATH` / `ORDER_STORE_PATH`, la app usa `/tmp/orbitrust/` (ver `lib/server/env.ts`). Eso permite escribir en serverless, pero **los datos no son duraderos** entre cold starts ni entre instancias — válido para demo corta; para producción migrá a Mongo/Postgres (v2.1 del README).

### Servidor — auth de vendedores

| Variable | Notas |
| --- | --- |
| `MONGODB_URI` | Connection string de Atlas (`mongodb+srv://...`) |
| `BETTER_AUTH_SECRET` | 32 bytes hex |
| `BETTER_AUTH_URL` | Misma URL que producción, ej. `https://tu-proyecto.vercel.app` |
| `SELLER_WALLET_SECRET` | Secreto distinto de `ORDER_TOKEN_SECRET` |

### No subir a Vercel

- `PRIVATE_KEY` (solo deploy local de contratos)
- Archivos `.env` locales

## 4. MongoDB Atlas

1. Creá un cluster y usuario con lectura/escritura.
2. **Network Access**: permití `0.0.0.0/0` (o los rangos IP de Vercel si preferís restringir).
3. Pegá `MONGODB_URI` en Vercel.

## 5. Relayer en testnet

1. Fundá la wallet del relayer en [faucet.monad.xyz](https://faucet.monad.xyz).
2. Poné `RELAYER_PRIVATE_KEY` en Vercel.
3. Tras el deploy, abrí `https://tu-proyecto.vercel.app/api/health` y confirmá que el relayer aparece configurado.

## 6. Better Auth y dominio

- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` deben coincidir con la URL de producción (sin barra final).
- Si usás dominio custom, actualizá ambas y el dominio en Vercel → **Settings → Domains**.

## 7. Qué funciona en Vercel vs local

| Funcionalidad | Vercel |
| --- | --- |
| Landing, dashboard UI, wagmi, lecturas on-chain | Sí |
| `/simulador` | Sí |
| Login vendedor + Mongo | Sí (con Atlas) |
| Gas patrocinado + magic links | Sí con relayer + secretos; stores en `/tmp` son **volátiles** |
| Deploy de contrato | No — corré `npm run deploy` en local |

## 8. Troubleshooting

- **Build falla en Vercel**: reproducí con `npm run build` local.
- **Auth redirect incorrecto**: revisá `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`.
- **Mongo timeout**: IP allowlist en Atlas.
- **Relayer off**: `/api/health` y variables `RELAYER_PRIVATE_KEY` + `ORDER_TOKEN_SECRET`.
- **Órdenes “desaparecen”**: esperable con JSON en `/tmp`; para persistencia real usá base de datos.

## 9. Dominio y redeploy

Cada push a la rama conectada dispara un deploy. Para producción manual: **Deployments → Redeploy** o `npx vercel --prod`.
