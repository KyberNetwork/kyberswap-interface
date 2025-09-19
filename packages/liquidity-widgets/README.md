# Kyber Liquidity Widgets

The `@kyberswap/liquidity-widgets` package is an npm package of React components used to provide subsets of the Zap Protocol functionality in a small and configurable user interface element.
Demo: https://kyberswap.com/earn

## Installation
Install the widgets library via npm or yarn.

```
yarn add @kyberswap/liquidity-widgets
```

```
npm i --save @kyberswap/liquidity-widgets
```

## Usage
Example usage: https://github.com/KyberNetwork/kyberswap-widgets/blob/main/apps/liquidity-widgets-demo/src/App.tsx#L243

### Params

Property | Description | Type | Default Value
--- | --- | --- | --- |
poolAddress | address of pool to zap | string | Required
positionId | Optional, in case “Increasing Liquidity into an existing position”, pass the position id. The position should belong to the poolAddress. Otherwise, it considers as “Adding Liquidity into a new position” | number | undefined 
poolType | supported protocol | [PoolType](https://github.com/KyberNetwork/kyberswap-widgets/blob/main/packages/liquidity-widgets/src/schema/index.ts#L21-L39) | Required
chainId | network of selected pool | number | Required 
connectedAccount | current network that user connected. if not connect, address should be undefined | { address?: string, chainId: number } | Required
onClose | action when user close the widget | () => void | Required
onConnectWallet | action to trigger connect wallet | () => void | Required 
onSwitchChain | action to trigger switch chain if network of the pool is different with network from connected account | () => void | Required
onSubmitTx | trigger submit transaction (approval or zap). Should return the tx hash | (txData: {from: string, to: string, value: string, data: string, gasLimit: string}) => Promise<string> | Required
initDepositTokens | init tokens in to zap, list of address separate by "," | string | 
initAmounts | init amounts of tokens in, list of amount separate by "," | string | 
source | To identify the dapp that integrating with liquidity widget | string | 


## Migrate from version 0.0.16 to 1.x.x 
### Deprecated 
Property | Description | Type | Default Value
--- | --- | --- | --- |
<s>provider</s> | <s>Web3Provider to interact with blockchain</s> |  [Web3Provider](https://docs.ethers.org/v5/api/providers/) | undefined 
<s>onTxSubmit</s> | <s>Callback function when tx was submitted</s> | (txHash: string) => void |
### New 
Property | Description | Type | Default Value
--- | --- | --- | --- |
connectedAccount | Info of current account that user connect to your website | { address?: string, chainId: number } |  
onTxSubmit | Function that trigger tx | (txData: {from: string, to: string, value: string, data: string, gasLimit: string}) => Promise<string>  |
