# Interfaz de KyberSwap

<!-- hy-mt2-i18n:start -->
[English](./README.md) | [中文](./README_zh-CN.md) | [日本語](./README_ja.md) | **Español**
<!-- hy-mt2-i18n:end -->


La Interfaz de KyberSwap es la interfaz frontal unificada para todo el conjunto de productos de la red Kyber. Este monorepo alberga todos los proyectos frontales de KyberSwap, lo que permite contar con un entorno de desarrollo modular, escalable y colaborativo.

- Página web: [kyberswap.com](https://kyberswap.com/)
- Documentación: [docs.kyberswap.com](https://docs.kyberswap.com/)

## Requisitos previos

- Node.js 18+
- pnpm (el repositorio utiliza espacios de trabajo de pnpm)

## Acceder a la Interfaz de KyberSwap

Para acceder a la Interfaz de KyberSwap, visite [kyberswap.com](https://kyberswap.com/)

## Desarrollo

### Instalar dependencias

```bash
pnpm i
```

### Compilar paquetes

```bash
pnpm build-package
```

### Ejecutar

```bash
cd apps/kyberswap-interface && pnpm start
```

### Otras aplicaciones

- Demo de Zap Widgets
  ```bash
  cd apps/zap-widgets-demo && pnpm dev
  ```
- Demo de Swap Widgets React
  ```bash
  cd apps/swap-widgets-react-demo && pnpm dev
  ```
- Demo de Swap Widgets Next.js
  ```bash
  cd apps/swap-widgets-nextjs-demo && pnpm dev
  ```

### Scripts comunes

- Compilar todo: `pnpm build`
- Analizar formato: `pnpm lint`
- Verificar tipos: `pnpm type-check`

### Paquetes del monorepo

- Widget de liquidez: `packages/liquidity-widgets` — Añadir/aumentar la liquidez LP (Zap In)
- Widget Zap Out: `packages/zap-out-widgets` — Eliminar LP y convertirlo en un único token (Zap Out)
- Widget de migración Zap: `packages/zap-migration-widgets` — Migrar/reposicionar posiciones LP
- Widget de liquidez Pancake: `packages/pancake-liquidity-widgets` — Zap In específico para PancakeSwap

Consulte el README de cada paquete para obtener información sobre instalación, uso, propiedades y ejemplos.

## Contribuciones

**Por favor, abra todas las solicitudes de pull request contra la rama `main`.**
Se ejecutarán pruebas CI en todas las PR.
