import { Box, ChakraProvider, Hide } from "@chakra-ui/react";
import type { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import "@fontsource/lexend/latin.css";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ToastContainer } from "material-react-toastify";
import type { AppProps } from "next/app";
import Head from "next/head";

import { Layout } from "components/layout";
import { BlockHashProvider, StarknetProvider, SwapProvider, TransactionsProvider } from "context";
import { ContractProvider } from "../context/ContractProvider";
import { PoolProvider } from "../context/PoolProvider";
import { TranslateProvider } from "../context/TranslateProvider";
import { WalletBaseProvider } from "../context/WalletBaseProvider";
import { WalletProvider } from "../context/WalletProvider";
import { WhitelistProvider } from "../context/WhitelistProvider";

import "material-react-toastify/dist/ReactToastify.css";
import createEmotionCache from "styles/createEmotionCache";
import customTheme from "styles/customTheme";

import type { FC } from "react";
import "styles/globals.css";

const clientSideEmotionCache = createEmotionCache();

interface Props extends AppProps {
  emotionCache?: EmotionCache;
}

const Index: FC<Props> = ({ Component, pageProps, emotionCache = clientSideEmotionCache }) => {
  const closeButton = ({ closeToast }: any) => (
    <Box className="custom-toast-close" onClick={closeToast} fontSize="md" pt={4}>
      <FontAwesomeIcon icon={faCircleXmark} />
    </Box>
  );
  return (
    <TranslateProvider>
      <StarknetProvider>
        <BlockHashProvider>
          <TransactionsProvider>
            <ContractProvider>
              <WhitelistProvider>
                <WalletBaseProvider>
                  <WalletProvider>
                    <PoolProvider>
                      <SwapProvider>
                        <CacheProvider value={emotionCache}>
                          <ChakraProvider theme={customTheme}>
                            <Head>
                              <meta
                                name="viewport"
                                content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
                              />
                            </Head>
                            <Hide below="md">
                              <ToastContainer newestOnTop closeButton={closeButton} />
                              <Layout>
                                <Component {...pageProps} />
                              </Layout>
                            </Hide>
                          </ChakraProvider>
                        </CacheProvider>
                      </SwapProvider>
                    </PoolProvider>
                  </WalletProvider>
                </WalletBaseProvider>
              </WhitelistProvider>
            </ContractProvider>
          </TransactionsProvider>
        </BlockHashProvider>
      </StarknetProvider>
    </TranslateProvider>
  );
};

Index.defaultProps = {
  emotionCache: clientSideEmotionCache,
};

export default Index;
