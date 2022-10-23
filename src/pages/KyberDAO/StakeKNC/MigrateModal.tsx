import { Trans } from '@lingui/macro'
import React from 'react'
import { ArrowDown, X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { AutoRow, RowBetween } from 'components/Row'
import useTheme from 'hooks/useTheme'
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
          <CurrencyInputForStake token="KNCL" />
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
          <CurrencyInputForStake />
          <GasPriceExpandableBox />
          <ButtonPrimary>
            <Text fontSize={14}>
              <Trans>Migrate</Trans>
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
