import { Box, Flex, Text, useColorMode } from "@chakra-ui/react";
import { faCheckDouble } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";

import { useTranslate } from "context/TranslateProvider";
import { usePool, useStarknet } from "../../context";
import { DEFAULT_SLIPPAGE } from "../../helpers/constants";
import { isInputsCompleteForAddLiquidity } from "../../helpers/token";
import Button from "../form/Button";
import type { ChangeTokensEvent } from "../form/TokensForm";
import TokensForm, { TokenFormType } from "../form/TokensForm";
import TransactionValidationModal from "../form/TransactionValidationModal";
import InformationBox from "../informational/InformationBox";
import Spinner from "../informational/Spinner";
import Collapsible from "../layout/Collapsible";
import PopoverOptions from "../layout/PopoverOptions";
import { WalletConnect } from "../wallet";

import PoolInfos from "./PoolInfos";

const AddLiquidityManager = () => {
  const { t } = useTranslate();
  const { colorMode } = useColorMode();
  const { currentAddLiquidityQuote, updateAddLiquidityQuote, addLiquidity } = usePool();
  const { account } = useStarknet();
  const [addLiquiditySlippage, setAddLiquiditySlippage] = useState<number>(DEFAULT_SLIPPAGE);
  const [isValidationTransactionOpen, setValidationTransactionOpen] = useState(false);

  // Update addLiquidityQuote when change token with token0 amount not changed
  useEffect(() => {
    updateAddLiquidityQuote(
      currentAddLiquidityQuote?.token0,
      currentAddLiquidityQuote?.token1,
      currentAddLiquidityQuote?.amountToken0 || "",
      currentAddLiquidityQuote?.amountToken1 || "",
      true,
      addLiquiditySlippage / 100
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAddLiquidityQuote, addLiquiditySlippage]);

  const isFirstDeposit = currentAddLiquidityQuote && currentAddLiquidityQuote.isFirstDeposit;

  const handleChangeTokens = (event: ChangeTokensEvent) => {
    updateAddLiquidityQuote(
      event.tokens[0],
      event.tokens[1],
      event.amounts[0],
      event.amounts[1],
      event.updatedIndex === 0,
      addLiquiditySlippage / 100
    );
  };

  function onAddLiquidity() {
    // Display validation modal
    setValidationTransactionOpen(true);
  }

  function addLiquidityValidationReturn(validate: boolean) {
    setValidationTransactionOpen(false);
    if (validate && account && currentAddLiquidityQuote) {
      addLiquidity(currentAddLiquidityQuote, account);
    }
  }

  function getMainErrorText() {
    if (currentAddLiquidityQuote && currentAddLiquidityQuote.error) {
      if (currentAddLiquidityQuote.error.message) {
        return currentAddLiquidityQuote.error.message;
      }
      return currentAddLiquidityQuote.error.type;
    }
    return undefined;
  }

  // TODO: export this in new component
  // Render the main Add/Remove/Connect button
  const renderMainButton = () => (
    <WalletConnect
      full
      customConnectedButton={
        <Button
          disabled={
            currentAddLiquidityQuote?.loading ||
            !isInputsCompleteForAddLiquidity(
              currentAddLiquidityQuote?.token0,
              currentAddLiquidityQuote?.token1,
              currentAddLiquidityQuote?.amountToken0 || "",
              currentAddLiquidityQuote?.amountToken1 || ""
            )
          }
          errorText={getMainErrorText()}
          onClick={() => onAddLiquidity()}
          w="full"
        >
          {`${isFirstDeposit ? t.pool.create_and : ""}${t.pool.add_liquidity}`}
        </Button>
      }
    />
  );

  // Check if we should display infos for addLiquidity
  // Hide if:
  // - Current addLiquidityQuote is undefined
  // - Tokens are not defined
  // - Amount input is not defined
  const shouldDisplayInfos = (): boolean =>
    !!(
      currentAddLiquidityQuote &&
      currentAddLiquidityQuote.token0 &&
      currentAddLiquidityQuote.token1 &&
      (currentAddLiquidityQuote.amountToken0 || currentAddLiquidityQuote.amountToken1)
    );

  return (
    <>
      <TransactionValidationModal
        addLiquidityQuote={currentAddLiquidityQuote}
        isOpen={isValidationTransactionOpen}
        onClose={(validate) => addLiquidityValidationReturn(validate)}
      />
      <Flex width="full" align="center" direction="column">
        <Flex width="full" align="center" mb={4}>
          <PopoverOptions initialValue={addLiquiditySlippage} onChange={setAddLiquiditySlippage} />
        </Flex>
        <TokensForm
          type={TokenFormType.LIQUIDITY}
          tokens={[currentAddLiquidityQuote?.token0, currentAddLiquidityQuote?.token1]}
          amounts={[currentAddLiquidityQuote?.amountToken0 || "", currentAddLiquidityQuote?.amountToken1 || ""]}
          onChange={handleChangeTokens}
          separatorAction="none"
          separatorIcon={<AiOutlinePlus size="24" />}
        />

        {/* Loader/Price infos */}
        {currentAddLiquidityQuote && shouldDisplayInfos() && (
          <Flex w="full" mt={8}>
            <Collapsible
              closable={false}
              defaultIsOpen
              header={
                <Flex w="full" direction="row" align="center" justify="flex-start" p={2}>
                  <Box minWidth="24px">
                    {currentAddLiquidityQuote.loading ? <Spinner /> : <FontAwesomeIcon icon={faCheckDouble} />}
                  </Box>
                  <Text ml={2} fontSize={14} color={colorMode === "light" ? "blackAlpha.600" : "whiteAlpha.600"}>
                    {currentAddLiquidityQuote.loading ? t.swap.waiting_quote : t.swap.quote_updated}
                  </Text>
                </Flex>
              }
            >
              {/* Swap Info */}
              <Box mt={4}>
                <PoolInfos addLiquidityQuote={currentAddLiquidityQuote} />
              </Box>
            </Collapsible>
          </Flex>
        )}

        {/* Buttons */}
        <Box my={8} w="full">
          {/* Connect/Add liquidity */}
          {renderMainButton()}
        </Box>
        {isFirstDeposit && (
          <InformationBox
            title={t.pool.pool_creation}
            content={<Text dangerouslySetInnerHTML={{ __html: t.pool.warning_no_pool }} />}
            level="warning"
          />
        )}
      </Flex>
    </>
  );
};

export default AddLiquidityManager;
