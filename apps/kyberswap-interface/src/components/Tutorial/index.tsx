import { Trans, t } from '@lingui/macro'
import React, { ReactNode, useState } from 'react'
import { X } from 'react-feather'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { ButtonEmpty } from 'components/Button'
import Modal from 'components/Modal'
import { MouseoverTooltip } from 'components/Tooltip'
import { ExternalLink } from 'theme'

export enum TutorialType {
  ELASTIC_POOLS = 'elastic_pools',
  ELASTIC_FARMS = 'elastic_farms',
  ELASTIC_MY_POOLS = 'elastic_my_pools',

  ELASTIC_ADD_LIQUIDITY = 'elastic_add_liquidity',
  ELASTIC_REMOVE_LIQUIDITY = 'elastic_remove_liquidity',
  ELASTIC_INCREASE_LIQUIDITY = 'ELASTIC_INCREASE_LIQUIDITY',
  CLASSIC_ADD_LIQUIDITY = 'CLASSIC_ADD_LIQUIDITY',
  CLASSIC_CREATE_POOL = 'CLASSIC_CREATE_POOL',

  CLASSIC_POOLS = 'classic_pools',
  CLASSIC_FARMS = 'classic_farms',
  CLASSIC_MY_POOLS = 'classic_my_pools',

  SWAP = 'swap',
  LIMIT_ORDER = 'limit_order',
}

interface Props {
  type: TutorialType
  customIcon?: ReactNode
  showTooltip?: boolean
}
const mapVideoId = {
  [TutorialType.ELASTIC_POOLS]: 'HCTI3pNDXIM',
  [TutorialType.CLASSIC_POOLS]: 'HCTI3pNDXIM',
  [TutorialType.ELASTIC_MY_POOLS]: 'gANTlasXStA',
  [TutorialType.CLASSIC_MY_POOLS]: 'gANTlasXStA',
  [TutorialType.ELASTIC_ADD_LIQUIDITY]: 'EyFOiR1httA',
  [TutorialType.ELASTIC_REMOVE_LIQUIDITY]: 'VE58XeRVXgQ',
  [TutorialType.ELASTIC_INCREASE_LIQUIDITY]: 'goMNh3hsjt4',
  [TutorialType.SWAP]: '1cW_IhT4_dw',
  [TutorialType.LIMIT_ORDER]: 'N9pLtZHjCuw',
  [TutorialType.ELASTIC_FARMS]: 'zvq62WtE_YA',
  [TutorialType.CLASSIC_FARMS]: 'FoQRGcf5tJc',
  [TutorialType.CLASSIC_CREATE_POOL]: 'wIMzSIKXUbs',
  [TutorialType.CLASSIC_ADD_LIQUIDITY]: '9Pudw0LqBQE',
}
export const getTutorialVideoId = (type: TutorialType) => {
  return mapVideoId[type] || ''
}

function Tutorial({ customIcon, type, showTooltip }: Props) {
  const [show, setShow] = useState(false)

  const title = (() => {
    switch (type) {
      case TutorialType.ELASTIC_POOLS:
        return <Trans>Navigating Pools Tutorial</Trans>
      case TutorialType.CLASSIC_POOLS:
        return <Trans>Navigating Pools Tutorial</Trans>

      case TutorialType.ELASTIC_FARMS:
        return <Trans>How to Farm Tutorial</Trans>
      case TutorialType.CLASSIC_FARMS:
        return <Trans>How to Farm Tutorial</Trans>

      case TutorialType.ELASTIC_MY_POOLS:
        return <Trans>Navigating My Pools Tutorial</Trans>
      case TutorialType.CLASSIC_MY_POOLS:
        return <Trans>Navigating My Pools Tutorial</Trans>
      default:
        return <Trans>Tutorial</Trans>
    }
  })()

  const subTitle = (() => {
    switch (type) {
      case TutorialType.CLASSIC_ADD_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to add liquidity to KyberSwap Classic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/Classic/guides/adding-liquidity-guide"> here</ExternalLink>
          </Trans>
        )

      case TutorialType.ELASTIC_ADD_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to add liquidity to KyberSwap Elastic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/creating-a-pool"> here</ExternalLink>
          </Trans>
        )

      case TutorialType.ELASTIC_INCREASE_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to increase liquidity to KyberSwap Elastic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/increase-liquidity"> here</ExternalLink>
          </Trans>
        )

      case TutorialType.ELASTIC_REMOVE_LIQUIDITY:
        return (
          <Trans>
            To learn more about how to remove liquidity on KyberSwap Elastic, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/remove-liquidity"> here</ExternalLink>
          </Trans>
        )

      default:
        return undefined
    }
  })()

  const videoId = getTutorialVideoId(type)

  return (
    <>
      {customIcon ? (
        <div className="flex items-center" onClick={() => setShow(true)}>
          <MouseoverTooltip text={t`Tutorial`} placement="top" width="fit-content" disableTooltip={!showTooltip}>
            {customIcon}
          </MouseoverTooltip>
        </div>
      ) : (
        <button
          onClick={() => setShow(true)}
          className="flex size-9 min-w-9 cursor-pointer items-center justify-center rounded-full border-none bg-subText-20 text-subText outline-none hover:bg-subText-40"
        >
          <MouseoverTooltip text={t`Tutorial`} placement="top" width="fit-content">
            <TutorialIcon />
          </MouseoverTooltip>
        </button>
      )}

      <Modal isOpen={show} onDismiss={() => setShow(false)} maxWidth="808px" maxHeight={80} minHeight={50}>
        <div className="flex w-full flex-col bg-background px-5 py-6">
          <div className="flex items-center justify-between">
            <span className="font-medium">{title}</span>

            <ButtonEmpty onClick={() => setShow(false)} width="36px" height="36px" padding="0">
              <X className="text-text" />
            </ButtonEmpty>
          </div>
          {subTitle && <p className="mb-4 mt-6 text-xs text-subText">{subTitle}</p>}
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </Modal>
    </>
  )
}

export default Tutorial
