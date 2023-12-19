import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect, useState } from 'react'
import * as AllIcons from 'react-feather'
import { Flex, Text } from 'rebass'

import sprite from 'assets/svg/sprite.svg'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import { ICON_IDS } from 'constants/index'

const SpriteIcon = () => {
  return (
    <Flex flexWrap="wrap" sx={{ gap: '8px' }}>
      {ICON_IDS.map((id: string) => (
        <Flex
          sx={{ padding: '1rem', gap: '1rem', alignItems: 'center', border: '1px solid #000000', borderRadius: '8px' }}
          flexDirection="column"
          key={id}
        >
          <svg style={{ display: 'block', width: '24px', height: '24px' }}>
            <use href={`${sprite}#${id}`} width="24" height="24" />
          </svg>
          <Flex sx={{ gap: '4px' }} alignItems="center">
            {id}
            <CopyHelper toCopy={`<Icon id="${id}" size={16} />`} />
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}

const ReactFeather = () => {
  return (
    <Flex flexWrap="wrap" sx={{ gap: '8px' }}>
      {Object.keys(AllIcons).map(key => {
        const Icon = AllIcons[key]
        return (
          <Flex
            sx={{
              padding: '1rem',
              gap: '1rem',
              alignItems: 'center',
              border: '1px solid #000000',
              borderRadius: '8px',
            }}
            flexDirection="column"
            key={key}
          >
            <Icon />

            <Flex sx={{ gap: '4px' }} alignItems="center">
              {key}
              <CopyHelper toCopy={`<${key} size={24} />`} />
            </Flex>
          </Flex>
        )
      })}
    </Flex>
  )
}

const allSvgFiles = import.meta.glob('../../../assets/**')

const SvgIcons = () => {
  const [svgComponents, setSvgComponents] = useState<any>([])

  useEffect(() => {
    const array = Object.keys(allSvgFiles).map(key => ({ path: key, id: key.split('/').pop(), fn: allSvgFiles[key]() }))

    Promise.all(array.map(el => el.fn))
      .then(data => {
        setSvgComponents(
          data.map((e: any, i) => {
            const id = array[i].id
            return {
              render: () => <img src={e.default} height="24px" />,
              id,
              path: array[i].path,
            }
          }),
        )
      })
      .catch(console.error)
  }, [])

  return (
    <Flex flexWrap="wrap" sx={{ gap: '8px' }}>
      {svgComponents.map((el: any) => {
        const title: string = el.id
        return (
          <Flex
            sx={{
              padding: '1rem',
              gap: '1rem',
              alignItems: 'center',
              justifyItems: 'center',
              border: '1px solid #000000',
              borderRadius: '8px',
            }}
            flexDirection="column"
            key={el.id}
          >
            {el.render?.()}
            <Flex alignItems="center">
              {title}
              <CopyHelper toCopy={`${el.path.slice(9)}`} />
            </Flex>
          </Flex>
        )
      })}
    </Flex>
  )
}

const allIconComponentsFiles = import.meta.glob('../../../components/Icons/*')

const IconComponents = () => {
  const [iconComponents, setIconComponents] = useState<any>([])

  useEffect(() => {
    const componentArr = Object.keys(allIconComponentsFiles).map(key => ({
      id: key.split('/').pop()?.replace('.tsx', ''),
      fn: allIconComponentsFiles[key](),
    }))
    Promise.all(componentArr.map(el => el.fn))
      .then(data => {
        setIconComponents(
          data.map((e: any, i) => {
            const id = componentArr[i].id
            return {
              render: e.default || (() => null),
              id,
            }
          }),
        )
      })
      .catch(console.error)
  }, [])

  return (
    <Flex flexWrap="wrap" sx={{ gap: '8px' }}>
      {iconComponents.map((el: any) => {
        const key: string = el.id
        return (
          <Flex
            sx={{
              padding: '1rem',
              gap: '1rem',
              alignItems: 'center',
              justifyItems: 'center',
              border: '1px solid #000000',
              borderRadius: '8px',
            }}
            flexDirection="column"
            key={key}
          >
            {(() => {
              try {
                return typeof el?.render === 'function'
                  ? el.render({ color: '#000000' })
                  : React.createElement(el?.render)
              } catch (error) {
                return 'Display Error'
              }
            })()}
            <Flex alignItems="center">
              {key}.tsx
              <CopyHelper toCopy={`import ${key} from 'components/Icons/${key}'`} />
            </Flex>
          </Flex>
        )
      })}
    </Flex>
  )
}
const Icons = () => {
  return (
    <Flex flexDirection="column">
      <Text fontWeight="500" fontSize="24px" marginBottom="1rem">
        Svg Sprite Icons
      </Text>
      <SpriteIcon />

      <Divider style={{ margin: '24px 0' }} />

      <Text fontWeight="500" fontSize="24px" marginBottom="1rem">
        React Feather
      </Text>
      <ReactFeather />

      <Divider style={{ margin: '24px 0' }} />

      <Text fontWeight="500" fontSize="24px" marginBottom="1rem">
        Folder: components/Icons
      </Text>
      <IconComponents />

      <Divider style={{ margin: '24px 0' }} />

      <Text fontWeight="500" fontSize="24px" marginBottom="1rem">
        Folder: assets
      </Text>
      <SvgIcons />
    </Flex>
  )
}

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof SpriteIcon> = {
  title: 'Kyberswap/Shared Components/Icons',
  component: Icons,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: { control: 'text' },
    color: { control: 'text' },
    theme: { control: 'none' },
  },
}

export default meta
type Story = StoryObj<typeof Icons>

export const Icon: Story = {}
