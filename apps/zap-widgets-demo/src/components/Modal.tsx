import ReactDOM from "react-dom";
import { ReactElement } from "react";

const Modal = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) => {
  return ReactDOM.createPortal(
    <div
      className="ks-zap-demo-modal-overlay fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-[#00000080] z-[999]"
      onClick={onClose}
    >
      <div
        className={`ks-zap-demo-modal-content max-w-[800px] max-h-[90%] overflow-auto rounded-md bg-transparent border-none outline-none p-0 [&::-webkit-scrollbar]:w-0 relative overflow-y-scroll w-full text-text transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.getElementById("ks-zap-demo-modal-root")!
  ) as ReactElement;
};

export default Modal;
