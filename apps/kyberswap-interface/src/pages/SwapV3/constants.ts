export enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
  CROSS_CHAIN = 'cross_chain',
  CROSS_CHAIN_SOURCES = 'cross_chain_sources',
}

export type MainTab = TAB.SWAP | TAB.LIMIT | TAB.CROSS_CHAIN

export const isSettingTab = (tab: TAB) =>
  [TAB.INFO, TAB.SETTINGS, TAB.LIQUIDITY_SOURCES, TAB.CROSS_CHAIN_SOURCES].includes(tab)
