import { connect as connectApp, createConfig, createConnector, createStorage } from '@wagmi/core'
import { http } from 'viem'
import { mainnet } from 'viem/chains'
import { expect, it, vi } from 'vitest'

import { evmConnection, readEvmReceiver, selectEvmAppConnection, watchEvmAppConnection } from './readEvmReceiver'

const sender = '0x0000000000000000000000000000000000000001' as const
const receiver = '0x0000000000000000000000000000000000000002' as const
const fixture = () => {
  const connect = vi.fn(async () => ({ accounts: [receiver], chainId: 1 }))
  const items = new Map<string, string>()
  const config = createConfig({
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
    storage: createStorage({
      storage: {
        getItem: key => items.get(key) ?? null,
        setItem: (key, value) => {
          items.set(key, value)
        },
        removeItem: key => {
          items.delete(key)
        },
      },
    }),
    multiInjectedProviderDiscovery: false,
    connectors: ['sender', 'receiver'].map(id =>
      createConnector(
        () =>
          ({
            id,
            name: id,
            type: 'mock',
            connect,
            disconnect: vi.fn(),
            getAccounts: async () => [receiver],
            getChainId: async () => 1,
            getProvider: async () => ({}),
            isAuthorized: async () => true,
            onAccountsChanged: vi.fn(),
            onChainChanged: vi.fn(),
            onDisconnect: vi.fn(),
          } as any),
      ),
    ),
  })
  const [a, b] = config.connectors
  const initial = { connector: a, accounts: [sender] as readonly [typeof sender], chainId: 1 }
  selectEvmAppConnection(config, initial)
  return { config, a, b, initial, connect }
}
it('parks a signing session outside wagmi and reverses without reconnecting', async () => {
  const { config, a, b, initial, connect } = fixture()
  const input = evmConnection(a, config, initial)
  const stopInput = input.subscribe(() => {})
  const [output] = await readEvmReceiver(b, config)
  const stopOutput = output.subscribe(() => {})
  expect(config.state.current).toBe(a.uid)
  expect(config.state.connections.has(b.uid)).toBe(false)
  if (output.family !== 'evm' || input.family !== 'evm') throw Error('Expected EVM')
  output.selectAppConnection()
  expect(config.state.current).toBe(b.uid)
  input.selectAppConnection()
  expect(config.state.current).toBe(a.uid)
  expect(connect).toHaveBeenCalledOnce()
  stopInput()
  stopOutput()
})
it('receiver changes and disconnect do not replace the app connection', async () => {
  const { config, a, b } = fixture()
  const [output] = await readEvmReceiver(b, config)
  const notify = vi.fn()
  const stop = output.subscribe(notify)
  b.emitter.emit('change', { accounts: [sender] })
  expect(output.getAddress()).toBe(sender)
  b.emitter.emit('disconnect')
  expect(output.getAddress()).toBe('')
  expect(config.state.current).toBe(a.uid)
  expect(notify).toHaveBeenCalledTimes(2)
  stop()
})
it('disconnecting the app never auto-selects the parked receiver', async () => {
  const { config, a, b } = fixture()
  const [output] = await readEvmReceiver(b, config)
  a.emitter.emit('disconnect')
  expect(config.state.current).toBe(null)
  expect(output.getAddress()).toBe(receiver)
})

it('parks the old app session when the header selects another wallet', async () => {
  const { config, a, b, initial } = fixture()
  const retained = evmConnection(a, config, initial)
  const stopSlot = retained.subscribe(() => {})
  const stopApp = watchEvmAppConnection(config)
  await connectApp(config, { connector: b })
  expect(config.state.connections.has(a.uid)).toBe(false)
  expect(retained.getAddress()).toBe(sender)
  b.emitter.emit('disconnect')
  expect(config.state.current).toBe(null)
  expect(retained.getAddress()).toBe(sender)
  stopSlot()
  stopApp()
})

it('keeps app auto-connect disabled after receiver rejection and permits an explicit retry', async () => {
  const { config, a, b, connect } = fixture()
  // Mirror the app policy: connector events may not select the app wallet.
  const detach = () => config.connectors.forEach(c => c.emitter.off('connect', config._internal.events.connect))
  detach()
  const stopPolicy = config.subscribe(state => state.connections, detach)
  const stopApp = watchEvmAppConnection(config)
  connect.mockRejectedValueOnce(new Error('Rejected'))
  await expect(readEvmReceiver(b, config)).rejects.toThrow('Rejected')
  b.emitter.emit('connect', { accounts: [receiver], chainId: 1 })
  expect(config.state.current).toBe(a.uid)
  expect(config.state.connections.has(b.uid)).toBe(false)
  await connectApp(config, { connector: b })
  expect(config.state.current).toBe(b.uid)
  stopPolicy()
  stopApp()
})

it('persists only the promoted EVM signer for boot restoration, including a reverse round trip', async () => {
  const { config, a, b, initial } = fixture()
  const input = evmConnection(a, config, initial)
  expect(await config.storage?.getItem('recentConnectorId')).toBe(a.id)
  const [output] = await readEvmReceiver(b, config)
  expect(await config.storage?.getItem('recentConnectorId')).toBe(a.id)
  if (input.family !== 'evm' || output.family !== 'evm') throw Error('Expected EVM')
  output.selectAppConnection()
  expect(config.state.current).toBe(b.uid)
  expect(await config.storage?.getItem('recentConnectorId')).toBe(b.id)
  input.selectAppConnection()
  expect(await config.storage?.getItem('recentConnectorId')).toBe(a.id)
  selectEvmAppConnection(config)
  expect(config.state.current).toBe(null)
  expect(await config.storage?.getItem('recentConnectorId')).toBe(a.id)
})
