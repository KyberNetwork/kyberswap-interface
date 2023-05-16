import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'

import { SimplePopupProps } from 'components/Announcement/Popups/SimplePopup'
import { PRIVATE_ANN_TITLE } from 'components/Announcement/PrivateAnnoucement'
import { AnnouncementTemplateCrossChain, NotificationType, PrivateAnnouncementType } from 'components/Announcement/type'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { formatAmountBridge } from 'pages/Bridge/helpers'
import { CrossChainTab } from 'pages/CrossChain/TransfersHistory/TabSelector'
import { isCrossChainTxsSuccess } from 'pages/CrossChain/helpers'

const DescriptionCrossChain = (
  content: AnnouncementTemplateCrossChain,
  templateType: PrivateAnnouncementType,
): SimplePopupProps => {
  const { srcAmount, srcChainId, dstAmount, dstChainId, srcTokenSymbol, dstTokenSymbol, status } = content.transaction
  const chainId = Number(srcChainId) as ChainId
  const chainIdOut = Number(dstChainId) as ChainId
  const isSuccess = isCrossChainTxsSuccess(status)

  const srcChainName = NETWORKS_INFO[chainId].name
  const dstChainName = NETWORKS_INFO[chainIdOut].name
  const amountIn = formatAmountBridge(srcAmount)
  const amountOut = formatAmountBridge(dstAmount)

  return {
    title: PRIVATE_ANN_TITLE[templateType] ?? '',
    type: isSuccess ? NotificationType.SUCCESS : NotificationType.WARNING,
    link: `${APP_PATHS.CROSS_CHAIN}?tab=${CrossChainTab.HISTORY}`,
    summary: isSuccess
      ? t`${amountIn} ${srcTokenSymbol} on ${srcChainName} has been successfully swapped to ${amountOut} ${dstTokenSymbol} on ${dstChainName}`
      : t`There was an issue with swapping ${amountIn} ${srcTokenSymbol} on ${srcChainName} to ${amountOut} ${dstTokenSymbol} on ${dstChainName}. Your assets remain in your wallet`,
  }
}
export default DescriptionCrossChain
