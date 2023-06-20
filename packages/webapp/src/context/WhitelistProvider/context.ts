import React from "react";

import type { WhitelistState } from "./model";
import { WHITELIST_INITIAL_STATE } from "./model";

export const WhitelistContext = React.createContext<WhitelistState>(WHITELIST_INITIAL_STATE);

export function useWhitelist() {
  return React.useContext(WhitelistContext);
}
