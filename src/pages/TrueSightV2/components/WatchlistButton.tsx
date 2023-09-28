import { Trans, t } from '@lingui/macro'
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import { Check, Plus, X } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Text } from 'rebass'
import styled, { css, useTheme } from 'styled-components'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import { useShowConfirm } from 'components/ConfirmModal'
import Divider from 'components/Divider'
import Icon from 'components/Icons/Icon'
import AnimatedSpinLoader from 'components/Loader/AnimatedSpinLoader'
import Modal from 'components/Modal'
import Popover from 'components/Popover'
import Row, { RowBetween, RowFit } from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

import kyberAIApi, {
  useAddToWatchlistMutation,
  useCreateCustomWatchlistMutation,
  useDeleteCustomWatchlistMutation,
  useGetWatchlistInformationQuery,
  useRemoveFromWatchlistMutation,
  useUpdateCustomizedWatchlistsPrioritiesMutation,
  useUpdateWatchlistsNameMutation,
} from '../hooks/useKyberAIData'
import { ICustomWatchlists } from '../types'
import SimpleTooltip from './SimpleTooltip'
import { StarWithAnimation } from './WatchlistStar'

const MenuWrapper = styled(Column)`
  width: fit-content;
  gap: 20px;
  padding: 20px;
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`

const ModalWrapper = styled(Column)`
  padding: 20px;
  border-radius: 20px;
  gap: 24px;
  width: 100%;
  transition: all 0.3s;
`

const MenuOption = styled(Row)`
  gap: 6px;
  cursor: pointer;
  :hover {
    color: ${({ theme }) => theme.text};
  }
`
const ReorderWrapper = styled.div`
  gap: 16px;
  height: 280px;

  ::-webkit-scrollbar {
    -webkit-appearance: button;
    width: 7px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.5);
    -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
  }

  ul {
    margin: 0;
    padding: 0;
  }
  li {
    color: ${({ theme }) => theme.subText};
    background-color: ${({ theme }) => theme.buttonBlack};
    border-radius: 16px;
    border: 1px solid ${({ theme }) => theme.border};
    gap: 4px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    user-select: none;
    position: relative;
  }
  li:not(:last-child) {
    margin-bottom: 16px;
  }
`
const GrabButton = styled.div`
  color: ${({ theme }) => theme.subText + '80'};
  transition: all 0.1s;
  :hover {
    color: ${({ theme }) => theme.subText + 'dd'};
  }
`
const InlineInput = styled.input`
  background-color: transparent;
  color: ${({ theme }) => theme.text};
  font-size: unset;
  outline: none;
  border: none;
`

