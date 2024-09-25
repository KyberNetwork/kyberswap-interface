import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

import { ReactComponent as KaiAvatar } from 'assets/svg/kai_avatar2.svg'

import { ActionType, KAI_ACTIONS, KaiAction, KaiOption } from './actions'
import {
  ActionButton,
  ActionPanel,
  ActionText,
  ChatInput,
  ChatPanel,
  ChatWrapper,
  Divider,
  KaiHeaderWrapper,
  Loader,
  LoadingWrapper,
  SendIcon,
  SubTextSpan,
  UserMessage,
  UserMessageWrapper,
} from './styled'

const DEFAULT_LOADING_TEXT = 'KAI is checking the data ...'
const DEFAULT_CHAT_PLACEHOLDER_TEXT = 'Write a message...'

const KaiPanel = () => {
  const chatPanelRef = useRef<HTMLDivElement>(null)

  const [chatPlaceHolderText, setChatPlaceHolderText] = useState(DEFAULT_CHAT_PLACEHOLDER_TEXT)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState(DEFAULT_LOADING_TEXT)
  const [listActions, setListActions] = useState<KaiAction[]>([KAI_ACTIONS.MAIN_MENU])
  // const [listActions, setListActions] = useState<KaiAction[]>([
  //   KAI_ACTIONS.MAIN_MENU,
  //   KAI_ACTIONS.COMING_SOON,
  //   {
  //     title: 'Add liquidity',
  //     type: ActionType.USER_MESSAGE,
  //   },
  //   {
  //     title: 'Add liquidity',
  //     type: ActionType.USER_MESSAGE,
  //   },
  //   {
  //     title: 'Add liquidity',
  //     type: ActionType.USER_MESSAGE,
  //   },
  //   KAI_ACTIONS.MAIN_MENU,
  // ])

  const lastAction = useMemo(() => {
    const cloneListActions = [...listActions]
    cloneListActions.reverse()

    return cloneListActions.find(
      (action: KaiAction) => action.type !== ActionType.INVALID && action.type !== ActionType.USER_MESSAGE,
    )
  }, [listActions])

  const onSubmitChat = (text: string) => {
    if (loading || !lastAction) return
    if (lastAction.loadingText) setLoadingText(lastAction.loadingText)
    setLoading(true)
    onChangeListActions([
      {
        title: text,
        type: ActionType.USER_MESSAGE,
      },
    ])
  }

  const onChangeListActions = (newActions: KaiAction[]) => {
    const cloneListActions = [...listActions]
    setListActions(cloneListActions.concat(newActions))
  }

  const getActionResponse = async () => {
    const lastUserAction = listActions[listActions.length - 1]
    if (lastUserAction?.type === ActionType.USER_MESSAGE) {
      const newActions: KaiAction[] = (await lastAction?.response?.(lastUserAction?.title?.toLowerCase() || '')) || []
      if (newActions.length) onChangeListActions(newActions)
      setLoading(false)
      setLoadingText(DEFAULT_LOADING_TEXT)
    }
  }

  useEffect(() => {
    if (lastAction?.placeholder) setChatPlaceHolderText(lastAction.placeholder)
    else setChatPlaceHolderText(DEFAULT_CHAT_PLACEHOLDER_TEXT)
  }, [lastAction])

  useEffect(() => {
    if (chatPanelRef.current)
      chatPanelRef.current.scrollTo({ top: chatPanelRef.current.scrollHeight, behavior: 'smooth' })
  }, [listActions])

  useEffect(() => {
    getActionResponse()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listActions])

  return (
    <>
      <KaiHeader />

      <ChatPanel ref={chatPanelRef}>
        <div>GM! What can I do for you today? 👋</div>
        {listActions.map((action: KaiAction, index: number) =>
          action.type === ActionType.OPTION ? (
            <ActionPanel key={index}>
              {action.data?.map((option: KaiOption, optionIndex: number) => (
                <ActionButton key={optionIndex} width={option.space} onClick={() => onSubmitChat(option.title)}>
                  {option.title}
                </ActionButton>
              ))}
            </ActionPanel>
          ) : action.type === ActionType.TEXT || action.type === ActionType.INVALID ? (
            <ActionText key={index}>{action.title}</ActionText>
          ) : action.type === ActionType.USER_MESSAGE ? (
            <UserMessageWrapper key={index} havePrevious={listActions[index - 1].type === ActionType.USER_MESSAGE}>
              <UserMessage
                havePrevious={listActions[index - 1].type === ActionType.USER_MESSAGE}
                haveFollowing={
                  index < listActions.length - 1 && listActions[index + 1].type === ActionType.USER_MESSAGE
                }
              >
                {action.title}
              </UserMessage>
            </UserMessageWrapper>
          ) : null,
        )}
      </ChatPanel>

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

  const handleSubmitChatInput = () => {
    if (disabled || !chatInput) return
    onSubmitChat(chatInput.trim())
    setChatInput('')
  }

  const handleEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    handleSubmitChatInput()
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
        disabled={disabled}
      />
      <SendIcon disabled={disabled} onClick={handleSubmitChatInput} />
    </ChatWrapper>
  )
}

export default KaiPanel
