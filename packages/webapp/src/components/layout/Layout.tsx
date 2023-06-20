import { Box, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { usePool } from "../../context/PoolProvider";
import { useStarknet } from "../../context/StarknetProvider";
import { useWallet } from "../../context/WalletProvider";

import { Footer, Header } from ".";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { account, connected, setConnected } = useStarknet();
  const { tokens, getTokenBalanceForAll } = useWallet();
  const { pools, getLPBalanceForAll } = usePool();
  const { getAllPools } = usePool();
  const [isWalletInitialized, setWalletInitialized] = useState(false);

  useEffect(() => {
    getAllPools();
  }, [getAllPools]);

  // Once user is connected, fetch is balance
  useEffect(() => {
    if (account && !connected) {
      setConnected(true);
    }
    // Fetch balance when user connect
    if (account && pools.length > 0 && !isWalletInitialized) {
      getTokenBalanceForAll(tokens, account);
      getLPBalanceForAll(pools, account);
      setWalletInitialized(true);
    }
    // Reset wallet when user disconnect
    if (!account) {
      setWalletInitialized(false);
    }
  }, [isWalletInitialized, pools, tokens, getLPBalanceForAll, getTokenBalanceForAll, account, setConnected, connected]);

  return (
    <Box margin="0 auto" h="100%" w="full" transition="0.5s ease-out">
      <Flex h="full" direction="column" align="center">
        <Header />
        <Flex
          w={{ md: "100%", lg: "70%" }}
          maxWidth="1120px"
          px={{ md: 4, lg: 0 }}
          minWidth="800px"
          flex="1 1 auto"
          as="main"
          align="flex-start"
          justify="center"
          pb={4}
        >
          <Flex direction="column" w="full" align="center" mt={24} mb={36}>
            {children}
          </Flex>
        </Flex>
        <Footer />
      </Flex>
    </Box>
  );
};

export default Layout;
