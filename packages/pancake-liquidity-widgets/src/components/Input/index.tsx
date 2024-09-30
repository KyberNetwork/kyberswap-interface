import "./Input.scss";

export default function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input className={`ks-lw-input ${props.className || ""}`} {...props} />
  );
}
