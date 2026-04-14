# 🍽️ Foodify PWA - Documentación del Proyecto

Bienvenido al repositorio de la **Foodify Progressive Web App (PWA)**. Este proyecto es el núcleo frontend para que comensales y personal (meseros/admin) interactúen con el sistema de pedidos.

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js**: v18.x o superior.
- **npm**: v9.x o superior.

### Instalación Local
1. Clona este repositorio.
2. Navega a la carpeta del cliente: `cd pwa-client`.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Configura las variables de entorno:
   Crea un archivo `.env.local` con:
   ```env
   NEXT_PUBLIC_API_URL=http://3.142.73.52:3000/api/v1
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🏗️ Tecnología & Arquitectura

- **Framework**: [Next.js](https://nextjs.org/) (App Router).
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (Configuración estricta para Vercel).
- **Estilos**: Vanilla CSS Modules y CSS-in-JS (Styles dinámicos).
- **Estado Global**: React Context (Auth, Theme, Toast).
- **PWA**: `next-pwa` para soporte offline y manifiesto web.
- **Charts**: `recharts` para el panel administrativo.

### Estructura de Carpetas
- `/src/app`: Rutas del servidor y páginas.
- `/src/components`: UI components reutilizables (Botones, Modales, Skeletons).
- `/src/context`: Lógica de autenticación y temas.
- `/src/lib`: Clientes de API (Axios) y servicios de datos.
- `/src/types`: Definiciones de interfaces globales.

## 🚢 Despliegue en Vercel

El proyecto está configurado para despliegue automático desde GitHub.

### Configuración Crítica del Proxy
Debido a que el backend corre en **HTTP** y la PWA en **HTTPS**, el navegador bloquea las peticiones (Mixed Content). Hemos implementado un **Proxy de Vercel** en `next.config.ts`:

- Las peticiones van a `/api_proxy/*`.
- Vercel las redirige internamente a `http://3.142.73.52:3000/*`.
- **Resultado**: Conectividad segura y transparente desde cualquier dispositivo.

## 📋 Funcionalidades Actuales

1. **Módulo Para Llevar**: Menú dinámico, filtros por categoría y carrito de compras.
2. **Seguimiento de Órdenes**: Vista en tiempo real del progreso de la orden (Polling 5s).
3. **Módulo Administrador**: Reportes de ventas, gestión de pedidos y personal.
4. **Módulo Mesero**: Vista rápida de órdenes listas para entrega.
5. **Autenticación**: Sistema de roles (Admin, Mesero, Guest).

---

*Desarrollado con ❤️ por el equipo de Foodify.*
