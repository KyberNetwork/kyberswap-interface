import { Placement } from "@popperjs/core";
import { Portal } from "@kyber/ui/portal";
import React, { useCallback, useState } from "react";
import { usePopper } from "react-popper";
import { useInterval } from "@kyber/hooks/use-interval";

export interface PopoverProps {
  content: React.ReactNode;
  show: boolean;
  children: React.ReactNode;
  placement?: Placement;
  noArrow?: boolean;
}

export default function Popover({
  content,
  show,
  children,
  placement = "auto",
  noArrow = false,
}: PopoverProps) {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, update, attributes } = usePopper(
    referenceElement,
    popperElement,
    {
      placement,
      strategy: "fixed",
      modifiers: [
        { name: "offset", options: { offset: [8, 8] } },
        { name: "arrow", options: { element: arrowElement } },
      ],
    }
  );
  const updateCallback = useCallback(() => {
    update && update();
  }, [update]);
  useInterval(updateCallback, show ? 100 : null);

  return (
    <>
      <div className="inline-block" ref={setReferenceElement}>
        {children}
      </div>
      <Portal>
        <div className="pcs-lw-style">
          <div
            className="pcs-lw-popover"
            data-visibility={show}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            {content}
            {noArrow || (
              <div
                className={`arrow arrow-${
                  attributes.popper?.["data-popper-placement"] ?? ""
                }`}
                ref={setArrowElement}
                style={styles.arrow}
                {...attributes.arrow}
              />
            )}
          </div>
        </div>
      </Portal>
    </>
  );
}
