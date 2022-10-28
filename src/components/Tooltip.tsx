import { ReactNode } from "react";
import styled from "styled-components";

import Popover, { PopoverProps } from "./Popover";

const TooltipContainer = styled.div<{ width?: string; size?: number }>`
  width: ${({ width }) => width || "228px"};
  padding: 0.6rem 1rem;
  line-height: 150%;
  font-weight: 400;
  font-size: ${({ size }) => size || 14}px;
`;

interface TooltipProps extends Omit<PopoverProps, "content"> {
  text: string | ReactNode;
  width?: string;
  size?: number;
}

export default function Tooltip({ text, width, size, ...rest }: TooltipProps) {
  return (
    <Popover
      content={
        text ? (
          <TooltipContainer width={width} size={size}>
            {text}
          </TooltipContainer>
        ) : null
      }
      {...rest}
    />
  );
}
