import { Trans } from '@lingui/macro'
import { Info, X } from 'react-feather'

import { ButtonConfirmed, ButtonOutlined } from 'components/Button'
import Modal from 'components/Modal'

type Props = {
  isOpen: boolean
  onClose?: () => void
  onConfirm?: () => void
}

const ElasticHackedModal = ({ isOpen, onClose, onConfirm }: Props) => {
  return (
    <Modal isOpen={isOpen} width="480px" maxWidth="unset">
      <div className="flex flex-col bg-background p-5">
        <div className="flex justify-end">
          <X onClick={onClose} className="size-5 cursor-pointer [&>*]:stroke-text" />
        </div>
        <div className="flex justify-center">
          <Info className="text-warning" size={64} />
        </div>
        <p className="m-0 mt-5 text-center text-base font-medium leading-6">
          <Trans>Attention</Trans>
        </p>
        <p className="m-0 mt-2 text-center text-sm leading-5 text-subText">
          <Trans>
            Adding liquidity to Elastic Pools and staking in Elastic Farms is temporarily unavailable. Kindly visit
            &quot;My Pool&quot; for prompt removal of your liquidity.
          </Trans>
        </p>

        <div className="mt-5 flex gap-4">
          <ButtonOutlined style={{ flex: 1, fontSize: '16px', padding: '10px' }} onClick={onClose}>
            <Trans>Close</Trans>
          </ButtonOutlined>
          <ButtonConfirmed style={{ fontSize: '16px', flex: 1, padding: '10px' }} onClick={onConfirm}>
            <Trans>Go to My Pool</Trans>
          </ButtonConfirmed>
        </div>
      </div>
    </Modal>
  )
}

export default ElasticHackedModal
