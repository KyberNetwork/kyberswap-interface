import { ConnectButton } from "@rainbow-me/rainbowkit";

const Header = () => {
  return (
    <div className="flex items-center justify-between w-full p-4 bg-[#1c1c1c] max-md:flex-col max-md:items-start max-md:gap-2 max-md:pb-2">
      <div className="flex items-center gap-2">
        <img width={28} src="./favicon.png" alt="logo" />
        <p className="text-white">Kyberswap Zap</p>
      </div>
      <ConnectButton />
    </div>
  );
};

export default Header;
