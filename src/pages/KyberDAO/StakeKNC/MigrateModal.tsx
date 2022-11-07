import { Trans, t } from '@lingui/macro'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { IOSView } from 'react-device-detect'
import { ArrowDown, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import { KNCL_ADDRESS, KNC_ADDRESS } from 'constants/index'
import { useKyberDaoStakeActions } from 'hooks/kyberdao'
import useTheme from 'hooks/useTheme'
import useTokenBalance from 'hooks/useTokenBalance'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

import CurrencyInputForStake from './CurrencyInputForStake'
import GasPriceExpandableBox from './GasPriceExpandableBox'

const Wrapper = styled.div`
  padding: 24px;
`

export default function MigrateModal() {
  const theme = useTheme()
  const modalOpen = useModalOpen(ApplicationModal.MIGRATE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  const { migrate } = useKyberDaoStakeActions()
  const [value, setValue] = useState('1')
  const [error, setError] = useState('')
  const oldKNCBalance = useTokenBalance(KNCL_ADDRESS)
  useEffect(() => {
    setError('')
  }, [value])
  const handleMigrate = () => {
    setError('')
    if (!oldKNCBalance.value.gte(parseUnits(value, 18))) {
      setError(t`Insufficient KNCL balance!`)
      return
    }
    try {
      migrate(parseUnits(value, 18))
    } catch (error) {
      setError(error)
    }
  }
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={664} maxWidth={420}>
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <Text fontSize={20} color={theme.text}>
              <Trans>KNC Migration</Trans>
            </Text>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <Text fontSize={12} lineHeight="16px" color={theme.subText}>
            <Trans>
              Click Migrate to start the migration process from KNC Legacy to the new KNC. You will receive the new KNC
              tokens in your wallet once the transaction has been confirmed. Conversion rate is 1:1. Read about the KNC
              migration <Text style={{ display: 'inline', color: theme.primary }}>here ↗</Text>
            </Trans>
          </Text>
          <CurrencyInputForStake value={value} setValue={setValue} tokenAddress={KNCL_ADDRESS} tokenName="KNCL" />
          <RowBetween>
            <Text fontSize={12} color={theme.subText}>
              1KNCL = 1KNC
            </Text>
            <AutoRow
              style={{
                height: '44px',
                width: '44px',
                borderRadius: '50%',
                background: theme.buttonBlack,
                padding: '10px',
              }}
            >
              <ArrowDown />
            </AutoRow>
          </RowBetween>
          <CurrencyInputForStake
            value={value}
            setValue={setValue}
            tokenAddress={KNC_ADDRESS}
            tokenName="KNC"
            disabled
          />
          <GasPriceExpandableBox />
          {error && (
            <Text color={theme.red} fontSize={14}>
              {error}
            </Text>
          )}
          <ButtonPrimary onClick={handleMigrate}>
            <Text fontSize={14}>
              <Trans>Migrate</Trans>
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
