import { Trans } from '@lingui/macro'
import axios from 'axios'
import { useCallback, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useSelector } from 'react-redux'
import { mutate } from 'swr'

import { CAMPAIGN_BASE_URL, SWR_KEYS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { StyledPrimaryButton } from 'pages/Campaign/CampaignButtonWithOptions'
import { Dots } from 'pages/Pool/styleds'
import { AppState } from 'state'
import { useRegisterCampaignModalToggle } from 'state/application/hooks'

export default function CampaignButtonEnterNow({ size }: { size: 'small' | 'large' }) {
  const { account } = useActiveWeb3React()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const { executeRecaptcha } = useGoogleReCaptcha()

  const [loading, setLoading] = useState(false)

  const { selectedCampaignLeaderboardPageNumber, selectedCampaignLeaderboardLookupAddress } = useSelector(
    (state: AppState) => state.campaigns,
  )

  const toggleRegisterCampaignModal = useRegisterCampaignModalToggle()

  // Create an event handler so you can call the verification on button click event or form submit
  const handleReCaptchaVerify = useCallback(async () => {
    if (!selectedCampaign || !account) return
    if (!executeRecaptcha) {
      console.log('Execute recaptcha not yet available')
      return
    }

    try {
      setLoading(true)
      const token = await executeRecaptcha('enterCampaign')
      console.log(`token`, token)
      const response = await axios({
        method: 'POST',
        url: `${CAMPAIGN_BASE_URL}/${selectedCampaign.id}/participants`,
        data: {
          token,
          address: account,
        },
      })
      if (response.status === 200) {
        await mutate([SWR_KEYS.getListCampaign, account])
        toggleRegisterCampaignModal()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [account, executeRecaptcha, selectedCampaign, toggleRegisterCampaignModal])

  return (
    <StyledPrimaryButton onClick={handleReCaptchaVerify} disabled={loading} size={size}>
      <Trans>Enter Now</Trans>
      {loading && <Dots />}
    </StyledPrimaryButton>
  )
}
