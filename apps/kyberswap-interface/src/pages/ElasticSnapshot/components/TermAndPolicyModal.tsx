import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'

import { ButtonEmpty, ButtonOutlined, ButtonPrimary } from 'components/Button'
import CheckBox from 'components/CheckBox'
import Modal from 'components/Modal'
import { TERM_FILES_PATH } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

export default function TermAndPolicyModal({
  isOpen,
  onDismiss,
  onOk,
}: {
  isOpen: boolean
  onDismiss: () => void
  onOk: () => void
}) {
  const theme = useTheme()
  const [accept1, setAccept1] = useState(false)
  const [accept2, setAccept2] = useState(false)
  const [accept3, setAccept3] = useState(false)
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth="800px" width="100%">
      <div className="relative flex w-full flex-col gap-6 bg-background p-5 text-justify text-sm leading-normal">
        <ButtonEmpty
          onClick={() => {
            onDismiss()
          }}
          width="36px"
          height="36px"
          padding="0"
          style={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <X color={theme.text} />
        </ButtonEmpty>

        <p className="text-center text-xl font-medium text-text">Terms and Conditions</p>

        <div className="flex cursor-pointer items-start gap-2" onClick={() => setAccept1(prev => !prev)} role="button">
          <CheckBox checked={accept1} />
          <p className="-mt-1">
            I understand that my participation in the [KyberSwap Elastic Exploit Grant Program] (“Grant Program”) will
            be subject to my completion of KYC screening to the satisfaction of KyberSwap and further subject to terms
            (“Terms of Grant”) to be published by KyberSwap, which Terms of Grant will include terms that require return
            of all or part of any grant to me pursuant to the Grant Program in the event of my full or partial recovery
            of assets taken from me in the KyberSwap Elastic Exploit.
          </p>
        </div>

        <div className="flex cursor-pointer items-start gap-2" onClick={() => setAccept2(prev => !prev)} role="button">
          <CheckBox checked={accept2} />
          <p className="-mt-1">
            I further understand that I will have to read and agree to the Terms of Grant as and when published before I
            will be eligible to be considered for or to receive any grant as KyberSwap may decide to extend to me
            pursuant to the Terms of Grant.
          </p>
        </div>

        <div className="flex cursor-pointer items-start gap-2" onClick={() => setAccept3(prev => !prev)} role="button">
          <CheckBox checked={accept3} />
          <p className="-mt-1">
            I acknowledge I have read and agree to the{' '}
            <ExternalLink href={TERM_FILES_PATH.PRIVACY_POLICY}>KyberSwap Privacy Policy</ExternalLink> which I agree
            will apply to any personal data provided by me in connection with the above mentioned KYC screening and my
            participation in the Grant Program.
          </p>
        </div>

        <div className="mt-4 flex gap-4">
          <ButtonOutlined onClick={onDismiss}>
            <Trans>Cancel</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            onClick={() => {
              if (accept1 && accept2 && accept3) onOk()
            }}
            disabled={!accept1 || !accept2 || !accept3}
          >
            Proceed with KYC
          </ButtonPrimary>
        </div>
      </div>
    </Modal>
  )
}
