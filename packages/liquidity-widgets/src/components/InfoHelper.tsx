import { CSSProperties, ReactNode, useCallback, useState } from 'react';

import { Placement } from '@popperjs/core';

import Info from '@/assets/svg/info.svg';
import Tooltip from '@/components/Tooltip';

export default function InfoHelper({
  text,
  size = 14,
  placement,
  style = {},
  color,
  width,
  noneMarginLeft,
}: {
  text: string | ReactNode;
  size?: number;
  isActive?: boolean;
  placement?: Placement;
  style?: CSSProperties;
  color?: string;
  width?: string;
  noneMarginLeft?: boolean;
}) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

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
      <Tooltip text={text} show={show} placement={placement} size={size} width={width}>
        <div
          onClick={open}
          onMouseEnter={open}
          onMouseLeave={close}
          className="flex items-center justify-center border-none bg-none outline-none cursor-default rounded-full text-subText"
        >
          <Info style={{ color, width: size, height: size }} />
        </div>
      </Tooltip>
    </span>
  );
}
