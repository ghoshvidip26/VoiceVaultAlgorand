import algosdk from "algosdk";

const algodToken = import.meta.env.VITE_ALGOD_TOKEN ?? "";
const algodServer = import.meta.env.VITE_ALGOD_SERVER ?? "https://testnet-api.algonode.cloud";
const algodPort = import.meta.env.VITE_ALGOD_PORT ?? "443";

const indexerToken = import.meta.env.VITE_INDEXER_TOKEN ?? "";
const indexerServer = import.meta.env.VITE_INDEXER_SERVER ?? "https://testnet-idx.algonode.cloud";
const indexerPort = import.meta.env.VITE_INDEXER_PORT ?? "443";

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
export const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

export async function getAlgoBalance(address: string): Promise<bigint> {
  const info = await algodClient.accountInformation(address).do();
  return BigInt(info.amount);
}

export function isValidAlgorandAddress(address: string): boolean {
  return algosdk.isValidAddress(address);
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const formatAddress = truncateAddress;

export async function waitForConfirmation(txId: string, rounds = 4) {
  return algosdk.waitForConfirmation(algodClient, txId, rounds);
}

export function getExplorerTxUrl(txId: string): string {
  return `https://lora.algokit.io/testnet/transaction/${txId}`;
}

export function getExplorerAccountUrl(address: string): string {
  return `https://lora.algokit.io/testnet/account/${address}`;
}

export function getExplorerAppUrl(appId: number): string {
  return `https://lora.algokit.io/testnet/application/${appId}`;
}
