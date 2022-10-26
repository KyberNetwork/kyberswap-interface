import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Dex } from "../hooks/useSwap";
import { Input } from "./SelectCurrency";

const SourceList = styled.div`
  width: 100%;
  height: 364px;
  max-height: 364px;
  overflow-y: scroll;
  overflow-x: hidden;

  display: flex;
  flex-direction: column;

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 8px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
    border-radius: 999px;
  }
`;

const Checkbox = styled.input`
  position: relative;
  transform: scale(1.35);
  accent-color: ${({ theme }) => theme.accent};

  :indeterminate::before {
    content: "";
    display: block;
    color: ${({ theme }) => theme.text};
    width: 13px;
    height: 13px;
    background-color: ${({ theme }) => theme.accent};
    border-radius: 2px;
  }
  :indeterminate::after {
    content: "";
    display: block;
    width: 7px;
    height: 7px;
    border: solid ${({ theme }) => theme.text};
    border-width: 2px 0 0 0;
    position: absolute;
    top: 5.5px;
    left: 3px;
  }
`;

const LiquiditySourceHeader = styled.div`
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
  background: ${({ theme }) => theme.inputBackground};
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 500;
  padding: 12px;
  color: ${({ theme }) => theme.subText};
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Row = styled.div`
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  column-gap: 16px;
  padding: 12px;
`;

const ImageWrapper = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;

  img {
    width: 100%;
    height: auto;
  }
`;

const SourceName = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
`;

function DexesSetting({
  allDexes,
  excludedDexes,
  setExcludedDexes,
}: {
  allDexes: Dex[];
  excludedDexes: Dex[];
  setExcludedDexes: (v: Dex[]) => void;
}) {
  const [search, setSearch] = useState("");

  const excludedDexIds = excludedDexes.map((item) => item.dexId);
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!allRef.current) return;
    if (excludedDexes.length === 0) {
      allRef.current.indeterminate = false;
      allRef.current.checked = true;
    } else if (excludedDexes.length === allDexes.length) {
      allRef.current.indeterminate = false;
      allRef.current.checked = false;
    } else {
      allRef.current.indeterminate = true;
      allRef.current.checked = false;
    }
  }, [allDexes.length, excludedDexes.length]);

  return (
    <>
      <Input
        placeholder="Search for a liquidity source"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={{ flex: 1 }}>
        <LiquiditySourceHeader>
          <Checkbox
            type="checkbox"
            ref={allRef}
            onChange={(e) => {
              if (e.currentTarget.checked) setExcludedDexes([]);
              else setExcludedDexes(allDexes);
            }}
          />
          Liquidity Sources
        </LiquiditySourceHeader>

        <SourceList>
          {allDexes
            .filter((item) => item.name.toLowerCase().includes(search.trim()))
            .map((item) => (
              <Row key={item.dexId}>
                <Checkbox
                  type="checkbox"
                  checked={!excludedDexIds.includes(item.dexId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExcludedDexes(
                        excludedDexes.filter((i) => i.dexId !== item.dexId)
                      );
                    } else {
                      setExcludedDexes([...excludedDexes, item]);
                    }
                  }}
                />
                <ImageWrapper>
                  <img src={item.logoURL} alt="" />
                </ImageWrapper>
                <SourceName>{item.name}</SourceName>
              </Row>
            ))}
        </SourceList>
      </div>
    </>
  );
}

export default DexesSetting;
