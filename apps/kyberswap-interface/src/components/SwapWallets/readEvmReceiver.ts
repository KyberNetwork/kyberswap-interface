import type { Config, Connection } from '@wagmi/core'
import type { Connector } from 'wagmi'

import type { SwapWalletConnection } from './walletConnection'

const detachAppListeners = (connector: Connector, config: Config) => {
  const events = config._internal.events
  connector.emitter.off('connect', events.connect)
  connector.emitter.off('change', events.change)
  connector.emitter.off('disconnect', events.disconnect)
}

/** The app owns one active EVM connection. Parked receivers remain live outside its registry. */
export const selectEvmAppConnection = (config: Config, connection?: Connection) => {
  for (const retained of config.state.connections.values()) detachAppListeners(retained.connector, config)
  if (connection) {
    const { connector } = connection
    detachAppListeners(connector, config)
    connector.emitter.on('change', config._internal.events.change)
    connector.emitter.on('disconnect', config._internal.events.disconnect)
    // Boot restoration targets this id, not the connector uid in wagmi.store.
    // Persist only when promoted to the app; merely connecting a receiver must not change it.
    void config.storage?.setItem('recentConnectorId', connector.id)
  }
  config.setState(state => ({
    ...state,
    connections: connection ? new Map([[connection.connector.uid, connection]]) : new Map(),
    current: connection?.connector.uid ?? null,
    status: connection ? 'connected' : 'disconnected',
  }))
}

/** Header wallet changes must also park the old signer instead of leaving it as wagmi's disconnect fallback. */
export const watchEvmAppConnection = (config: Config) => {
  const retainCurrent = () => {
    if (config.state.status !== 'connected' || config.state.connections.size < 2) return
    const current = config.state.current && config.state.connections.get(config.state.current)
    if (current) selectEvmAppConnection(config, current)
  }
  retainCurrent()
  return config.subscribe(state => state.connections, retainCurrent)
}

export const evmConnection = (connector: Connector, config: Config, initial: Connection): SwapWalletConnection => {
  let session: Connection | undefined = initial
  return {
    family: 'evm',
    connector,
    id: connector.id,
    name: connector.name,
    icon: connector.icon ?? '',
    address: initial.accounts[0],
    getAddress: () => (config.state.connections.get(connector.uid) ?? session)?.accounts[0] || '',
    subscribe: listener => {
      const change = (data: { accounts?: readonly string[]; chainId?: number }) => {
        if (session) session = data.accounts?.length === 0 ? undefined : ({ ...session, ...data } as Connection)
        listener()
      }
      const disconnect = () => {
        session = undefined
        listener()
      }
      connector.emitter.on('change', change)
      connector.emitter.on('disconnect', disconnect)
      return () => {
        connector.emitter.off('change', change)
        connector.emitter.off('disconnect', disconnect)
      }
    },
    selectAppConnection: () => selectEvmAppConnection(config, config.state.connections.get(connector.uid) ?? session),
  }
}

/** Connecting the receiver creates a signing session without selecting the app wallet. */
export const readEvmReceiver = async (connector: Connector, config: Config): Promise<SwapWalletConnection[]> => {
  let session = config.state.connections.get(connector.uid)
  if (!session) {
    detachAppListeners(connector, config)
    // Leave app listeners detached on rejection too. The app deliberately disables
    // unsolicited connect events; a failed receiver request must not re-enable them.
    const data = await connector.connect()
    if (!data.accounts.length) throw new Error('No receiving address returned by the wallet')
    session = { ...data, accounts: data.accounts as Connection['accounts'], connector }
  }
  return [evmConnection(connector, config, session)]
}
