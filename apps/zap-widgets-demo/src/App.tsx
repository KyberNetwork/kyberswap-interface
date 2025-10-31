import "@kyber/ui/styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.css";

import Header from "@/components/Header";
import ZapIn from "@/components/ZapIn";
import ZapMigration from "@/components/ZapMigration";
import ZapOut from "@/components/ZapOut";
import PancakeZapIn from "@/components/PancakeZapIn";
import ZapCreatePool from "@/components/ZapCreatePool";
import { Tabs, TabsList, TabsTrigger } from "@kyber/ui";

// eslint-disable-next-line react-refresh/only-export-components
export enum Zap {
  ZAP_IN = "zap-in",
  ZAP_MIGRATION = "zap-migration",
  ZAP_OUT = "zap-out",
  PANCAKE_ZAP_IN = "pancake-zap-in",
  ZAP_CREATE_POOL = "zap-create-pool",
}

function App() {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const zap = params.get("zap");

  const openZap =
    zap && Object.values(Zap).includes(zap as Zap) ? zap : Zap.ZAP_IN;

  const handleChangeTab = (value: Zap) => {
    window.history.pushState({}, "", `?zap=${value}`);
  };

  return (
    <>
      <Header />

      <div className="w-full p-4">
        <Tabs
          defaultValue={openZap}
          className="w-[700px] mx-auto max-md:w-full"
          onValueChange={(value) => handleChangeTab(value as Zap)}
        >
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5 p-1">
            <TabsTrigger value={Zap.ZAP_IN}>Zap in</TabsTrigger>
            <TabsTrigger value={Zap.ZAP_MIGRATION}>Zap migration</TabsTrigger>
            <TabsTrigger value={Zap.ZAP_OUT}>Zap out</TabsTrigger>
            <TabsTrigger value={Zap.PANCAKE_ZAP_IN}>Pancake zap in</TabsTrigger>
            <TabsTrigger value={Zap.ZAP_CREATE_POOL}>
              Zap create pool
            </TabsTrigger>
          </TabsList>
          <ZapIn />
          <ZapMigration />
          <ZapOut />
          <PancakeZapIn />
          <ZapCreatePool />
        </Tabs>
      </div>
    </>
  );
}

export default App;
