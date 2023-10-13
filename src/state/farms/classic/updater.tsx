// import { useKyberSwapConfig } from 'state/application/hooks'
import KNUpdater from 'state/farms/classic/knUpdater'
import RPCUpdater from 'state/farms/classic/rpcUpdater'

export default function Updater({ isInterval = true }: { isInterval?: boolean }) {
  // const { isEnableKNProtocol } = useKyberSwapConfig() // todo namgold: revert
  const isEnableKNProtocol = true
  return isEnableKNProtocol ? <KNUpdater isInterval={isInterval} /> : <RPCUpdater isInterval={isInterval} />
}
