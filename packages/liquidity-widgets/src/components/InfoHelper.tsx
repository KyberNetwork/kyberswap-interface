import { Placement } from "@popperjs/core";
import { CSSProperties, ReactNode, useCallback, useState } from "react";
import Info from "../assets/info.svg";

import Tooltip from "./Tooltip";
import { useWidgetInfo } from "../hooks/useWidgetInfo";

export default function InfoHelper({
  text,
  size = 14,
  placement,
  style = {},
  color,
  width,
}: {
  text: string | ReactNode;
  size?: number;
  isActive?: boolean;
  placement?: Placement;
  style?: CSSProperties;
  color?: string;
  width?: string;
}) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);
  const { theme } = useWidgetInfo();

  return (
    <span
      style={{
        display: "inline-flex",
        justifyContent: "center",
        marginLeft: "0.25rem",
        alignItems: "center",
        lineHeight: "100%",
        verticalAlign: "middle",
        ...style,
      }}
    >
      <Tooltip
        text={text}
        show={show}
        placement={placement}
        size={size}
        width={width}
      >
        <div
          onClick={open}
          onMouseEnter={open}
          onMouseLeave={close}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "none",
            outline: "none",
            cursor: "default",
            borderRadius: "36px",
            color: theme.subText,
          }}
        >
          <Info style={{ color, width: size, height: size }} />
        </div>
      </Tooltip>
    </span>
  );
}
