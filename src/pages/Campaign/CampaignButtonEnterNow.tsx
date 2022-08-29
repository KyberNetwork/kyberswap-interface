import { Trans } from '@lingui/macro'
import axios from 'axios'
import { useCallback } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useSelector } from 'react-redux'

import { CAMPAIGN_BASE_URL } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { StyledPrimaryButton } from 'pages/Campaign/CampaignButtonWithOptions'
import { Dots } from 'pages/Pool/styleds'
import { AppState } from 'state'
import { useIsConnectedAccountEligibleForSelectedCampaign } from 'state/campaigns/hooks'

export default function CampaignButtonEnterNow() {
  const { account } = useActiveWeb3React()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const { executeRecaptcha } = useGoogleReCaptcha()

  // Create an event handler so you can call the verification on button click event or form submit
  const handleReCaptchaVerify = useCallback(async () => {
    if (!selectedCampaign || !account) return
    if (!executeRecaptcha) {
      console.log('Execute recaptcha not yet available')
      return
    }

    try {
      const token = await executeRecaptcha('enterCampaign')
      console.log(`token`, token)
      const response = await axios({
        method: 'POST',
        url: `${CAMPAIGN_BASE_URL}/${selectedCampaign.id}/eligible-users`,
        data: {
          token,
          address: account,
        },
      })
      if (response.status === 200) {
        console.log(`I'm here: Done`)
      }
    } catch (err) {
      console.error(err)
    }
  }, [account, executeRecaptcha, selectedCampaign])

  const isAccountEligible = useIsConnectedAccountEligibleForSelectedCampaign()
  const loading = isAccountEligible.loading

  return (
    <StyledPrimaryButton onClick={handleReCaptchaVerify} disabled={loading}>
      <Trans>Enter Now</Trans>
      {loading && <Dots />}
    </StyledPrimaryButton>
  )
}
