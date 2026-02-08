# 🚀 NicoCodeFlow Full-Stack Engine

**Automate your development with precision.**

NicoCodeFlow Skills es un "cerebro" modular de herramientas avanzadas diseñado para potenciar tu Agente de IA. Este ecosistema de scripts automatiza flujos de trabajo complejos, asegurando la generación de código robusto, escalable y estrictamente tipado para arquitecturas modernas Full-Stack.

---

## 📊 Vista Rápida

| Área | Skills | Categorías |
|------|--------|------------|
| **Backend** | 23 | API, Database, Security, Infrastructure, Logic, Testing, Scheduling, Integrations |
| **Frontend** | 19 | UI, Logic, Routing, Infrastructure, Testing |
| **Total** | **42 skills** | 13 categorías |

---

## 🏗️ Estructura del Ecosistema

```
skills/
├── 📦 backend/                    # NestJS + TypeORM
│   ├── api/                       # Recursos y documentación
│   │   ├── generate_nest_resource # Scaffolding CRUD completo
│   │   ├── rate_limit_setup       # Rate limiting con throttler
│   │   ├── swagger_doc_helper     # Documentación OpenAPI
│   │   └── versioning_manager     # Versionado de API
│   │
│   ├── database/                  # Persistencia
│   │   ├── entity_creator         # Entidades TypeORM con relaciones
│   │   └── migration_expert       # Migraciones seguras
│   │
│   ├── infrastructure/            # Infraestructura core
│   │   ├── cache_manager          # ✨ Redis/Memory caching
│   │   ├── email_service          # ✨ Nodemailer/SendGrid/Resend
│   │   ├── health_check_builder   # Health endpoints
│   │   ├── logger_provider        # Logging estructurado
│   │   └── websocket_gateway      # ✨ Socket.IO real-time
│   │
│   ├── integrations/              # ✨ Servicios externos
│   │   ├── google_oauth           # ✨ OAuth2 con Passport
│   │   └── s3_upload              # ✨ S3/R2/Supabase uploads
│   │
│   ├── logic/                     # Lógica de negocio
│   │   ├── file_upload_manager    # Uploads locales
│   │   ├── gemini_integration     # IA Generativa
│   │   └── mercado_pago_integration # Pagos LATAM
│   │
│   ├── scheduling/                # ✨ Tareas programadas
│   │   └── cron_job_scheduler     # ✨ @nestjs/schedule
│   │
│   ├── security/                  # Autenticación y autorización
│   │   ├── access_list_manager    # ACL management
│   │   ├── role_guard_generator   # RBAC Guards
│   │   └── token_blacklist        # JWT revocation
│   │
│   └── testing/                   # Testing backend
│       ├── e2e_test_builder       # Tests end-to-end
│       ├── load_test_config       # Tests de carga
│       └── unit_test_generator    # Tests unitarios Jest
│
├── 🎨 frontend/                   # React/Next.js
│   ├── infrastructure/            # Core frontend
│   │   ├── auth_guard             # Route protection
│   │   ├── auth_session_manager   # Clean Slate logout
│   │   ├── component_optimizer    # Performance tuning
│   │   └── theme_switcher         # ✨ Dark/light mode
│   │
│   ├── logic/                     # Hooks y estado
│   │   ├── analyze_hook_logic     # Análisis de hooks
│   │   ├── data_fetching          # React Query hooks
│   │   ├── form_factory           # Forms + Zod
│   │   └── infinite_scroll        # ✨ Infinite loading
│   │
│   ├── routing/                   # Navegación
│   │   ├── routing_master         # App Router config
│   │   ├── search_params_manager  # URL state
│   │   └── sitemap_generator      # SEO sitemaps
│   │
│   ├── testing/                   # Testing frontend
│   │   ├── component_test_builder # React Testing Library
│   │   ├── e2e_frontend_builder   # Playwright/Cypress
│   │   └── hook_test_generator    # Hook testing
│   │
│   └── ui/                        # Componentes visuales
│       ├── ai_copywriter_ui       # Generación de copy
│       ├── feedback_system        # Loading/error states
│       ├── responsive_ui          # Layouts responsivos
│       ├── shadcn_expert          # 🔧 Cards, Tables, Modals
│       ├── skeleton_loader        # ✨ Loading skeletons
│       ├── table_generator        # ✨ TanStack Tables
│       ├── toast_notification     # ✨ Sonner/react-hot-toast
│       └── ui_polish              # Micro-animaciones
│
└── types.ts                       # Tipos compartidos
```

