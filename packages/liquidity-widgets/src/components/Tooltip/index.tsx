import { ReactNode, useCallback, useRef, useState } from "react";

import Popover, { PopoverProps } from "../Popover";

interface TooltipProps extends Omit<PopoverProps, "content"> {
  text: string | ReactNode;
  delay?: number;
  width?: string;
  maxWidth?: string;
  size?: number;
  disableTooltip?: boolean;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  dataTestId?: string;
}

export default function Tooltip({ text, width, size, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text ? (
          <div
            style={{
              width: width || "max-content",
              padding: "10px 16px",
              lineHeight: 1.5,
              fontWeight: "400",
              fontSize: `${size || 14}px`,
            }}
          >
            {text}
          </div>
        ) : null
      }
      {...rest}
    />
  );
}

export function MouseoverTooltip({
  children,
  disableTooltip,
  delay,
  ...rest
}: Omit<TooltipProps, "show">) {
  const [show, setShow] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const hovering = useRef(false);
  const open = useCallback(() => {
    if (rest.text) {
      hovering.current = true;
      setTimeout(() => {
        if (hovering.current) setShow(true);
      }, delay || 50);

      if (closeTimeout) {
        clearTimeout(closeTimeout);
        setCloseTimeout(null);
      }
    }
  }, [rest.text, closeTimeout, delay]);
  const close = useCallback(
    () =>
      setCloseTimeout(
        setTimeout(() => {
          hovering.current = false;
          setShow(false);
        }, 50)
      ),
    []
  );
  if (disableTooltip) return <>{children}</>;
  return (
    <Tooltip {...rest} show={show} onMouseEnter={open} onMouseLeave={close}>
      <div
        onMouseOver={open}
        onMouseLeave={close}
        style={{ display: "flex", alignItems: "center" }}
      >
        {children}
      </div>
    </Tooltip>
  );
}
