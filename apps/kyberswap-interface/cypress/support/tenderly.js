const axios = require('axios')
const { Interface } = require('@ethersproject/abi')
const { StaticJsonRpcProvider } = require('@ethersproject/providers')
require('dotenv').config()

const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env
const {
  FROM_WALLET_ADDRESS,
  NATIVE_TOKEN_ADDRESS,
  ZAP_ROUTER_ADDESS,
  BIG_AMOUNT,
  MAX_UINT,
  Holders,
} = require('./constants.js')

const projectBase = `account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}`

const KSZapABI = require('./KSZAPRouterABI.json')
const Erc20ABI = require('./erc20.json')
const { Console } = require('console')
const erc20Interface = new Interface(Erc20ABI)
const ksZapRouterInterface = new Interface(KSZapABI)

const anAxiosOnTenderly = () =>
  axios.create({
    baseURL: 'https://api.tenderly.co/api/v1',
    headers: {
      'X-Access-Key': TENDERLY_ACCESS_KEY || '',
      'Content-Type': 'application/json',
    },
  })
class TenderlySimulation {
  maxGasLimit = 80000000
  constructor() {}
  async setup(chainId) {
    this.chainId = chainId
    const tAxios = anAxiosOnTenderly()
    const resp = await tAxios.post(`${projectBase}/fork`, {
      network_id: chainId,
    })

    const forkId = resp.data.simulation_fork.id
    const lastTx = resp.data.root_transaction.id
    this.forkId = forkId
    this.lastTx = lastTx
    this.tAxios = anAxiosOnTenderly()
  }

  async applyOverride(contractAddress) {
    const balanceFns = ['balanceOf', 'balances', '_balances', 'shares']
    const allowanceFns = ['allowance', 'allowances', '_allowances', 'allowed']
    const overrideStorageObj = await this.tAxios
      .get(`https://api.tenderly.co/api/v1/public-contracts/${this.chainId}/${contractAddress}`)
      .then(response => {
        if ('states' in response.data.data) {
          let fns = response.data.data.states.map(state => state.name)
          const allowanceFnName = getMatch(allowanceFns, fns)
          const balanceFnName = getMatch(balanceFns, fns)

          if (allowanceFnName.length == 0) {
            throw new Error('Cannot find allowance method name for token ' + contractAddress)
          }
          if (balanceFnName.length == 0) {
            throw new Error('Cannot find balance method name for token ' + contractAddress)
          }

          const addBalance = constructAddBalanceFn(balanceFnName[0])
          const addAllowance = constructAddBAllowanceFn(allowanceFnName[0])

          const balanceStorage = addBalance(FROM_WALLET_ADDRESS, BIG_AMOUNT)
          const allowanceStorage = addAllowance(FROM_WALLET_ADDRESS, ZAP_ROUTER_ADDESS, BIG_AMOUNT)
          const value = { ...balanceStorage, ...allowanceStorage }
          const overrides = {
            networkID: `${this.chainId}`,
            stateOverrides: {
              [`${contractAddress}`]: {
                value: value,
              },
            },
          }
          return overrides
        } else {
          return {}
        }
      })
    return overrideStorageObj
  }
  async encodeState(tokenIn) {
    try {
      if (tokenIn.toLowerCase() == NATIVE_TOKEN_ADDRESS.toLowerCase()) {
        return {
          [`${FROM_WALLET_ADDRESS}`]: {
            balance: `${BIG_AMOUNT}`,
          },
        }
      } else {
        const stateOverridesPayload = await this.applyOverride(tokenIn)
        if (isObjectEmpty(stateOverridesPayload)) {
          return {}
        } else {
          const encodeState = await this.tAxios
            .post(`${projectBase}/contracts/encode-states`, stateOverridesPayload)
            .catch(function (error) {
              console.log('Tenderly_generate_override_storage', error)
            })

          return Object.keys(encodeState.data.stateOverrides).reduce((acc, contract) => {
            const _storage = encodeState.data.stateOverrides[contract].value
            acc[contract] = {
              storage: _storage,
            }
            return acc
          }, {})
        }
      }
    } catch (e) {
      console.log(`TenderlySimulation_encode-states:`, e.response.data.error.message)
      return {}
    }
  }

