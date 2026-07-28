import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Trash, X } from 'react-feather'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'

type Props = {
  disabled: boolean
  onClear: () => Promise<any>
  notificationName: string | undefined
}
const DeleteAllAlertsButton: React.FC<Props> = ({ onClear, disabled, notificationName }) => {
  const { account } = useActiveWeb3React()
  const [isModalOpen, setModalOpen] = useState(false)

  const [isLoading, setLoading] = useState(false)

  const handleClickDeleteAll = async () => {
    if (isLoading) {
      return
    }
    try {
      setLoading(true)
      await onClear()
    } catch (e) {
      console.error(e)
    }
    setModalOpen(false)
  }

  const handleDismiss = () => {
    setModalOpen(false)
  }

  useEffect(() => {
    if (!account) {
      setModalOpen(false)
    }
  }, [account])

  return (
    <>
      <ButtonEmpty
        className="h-6 w-20 gap-1 whitespace-nowrap p-0 text-red"
        onClick={() => {
          setModalOpen(true)
        }}
        disabled={isLoading || disabled}
      >
        <Trash size="16px" /> <Trans>Clear All</Trans>
      </ButtonEmpty>

      <Modal isOpen={isModalOpen} onDismiss={handleDismiss} minHeight={false} maxWidth={400}>
        <div className="m-0 flex w-full flex-col gap-5 p-6">
          <RowBetween>
            <span className="text-xl font-normal">
              <Trans>Delete all {notificationName}</Trans>
            </span>
            <X onClick={handleDismiss} className="cursor-pointer text-subText" />
          </RowBetween>

          <span className="text-sm text-subText">
            <Trans>Are you sure you want to delete all {notificationName}?</Trans>
          </span>

          <div className="flex items-center gap-4">
            <ButtonPrimary
              borderRadius="24px"
              height="36px"
              flex="1 1 100%"
              onClick={handleDismiss}
              disabled={isLoading}
            >
              <Trans>No, go back</Trans>
            </ButtonPrimary>

            <ButtonOutlined
              borderRadius="24px"
              height="36px"
              flex="1 1 100%"
              onClick={handleClickDeleteAll}
              disabled={isLoading}
            >
              {t`Delete all`}
            </ButtonOutlined>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DeleteAllAlertsButton
