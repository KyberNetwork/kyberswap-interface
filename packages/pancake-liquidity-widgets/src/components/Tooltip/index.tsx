import { ReactNode, useCallback, useRef, useState } from "react";

import Popover, { PopoverProps } from "@/components/Popover";

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

export default function Tooltip({
  text,
  width,
  size,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: TooltipProps) {
  return (
    <Popover
      content={
        text ? (
          <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="py-[10px] px-4 font-normal"
            style={{
              width: width || "max-content",
              lineHeight: 1.5,
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
  const [closeTimeout, setCloseTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
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
        className="flex items-center"
      >
        {children}
      </div>
    </Tooltip>
  );
}
