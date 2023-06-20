import type { AddTransactionResponse, Status } from "starknet";

export interface StoredTransaction {
  code: Status;
  hash: string;
  address?: string;
  lastChecked: string;
  description: string;
  successCallback?: () => void;
  errorCallback?: () => void;
}

export type StoredTransactionsState = StoredTransaction[];

export interface TransactionsProviderState {
  transactions: StoredTransactionsState;
  addTransaction: (
    payload: AddTransactionResponse,
    description: string,
    successCallback: () => void,
    errorCallback: () => void
  ) => void;
}

export const TRANSACTIONS_PROVIDER_INITIAL_STATE: TransactionsProviderState = {
  transactions: [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addTransaction: (tx) => undefined,
};
