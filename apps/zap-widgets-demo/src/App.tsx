import "@kyberswap/liquidity-widgets/dist/style.css";
import "@kyberswap/zap-migration-widgets/dist/style.css";
import "@rainbow-me/rainbowkit/styles.css";
import "@kyber/ui/styles.css";
import "./App.css";

import { Tabs, TabsList, TabsTrigger } from "@kyber/ui/tabs";
import Header from "./components/Header";
import ZapIn from "./components/ZapIn";
import ZapMigration from "./components/ZapMigration";
import ZapOut from "./components/ZapOut";

function App() {
  return (
    <>
      <Header />

      <div className="w-full p-4">
        <Tabs defaultValue="zap-in" className="w-[650px] mx-auto max-md:w-full">
          <TabsList className="grid w-full grid-cols-3 p-1">
            <TabsTrigger value="zap-in">Zap in</TabsTrigger>
            <TabsTrigger value="zap-migration">Zap migration</TabsTrigger>
            <TabsTrigger value="zap-out">Zap out</TabsTrigger>
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
