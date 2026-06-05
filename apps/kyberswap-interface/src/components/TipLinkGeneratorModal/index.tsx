import { ChainId as SchemaChainId, Token as TokenSchema } from '@kyber/schema'
import TokenSelectorModal, { TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import Portal from '@reach/portal'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { X } from 'react-feather'
import {
  buildTipLinkThumbnailURL,
  uploadTipLinkThumbnailToSignedURL,
  useCreateTipLinkMutation,
  useGetTipLinkThumbnailSignedUrlMutation,
} from 'services/tipLink'
import { v4 as uuid } from 'uuid'

import ShareBanner from 'assets/images/share-banner.png'
import { NotificationType } from 'components/Announcement/type'
import NetworkModal from 'components/Header/web3/NetworkModal'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import TipConfigForm from 'components/TipLinkGeneratorModal/TipConfigForm'
import TipConfigOutput from 'components/TipLinkGeneratorModal/TipConfigOutput'
import TipConfigPreview from 'components/TipLinkGeneratorModal/TipConfigPreview'
import {
  BackgroundMode,
  MAX_IMAGE_SIZE,
  PRIMARY_CHAINS,
  SOLID_COLORS,
  TIP_LINK_CHAINS,
  TIP_LINK_CLIENT_ID,
  TokenSelectorTarget,
  enablePreview,
  getCurrencyParam,
  getDefaultInputToken,
  getDefaultOutputToken,
  isSameToken,
} from 'components/TipLinkGeneratorModal/shared'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import { useNotify, useWalletModalToggle } from 'state/application/hooks'
import { ChargeFeeBy } from 'types/route'
import { isAddress } from 'utils'

const makeFileName = (file?: File) => {
  const ext = file?.name?.split('.').pop()?.toLowerCase() || 'png'
  return `${uuid()}-${Date.now()}.${ext}`
}

export default function TipLinkGeneratorModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const { account, chainId: selectedChainId } = useActiveWeb3React()
  const { supportedChains } = useChainsConfig()
  const toggleWalletModal = useWalletModalToggle()
  const notify = useNotify()
  const defaultChainId = TIP_LINK_CHAINS.includes(selectedChainId) ? selectedChainId : PRIMARY_CHAINS[0]

  const [chainId, setChainId] = useState<ChainId>(defaultChainId)
  const [receiver, setReceiver] = useState(account || '')
  const [creatorName, setCreatorName] = useState('')
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('default')
  const [backgroundColor, setBackgroundColor] = useState<string>(SOLID_COLORS[0])
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState<File | undefined>()
  const [showBackground, setShowBackground] = useState(false)
  const [shortLink, setShortLink] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [showNetworkModal, setShowNetworkModal] = useState(false)
  const [inputToken, setInputToken] = useState<TokenSchema>(() => getDefaultInputToken(defaultChainId))
  const [outputToken, setOutputToken] = useState<TokenSchema | undefined>(() => getDefaultOutputToken(defaultChainId))
  const [tokenSelectorTarget, setTokenSelectorTarget] = useState<TokenSelectorTarget | null>(null)

  const [getSignedUrl, { isLoading: isGettingSignedUrl }] = useGetTipLinkThumbnailSignedUrlMutation()
  const [createTipLink, { isLoading: isCreatingTipLink }] = useCreateTipLinkMutation()

  const whitelistedTokens = useAllTokens(true, chainId)
  const networkInfo = NETWORKS_INFO[chainId]
  const isLoading = isGettingSignedUrl || isCreatingTipLink
  const trimmedReceiver = receiver.trim()
  const trimmedCreatorName = creatorName.trim()
  const isReceiverValid = !trimmedReceiver || Boolean(isAddress(chainId, trimmedReceiver))
  const canGenerate = Boolean(trimmedReceiver && isReceiverValid && inputToken && outputToken)
  const selectedTokenAddress = tokenSelectorTarget === 'input' ? inputToken?.address : outputToken?.address
  const isUsingConnectedAddress = !!account && trimmedReceiver.toLowerCase() === account.toLowerCase()
  const isCustomColor = backgroundMode === 'solid' && !SOLID_COLORS.includes(backgroundColor)
  const customColorLabel = isCustomColor ? String(backgroundColor).toUpperCase() : '# Custom'

  const resetState = useCallback(() => {
    setChainId(defaultChainId)
    setReceiver(account || '')
    setCreatorName('')
    setBackgroundMode('default')
    setBackgroundColor(SOLID_COLORS[0])
    setImagePreview('')
    setImageFile(undefined)
    setShowBackground(false)
    setShortLink(false)
    setGeneratedLink('')
    setCopied(false)
    setShowNetworkModal(false)
    setInputToken(getDefaultInputToken(defaultChainId))
    setOutputToken(getDefaultOutputToken(defaultChainId))
    setTokenSelectorTarget(null)
  }, [account, defaultChainId])

  const handleDismiss = () => {
    resetState()
    onDismiss()
  }

  useEffect(() => {
    if (!isOpen) resetState()
  }, [isOpen, resetState])

  useEffect(() => {
    setInputToken(getDefaultInputToken(chainId))
    setOutputToken(getDefaultOutputToken(chainId))
  }, [chainId])

  useEffect(() => {
    setOutputToken(prev => {
      if (!prev?.address || prev.logo) return prev
      const logo = whitelistedTokens[prev.address.toLowerCase()]?.logoURI
      return logo ? { ...prev, logo } : prev
    })
  }, [outputToken?.address, outputToken?.logo, whitelistedTokens])

  useEffect(() => {
    if (isOpen) {
      setReceiver(account || '')
    }
  }, [account, isOpen])

  useEffect(() => {
    setGeneratedLink('')
    setCopied(false)
  }, [
    backgroundColor,
    backgroundMode,
    chainId,
    creatorName,
    imageFile,
    inputToken?.address,
    outputToken?.address,
    receiver,
    shortLink,
  ])

  const previewStyle = useMemo(() => {
    if (backgroundMode === 'solid') {
      return {
        background: `linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,.34)), linear-gradient(to bottom, rgba(255,255,255,.06), rgba(0,0,0,.78)), ${backgroundColor}`,
      }
    }
    if (backgroundMode === 'image' && imagePreview) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,.34)), linear-gradient(to bottom, rgba(255,255,255,.06), rgba(0,0,0,.78)), url(${imagePreview})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {
      backgroundImage: `linear-gradient(rgba(0,0,0,.34), rgba(0,0,0,.34)), linear-gradient(to bottom, rgba(255,255,255,.06), rgba(0,0,0,.78)), url(${ShareBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }, [backgroundColor, backgroundMode, imagePreview])

  const previewTitle = `Swap ${inputToken.symbol} to ${outputToken?.symbol || 'USDC'} on ${networkInfo.name}`

  const handleChainSelect = (nextChainId: ChainId) => {
    if (nextChainId === chainId) return
    setChainId(nextChainId)
  }

  const handleImageChange = (preview: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      notify({ title: t`Unsupported file`, summary: t`Please upload an image file.`, type: NotificationType.ERROR })
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      notify({
        title: t`Image is too large`,
        summary: t`Please upload an image smaller than 1MB.`,
        type: NotificationType.ERROR,
      })
      return
    }
    setImagePreview(preview)
    setImageFile(file)
    setBackgroundMode('image')
  }

  const handleRemoveImage = () => {
    setImagePreview('')
    setImageFile(undefined)
    if (backgroundMode === 'image') setBackgroundMode('default')
  }

  const handleGenerate = async () => {
    if (!canGenerate || !outputToken) return

    if (!enablePreview || !shortLink) {
      const params = new URLSearchParams({
        chainId: String(chainId),
        inputCurrency: getCurrencyParam(inputToken, chainId),
        outputCurrency: getCurrencyParam(outputToken, chainId),
        enableTip: 'true',
        feeReceiver: trimmedReceiver,
        feeAmount: '0',
        chargeFeeBy: ChargeFeeBy.CURRENCY_OUT,
        clientId: TIP_LINK_CLIENT_ID,
      })
      if (trimmedCreatorName) params.set('creatorName', trimmedCreatorName)
      setGeneratedLink(`${window.location.origin}${APP_PATHS.USER_SWAP}?${params.toString()}`)
      return
    }

    try {
      let thumbnailURL: string | undefined
      if (backgroundMode === 'image' && imageFile) {
        const fileName = makeFileName(imageFile)
        const signedUrl = await getSignedUrl({ fileName }).unwrap()
        await uploadTipLinkThumbnailToSignedURL(signedUrl.signedURL, imageFile)
        thumbnailURL = buildTipLinkThumbnailURL(signedUrl.fileName || fileName)
      }

      const tipLink = await createTipLink({
        chainId: String(chainId),
        inputCurrency: getCurrencyParam(inputToken, chainId),
        outputCurrency: getCurrencyParam(outputToken, chainId),
        tipReceiver: trimmedReceiver,
        thumbnailURL,
        backgroundColor: backgroundMode === 'solid' ? backgroundColor : undefined,
        creatorName: trimmedCreatorName || undefined,
      }).unwrap()
      const idOrCode = tipLink.code || tipLink.id
      setGeneratedLink(`${window.location.origin}${APP_PATHS.USER_SWAP}/${encodeURIComponent(idOrCode)}`)
    } catch (error) {
      notify({
        title: t`Failed to generate link`,
        summary: t`Please try again in a moment.`,
        type: NotificationType.ERROR,
      })
    }
  }

  const handleCopy = async () => {
    if (!generatedLink) return
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      notify({
        title: t`Copy failed`,
        summary: t`Please copy the generated link manually.`,
        type: NotificationType.ERROR,
      })
    }
  }

  const handleTokenSelect = (token: TokenSchema) => {
    if (tokenSelectorTarget === 'input') {
      if (isSameToken(token, outputToken)) setOutputToken(inputToken)
      setInputToken(token)
    } else {
      if (isSameToken(token, inputToken)) setInputToken(outputToken || getDefaultInputToken(chainId))
      setOutputToken(token)
    }
    setTokenSelectorTarget(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      maxWidth={420}
      width="calc(100vw - 32px)"
      borderRadius="8px"
      margin={enablePreview ? '48px auto' : 'auto'}
      className={enablePreview ? '!self-start' : undefined}
      bypassFocusLock
    >
      <Stack className="max-h-[calc(100vh-96px)] overflow-hidden rounded-lg bg-[#1c1c1c] text-text shadow-2xl">
        <HStack className="shrink-0 items-start justify-between gap-4 p-4">
          <Stack className="gap-1">
            <h2 className="text-xl font-medium leading-6">Tip Link Generator</h2>
            <p className="text-xs text-subText">Generate a referral swap URL and earn optional tips</p>
          </Stack>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-subText transition-colors hover:bg-white/10 hover:text-text"
          >
            <X size={18} />
          </button>
        </HStack>

        <Stack className="min-h-0 flex-1 gap-5 overflow-y-auto px-4 pb-4">
          <TipConfigForm
            account={account}
            chainId={chainId}
            creatorName={creatorName}
            inputToken={inputToken}
            isReceiverValid={isReceiverValid}
            isUsingConnectedAddress={isUsingConnectedAddress}
            onChainSelect={handleChainSelect}
            onCreatorNameChange={setCreatorName}
            onOpenNetworkModal={() => setShowNetworkModal(true)}
            onOpenTokenSelector={setTokenSelectorTarget}
            onReceiverChange={setReceiver}
            onSwapTokens={() => {
              if (!outputToken) return
              setInputToken(outputToken)
              setOutputToken(inputToken)
            }}
            onUseConnectedAddress={() => account && setReceiver(account)}
            onWalletConnect={toggleWalletModal}
            outputToken={outputToken}
            receiver={receiver}
            showNetworkModal={showNetworkModal}
          />

          {enablePreview && (
            <TipConfigPreview
              backgroundColor={backgroundColor}
              backgroundMode={backgroundMode}
              customColorLabel={customColorLabel}
              defaultBackgroundImage={ShareBanner}
              imageFile={imageFile}
              imagePreview={imagePreview}
              inputToken={inputToken}
              isCustomColor={isCustomColor}
              onBackgroundColorChange={setBackgroundColor}
              onBackgroundModeChange={setBackgroundMode}
              onImageChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
              onToggle={() => setShowBackground(prev => !prev)}
              outputToken={outputToken}
              previewStyle={previewStyle}
              previewTitle={previewTitle}
              show={showBackground}
            />
          )}

          <TipConfigOutput
            canGenerate={canGenerate}
            copied={copied}
            generatedLink={generatedLink}
            isLoading={isLoading}
            onCopy={handleCopy}
            onGenerate={handleGenerate}
            onShortLinkChange={() => setShortLink(prev => !prev)}
            shortLink={shortLink}
          />
        </Stack>
      </Stack>

      <NetworkModal
        isOpen={showNetworkModal}
        customToggleModal={() => setShowNetworkModal(prev => !prev)}
        selectedId={chainId}
        activeChainIds={supportedChains.map(item => item.chainId)}
        customOnSelectNetwork={selectedChain => {
          if (TIP_LINK_CHAINS.includes(selectedChain as ChainId)) {
            handleChainSelect(selectedChain as ChainId)
          }
        }}
      />

      {!!tokenSelectorTarget && (
        <Portal>
          <TokenSelectorModal
            chainId={chainId as unknown as SchemaChainId}
            title={t`Select a token`}
            onClose={() => setTokenSelectorTarget(null)}
            wallet={{
              account,
              onConnectWallet: toggleWalletModal,
            }}
            tokenOptions={{
              tokensIn: [],
              amountsIn: '',
              mode: TOKEN_SELECT_MODE.SELECT,
              selectedTokenAddress,
              token0Address: inputToken?.address ?? '',
              token1Address: outputToken?.address ?? '',
              setTokensIn: () => undefined,
              setAmountsIn: () => undefined,
              onTokenSelect: handleTokenSelect,
            }}
            positionOptions={{
              poolAddress: '',
            }}
          />
        </Portal>
      )}
    </Modal>
  )
}
