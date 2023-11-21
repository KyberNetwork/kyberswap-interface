import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Check, X } from 'react-feather'
import { Text } from 'rebass'
import { useCheckAirdropQuery } from 'services/reward'

import ToggleCollapse from 'components/Collapse'
import Column from 'components/Column'
import { CheckCircle } from 'components/Icons'
import IconFailure from 'components/Icons/Failed'
import Loader from 'components/Loader'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

const Title = ({ title, eligible, checking }: { title: string; eligible: boolean; checking: boolean }) => {
  const theme = useTheme()
  return (
    <Row gap="8px">
      {checking ? (
        <Loader />
      ) : eligible ? (
        <CheckCircle size="16px" color={theme.primary} />
      ) : (
        <IconFailure size={18} color={theme.red} />
      )}
      <Text fontWeight={'500'} fontSize={'16px'} color={theme.text}>
        {title}
      </Text>
    </Row>
  )
}

const Content = ({
  items,
  checking,
  currentLevel = 0,
}: {
  items: { title: ReactNode }[]
  checking: boolean
  currentLevel: number | undefined
}) => {
  const theme = useTheme()

  return (
    <Column gap="10px" sx={{ paddingLeft: '22px', paddingTop: '10px' }}>
      {items.map((el, i) => {
        const eligible = currentLevel >= i + 1
        return (
          <Row key={i} gap="8px">
            {checking ? (
              <Loader size={'14px'} style={{ minWidth: '14px' }} />
            ) : eligible ? (
              <Check color={theme.primary} size={16} style={{ minWidth: 16 }} />
            ) : (
              <X size={16} color={theme.subText} style={{ minWidth: 16 }} />
            )}{' '}
            <Text color={eligible ? theme.text : theme.subText} fontSize={'12px'}>
              {el.title}
            </Text>
          </Row>
        )
      })}
    </Column>
  )
}

export default function EligibleSection() {
  const { account } = useActiveWeb3React()
  const { data, isFetching } = useCheckAirdropQuery({ address: account || '' }, { skip: !account })
  const rewardDetail = data?.details
  const theme = useTheme()

  return (
    <Column flex={1} gap="24px">
      <Text fontSize={'20px'} fontWeight={'500'} color={theme.text}>
        <Trans>Criteria</Trans>
      </Text>
      <ToggleCollapse
        style={{
          borderRadius: 20,
          border: `1px solid ${theme.border}`,
          overflow: 'hidden',
        }}
        itemStyle={{ borderBottom: `1px solid ${theme.border}`, padding: 16 }}
        data={[
          {
            title: (
              <Title eligible={!!rewardDetail?.liquidity?.level} checking={isFetching} title={t`Providing Liquidity`} />
            ),
            content: (
              <Content
                checking={isFetching}
                currentLevel={rewardDetail?.liquidity?.level}
                items={[
                  {
                    title: (
                      <Trans>
                        Added liquidity with total deposits falling within the range of <b>≥$1,000 - &lt;5,000</b>, and
                        held positions for 10 days.
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Added liquidity with total deposits falling within the range of <b>≥$5,000 - &lt;10,000</b> and
                        held positions for 10 days.
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Added liquidity with total deposits falling within the range of <b>≥$10,000 - &lt;100,000</b>{' '}
                        and held positions for 10 days.
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Added <b>$100,000</b> or more in total deposits and held positions for 10 days .
                      </Trans>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            title: (
              <Title
                eligible={!!rewardDetail?.aggregator?.level}
                checking={isFetching}
                title={t`Swapping via Kyberswap UI`}
              />
            ),
            content: (
              <Content
                checking={isFetching}
                currentLevel={rewardDetail?.aggregator?.level}
                items={[
                  {
                    title: (
                      <Trans>
                        Swapped at least 3 times within a month (any month) + Minimum <b>$10K - &lt;20k vol.</b>
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Swapped at least 3 times within a month (any month) + Minimum <b>$20k - &lt;50k vol.</b>
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Swapped at least 3 times within a month (any month) + Minimum <b>$50K - &lt;200k vol.</b>
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Swapped at least 3 times within a month (any month) + Minimum <b>$200k vol.</b>
                      </Trans>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            title: (
              <Title
                eligible={!!rewardDetail?.limitOrder?.level}
                checking={isFetching}
                title={t`Engaging with Limit Orders`}
              />
            ),
            content: (
              <Content
                checking={isFetching}
                currentLevel={rewardDetail?.limitOrder?.level}
                items={[
                  {
                    title: (
                      <Trans>
                        Makers with total filled volume falling within the range of <b>$10 - &lt;$50</b>
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Makers with total filled volume falling within the range of <b>$50 - &lt;200</b>
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Makers with total filled volume falling within the range of <b>$200 - &lt;500</b>
                      </Trans>
                    ),
                  },
                  {
                    title: (
                      <Trans>
                        Makers with total filled volume of at least <b>$500</b>
                      </Trans>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            title: (
              <Title
                eligible={!!rewardDetail?.kyberAI?.level}
                checking={isFetching}
                title={t`Referring KyberAI to friends`}
              />
            ),
            content: (
              <Content
                checking={isFetching}
                currentLevel={rewardDetail?.kyberAI?.level}
                items={[
                  {
                    title: t`Referred 1 to less than 5 friends`,
                  },
                  {
                    title: t`Referred 5 to less than 10 friends`,
                  },
                  {
                    title: t`Referred 10 to less than 50 friends`,
                  },
                  {
                    title: t`Referred 50 and more friends`,
                  },
                ]}
              />
            ),
            style: { borderBottom: 'none' },
          },
        ]}
      />
    </Column>
  )
}
