import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
export const aptos = new Aptos(aptosConfig);

// Helper function to format address
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to get account balance
export const getAccountBalance = async (address: string) => {
  try {
    const resources = await aptos.getAccountResources({ accountAddress: address });
    const coinResource = resources.find(
      (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    );
    
    if (coinResource) {
      const balance = (coinResource.data as any).coin.value;
      return Number(balance) / 100000000; // Convert from Octas to APT
    }
    return 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
};

// Helper function to get account info
export const getAccountInfo = async (address: string) => {
  try {
    const account = await aptos.getAccountInfo({ accountAddress: address });
    return account;
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
};
