# Kyber Liquidity Widgets

The `@kyberswap/pancake-liquidity-widgets` package is an npm package of React components used to provide subsets of the Zap Protocol functionality in a small and configurable user interface element.
Demo: https://pancake-liq-widget-demo.vercel.app/

## Installation
Install the widgets library via npm or yarn.

```
yarn add @kyberswap/pancake-liquidity-widgets
```

```
npm i --save @kyberswap/pancake-liquidity-widgets
```

## Usage
Example usage: https://github.com/KyberNetwork/kyberswap-widgets/blob/main/examples/pancake-demo/src/App.tsx#L116-L137

### Params

Property | Description | Type | Default Value
--- | --- | --- | --- |
source | To identify the dapp that integrating with liquidity widget | string | 
account | Current connected wallet | string | "" 
networkChainId | Current network chainId | number | Required
chainId | network of selected pool | number | Required 
poolAddress | address of pool to zap | string | Required 
positionId | Optional, in case “Increasing Liquidity into an existing position”, pass the position id. The position should belong to the poolAddress. Otherwise, it considers as “Adding Liquidity into a new position” | number | undefined 
initTickLower | init tick lower in case add liquidity into a new position | number | undefined 
initTickUpper | init tick upper in case add liquidity into a new position | number | undefined 
initDepositToken | init deposit token in. Use `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` in case it's native token | string | undefined 
initAmount | init amount in | number | undefined 
theme | matching with pancake theme. accept 'dark' or 'light' | string | dark
feeAddress | Wallet Address if you want to charge zap fee | string | undefined 
feePcm | fee percentage in per cent mille (0.001% or 1 in 100,000). Ignored if feeAddress is empty. From 0 to 100,000 inclusively. Example: 1 for 0.001%. | number | undefined 
includedSources | List of liquidty sources you want to include from your zap, separate by comma | [KyberSwap Aggregator Dex Ids](https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/dex-ids) | 
excludedSources | List of liquidty sources you want to exclude from your zap, separate by comma | [KyberSwap Aggregator Dex Ids](https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/dex-ids) | 
onDismiss | Callback function when click cancel or close widget | () => void | 
onTxSubmit | Callback function when tx was submitted  | (txHash: string) => void | 
onConnectWallet | function when user click connect wallet  | () => void | 
