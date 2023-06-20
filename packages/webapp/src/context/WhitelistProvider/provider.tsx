import type React from "react";

import { WhitelistContext } from "./context";
import useWhitelistManager from "./manager";

export interface WalletBaseProviderProps {
  children: React.ReactNode;
}

export function WhitelistProvider({ children }: WalletBaseProviderProps): JSX.Element {
  const state = useWhitelistManager();
  return <WhitelistContext.Provider value={state}>{children}</WhitelistContext.Provider>;
}
