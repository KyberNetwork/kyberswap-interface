import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import { RowBetween } from 'components/Row'
import { HStack, Stack } from 'components/Stack'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useEligibleTransactions } from 'hooks/kyberdao'
import { HeaderCell, Table, TableHeader, TableRow } from 'pages/KyberDAO/KNCUtility/TxTable'
import { KyberDAOModalCloseButton } from 'pages/KyberDAO/common'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

const EligibleTxModalContent = ({ closeModal }: { closeModal: () => void }) => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const [currentPage, setCurrentPage] = useState(1)
  const eligibleTxs = useEligibleTransactions(currentPage, 10)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <Modal isOpen onDismiss={closeModal} maxWidth="800px" width="70vw">
      <Stack className="w-full min-w-[550px] gap-4 rounded-2xl bg-tableHeader p-6 max-xs:min-w-0">
        <Stack className="gap-8">
          <RowBetween>
            <span className="text-xl font-medium">
              <Trans>Your transactions</Trans>
            </span>
            <KyberDAOModalCloseButton onClick={closeModal} />
          </RowBetween>
          <Table>
            <TableHeader>
              <HeaderCell>
                <Trans>TXN HASH</Trans>
              </HeaderCell>
              {upToExtraSmall ? null : (
                <>
                  <HeaderCell>
                    <Trans>LOCAL TIME</Trans>
                  </HeaderCell>
                  <HeaderCell>
                    <Trans>GAS FEE</Trans>
                  </HeaderCell>
                </>
              )}
              <HeaderCell textAlign="right">
                <Trans>GAS REFUND REWARDS</Trans>
              </HeaderCell>
            </TableHeader>
            {eligibleTxs?.transactions?.map(tx => {
              const time = new Date(tx.timestamp * 1000)
              return (
                <TableRow key={tx.tx}>
                  <HeaderCell>
                    <HStack className="gap-2">
                      <div className="flex items-center justify-center bg-transparent max-md:items-end [&>img]:size-4 [&>span]:size-4">
                        <img src={networkInfo.icon} />
                      </div>
                      <span className="self-center text-sm font-normal">
                        {tx.tx.slice(0, 6)}...{tx.tx.slice(-4)}
                      </span>
                      <CopyHelper toCopy={tx.tx} margin="unset" className="text-subText" />
                      <ExternalLinkIcon
                        href={getEtherscanLink(chainId, tx.tx, 'transaction')}
                        className="text-subText"
                      />
                    </HStack>
                  </HeaderCell>
                  {upToExtraSmall ? null : (
                    <>
                      <HeaderCell>
                        <Stack className="gap-2">
                          <span>{time.toLocaleDateString()}</span>
                          <span className="font-normal text-subText">{time.toLocaleTimeString()}</span>
                        </Stack>
                      </HeaderCell>
                      <HeaderCell>
                        <Stack className="gap-2">
                          <span>
                            {formatDisplayNumber(tx.gasFeeInNativeToken, { significantDigits: 6 })}{' '}
                            {NativeCurrencies[chainId].symbol}
                          </span>
                          <span className="font-normal text-subText">
                            {formatDisplayNumber(tx.gasFeeInUSD, { style: 'currency', significantDigits: 6 })}
                          </span>
                        </Stack>
                      </HeaderCell>
                    </>
                  )}

                  <HeaderCell textAlign="right">
                    <Stack className="gap-2">
                      <span>{formatDisplayNumber(tx.gasRefundInKNC, { significantDigits: 6 })} KNC</span>
                      <span className="font-normal text-subText">
                        <Trans>Tier {tx.userTier}</Trans> - {Number(tx.gasRefundPercentage) * 100}%
                      </span>
                    </Stack>
                  </HeaderCell>
                </TableRow>
              )
            })}
          </Table>
        </Stack>
        <Pagination
          onPageChange={setCurrentPage}
          totalCount={(eligibleTxs?.pagination.pageSize ?? 0) * (eligibleTxs?.pagination.totalOfPages ?? 0)}
          currentPage={eligibleTxs?.pagination.currentPage ?? 0}
          pageSize={eligibleTxs?.pagination.pageSize ?? 0}
          haveBg={false}
          style={{ padding: '0' }}
        />
      </Stack>
    </Modal>
  )
}

export default function EligibleTxModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  return isOpen ? <EligibleTxModalContent closeModal={closeModal} /> : null
}
