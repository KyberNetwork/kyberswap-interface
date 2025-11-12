import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { useGetRaffleCampaignTransactionsQuery } from 'services/raffleCampaign'
import styled from 'styled-components'

import Divider from 'components/Divider'
import Input from 'components/Input'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { ButtonText, ExternalLink, MEDIA_WIDTHS } from 'theme'
import { shortenHash } from 'utils'
import { formatDisplayNumber } from 'utils/numbers'

const Wrapper = styled.div`
  border-radius: 20px;
  padding: 20px;
  background: ${({ theme }) => theme.background};
  margin-top: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1rem;
  `}
`

const PAGE_SIZE = 10

export default function RaffleLeaderboard() {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const senderInQuery = searchParams.get('sender') || ''
  const [sender, setSender] = useState(senderInQuery)
  const debouncedSender = useDebounce(sender.trim().toLowerCase(), 300)

  useEffect(() => {
    const currentSender = searchParams.get('sender') || ''
    setSender(prev => (prev === currentSender ? prev : currentSender))
  }, [searchParams])

  useEffect(() => {
    const normalizedSender = debouncedSender
    const params = new URLSearchParams(searchParams)
    const current = params.get('sender') || ''
    if (normalizedSender === current) return

    if (normalizedSender) {
      params.set('sender', normalizedSender)
    } else {
      params.delete('sender')
    }
    params.set('page', '1')
    setSearchParams(params)
  }, [debouncedSender, searchParams, setSearchParams])

  const pageFromQuery = Number(searchParams.get('page') || '1')
  const currentPage = Number.isFinite(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1

  const { data, isLoading } = useGetRaffleCampaignTransactionsQuery({
    page: currentPage,
    limit: PAGE_SIZE,
    sender: senderInQuery || undefined,
  })

  const transactions = data ?? []
  const hasMore = transactions.length === PAGE_SIZE
  const totalCount = useMemo(() => {
    const base = (currentPage - 1) * PAGE_SIZE + transactions.length
    return hasMore ? base + 1 : base
  }, [currentPage, hasMore, transactions.length])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    setSearchParams(params)
  }

  const handleClearFilter = () => {
    if (!sender) return
    setSender('')
  }

  useEffect(() => {
    if (!isLoading && currentPage > 1 && transactions.length === 0) {
      const params = new URLSearchParams(searchParams)
      params.set('page', Math.max(currentPage - 1, 1).toString())
      setSearchParams(params)
    }
  }, [isLoading, currentPage, transactions.length, searchParams, setSearchParams])

  const renderLabel = (label: ReactNode) =>
    upToSmall ? (
      <Text fontWeight="500" fontSize={13} color={theme.subText}>
        {label}
      </Text>
    ) : null

  return (
    <Wrapper>
      <Flex
        flexDirection={upToSmall ? 'column' : 'row'}
        alignItems={upToSmall ? 'stretch' : 'center'}
        sx={{ gap: '12px' }}
      >
        <Text fontSize={16} fontWeight="500">
          <Trans>Eligible transaction log</Trans>
        </Text>

        <Flex flex={1} sx={{ gap: '8px' }} alignItems="center">
          <Input
            value={sender}
            onChange={e => setSender(e.target.value)}
            placeholder={t`Filter by wallet (sender)`}
            style={{ flex: 1 }}
          />
          {sender && (
            <ButtonText style={{ whiteSpace: 'nowrap' }} onClick={handleClearFilter}>
              <Trans>Clear</Trans>
            </ButtonText>
          )}
        </Flex>
      </Flex>

      <Divider style={{ margin: '16px 0' }} />

      <Flex padding={upToSmall ? '0 0 12px' : '0 1.25rem 12px'} fontSize={12} color={theme.subText} fontWeight="500">
        <Text width={40}>#</Text>
        <Text flex={1}>
          <Trans>Tx hash</Trans>
        </Text>
        <Text flex={1}>
          <Trans>Wallet</Trans>
        </Text>
        <Text width={upToSmall ? '120px' : '140px'} textAlign="right">
          <Trans>Volume (USD)</Trans>
        </Text>
        <Text width={upToSmall ? '80px' : '100px'} textAlign="center">
          <Trans>Eligible</Trans>
        </Text>
        <Text width={upToSmall ? '80px' : '100px'} textAlign="center">
          <Trans>Rewarded</Trans>
        </Text>
        <Text width={upToSmall ? '100px' : '120px'} textAlign="right">
          <Trans>Diff</Trans>
        </Text>
        {!upToSmall && (
          <Text width="160px" textAlign="right">
            <Trans>Time</Trans>
          </Text>
        )}
      </Flex>

      <Divider />

      {isLoading ? (
        <LocalLoader />
      ) : transactions.length ? (
        transactions.map((tx, index) => {
          const rowNumber = index + 1 + (currentPage - 1) * PAGE_SIZE
          const formattedTime = dayjs(tx.time).format('MMM DD, YYYY HH:mm:ss')
          return (
            <Flex
              key={tx.id}
              padding={upToSmall ? '12px 0' : '12px 1.25rem'}
              fontSize={14}
              color={theme.text}
              flexDirection={upToSmall ? 'column' : 'row'}
              sx={{ gap: upToSmall ? '8px' : '0' }}
            >
              <Flex
                width={upToSmall ? '100%' : '40px'}
                flexDirection="column"
                alignItems={upToSmall ? 'flex-start' : 'center'}
              >
                {renderLabel('#')}
                <Text fontWeight="500">{rowNumber}</Text>
              </Flex>
              <Flex flex={1} flexDirection="column">
                {renderLabel(<Trans>Tx hash</Trans>)}
                <ExternalLink href={`https://etherscan.io/tx/${tx.tx}`}>
                  {shortenHash(tx.tx, upToSmall ? 8 : 12)}
                </ExternalLink>
              </Flex>
              <Flex flex={1} flexDirection="column">
                {renderLabel(<Trans>Wallet</Trans>)}
                <Text>{shortenHash(tx.user_address, upToSmall ? 8 : 12)}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '140px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'right'}
              >
                {renderLabel(<Trans>Volume (USD)</Trans>)}
                <Text fontWeight="500">
                  {formatDisplayNumber(tx.amount_in_usd, { style: 'currency', significantDigits: 4 })}
                </Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '100px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'center'}
              >
                {renderLabel(<Trans>Eligible</Trans>)}
                <Text color={tx.eligible ? theme.primary : theme.subText}>{tx.eligible ? t`Yes` : t`No`}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '100px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'center'}
              >
                {renderLabel(<Trans>Rewarded</Trans>)}
                <Text color={tx.rewarded ? theme.primary : theme.subText}>{tx.rewarded ? t`Yes` : t`No`}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '120px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'right'}
              >
                {renderLabel(<Trans>Diff</Trans>)}
                <Text>{formatDisplayNumber(tx.diff, { significantDigits: 6 })}</Text>
              </Flex>
              <Flex
                width={upToSmall ? '100%' : '160px'}
                flexDirection="column"
                textAlign={upToSmall ? 'left' : 'right'}
              >
                {renderLabel(<Trans>Time</Trans>)}
                <Text>{formattedTime}</Text>
              </Flex>
            </Flex>
          )
        })
      ) : (
        <Text color={theme.subText} textAlign="center" padding="24px" marginTop="12px">
          {t`No data found`}
        </Text>
      )}

      {!isLoading && totalCount > 0 && (
        <Pagination
          onPageChange={handlePageChange}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          style={{ marginTop: '12px' }}
        />
      )}
    </Wrapper>
  )
}
