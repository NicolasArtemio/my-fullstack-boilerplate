# 🚀 NicoCodeFlow Full-Stack Engine

**Automate your development with precision.**

NicoCodeFlow Skills es un "cerebro" modular de herramientas avanzadas diseñado para potenciar tu Agente de IA. Este ecosistema de scripts automatiza flujos de trabajo complejos, asegurando la generación de código robusto, escalable y estrictamente tipado para arquitecturas modernas Full-Stack.

---

## 🏗️ Estructura del Ecosistema

El núcleo está dividido estratégicamente para cubrir las dos áreas críticas del desarrollo moderno:

*   **`frontend/`**: Optimizado para **Next.js 14+**, **Shadcn/UI** y **Tailwind CSS**. Enfocado en componentes reactivos, Server/Client components y gestión de estado.
*   **`backend/`**: Diseñado para arquitecturas escalables en **NestJS**. Enfocado en seguridad, integridad de datos con **PostgreSQL/TypeORM** y lógica de negocio limpia.

---

## ⚡ Análisis por Batches

### 🎨 Frontend Skills
Herramientas para construir interfaces modernas y performantes.

*   **UI (`ui/`)**: Generación de componentes visuales impactantes utilizando los estándares de **Shadcn** y **Tailwind**.
*   **Logic (`logic/`)**: Automatización de hooks personalizados, validación de formularios complejas y gestión de estado global.
*   **Routing (`routing/`)**: Estructuración inteligente del **App Router** de Next.js, manejando layouts, loading states y error boundaries.
*   **Infrastructure (`infrastructure/`)**: Auditorías de performance, configuración de SEO dinámico, headers de seguridad y gestión de sesiones robusta (Clean Slate Logout).
*   **Testing (`testing/`)**: Creación rápida de tests unitarios y de integración para asegurar la estabilidad de la UI.

### ⚙️ Backend Skills
Herramientas para cimientos sólidos y seguros.

*   **API (`api/`)**: Scaffolding completo de Recursos NestJS (Controller, Service, Module) con DTOs validados automáticamente.
*   **Database (`database/`)**: Gestión de entidades **TypeORM**, verificación de relaciones y migraciones seguras.
*   **Security (`security/`)**: Implementación de guardias (Guards), estrategias RBAC (Roles), y manejo de **Token Blacklists**.
*   **Logic (`logic/`)**: Servicios de lógica de negocio pura, integración de pagos con **Mercado Pago** e integración con modelos de IA como **Gemini**.
*   **Infrastructure (`infrastructure/`)**: Implementación de Health Checks y system loggers estructurados.
*   **Testing (`testing/`)**: Generadores de tests E2E y unitarios para validar flujos críticos de negocio.

---

## 🛠️ Guía de Instalación

Sigue estos pasos para integrar este cerebro en tu flujo de trabajo:

**Paso 1: Clonar el repositorio**
Descarga la carpeta `skills` en tu máquina local.

**Paso 2: Instalar dependencias base**
Estas herramientas requieren un entorno de TypeScript funcional. Ejecuta en la raíz de tu carpeta de skills:

```bash
npm install zod typescript ts-node
```

**Paso 3: Integración**
Copia la carpeta completa `skills/` en la raíz de tu proyecto destino o configúrala en el path de contexto de tu Agente.

---

## 🤖 Cómo usar las Skills

Estas habilidades no se ejecutan manualmente. Son herramientas que tu Agente de IA debe invocar.

Para utilizarlas, simplemente da la instrucción a tu Agente en lenguaje natural o menciónalo específicamente si tu entorno lo soporta:

> *"@Antigravity genera un recurso de usuarios en el backend validando el email"*
>
> *"Usa la skill de UI para crear un componente de tarjeta con gradientes"*

El agente seleccionará la herramienta correcta de la carpeta `skills/` y ejecutará la lógica precisa.

---

## 💻 Tecnologías Soportadas

<p align="center">
  <strong>NestJS</strong> • <strong>Next.js</strong> • <strong>Tailwind CSS</strong> • <strong>Shadcn/UI</strong> • <strong>PostgreSQL</strong> • <strong>Gemini AI</strong> • <strong>Vitest/Jest</strong>
</p>