*✨ = Nuevo | 🔧 = Mejorado*

---

## ⚡ Skills Destacadas

### 🔥 Nuevas Integraciones Backend

#### `websocket_gateway` - Real-time
```typescript
// Genera: Gateway + Guards + React Hook
{
  gatewayName: 'Chat',
  namespace: '/chat',
  events: [{ name: 'message', broadcast: true }],
  withAuth: true,
  withRooms: true
}
```

#### `email_service` - Notificaciones
```typescript
// Genera: Service + Templates + Queue support
{
  provider: 'nodemailer', // o 'sendgrid', 'resend'
  templateEngine: 'handlebars',
  includeTemplates: true,
  queueSupport: true
}
```

#### `cache_manager` - Performance
```typescript
// Genera: Module + Service + @Cacheable decorator
{
  cacheType: 'redis',
  defaultTTL: 3600,
  generateDecorator: true
}
```

### 🎨 Nuevos Componentes Frontend

#### `table_generator` - Data Tables
```typescript
// Genera: TanStack Table con todas las features
{
  tableName: 'UsersTable',
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true }
  ],
  withPagination: true,
  withSearch: true,
  withRowActions: true
}
```

#### `shadcn_expert` - Componentes UI (Mejorado)
```typescript
// Ahora genera código funcional completo
{
  componentType: 'data-table', // card, form, modal
  dataFields: ['Name', 'Email', 'Status'],
  includeActions: true,
  darkMode: true
}
```

---

## 🛠️ Guía de Instalación

**Paso 1: Clonar el repositorio**
```bash
git clone <repo-url>
cd skills
```

**Paso 2: Instalar dependencias**
```bash
npm install zod typescript ts-node
```

**Paso 3: Integración**
Copia la carpeta `skills/` en la raíz de tu proyecto o configúrala en el path de contexto de tu Agente.

---

## 🤖 Cómo Usar las Skills

Estas habilidades son invocadas por tu Agente de IA. Ejemplos:

> *"Genera un WebSocket gateway para chat con autenticación JWT"*

> *"Crea una tabla de productos con sorting y paginación"*

> *"Implementa un sistema de emails con templates para welcome y password reset"*

> *"Agrega caching Redis al endpoint de productos"*

---

## 💻 Tecnologías Soportadas

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
</p>

<p align="center">
  <strong>Tailwind CSS</strong> • <strong>Shadcn/UI</strong> • <strong>TanStack</strong> • <strong>Zod</strong> • <strong>Mercado Pago</strong> • <strong>AWS S3</strong> • <strong>Google OAuth</strong>
</p>

---

## 📈 Changelog

### v2.0.0 (2026-02-08)
**Backend:**
- ✨ `cache_manager` - Sistema de caching con Redis/Memory
- ✨ `websocket_gateway` - Real-time con Socket.IO
- ✨ `email_service` - Emails con templates y queues
- ✨ `cron_job_scheduler` - Tareas programadas
- ✨ `s3_upload` - Uploads a S3/R2/Supabase
- ✨ `google_oauth` - Autenticación OAuth2

**Frontend:**
- ✨ `table_generator` - TanStack Tables completas
- ✨ `toast_notification` - Sistema de notificaciones
- ✨ `theme_switcher` - Dark/light mode
- ✨ `skeleton_loader` - Loading states
- ✨ `infinite_scroll` - Scroll infinito
- 🔧 `shadcn_expert` - Reescrito completamente

### v1.0.0
- Release inicial con 28 skills

---

<p align="center">
  <strong>Built with ❤️ by NicoCodeFlow</strong>
</p>
