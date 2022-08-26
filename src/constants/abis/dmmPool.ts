import { DMMPool } from '@namgold/ks-sdk-classic'
import { Interface } from 'ethers/lib/utils'

const DMM_POOL_INTERFACE = new Interface(DMMPool.abi)

export default DMM_POOL_INTERFACE