function WatchlistsItem({
  item,
  watchlistsCount,
  wrapperRef,
  refetchList,
}: {
  item: ICustomWatchlists
  watchlistsCount: number
  wrapperRef: React.RefObject<HTMLDivElement>
  refetchList: () => void
}) {
  const controls = useDragControls()
  const theme = useTheme()
  const showConfirm = useShowConfirm()

  const [isEditting, setIsEditting] = useState(false)

  const [updateWatchlistsName] = useUpdateWatchlistsNameMutation()
  const [deleteCustomWatchlist, { isLoading: isDeleting }] = useDeleteCustomWatchlistMutation()

  const ref = useRef<HTMLInputElement>(null)

  const handleStartEdit = () => {
    setIsEditting(true)
  }

  const handleExitEdit = () => {
    setIsEditting(false)
  }

  const handleUpdateWatchlists = () => {
    setIsEditting(false)
    updateWatchlistsName({ userWatchlistId: item.id, name: ref.current?.value || '' }).finally(() => refetchList())
  }

  const handleRemoveWatchlists = () => {
    showConfirm({
      isOpen: true,
      content: (
        <Text padding="1em 0">
          <Trans>
            Do you want to remove{' '}
            <strong style={{ color: theme.text }}>
              {item.name} ({item.assetNumber})
            </strong>
          </Trans>
        </Text>
      ),
      title: t`Remove Watchlist`,
      confirmText: t`Yes`,
      cancelText: t`No, go back`,
      onConfirm: () => deleteCustomWatchlist({ ids: item.id.toString() }).finally(() => refetchList()),
    })
  }

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      const element = e.target as HTMLInputElement
      if (e.key === 'Enter') {
        e.preventDefault() // Prevent line break
        handleUpdateWatchlists()
      }
      if (e.key === 'Escape') {
        handleExitEdit()
        element.value = item.name
      }
    }
    const element = ref.current
    if (isEditting && element) {
      element.focus()
      element.setAttribute('value', item.name)
      element.setSelectionRange(item.name.length, item.name.length)
      element.addEventListener('keydown', keydownHandler)
    }
    return () => {
      element?.removeEventListener('keydown', keydownHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditting, item])

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      dragConstraints={wrapperRef}
      dragElastic={0}
      initial={{ opacity: 0, scale: 1 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      whileDrag={{ boxShadow: '2px 5px 10px rgba(0,0,0,0.3)', scale: 1.02 }}
    >
      <RowBetween gap="4px">
        <Row gap="2px">
          <GrabButton onPointerDown={e => controls.start(e)} style={{ cursor: 'grab' }}>
            <Icon id="drag-indicator" />
          </GrabButton>
          {isEditting ? (
            <InlineInput ref={ref} maxLength={30} />
          ) : (
            <div style={{ flex: 1 }}>
              {item.name} ({item.assetNumber})
            </div>
          )}
        </Row>
        <RowFit gap="2px" flexShrink={0}>
          {isEditting ? (
            <>
              <ButtonAction onClick={handleUpdateWatchlists}>
                <Check size={16} color={theme.primary} strokeWidth="3px" />
              </ButtonAction>
              <ButtonAction onClick={handleExitEdit}>
                <X size={16} color={theme.red} strokeWidth="3px" />
              </ButtonAction>
            </>
          ) : (
            <ButtonAction onClick={handleStartEdit} sx={{ ':hover': { color: theme.text } }}>
              <Icon id="pencil" size={16} />
            </ButtonAction>
          )}
          {isDeleting ? (
            <AnimatedSpinLoader size={20} />
          ) : (
            <ButtonAction
              disabled={watchlistsCount <= 1}
              onClick={handleRemoveWatchlists}
              sx={{
                ':hover': { color: theme.text },
                ':disabled': {
                  pointerEvents: 'none',
                  filter: 'brightness(0.5)',
                },
              }}
            >
              <Icon id="trash" size={16} />
            </ButtonAction>
          )}
        </RowFit>
      </RowBetween>
    </Reorder.Item>
  )
}

const CreateListWrapper = styled.div<{ $disabled: boolean }>`
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.border};
  gap: 4px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  user-select: none;
  position: relative;
  height: 40px;
  :hover {
    border: 1px solid ${({ theme }) => theme.text + 'aa'};
  }
  :has(input:focus) {
    border: 1px solid ${({ theme }) => theme.primary};
  }
  ${({ $disabled }) =>
    $disabled &&
    css`
      cursor: unset;
      user-select: none;
      pointer-events: none;
      filter: opacity(0.4);
    `}
`

const CreateListButtonWrapper = styled(RowFit)`
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  transition: all 0.1s;
  gap: 4px;
  :hover {
    filter: brightness(1.2);
  }
`

const CreateListInput = ({ watchlistsCount, refetchList }: { watchlistsCount: number; refetchList: () => void }) => {
  const [value, setValue] = useState<string>('')
  const [createCustomWatchlist] = useCreateCustomWatchlistMutation()
  const ref = useRef<HTMLInputElement>(null)
  const onSubmit = (e: any) => {
    e.stopPropagation()
    if (value !== '') {
      const newListName = value ? value : generateNewListName(watchlistsCount + 1)
      if (newListName) {
        createCustomWatchlist({ name: newListName }).finally(() => {
          refetchList()
        })
      }
    }
    setValue('')
  }
  const disabled = watchlistsCount >= 5

  return (
    <SimpleTooltip text={t`You can only create up to 5 watchlists`} disabled={!disabled} delay={100}>
      <CreateListWrapper
        $disabled={!!disabled}
        onClick={() => {
          ref.current?.focus()
        }}
      >
        <RowBetween>
          <InlineInput
            ref={ref}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={t`Create a new list`}
            maxLength={25}
          />
          <CreateListButtonWrapper onClick={onSubmit}>
            <Plus size={16} />
            <Text fontSize="14px">
              <Trans>Create list</Trans>
            </Text>
          </CreateListButtonWrapper>
        </RowBetween>
      </CreateListWrapper>
    </SimpleTooltip>
  )
}

const generateNewListName = (number: number) => {
  const ordinalStrings: { [key: number]: string } = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' }
  return `My ${ordinalStrings[number]} Watchlist`
}

