# KyberSwap 接口

<!-- hy-mt2-i18n:start -->
[English](./README.md) | **中文** | [日本語](./README_ja.md) | [Español](./README_es.md)
<!-- hy-mt2-i18n:end -->


KyberSwap 接口是整个 Kyber 网络产品系列的统一前端界面。这个单仓库架构汇集了所有 KyberSwap 前端项目，从而打造出一个模块化、可扩展且便于协作的开发环境。

- 网站：[kyberswap.com](https://kyberswap.com/)
- 文档：[docs.kyberswap.com](https://docs.kyberswap.com/)

## 先决条件

- Node.js 18 及以上版本
- pnpm（该仓库使用 pnpm 工作空间）

## 访问 KyberSwap 接口

要访问 KyberSwap 接口，请前往 [kyberswap.com](https://kyberswap.com/)

## 开发

### 安装依赖项

```bash
pnpm i
```

### 构建打包包

```bash
pnpm build-package
```

### 运行程序

```bash
cd apps/kyberswap-interface && pnpm start
```

### 其他应用

- Zap Widgets 演示版
  ```bash
  cd apps/zap-widgets-demo && pnpm dev
  ```
- Swap Widgets React 演示版
  ```bash
  cd apps/swap-widgets-react-demo && pnpm dev
  ```
- Swap Widgets Next.js 演示版
  ```bash
  cd apps/swap-widgets-nextjs-demo && pnpm dev
  ```

### 常用脚本

- 构建所有项目：`pnpm build`
- 代码检查：`pnpm lint`
- 类型检查：`pnpm type-check`

### 单仓库中的打包包

- 流动性组件：`packages/liquidity-widgets` —— 添加/增加提供流动性资金（Zap In）
- 流动性提取组件：`packages/zap-out-widgets` —— 将提供流动性资金转换为一种代币（Zap Out）
- 流动性迁移组件：`packages/zap-migration-widgets` —— 迁移/调整提供流动性资金的位置
- PancakeSwap 流动性组件：`packages/pancake-liquidity-widgets` —— 专为 PancakeSwap 设计的 Zap In 功能

有关各打包包的安装、使用方法、属性及示例，可参考其对应的 README 文件。

## 贡献指南

**请将所有的拉取请求提交到 `main` 分支。**
所有拉取请求都会经过 CI 检测。
