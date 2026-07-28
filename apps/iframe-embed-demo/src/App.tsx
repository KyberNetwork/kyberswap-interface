import "./App.css";

import { useState } from "react";

import BrowserFrame from "@/components/BrowserFrame";
import ChainTabs from "@/components/ChainTabs";
import { CHAINS, partnerSwapUrl, targetOrigin } from "@/constants";

function App() {
  const [chainId, setChainId] = useState(CHAINS[0].id);
  const src = partnerSwapUrl(targetOrigin, chainId);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center px-6 py-12">
      <img src="./favicon.png" width={36} height={36} alt="KyberSwap" className="rounded-lg" />
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-text">Partner Embed Playground</h1>
      <p className="mt-1.5 text-sm text-subText">
        The KyberSwap <span className="text-text">/partner-swap</span> widget, embedded
      </p>

      <ChainTabs value={chainId} onChange={setChainId} className="mt-8" />

      <BrowserFrame address={window.location.origin} className="mt-6">
        <iframe
          title="KyberSwap partner-swap"
          src={src}
          allow="clipboard-read; clipboard-write; web-share"
          className="block h-[620px] w-full bg-[#0f0f0f]"
        />
      </BrowserFrame>

      <p className="mt-4 max-w-[380px] text-center text-xs leading-relaxed text-subText">
        A blank frame means KyberSwap refused to embed on this origin — the frame-ancestors block is logged in the
        browser console.
      </p>
    </div>
  );
}

export default App;
