import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

export const ELASTIC_NOT_SUPPORTED: { [key: string]: string } = {
  [ChainId.AURORA]: t`Elastic is not supported on Aurora. Please switch to other chains`,
  [ChainId.ZKSYNC]: t`Elastic will be available soon`,
  // [ChainId.VELAS]: t`Elastic will be available soon`,
}

export enum VERSION {
  ELASTIC = 'elastic',
  CLASSIC = 'classic',
  ELASTIC_LEGACY = 'elastic-legacy',
}

export const TOBE_EXTENDED_FARMING_POOLS: string[] = []
