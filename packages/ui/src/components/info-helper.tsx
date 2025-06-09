import { CSSProperties, ReactNode } from 'react';

import { Placement } from '@popperjs/core';

import Info from '../assets/icons/info.svg?react';
import { MouseoverTooltip } from './Tooltip';

export function InfoHelper({
  text,
  size = 14,
  placement,
  style = {},
  color,
  width,
  noneMarginLeft,
  delay,
}: {
  text: string | ReactNode;
  size?: number;
  isActive?: boolean;
  placement?: Placement;
  style?: CSSProperties;
  color?: string;
  width?: string;
  noneMarginLeft?: boolean;
  delay?: number;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        marginLeft: noneMarginLeft ? '0' : '0.25rem',
        alignItems: 'center',
        lineHeight: '100%',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      <MouseoverTooltip text={text} placement={placement} size={size} width={width} delay={delay}>
        <div className="flex items-center justify-center border-none bg-none outline-none cursor-default rounded-full text-subText">
          <Info style={{ color, width: size, height: size }} />
        </div>
      </MouseoverTooltip>
    </span>
  );
}