let timer: NodeJS.Timeout
const debounce = (func: () => void, timeout = 1000) => {
  clearTimeout(timer)
  timer = setTimeout(() => func(), timeout)
}

export default function WatchlistButton({
  assetId,
  size,
  wrapperStyle,
}: {
  assetId?: string
  size?: number
  wrapperStyle?: CSSProperties
}) {
  const theme = useTheme()
  const dispatch = useDispatch()
  const [openMenu, setOpenMenu] = useState(false)
  const [openManageModal, setOpenManageModal] = useState(false)

  const { data, refetch: refetchWatchlists } = useGetWatchlistInformationQuery()
  const watchlists = data?.watchlists || []
  const numberOfWatchlists = watchlists?.length || 0

  const [updateWatchlistsPriorities] = useUpdateCustomizedWatchlistsPrioritiesMutation()

  const [addToWatchlist] = useAddToWatchlistMutation()
  const [removeFromWatchlist] = useRemoveFromWatchlistMutation()

  const ref = useRef<HTMLDivElement>(null)
  const reorderWrapperRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setOpenMenu(false)
  })

  const handleAddtoWatchlist = (id: number) => {
    if (id && assetId) {
      addToWatchlist({ userWatchlistId: id, assetId: +assetId })
    }
  }

  const handleRemoveFromWatchlist = (id: number) => {
    if (id && assetId) {
      removeFromWatchlist({ userWatchlistId: id, assetId: +assetId })
    }
  }

  const handleReorder = (newOrders: ICustomWatchlists[]) => {
    const orderedIds = newOrders.map(item => item.id).join(',')
    dispatch(
      kyberAIApi.util.updateQueryData('getWatchlistInformation', undefined, draft => {
        const order = orderedIds.split(',')
        draft.watchlists = draft.watchlists.sort((a, b) => {
          return order.indexOf(a.id.toString()) - order.indexOf(b.id.toString())
        })
        return draft
      }),
    )
    debounce(() => updateWatchlistsPriorities({ orderedIds }), 1000)
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <Popover
        show={openMenu}
        style={{ backgroundColor: theme.tableHeader, borderRadius: '20px' }}
        content={
          <MenuWrapper ref={ref}>
            {watchlists?.map((watchlists: ICustomWatchlists) => {
              const watched = !!assetId && !!watchlists.assetIds && watchlists.assetIds.includes(+assetId)
              return (
                <MenuOption key={watchlists.id}>
                  <StarWithAnimation
                    watched={watched}
                    size={16}
                    onClick={() => {
                      watched ? handleRemoveFromWatchlist(watchlists.id) : handleAddtoWatchlist(watchlists.id)
                    }}
                  />
                  {watchlists.name} ({watchlists.assetNumber})
                </MenuOption>
              )
            })}

            <Divider />
            <MenuOption
              justify="center"
              onClick={() => {
                setOpenManageModal(true)
                setOpenMenu(false)
              }}
            >
              <Icon id="assignment" size={20} /> <Trans>Manage Lists</Trans>
            </MenuOption>
          </MenuWrapper>
        }
        opacity={1}
        placement="bottom-start"
        noArrow={true}
      >
        <StarWithAnimation
          loading={false}
          watched={!!assetId && !!watchlists && watchlists?.some(item => item.assetIds?.includes(+assetId))}
          onClick={() => setOpenMenu(prev => !prev)}
          wrapperStyle={wrapperStyle}
          size={size}
        />
      </Popover>
      <Modal isOpen={openManageModal} width="380px">
        <ModalWrapper onClick={e => e.stopPropagation()}>
          <RowBetween>
            <Text>Manage Watchlists</Text>
            <ButtonAction onClick={() => setOpenManageModal(false)}>
              <X />
            </ButtonAction>
          </RowBetween>
          <CreateListInput watchlistsCount={numberOfWatchlists} refetchList={() => refetchWatchlists()} />
          <ReorderWrapper ref={reorderWrapperRef}>
            <Reorder.Group axis="y" values={watchlists} onReorder={handleReorder}>
              <AnimatePresence>
                {watchlists?.map(item => (
                  <WatchlistsItem
                    wrapperRef={reorderWrapperRef}
                    watchlistsCount={numberOfWatchlists}
                    key={item.id}
                    item={item}
                    refetchList={() => refetchWatchlists()}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </ReorderWrapper>
        </ModalWrapper>
      </Modal>
    </div>
  )
}