  async simulate(params, stateOverrides = {}) {
    let _params = {
      network_id: this.chainId,
      from: params.from,
      to: params.to,
      save: true,
      root: this.lastTx,
      value: params.value || '0',
      gas: this.maxGasLimit,
      input: params.data,
      state_objects: {},
    }
    try {
      if (stateOverrides) {
        _params.state_objects = stateOverrides
      }
      const { data } = await this.tAxios.post(`${projectBase}/fork/${this.forkId}/simulate`, _params)
      const lastTx = data.simulation.id
      if (data.transaction.status) {
        this.lastTx = lastTx
        return {
          success: true,
          gasUsed: data.transaction.gas_used,
          tenderlyUrl: `https://dashboard.tenderly.co/${TENDERLY_USER}/${TENDERLY_PROJECT}/fork/${this.forkId}/simulation/${lastTx}`,
          // transaction: data.transaction,
        }
      } else {
        return {
          success: false,
          tenderlyUrl: `https://dashboard.tenderly.co/${TENDERLY_USER}/${TENDERLY_PROJECT}/fork/${this.forkId}/simulation/${lastTx}`,
          error: `Simulation failed: ${data.transaction.error_info.error_message} at ${data.transaction.error_info.address}`,
        }
      }
    } catch (e) {
      console.error(`TenderlySimulation_simulate:`, e)
      return {
        success: false,
        tenderlyUrl: '',
      }
    }
  }
}

const getForkRpcUrl = async chainId => {
  const RPCs = {
    1101: process.env.POLYGON_ZKEVM_NODE_URL,
    59144: process.env.LINEA_NODE_URL,
    8453: process.env.BASE_NODE_URL,
    137: process.env.POLYGON_NODE_URL,
    534352: process.env.SCROLL_NODE_URL,
    42161: process.env.ARBITRUM_NODE_URL,
  }
  const rpcUrl = RPCs[chainId] ?? (await createFork(chainId))
  return rpcUrl
}

const isObjectEmpty = objectName => {
  return objectName && Object.keys(objectName).length === 0 && objectName.constructor === Object
}

function allowTokenTransferProxyParams(tokenAddress, holderAddress, routerAddress) {
  return {
    from: holderAddress,
    to: tokenAddress,
    data: erc20Interface.encodeFunctionData('approve', [routerAddress, MAX_UINT]),
    value: '0',
  }
}

async function simulateTenderly(input) {
  const { data, chainId, tokenIn } = input
  // Holders[chainId]
  // const holder = '0xa843392198862f98d17e3aa1421b08f2c2020cff'

  const ts = new TenderlySimulation()
  await ts.setup(chainId)
  const stateOverrideObj = await ts.encodeState(tokenIn)
  let holder = FROM_WALLET_ADDRESS

  /**
   * Some token cannot find allowance and balance function to override state,
   * so this step will finding the holder via scanner
   * then fake allowance for kyber router
   */
  if (isObjectEmpty(stateOverrideObj)) {
    holder = Holders[chainId][tokenIn]
    if (tokenIn.toLowerCase() != NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      const allowParams = allowTokenTransferProxyParams(tokenIn, holder, ZAP_ROUTER_ADDESS)
      const allowanceTx = await ts.simulate({
        from: holder,
        ...allowParams,
      })
      if (!allowanceTx.success) console.log(allowanceTx.url)
    }
  }

  let zapInParams = {
    from: holder,
    data: data,
    to: ZAP_ROUTER_ADDESS,
    value: input.value || '0',
  }

  return await ts.simulate(zapInParams, stateOverrideObj)
}

function getMatch(a, b) {
  var matches = []
  for (var i = 0; i < a.length; i++) {
    for (var e = 0; e < b.length; e++) {
      if (a[i] === b[e]) matches.push(a[i])
    }
  }
  return matches
}

function constructAddBalanceFn(varName) {
  return (address, amount) => {
    return {
      [`${varName}[${address}]`]: amount,
    }
  }
}

function constructAddBAllowanceFn(varName) {
  return (address, spender, amount) => {
    return {
      [`${varName}[${address}][${spender}]`]: amount,
    }
  }
}
async function estimateGas(input) {
  const rpc = await getForkRpcUrl(input.chain)
  const provider = new StaticJsonRpcProvider(rpc, Number(input.chain))
  let txObject = {
    from: input.to,
    data: input.encodedSwapData,
    value: 0,
    to: input.routerAddress,
  }

  try {
    const result = await provider.estimateGas(txObject)
    return {
      success: true,
      gasUsed: result.toNumber().toString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error,
    }
  }
}

function getTokenInFromZapEncodeData(zapInData) {
  let funcSig = zapInData['data'].slice(0, 10)
  switch (funcSig) {
    case '0x0779b145':
      return NATIVE_TOKEN_ADDRESS
    case '0xbea67258':
      let decode = ksZapRouterInterface.decodeFunctionData('zapIn', zapInData['data'])
      const tokenInAddress = decode[0][1]
      return tokenInAddress
    default:
      throw 'function selector'
  }
}
module.exports = {
  simulateTenderly,
  getForkRpcUrl,
  estimateGas,
  getTokenInFromZapEncodeData,
}
