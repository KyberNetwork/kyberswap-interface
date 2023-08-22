import { Trans, t } from '@lingui/macro'
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Check, Plus, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled, { css, useTheme } from 'styled-components'

import { ButtonAction } from 'components/Button'
import Column from 'components/Column'
import Divider from 'components/Divider'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Popover from 'components/Popover'
import Row, { RowBetween, RowFit } from 'components/Row'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { MEDIA_WIDTHS } from 'theme'

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
  overflow: scroll;
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

interface IOption {
  id: number
  text: string
  watched: boolean
}
const options = [
  { id: 1, text: 'Default List (20)', watched: false },
  { id: 2, text: 'List 1 (2)', watched: false },
  { id: 3, text: 'Side Token (0)', watched: false },
]

function WatchlistItem({
  item,
  onValueChange,
  onRemove,
}: {
  item: IOption
  onValueChange?: (newValue: string) => void
  onRemove?: () => void
}) {
  const controls = useDragControls()
  const theme = useTheme()
  const [isEditting, setIsEditting] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const preEditValue = useRef<string>('')

  const startEdit = () => {
    setIsEditting(true)
    preEditValue.current = item.text
  }

  const exitEdit = () => {
    setIsEditting(false)
    onValueChange?.(preEditValue.current)
  }

  const submitEdit = () => {
    setIsEditting(false)
    onValueChange?.(ref.current?.value || '')
  }

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      const element = e.target as HTMLInputElement
      if (e.key === 'Enter') {
        e.preventDefault() // Prevent line break
        setIsEditting(false)
        onValueChange?.(element?.value)
      }
      if (e.key === 'Escape') {
        setIsEditting(false)
        element.value = item.text
      }
    }
    const element = ref.current
    if (isEditting && element) {
      element.focus()
      element.setAttribute('value', item.text)
      element.setSelectionRange(item.text.length, item.text.length)
      element.addEventListener('keydown', keydownHandler)
    }
    return () => {
      element?.removeEventListener('keydown', keydownHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditting, item, onValueChange])

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, scale: 1 }}
      animate={{
        opacity: 1,
        transition: { duration: 0.1 },
      }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      whileDrag={{ boxShadow: '2px 5px 10px rgba(0,0,0,0.3)', scale: 1.02 }}
    >
      <RowBetween gap="4px">
        <Row gap="2px">
          <GrabButton onPointerDown={e => controls.start(e)} style={{ cursor: 'grab' }}>
            <Icon id="drag-indicator" />
          </GrabButton>
          {isEditting ? <InlineInput ref={ref} maxLength={25} /> : <div style={{ flex: 1 }}>{item.text}</div>}
        </Row>
        <RowFit gap="2px" flexShrink={0}>
          {isEditting ? (
            <>
              <ButtonAction onClick={submitEdit}>
                <Check size={16} color={theme.primary} strokeWidth="3px" />
              </ButtonAction>
              <ButtonAction onClick={exitEdit}>
                <X size={16} color={theme.red} strokeWidth="3px" />
              </ButtonAction>
            </>
          ) : (
            <ButtonAction onClick={startEdit}>
              <Icon id="pencil" size={16} />
            </ButtonAction>
          )}
          <ButtonAction onClick={() => onRemove?.()}>
            <Icon id="trash" size={16} />
          </ButtonAction>
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
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
  transition: all 0.1s;
  gap: 4px;
  :hover {
    color: ${({ theme }) => theme.text};
  }
`

const CreateListInput = ({ onCreate, disabled }: { onCreate: (listName: string) => void; disabled?: boolean }) => {
  const [value, setValue] = useState<string>('')
  const ref = useRef<HTMLInputElement>(null)
  const onSubmit = (e: any) => {
    e.stopPropagation()

    if (value !== '') {
      onCreate(value)
    }
    setValue('')
  }

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

export default function WatchlistButton() {
  const [openMenu, setOpenMenu] = useState(false)
  const [openManageModal, setOpenManageModal] = useState(false)
  const [listOptions, setListOptions] = useState(options)

  const theme = useTheme()
  const above768 = useMedia(`(min-width:${MEDIA_WIDTHS.upToSmall}px)`)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setOpenMenu(false)
  })
  const handleSingleValueChange = (newText: string, index: number) => {
    const newOptions = [...listOptions]
    newOptions[index].text = newText
    setListOptions(newOptions)
  }
  const handleRemoveValue = (index: number) => {
    const newOptions = [...listOptions]
    newOptions.splice(index, 1)
    setListOptions(newOptions)
  }
  const handleCreateNewList = (newListName: string) => {
    const id = Math.max(...listOptions.map(i => i.id)) + 1
    setListOptions([{ id: id, text: newListName, watched: false }, ...listOptions])
  }
  return (
    <>
      <Popover
        show={openMenu}
        style={{ backgroundColor: theme.tableHeader, borderRadius: '20px' }}
        content={
          <MenuWrapper ref={ref}>
            {listOptions.map((t: IOption, i: number) => (
              <MenuOption key={t.id}>
                <StarWithAnimation
                  loading={false}
                  watched={listOptions[i].watched}
                  size={16}
                  onClick={() =>
                    setListOptions(prev => {
                      const newListOptions = [...prev]
                      newListOptions[i].watched = !newListOptions[i].watched
                      return newListOptions
                    })
                  }
                />
                {t.text}
              </MenuOption>
            ))}
            <Divider />
            <MenuOption
              justify="center"
              onClick={() => {
                setOpenManageModal(true)
                setOpenMenu(false)
              }}
            >
              <Icon id="assignment" /> Manage Lists
            </MenuOption>
          </MenuWrapper>
        }
        opacity={1}
        placement="bottom-start"
        noArrow={true}
      >
        <StarWithAnimation
          loading={false}
          watched={false}
          onClick={() => setOpenMenu(prev => !prev)}
          wrapperStyle={{
            color: theme.subText,
            backgroundColor: theme.darkMode ? theme.buttonGray : theme.background,
            height: above768 ? '36px' : '32px',
            width: above768 ? '36px' : '32px',
            borderRadius: '100%',
          }}
        />
      </Popover>
      <Modal isOpen={openManageModal} width="380px">
        <ModalWrapper>
          <RowBetween>
            <Text>Manage Watchlists</Text>
            <ButtonAction onClick={() => setOpenManageModal(false)}>
              <X />
            </ButtonAction>
          </RowBetween>
          <CreateListInput onCreate={handleCreateNewList} disabled={listOptions.length >= 5} />
          <ReorderWrapper>
            <Reorder.Group
              axis="y"
              values={listOptions}
              onReorder={newOrders => {
                setListOptions(newOrders)
              }}
            >
              <AnimatePresence>
                {listOptions.map((item, i) => (
                  <WatchlistItem
                    key={item.id}
                    item={item}
                    onValueChange={newValue => handleSingleValueChange(newValue, i)}
                    onRemove={() => handleRemoveValue(i)}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </ReorderWrapper>
        </ModalWrapper>
      </Modal>
    </>
  )
}
