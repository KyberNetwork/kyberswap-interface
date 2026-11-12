import { Trans } from '@lingui/macro'
import { isAndroid, isIOS } from 'react-device-detect'

import METAMASK_ICON from 'assets/wallets-connect/metamask.svg'

// Store page shown alongside the mobile "Open MetaMask" deep link, for users without the app.
const METAMASK_STORE_URL = isAndroid
  ? 'https://play.google.com/store/apps/details?id=io.metamask'
  : isIOS
  ? 'https://apps.apple.com/app/metamask/id1438144202'
  : 'https://metamask.io/download/'

/** Shared mobile handoff; a user tap is required to open the MetaMask app. */
export const MetaMaskMobilePrompt = ({ link }: { link: string }) => (
  <div className="flex flex-col items-center gap-4 pb-1 pt-2 text-center">
    <img src={METAMASK_ICON} alt="MetaMask" className="size-12 rounded-lg" />
    <span className="text-sm text-subText">
      <Trans>Tap the button below to open the MetaMask app and approve the connection.</Trans>
    </span>
    <a
      href={link}
      className="w-full rounded-full bg-primary py-2 text-center text-base font-medium !text-darkText hover:brightness-110"
    >
      <Trans>Open MetaMask</Trans>
    </a>
    <a
      href={METAMASK_STORE_URL}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-subText underline"
    >
      <Trans>No MetaMask app yet? Install it</Trans>
    </a>
  </div>
)
