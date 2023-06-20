import { Box, Flex, Heading, Text, useColorMode } from "@chakra-ui/react";
import { faArrowAltCircleDown, faCheckCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

import { useTranslate } from "context/TranslateProvider";
import { useStarknet, useSwap } from "../../context";
import { DEFAULT_SLIPPAGE } from "../../helpers/constants";
import { isInputsCompleteForSwap } from "../../helpers/token";
import Button from "../form/Button";
import type { ChangeTokensEvent } from "../form/TokensForm";
import TokensForm, { TokenFormType } from "../form/TokensForm";
import TransactionValidationModal from "../form/TransactionValidationModal";
import Spinner from "../informational/Spinner";
import Collapsible from "../layout/Collapsible";
import PopoverOptions from "../layout/PopoverOptions";
import { WalletConnect } from "../wallet";

import SwapInfos from "./SwapInfos";

const SwapManager = () => {
  const { colorMode } = useColorMode();
  const { t } = useTranslate();
  const { account } = useStarknet();
  const { currentSwapQuote, updateSwapQuote, swap } = useSwap();
  const [isSwapInfoOpen, setSwapInfoOpen] = useState(false);
  const [swapSlippage, setSwapSlippage] = useState<number>(DEFAULT_SLIPPAGE);
  const [isValidationTransactionOpen, setValidationTransactionOpen] = useState(false);

  useEffect(() => {
    updateSwapQuote(
      currentSwapQuote?.amountTokenFrom || "",
      currentSwapQuote?.tokenFrom,
      currentSwapQuote?.tokenTo,
      swapSlippage / 100
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSwapQuote, swapSlippage]);

  const handleChangeTokens = (event: ChangeTokensEvent) =>
    updateSwapQuote(event.amounts[0], event.tokens[0], event.tokens[1], swapSlippage / 100);

  // Display validation modal
  const onSwapClick = () => setValidationTransactionOpen(true);

  function swapValidationReturn(validate: boolean) {
    setValidationTransactionOpen(false);
    if (validate && account && currentSwapQuote) {
      swap(currentSwapQuote, account);
    }
  }

  function getMainErrorText() {
    if (currentSwapQuote && currentSwapQuote.error) {
      if (currentSwapQuote.error.message) {
        return currentSwapQuote.error.message;
      }
      return currentSwapQuote.error.type;
    }
    return undefined;
  }

  // Check if we should display infos for swap
  // Hide if:
  // - CurrentSwapQuote is undefined
  // - Tokens are not defined
  // - Amount input is not defined
  function shouldDisplayInfos() {
    return (
      currentSwapQuote && currentSwapQuote.tokenFrom && currentSwapQuote.tokenTo && currentSwapQuote?.amountTokenFrom
    );
  }

  // TODO: export this in new component
  // Render the main Add/Remove/Connect button
  function renderMainButton() {
    return (
      <WalletConnect
        full
        customConnectedButton={
          <Button
            disabled={
              currentSwapQuote?.loading ||
              !isInputsCompleteForSwap(
                [currentSwapQuote?.tokenFrom, currentSwapQuote?.tokenTo],
                currentSwapQuote?.amountTokenFrom || ""
              )
            }
            errorText={getMainErrorText()}
            onClick={() => onSwapClick()}
            w="full"
          >
            {t.swap.swap}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <TransactionValidationModal
        swapQuote={currentSwapQuote}
        isOpen={isValidationTransactionOpen}
        onClose={(validate) => swapValidationReturn(validate)}
      />
      <Flex width="full" align="center" direction="column">
        <Flex width="full" align="center" mb={4}>
          <Heading as="h2" size="md">
            <Box>{t.swap.swap}</Box>
          </Heading>

          <PopoverOptions initialValue={swapSlippage} onChange={setSwapSlippage} />
        </Flex>

        <TokensForm
          type={TokenFormType.SWAP}
          amounts={[currentSwapQuote?.amountTokenFrom || "", currentSwapQuote?.amountTokenTo || ""]}
          tokens={[currentSwapQuote?.tokenFrom, currentSwapQuote?.tokenTo]}
          onChange={handleChangeTokens}
          separatorIcon={<FontAwesomeIcon icon={faArrowAltCircleDown} size="lg" />}
          separatorAction="swap"
          disableSecondInput
        />
        {/* Loader/Price infos */}
        {currentSwapQuote && shouldDisplayInfos() && (
          <Flex w="full" mt={8}>
            <Collapsible
              onUpdate={(isOpen) => setSwapInfoOpen(isOpen)}
              defaultIsOpen
              header={
                <Flex w="full" direction="row" align="center" justify="space-between" p={2}>
                  <Flex w="full" direction="row" align="center" justify="flex-start">
                    <Box minWidth="24px">
                      {currentSwapQuote.loading ? <Spinner /> : <FontAwesomeIcon icon={faCheckCircle} />}
                    </Box>
                    <Text ml={2} fontSize={14} color={colorMode === "light" ? "blackAlpha.600" : "whiteAlpha.600"}>
                      {currentSwapQuote.loading ? t.swap.waiting_quote : t.swap.quote_updated}
                    </Text>
                  </Flex>
                  <Box
                    opacity={0.6}
                    transition="transform .5s ease"
                    transform={`rotate(${isSwapInfoOpen ? "180" : "0"}deg)`}
                  >
                    <FontAwesomeIcon icon={faArrowAltCircleDown} />
                  </Box>
                </Flex>
              }
            >
              {/* Swap Info */}
              {currentSwapQuote && (
                <Box mt={4}>
                  <SwapInfos swapQuote={currentSwapQuote} />
                </Box>
              )}
            </Collapsible>
          </Flex>
        )}
        {/* Buttons */}
        <Box mt={8} w="full">
          {/* Connect/Swap button */}
          {renderMainButton()}
        </Box>
      </Flex>
    </>
  );
};

export default SwapManager;
