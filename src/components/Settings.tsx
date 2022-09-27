import { useState } from "react";
import styled from "styled-components";

const Label = styled.div`
  font-size: 0.875rem;
  text-align: left;
`;

const Input = styled.input`
  background: ${({ theme }) => theme.bg2};
  border: none;
  outline: none;
  border-radius: 999px;
  padding: 0.75rem;
  color: #fff;
`;

const BPS = 10_000;

function Settings({
  slippage,
  setSlippage,
}: {
  slippage: number;
  setSlippage: (value: number) => void;
}) {
  const [v, setV] = useState(((slippage * 100) / BPS).toString());
  return (
    <>
      <Label>Max Slippage</Label>
      <Input
        value={v}
        onChange={(e) => {
          setV(e.target.value);
        }}
        onBlur={() => {
          const temp = parseFloat(v);
          if (temp) setSlippage((temp * BPS) / 100);
        }}
      />
    </>
  );
}

export default Settings;
