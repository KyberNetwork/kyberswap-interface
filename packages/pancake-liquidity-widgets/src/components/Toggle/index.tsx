import React, { CSSProperties, ReactNode } from "react";

export interface ToggleProps {
  id?: string;
  isActive: boolean;
  toggle: () => void;
  style?: CSSProperties;
  icon?: ReactNode;
}

const Toggle: React.FC<ToggleProps> = ({
  id,
  isActive,
  toggle,
  style,
  icon,
}) => {
  return (
    <div
      id={id}
      onClick={toggle}
      data-active={isActive}
      className="relative w-14 h-7 bg-disabled rounded-full transition-all duration-200 ease-in-out cursor-pointer data-[active='true']:bg-[#31d0aa]"
      style={{ boxShadow: "0px 2px 0px -1px #0000000f inset", ...style }}
    >
      <div
        data-active={isActive}
        className="absolute top-1/2 left-[2px] w-6 h-6 bg-cardBackground rounded-[50%] -translate-y-1/2 transition-all duration-200 ease-in-out flex items-center justify-center data-[active='true']:bg-cardBackground data-[active='true']:left-[30px] data-[active='true']:opacity-100"
      >
        {isActive && icon}
      </div>
    </div>
  );
};

export default Toggle;
