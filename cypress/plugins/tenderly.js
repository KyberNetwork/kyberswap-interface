const axios = require('axios')
const { Interface } = require('@ethersproject/abi')

const Erc20ABI = require('./erc20.json')
const ZAP_ROUTER = '0x30c5322e4e08ad500c348007f92f120ab4e2b79e'

require('dotenv').config()
const { TENDERLY_USER, TENDERLY_PROJECT, TENDERLY_ACCESS_KEY } = process.env
const projectBase = `account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}`
const { FROM_WALLET_ADDRESS, NATIVE_TOKEN_ADDRESS, ROUTER_ADDRESS, BIG_AMOUNT, MAX_UINT } = require('./constants.js')
const erc20Interface = new Interface(Erc20ABI)

function getHolder(chainId, tokenAddress) {
  return FROM_WALLET_ADDRESS
}
const { StaticJsonRpcProvider, Provider } = require('@ethersproject/providers')

const anAxiosOnTenderly = () =>
  axios.create({
    baseURL: 'https://api.tenderly.co/api/v1',
    headers: {
      'X-Access-Key': TENDERLY_ACCESS_KEY || '',
      'Content-Type': 'application/json',
    },
  })

/**
 *
 * @param {number} chainId
 * @returns {uuid,uuid} forkId,lastTx
 */
async function createFork(chainId) {
  const tAxios = anAxiosOnTenderly()
  const resp = await tAxios.post(`${projectBase}/fork`, {
    network_id: chainId,
  })

  const forkId = resp.data.simulation_fork.id
  const lastTx = resp.data.root_transaction.id
  return { forkId, lastTx }
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

/*
 * @param {uuid} forkId
 * @param {SimulateParam} _params
 * @returns
 */
async function forkSimulate(forkId, _params) {
  try {
    const tAxios = anAxiosOnTenderly()

    const { data } = await tAxios.post(`${projectBase}/fork/${forkId}/simulate`, _params)

    const lastTx = data.simulation.id
    if (data.transaction.status) {
      this.lastTx = lastTx
      return {
        success: true,
        gasUsed: data.transaction.gas_used,
        tenderlyUrl: `https://dashboard.tenderly.co/${TENDERLY_USER}/${TENDERLY_PROJECT}/fork/${forkId}/simulation/${lastTx}`,
        // transaction: data.transaction,
        lastTx: lastTx,
      }
    } else {
      return {
        success: false,
        tenderlyUrl: `https://dashboard.tenderly.co/${TENDERLY_USER}/${TENDERLY_PROJECT}/fork/${forkId}/simulation/${lastTx}`,
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

const isObjectEmpty = objectName => {
  return objectName && Object.keys(objectName).length === 0 && objectName.constructor === Object
}

async function encodeState(chain, tokenIn) {
  try {
    if (tokenIn.toLowerCase() == NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      return {
        [`${FROM_WALLET_ADDRESS}`]: {
          balance: `${BIG_AMOUNT}`,
        },
      }
    } else {
      const tAxios = anAxiosOnTenderly()
      const stateOverridesPayload = await applyOverride(chain, tokenIn)
      if (isObjectEmpty(stateOverridesPayload)) {
        return {}
      } else {
        const encodeState = await tAxios
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

async function simulate(_params) {
  const tAxios = anAxiosOnTenderly()
  const resp = await tAxios.post(`${projectBase}/simulate`, _params)
  return resp.data.transaction
}

function allowTokenTransferProxyParams(tokenAddress, holderAddress, network) {
  // const tokenTransferProxy = generateConfig(network).tokenTransferProxyAddress;
  const router = '0x30C5322E4e08AD500c348007f92f120ab4E2b79e'
  return {
    from: holderAddress,
    to: tokenAddress,
    data: erc20Interface.encodeFunctionData('approve', [router, MAX_UINT]),
    value: '0',
  }
}

async function simulateTenderly(input) {
  const { data, to, chain, tokenIn, value } = input
  const state_objects = await encodeState(chain, tokenIn.toLowerCase())
  // const holder = isObjectEmpty(state_objects) ? FROM_WALLET_ADDRESS : getHolder(chain, tokenIn)
  const holder = '0xa843392198862f98d17e3aa1421b08f2c2020cff'

  let _params = {
    network_id: chain,
    from: holder,
    input: data,
    to: ZAP_ROUTER,
    gas: input.gas || 8000000,
    gas_price: '0',
    value: input.value || '0',
    save: true,
    state_objects: {},
  }

  const { forkId, lastTx } = await createFork(chain)
  let rootTx = lastTx
  /**
   * Fake allowance
   */
  if (tokenIn.toLowerCase() != NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    const allowTx = allowTokenTransferProxyParams(tokenIn, holder, 'arbitrum')
    // console.log(allowTx)

    const allowanceTx = await forkSimulate(forkId, {
      network_id: chain,
      from: holder,
      input: allowTx.data,
      to: allowTx.to,
      gas: input.gas || 8000000,
      gas_price: '0',
      root: rootTx,
      value: allowTx.value,
      save: true,
      state_objects: {},
    })
    if (!allowanceTx.success) console.log(allowanceTx.url)
    rootTx = allowanceTx.lastTx
    // console.log(allowanceTx)
  }

  if (tokenIn.toLowerCase() == NATIVE_TOKEN_ADDRESS.toLowerCase()) {
    _params.value = value
  }

  _params.root = rootTx

  // console.log(_params)
  return await forkSimulate(forkId, _params)
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
/**
 * This function use to get the name of two functions that are using
 * for fake allowance and balanceOf a token
 * @param {*} chainId
 * @param {*} contractAddress
 * @returns: override object
 */
async function applyOverride(chainId, contractAddress) {
  const tAxios = anAxiosOnTenderly()
  const balanceFns = ['balanceOf', 'balances', '_balances', 'shares']
  const allowanceFns = ['allowance', 'allowances', '_allowances', 'allowed']
  const overrideStorageObj = await tAxios
    .get(`https://api.tenderly.co/api/v1/public-contracts/${chainId}/${contractAddress}`)
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
        const allowanceStorage = addAllowance(FROM_WALLET_ADDRESS, ROUTER_ADDRESS, BIG_AMOUNT)
        const value = { ...balanceStorage, ...allowanceStorage }
        const overrides = {
          networkID: `${chainId}`,
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
module.exports = {
  simulateTenderly,
  getForkRpcUrl,
  estimateGas,
}
