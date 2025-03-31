import "@kyber/ui/styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import "./App.css";

import Header from "./components/Header";
import ZapIn from "./components/ZapIn";
import ZapMigration from "./components/ZapMigration";
import ZapOut from "./components/ZapOut";
import { Tabs, TabsList, TabsTrigger } from "@kyber/ui/tabs";

enum Zap {
  ZAP_IN = "zap-in",
  ZAP_MIGRATION = "zap-migration",
  ZAP_OUT = "zap-out",
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
          className="w-[650px] mx-auto max-md:w-full"
          onValueChange={(value) => handleChangeTab(value as Zap)}
        >
          <TabsList className="grid w-full grid-cols-3 p-1">
            <TabsTrigger value={Zap.ZAP_IN}>Zap in</TabsTrigger>
            <TabsTrigger value={Zap.ZAP_MIGRATION}>Zap migration</TabsTrigger>
            <TabsTrigger value={Zap.ZAP_OUT}>Zap out</TabsTrigger>
          </TabsList>
          <ZapIn />
          <ZapMigration />
          <ZapOut />
        </Tabs>
      </div>
    </>
  );
}

export default App;
