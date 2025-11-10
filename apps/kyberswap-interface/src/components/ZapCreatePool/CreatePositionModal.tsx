import { ChainId, POOL_CATEGORY, Token } from '@kyber/schema'
import { TOKEN_SELECT_MODE, TokenLogo, TokenSelectorModal } from '@kyber/ui'
import { Trans } from '@lingui/macro'
import Portal from '@reach/portal'
import { useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useCheckPairQuery } from 'services/marketOverview'
import { useSupportedProtocolsQuery } from 'services/zapEarn'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import FeeTierControl from 'components/FeeTierControl'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import DropdownMenu from 'pages/Earns/components/DropdownMenu'
import { Exchange } from 'pages/Earns/constants'
import { useWalletModalToggle } from 'state/application/hooks'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  width: 100%;
`

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
`

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const TokenSelectWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.background};
  border-radius: 999px;
  padding: 6px 12px;
  width: 100%;
  cursor: pointer;
`

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column-reverse;
  `}
`

type FeePreset = { defaultFee: number; options: number[] }

const CATEGORY_FEE_PRESETS: Record<POOL_CATEGORY, FeePreset> = {
  [POOL_CATEGORY.STABLE_PAIR]: { defaultFee: 0.01, options: [0.005, 0.01, 0.05, 0.3] },
  [POOL_CATEGORY.CORRELATED_PAIR]: { defaultFee: 0.05, options: [0.01, 0.05, 0.1, 0.3] },
  [POOL_CATEGORY.COMMON_PAIR]: { defaultFee: 0.3, options: [0.1, 0.3, 0.5, 1] },
  [POOL_CATEGORY.EXOTIC_PAIR]: { defaultFee: 1, options: [0.3, 0.5, 1, 3] },
  [POOL_CATEGORY.HIGH_VOLATILITY_PAIR]: { defaultFee: 1, options: [0.3, 0.5, 1, 3] },
}

export type CreatePoolModalConfig = {
  chainId: number
  protocol: Exchange
  token0: Token
  token1: Token
  fee: number
}

interface Props {
  isOpen: boolean
  onDismiss: () => void
  onSubmit: (config: CreatePoolModalConfig) => void | Promise<void>
}

const CreatePositionModal = ({ isOpen, onDismiss, onSubmit }: Props) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const { supportedChains } = useChainsConfig()
  const { data: supportedProtocols } = useSupportedProtocolsQuery()

  const [selectedChainId, setSelectedChainId] = useState<ChainId>(ChainId.Bsc)
  const [selectedProtocol, setSelectedProtocol] = useState<Exchange>(Exchange.DEX_UNISWAP_V4_FAIRFLOW)
  const [token0, setToken0] = useState<Token | null>(null)
  const [token1, setToken1] = useState<Token | null>(null)
  const [fee, setFee] = useState<number | null>(null)
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<'token0' | 'token1' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const chainOptions = useMemo(
    () =>
      supportedChains
        .filter(chain => [ChainId.Ethereum, ChainId.Bsc, ChainId.Base].includes(chain.chainId))
        .map(chain => ({
          label: chain.name,
          value: chain.chainId.toString(),
          icon: chain.icon,
        })),
    [supportedChains],
  )

  const protocolOptions = useMemo(() => {
    if (!supportedProtocols?.data?.chains) return []
    const availableProtocols =
      Object.values(supportedProtocols.data.chains).find(chain => chain.chainId === selectedChainId)?.protocols || []
    return availableProtocols
      .filter(protocol =>
        [Exchange.DEX_UNISWAPV3, Exchange.DEX_UNISWAP_V4, Exchange.DEX_UNISWAP_V4_FAIRFLOW].includes(protocol.id),
      )
      .map(protocol => ({
        label: protocol.name,
        value: protocol.id,
      }))
  }, [selectedChainId, supportedProtocols])

  useEffect(() => {
    if (!isOpen) return
    setSelectedChainId(ChainId.Bsc)
    setSelectedProtocol(Exchange.DEX_UNISWAP_V4_FAIRFLOW)
    setToken0(null)
    setToken1(null)
    setFee(null)
  }, [isOpen])

  useEffect(() => {
    setToken0(null)
    setToken1(null)
  }, [selectedChainId])

  const canSubmit = !!token0 && !!token1 && !!fee && !isSubmitting

  const handleConfirm = () => {
    if (!canSubmit) return
    setIsSubmitting(true)

    void Promise.resolve(
      onSubmit({
        chainId: selectedChainId,
        protocol: selectedProtocol,
        token0,
        token1,
        fee: Number(fee),
      }),
    ).finally(() => {
      setIsSubmitting(false)
    })
  }

  const selectedTokenAddress =
    tokenSelectorTarget === 'token0' ? token0?.address : tokenSelectorTarget === 'token1' ? token1?.address : ''

  const handleSetTokenIn = (newToken: Token) => {
    if (tokenSelectorTarget === 'token0') {
      if (newToken.address === token1?.address) setToken1(token0)
      setToken0(newToken)
    }
    if (tokenSelectorTarget === 'token1') {
      if (newToken.address === token0?.address) setToken0(token1)
      setToken1(newToken)
    }
    setTokenSelectorTarget(null)
  }

  const { data: poolCategory } = useCheckPairQuery(
    {
      chainId: selectedChainId,
      tokenIn: token0?.address ?? '',
      tokenOut: token1?.address ?? '',
    },
    {
      skip: !token0 || !token1,
      selectFromResult: ({ data, isFetching }) => ({
        data: data?.data.category as unknown as POOL_CATEGORY,
        isFetching,
      }),
    },
  )

  const feeOptions = useMemo(() => {
    const preset = CATEGORY_FEE_PRESETS[poolCategory]
    if (preset) {
      return preset.options
    }
    return undefined
  }, [poolCategory])

  useEffect(() => {
    const preset = CATEGORY_FEE_PRESETS[poolCategory]
    if (preset) {
      setFee(currentFee => {
        if (preset.options.some(option => option === currentFee)) {
          return currentFee
        }
        return preset.defaultFee
      })
    }
  }, [poolCategory])

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={onDismiss} maxWidth={480} width="100%">
        <Wrapper>
          <Title>
            <Trans>Create Position</Trans>
          </Title>

          <Section>
            <Text>
              <Trans>Choose to create pool on</Trans>
            </Text>
            <Row gap="12px">
              <DropdownMenu
                width={160}
                options={chainOptions}
                value={selectedChainId.toString()}
                alignLeft
                mobileFullWidth
                onChange={value => setSelectedChainId(Number(value) as ChainId)}
              />
              <DropdownMenu
                width={160}
                options={protocolOptions}
                value={selectedProtocol}
                alignLeft
                mobileFullWidth
                onChange={value => setSelectedProtocol(value as Exchange)}
              />
            </Row>
          </Section>

          <Section>
            <Text>
              <Trans>Choose Pool Pair</Trans>
            </Text>
            <Row gap="12px">
              <TokenSelectWrapper onClick={() => setTokenSelectorTarget('token0')}>
                <Row gap="6px" style={{ flex: 1 }}>
                  {token0 && <TokenLogo src={token0.logo} size={20} />}
                  <Text fontSize="14px" color={theme.subText}>
                    {token0?.symbol || <Trans>Select Token</Trans>}
                  </Text>
                </Row>
                <DropdownSVG color={theme.subText} />
              </TokenSelectWrapper>

              <TokenSelectWrapper onClick={() => setTokenSelectorTarget('token1')}>
                <Row gap="6px" style={{ flex: 1 }}>
                  {token1 && <TokenLogo src={token1.logo} size={20} />}
                  <Text fontSize="14px" color={theme.subText}>
                    {token1?.symbol || <Trans>Select Token</Trans>}
                  </Text>
                </Row>
                <DropdownSVG color={theme.subText} />
              </TokenSelectWrapper>
            </Row>
          </Section>

          <Section>
            <Text>
              <Trans>Select Fee Tier</Trans>
            </Text>
            <FeeTierControl value={fee} onChange={setFee} options={feeOptions} />
          </Section>

          <Footer>
            <ButtonOutlined onClick={onDismiss} style={{ borderRadius: '20px', height: 40 }}>
              <Trans>Cancel</Trans>
            </ButtonOutlined>
            <ButtonPrimary
              onClick={handleConfirm}
              disabled={!canSubmit}
              altDisabledStyle
              style={{ borderRadius: '20px', height: 40 }}
            >
              {isSubmitting ? <Loader stroke={theme.textReverse} /> : <Trans>Create with Zap</Trans>}
            </ButtonPrimary>
          </Footer>
        </Wrapper>
      </Modal>
      {!!tokenSelectorTarget && (
        <Portal>
          <TokenSelectorModal
            chainId={selectedChainId}
            tokensIn={[]}
            amountsIn=""
            account={account}
            mode={TOKEN_SELECT_MODE.SELECT}
            selectedTokenAddress={selectedTokenAddress}
            poolAddress=""
            token0Address={token0?.address ?? ''}
            token1Address={token1?.address ?? ''}
            setTokensIn={() => undefined}
            setAmountsIn={() => undefined}
            onTokenSelect={handleSetTokenIn}
            onConnectWallet={toggleWalletModal}
            onClose={() => setTokenSelectorTarget(null)}
          />
        </Portal>
      )}
    </>
  )
}

export default CreatePositionModal
