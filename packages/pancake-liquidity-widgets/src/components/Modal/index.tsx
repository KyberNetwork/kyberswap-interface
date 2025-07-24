import ReactDOM from "react-dom";
import { ReactElement } from "react";

const Modal = ({
  isOpen,
  children,
  onClick,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  if (!isOpen) return <></>;

  return ReactDOM.createPortal(
    <div className="pcs-lw-modal-overlay" onClick={onClick}>
      <div
        className="pcs-lw-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    // already created in Widget/index.ts
    document.getElementById("pcs-lw-modal-root")!
  ) as ReactElement;
};

export default Modal;
