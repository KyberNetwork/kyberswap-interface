import { Placement } from "@popperjs/core";
import { CSSProperties, ReactNode, useCallback, useState } from "react";
import Info from "@/assets/svg/info.svg";

import Tooltip from "../Tooltip";

export default function InfoHelper({
  text,
  size = 14,
  placement,
  style,
  color,
}: {
  text: string | ReactNode;
  size?: number;
  isActive?: boolean;
  placement?: Placement;
  style?: CSSProperties;
  color?: string;
}) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  return (
    <div className="ks-lw-helper-wrapper" style={style}>
      <Tooltip text={text} show={show} placement={placement} size={size}>
        <div
          className="ks-lw-wrapper"
          onClick={open}
          onMouseEnter={open}
          onMouseLeave={close}
        >
          <Info style={{ color, width: size, height: size }} />
        </div>
      </Tooltip>
    </div>
  );
}
