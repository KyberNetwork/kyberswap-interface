import { Trans } from '@lingui/macro'
import { useState } from 'react'
import { X } from 'react-feather'
import { useMedia } from 'react-use'

import CopyHelper from 'components/Copy'
import Modal from 'components/Modal'
import Pagination from 'components/Pagination'
import { RowBetween } from 'components/Row'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useEligibleTransactions } from 'hooks/kyberdao'
import { HeaderCell, Table, TableHeader, TableRow } from 'pages/KyberDAO/KNCUtility/TxTable'
import { ExternalLinkIcon, MEDIA_WIDTHS } from 'theme'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

export default function EligibleTxModal({ isOpen, closeModal }: { isOpen: boolean; closeModal: () => void }) {
  const { chainId, networkInfo } = useActiveWeb3React()
  const [currentPage, setCurrentPage] = useState(1)
  const eligibleTxs = useEligibleTransactions(currentPage, 10)
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <Modal isOpen={isOpen} onDismiss={closeModal} maxWidth="800px" width="70vw">
      <div className="w-full min-w-[550px] rounded-[20px] bg-tableHeader px-6 pb-[30px] pt-6 max-[500px]:min-w-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-[26px]">
            <RowBetween>
              <span className="text-xl font-medium leading-6">
                <Trans>Your transactions</Trans>
              </span>
              <div onClick={closeModal} className="hover:brightness-90 [&_svg]:block">
                <X style={{ cursor: 'pointer' }} />
              </div>
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
                      <div className="flex gap-1">
                        <div className="flex items-center justify-center bg-transparent max-md:items-end [&>img]:size-4 [&>span]:size-4">
                          <img src={networkInfo.icon} />
                        </div>
                        <span className="self-center text-sm font-normal leading-normal">
                          {tx.tx.slice(0, 6)}...{tx.tx.slice(-4)}
                        </span>
                        <CopyHelper toCopy={tx.tx} margin="unset" className="text-subText" />
                        <ExternalLinkIcon
                          href={getEtherscanLink(chainId, tx.tx, 'transaction')}
                          className="text-subText"
                        />
                      </div>
                    </HeaderCell>
                    {upToExtraSmall ? null : (
                      <>
                        <HeaderCell>
                          <div className="flex flex-col gap-1">
                            <span>{time.toLocaleDateString()}</span>
                            <span className="font-normal text-subText">{time.toLocaleTimeString()}</span>
                          </div>
                        </HeaderCell>
                        <HeaderCell>
                          <div className="flex flex-col gap-1">
                            <span>
                              {formatDisplayNumber(tx.gasFeeInNativeToken, { significantDigits: 6 })}{' '}
                              {NativeCurrencies[chainId].symbol}
                            </span>
                            <span className="font-normal text-subText">
                              {formatDisplayNumber(tx.gasFeeInUSD, { style: 'currency', significantDigits: 6 })}
                            </span>
                          </div>
                        </HeaderCell>
                      </>
                    )}

                    <HeaderCell textAlign="right">
                      <div className="flex flex-col gap-1">
                        <span>{formatDisplayNumber(tx.gasRefundInKNC, { significantDigits: 6 })} KNC</span>
                        <span className="font-normal text-subText">
                          <Trans>Tier {tx.userTier}</Trans> - {Number(tx.gasRefundPercentage) * 100}%
                        </span>
                      </div>
                    </HeaderCell>
                  </TableRow>
                )
              })}
            </Table>
          </div>
          <Pagination
            onPageChange={setCurrentPage}
            totalCount={(eligibleTxs?.pagination.pageSize ?? 0) * (eligibleTxs?.pagination.totalOfPages ?? 0)}
            currentPage={eligibleTxs?.pagination.currentPage ?? 0}
            pageSize={eligibleTxs?.pagination.pageSize ?? 0}
            haveBg={false}
            style={{ padding: '0' }}
          />
        </div>
      </div>
    </Modal>
  )
}
