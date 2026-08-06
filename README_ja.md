# KyberSwapインターフェース

<!-- hy-mt2-i18n:start -->
[English](./README.md) | [中文](./README_zh-CN.md) | **日本語** | [Español](./README_es.md)
<!-- hy-mt2-i18n:end -->


KyberSwapインターフェースは、Kyber Networkの全製品群を統合したフロントエンドです。このモノレポにはすべてのKyberSwapフロントエンドプロジェクトが収められており、モジュール型で拡張性が高く、協力的な開発環境を実現しています。

- ウェブサイト: [kyberswap.com](https://kyberswap.com/)
- ドキュメント: [docs.kyberswap.com](https://docs.kyberswap.com/)

## 前提条件

- Node.js 18+
- pnpm（このリポジトリではpnpm workspacesが使用されています）

## KyberSwapインターフェースへのアクセス

KyberSwapインターフェースにアクセスするには、[kyberswap.com](https://kyberswap.com/)にアクセスしてください。

## 開発

### 依存関係のインストール

```bash
pnpm i
```

### パッケージのビルド

```bash
pnpm build-package
```

### 実行

```bash
cd apps/kyberswap-interface && pnpm start
```

### その他のアプリ

- Zap Widgetsデモ
  ```bash
  cd apps/zap-widgets-demo && pnpm dev
  ```
- Swap Widgets Reactデモ
  ```bash
  cd apps/swap-widgets-react-demo && pnpm dev
  ```
- Swap Widgets Next.jsデモ
  ```bash
  cd apps/swap-widgets-nextjs-demo && pnpm dev
  ```

### 一般的なスクリプト

- すべてをビルド: `pnpm build`
- リンティング: `pnpm lint`
- 型チェック: `pnpm type-check`

### モノレポのパッケージ

- Liquidity Widget: `packages/liquidity-widgets` — LP流動性の追加/増加（Zap In）
- Zap Out Widget: `packages/zap-out-widgets` — 単一トークンにLPを移行（Zap Out）
- Zap Migration Widget: `packages/zap-migration-widgets` — LPポジションの移行/再配置
- Pancake Liquidity Widget: `packages/pancake-liquidity-widgets` — PancakeSwap専用のZap In

インストール方法、使用法、プロパティ、例については、各パッケージのREADMEを参照してください。

## 貢献

**すべてのプルリクエストは`main`ブランチに対して提出してください。**
すべてのPRに対してCIチェックが実行されます。
