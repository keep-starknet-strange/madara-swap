import type { AccountInterface } from "starknet";

export interface WhitelistState {
  isWhitelisted: boolean;
  freeSlots: number;
  isCheckingWhitelist: boolean;
  isLoadingFreeSlots: boolean;
  isRegistering: boolean;
  register: (account: AccountInterface) => Promise<any>;
  checkWhitelisted: (account: AccountInterface) => Promise<any>;
  getFreeSlots: () => Promise<any>;
}

export const WHITELIST_INITIAL_STATE: WhitelistState = {
  isWhitelisted: true,
  freeSlots: -1, // Not init
  isCheckingWhitelist: false,
  isLoadingFreeSlots: false,
  isRegistering: false,
  register: () => Promise.reject(),
  checkWhitelisted: () => Promise.reject(),
  getFreeSlots: () => Promise.reject(),
};
