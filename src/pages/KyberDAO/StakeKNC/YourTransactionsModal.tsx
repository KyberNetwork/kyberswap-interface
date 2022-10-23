import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import 'react-device-detect'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { AutoColumn } from 'components/Column'
import CopyIcon from 'components/Icons/CopyIcon'
import LaunchIcon from 'components/Icons/LaunchIcon'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import Row, { RowBetween } from 'components/Row'
import { KNC_ADDRESS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useWindowSize } from 'hooks/useWindowSize'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { getTokenLogoURL } from 'utils'

const Wrapper = styled.div`
  width: 100%;
  padding: 20px;
`
const gridTemplate = `4fr 3.4fr 3.6fr 4fr`
const gridTemplateMobile = '1fr 1fr'
const TableWrapper = styled.div``
const TableHeader = styled.div`
  display: grid;
  grid-template-columns: ${gridTemplate};
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 8px 8px 0px 0px;
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`
const TableHeaderItem = styled.div<{ align?: 'left' | 'right' | 'center' }>`
  padding: 16px;
  text-transform: uppercase;
  font-size: 12px;
  text-align: ${({ align }) => align};
  ${({ theme }) => css`
    color: ${theme.subText};
  `}
`
const TableRow = styled.div`
  height: 55px;
  display: grid;
  grid-template-columns: ${gridTemplate};
  ${({ theme }) => css`
    border-bottom: 1px solid ${theme.border};
  `};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: ${gridTemplateMobile};
    height: 76px;
  `}
`
const TableCell = styled.div<{ justify?: 'flex-end' | 'flex-right' | 'center' }>`
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 3px;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  justify-content: ${({ justify }) => justify};
  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.subText};
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    justify-content: space-between;
    padding: 12px 0;
    &>*{
      flex:1;
    }
  `}
`
export default function YourTransactionsModal() {
  const theme = useTheme()
  const modalOpen = useModalOpen(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const toggleModal = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)
  const windowSize = useWindowSize()
  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={750} maxWidth={800}>
      <Wrapper>
        <AutoColumn gap="20px">
          <RowBetween>
            <Text fontSize={20}>
              <Trans>Your transactions</Trans>
            </Text>
            <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleModal}>
              <X onClick={toggleModal} size={20} color={theme.subText} />
            </Flex>
          </RowBetween>
          <TableWrapper>
            <TableHeader>
              <TableHeaderItem>
                <Trans>Transactions</Trans>
              </TableHeaderItem>
              <TableHeaderItem>
                <Trans>Action</Trans>
              </TableHeaderItem>
              <TableHeaderItem>
                <Trans>Time</Trans>
              </TableHeaderItem>
              <TableHeaderItem align="right">
                <Trans>Amount</Trans>
              </TableHeaderItem>
            </TableHeader>
            {windowSize.width && windowSize.width > 768 ? (
              <>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <img
                      src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                      alt="knc-logo"
                      width="24px"
                      height="24px"
                    />
                    <Text>0x9E6A...3651</Text>
                    <CopyIcon />
                    <LaunchIcon />
                  </TableCell>
                  <TableCell>
                    <Text>Vote</Text>
                  </TableCell>
                  <TableCell>
                    <AutoColumn>
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </AutoColumn>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>{' '}
              </>
            ) : (
              <>
                <TableRow>
                  <TableCell>
                    <Row gap="4px">
                      <img
                        src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                        alt="knc-logo"
                        width="24px"
                        height="24px"
                      />
                      <Text>Vote</Text>
                      <CopyIcon />
                      <LaunchIcon />
                    </Row>
                    <Row gap="4px">
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </Row>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Row gap="4px">
                      <img
                        src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                        alt="knc-logo"
                        width="24px"
                        height="24px"
                      />
                      <Text>Vote</Text>
                      <CopyIcon />
                      <LaunchIcon />
                    </Row>
                    <Row gap="4px">
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </Row>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Row gap="4px">
                      <img
                        src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                        alt="knc-logo"
                        width="24px"
                        height="24px"
                      />
                      <Text>Vote</Text>
                      <CopyIcon />
                      <LaunchIcon />
                    </Row>
                    <Row gap="4px">
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </Row>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Row gap="4px">
                      <img
                        src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                        alt="knc-logo"
                        width="24px"
                        height="24px"
                      />
                      <Text>Vote</Text>
                      <CopyIcon />
                      <LaunchIcon />
                    </Row>
                    <Row gap="4px">
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </Row>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Row gap="4px">
                      <img
                        src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`}
                        alt="knc-logo"
                        width="24px"
                        height="24px"
                      />
                      <Text>Vote</Text>
                      <CopyIcon />
                      <LaunchIcon />
                    </Row>
                    <Row gap="4px">
                      <Text color={theme.text}>16/10/2021</Text>
                      <Text color={theme.subText}>11:25:42</Text>
                    </Row>
                  </TableCell>
                  <TableCell>
                    <AutoColumn justify="flex-end" style={{ width: '100%' }}>
                      <Text color={theme.text}>300 KNC</Text>
                      <Text color={theme.subText}>- 2.32% Power</Text>
                    </AutoColumn>
                  </TableCell>
                </TableRow>
              </>
            )}
            <Pagination
              currentPage={3}
              onPageChange={e => console.log(e)}
              pageSize={10}
              totalCount={120}
              haveBg={false}
            />
          </TableWrapper>
        </AutoColumn>
      </Wrapper>
    </Modal>
  )
}
