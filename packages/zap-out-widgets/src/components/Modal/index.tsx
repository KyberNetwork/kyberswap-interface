import ReactDOM from "react-dom";
import { ReactElement } from "react";

const Modal = ({
  isOpen,
  children,
  onClick,
  modalContentClass,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  modalContentClass?: string;
}) => {
  if (!isOpen) return <></>;

  return ReactDOM.createPortal(
    <div className="ks-lw-modal-overlay" onClick={onClick}>
      <div
        className={`ks-lw-modal-content ${modalContentClass || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    // already created in Widget/index.ts
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.getElementById("ks-lw-modal-root")!
  ) as ReactElement;
};

export default Modal;
