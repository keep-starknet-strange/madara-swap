import React from "react";
import type { GetBlockResponse } from "starknet";

import { useStarknet } from "../StarknetProvider";

import { BlockContext } from "./context";

export interface BlockHashProviderProps {
  children: React.ReactNode;
  interval?: number;
}

export function BlockHashProvider({ interval, children }: BlockHashProviderProps): JSX.Element {
  const { provider } = useStarknet();
  const [blockHash, setBlockHash] = React.useState<string | undefined>(undefined);
  const [blockNumber, setBlockNumber] = React.useState<number | undefined>(undefined);

  const fetchBlockHash = React.useCallback(() => {
    provider
      .getBlock()
      .then((block: GetBlockResponse) => {
        setBlockHash(block.block_hash);
        // @ts-ignore
        setBlockNumber(block.block_number);
      })
      .catch(console.log);
  }, [provider]);

  React.useEffect(() => {
    fetchBlockHash();
    const intervalId = setInterval(() => {
      fetchBlockHash();
    }, interval ?? 5000);
    return () => clearInterval(intervalId);
  }, [interval, fetchBlockHash]);

  return <BlockContext.Provider value={{ blockHash, blockNumber }}>{children}</BlockContext.Provider>;
}
