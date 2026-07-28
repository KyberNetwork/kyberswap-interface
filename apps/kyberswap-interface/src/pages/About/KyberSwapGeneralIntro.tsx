import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'

import { ButtonPrimary } from 'components/Button'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

const KyberSwapGeneralIntro = () => {
  const { networkInfo } = useActiveWeb3React()
  const { trackingHandler } = useTracking()

  const renderKyberSwapIntroDEX = () => {
    return (
      <span className="text-center text-lg font-normal leading-7">
        <Trans>
          KyberSwap is a decentralized platform. We provide our traders with <b>superior token prices</b> by analyzing
          rates across thousands of exchanges instantly!
        </Trans>
      </span>
    )
  }

  const renderSwapNowButton = () => {
    return (
      <ButtonPrimary
        onClick={() => trackingHandler(TRACKING_EVENT_TYPE.ABOUT_SWAP_CLICKED)}
        as={Link}
        to={`${APP_PATHS.SWAP}/${networkInfo.route}?highlightBox=true`}
        className="w-[216px] rounded-[32px] px-3 py-2.5"
      >
        <Repeat size={20} />
        <span className="ml-2 text-sm">
          <Trans>Swap Now</Trans>
        </span>
      </ButtonPrimary>
    )
  }

  // Responsive via pure CSS (no useMedia branch) so the server and client render identically and the
  // prerendered About page hydrates without a mismatch. ≥768: tighter gap + wider padding.
  return (
    <div className="mt-8 flex w-full flex-col items-center gap-y-4 px-8 sm:gap-y-6 sm:px-16">
      {renderKyberSwapIntroDEX()}
      {renderSwapNowButton()}
    </div>
  )
}

export default KyberSwapGeneralIntro
