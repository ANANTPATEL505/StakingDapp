import type { Eip1193Provider } from "ethers";

type Listener = (...args: any[]) => void;

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      on?: (event: string, cb: Listener) => void;
      removeListener?: (event: string, cb: Listener) => void;
    };
  }
}

export {};
