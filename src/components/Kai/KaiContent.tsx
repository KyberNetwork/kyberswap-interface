import { ChangeEvent, KeyboardEvent, useState } from 'react'

import { ReactComponent as KaiAvatar } from 'assets/svg/kai_avatar2.svg'

import {
  ActionButton,
  ActionPanel,
  ChatInput,
  ChatWrapper,
  Divider,
  KaiHeaderWrapper,
  Loader,
  LoadingWrapper,
  SendIcon,
  SubTextSpan,
  WelcomeText,
} from './KaiStyledComponents'
import { KaiAction, MAIN_MENU } from './actions'

const DEFAULT_LOADING_TEXT = 'KAI is checking the data ...'
const DEFAULT_CHAT_PLACEHOLDER_TEXT = 'Ask me anything or select'

const KaiContent = () => {
  const [chatPlaceHolderText, _setChatPlaceHolderText] = useState(DEFAULT_CHAT_PLACEHOLDER_TEXT)
  const [loading, _setLoading] = useState(false)
  const [loadingText, _setLoadingText] = useState(DEFAULT_LOADING_TEXT)

  const onSubmitChat = (text: string) => {
    console.log('Submitted chat: ' + text)
  }

  return (
    <>
      <KaiHeader />
      <WelcomeText>GM! What can I do for you today? 👋</WelcomeText>
      <ActionPanel>
        {MAIN_MENU.map((action: KaiAction, index: number) => (
          <ActionButton key={index} width={action.space}>
            {action.title}
          </ActionButton>
        ))}
      </ActionPanel>
      {loading && <KaiLoading loadingText={loadingText} />}
      <KaiChat disabled={loading} chatPlaceHolderText={chatPlaceHolderText} onSubmitChat={onSubmitChat} />
    </>
  )
}

const KaiHeader = () => {
  return (
    <>
      <KaiHeaderWrapper>
        <KaiAvatar />
        <span>I&apos;m KAI</span>
        <SubTextSpan>Kyber Assistant Interface</SubTextSpan>
      </KaiHeaderWrapper>
      <Divider />
    </>
  )
}

const KaiLoading = ({ loadingText }: { loadingText: string }) => {
  return (
    <LoadingWrapper>
      <Loader />
      <span>{loadingText}</span>
    </LoadingWrapper>
  )
}

const KaiChat = ({
  chatPlaceHolderText,
  onSubmitChat,
  disabled = false,
}: {
  chatPlaceHolderText: string
  onSubmitChat: (text: string) => void
  disabled?: boolean
}) => {
  const [chatInput, setChatInput] = useState('')

  const onChangeChatInput = (e: ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    onSubmitChat(chatInput)
  }

  return (
    <ChatWrapper disabled={disabled}>
      <ChatInput
        type="text"
        id="token-search-input"
        data-testid="token-search-input"
        placeholder={chatPlaceHolderText}
        value={chatInput}
        onChange={onChangeChatInput}
        onKeyDown={handleEnter}
        autoComplete="off"
      />
      <SendIcon onClick={() => onSubmitChat(chatInput)} />
    </ChatWrapper>
  )
}

export default KaiContent
