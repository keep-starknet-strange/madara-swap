import environment from "../environment";

export const cropAddress = (address: string | undefined): string => {
  return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "0x0000...0000";
};

export const removeLeadingZero = (address: string): string => {
  let result = address.replace("0x", "");
  while (result.startsWith("0")) {
    result = result.substring(1, result.length);
  }
  return address ? `0x${result}` : "";
};

export const getVoyagerLink = (txHash: string): string => {
  return `${environment.explorerUrl}/tx/${txHash}`;
};
