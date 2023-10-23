import { useKyberSwapConfig } from 'state/application/hooks'
import KNUpdater from 'state/farms/classic/knUpdater'
import RPCUpdater from 'state/farms/classic/rpcUpdater'

export default function Updater({ isInterval = true }: { isInterval?: boolean }) {
  const { isEnableKNProtocol } = useKyberSwapConfig()
  return isEnableKNProtocol ? <KNUpdater isInterval={isInterval} /> : <RPCUpdater isInterval={isInterval} />
}
