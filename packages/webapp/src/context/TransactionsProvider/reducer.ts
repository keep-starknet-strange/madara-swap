import type { AddTransactionResponse, Status } from "starknet";

import type { StoredTransaction, StoredTransactionsState } from "./model";

interface AddTransaction {
  type: "ADD_TRANSACTION";
  payload: AddTransactionResponse;
  description: string;
  successCallback: () => void;
  errorCallback: () => void;
}

interface UpdateTransactions {
  type: "UPDATE_TRANSACTIONS";
  payload: StoredTransaction[];
}

type Action = AddTransaction | UpdateTransactions;

const transactionsReducer = (state: StoredTransactionsState, action: Action): StoredTransactionsState => {
  switch (action.type) {
    case "ADD_TRANSACTION": {
      const storedTx = {
        hash: action.payload.transaction_hash,
        code: "NOT_RECEIVED" as Status,
        address: action.payload.address,
        description: action.description,
        lastChecked: "",
        successCallback: action.successCallback,
        errorCallback: action.errorCallback,
      };
      return [storedTx, ...state];
    }
    case "UPDATE_TRANSACTIONS": {
      return action.payload;
    }
    default: {
      return state;
    }
  }
};

export default transactionsReducer;
