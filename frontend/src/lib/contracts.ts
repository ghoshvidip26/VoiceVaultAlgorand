const paymentAppId = Number.parseInt(import.meta.env.VITE_PAYMENT_APP_ID ?? "0", 10);
const voiceAppId = Number.parseInt(import.meta.env.VITE_VOICE_APP_ID ?? "0", 10);

export const CONTRACTS = {
  PAYMENT: {
    appId: Number.isFinite(paymentAppId) ? paymentAppId : 0,
  },
  VOICE: {
    appId: Number.isFinite(voiceAppId) ? voiceAppId : 0,
  },
  PLATFORM_ADDRESS: import.meta.env.VITE_PLATFORM_ADDRESS ?? "",
} as const;

export const FEES = {
  PLATFORM_BPS: 250,
  ROYALTY_BPS: 1000, // 10%
} as const;

export const ALGO_DECIMALS = 6;
export const MICROALGO_PER_ALGO = 1_000_000;

export function algoToMicroAlgo(algo: number): bigint {
  return BigInt(Math.round(algo * MICROALGO_PER_ALGO));
}

export function microAlgoToAlgo(microAlgo: bigint | number): number {
  return Number(microAlgo) / MICROALGO_PER_ALGO;
}

export function calculatePaymentBreakdown(totalMicroAlgo: bigint) {
  const platformFee = (totalMicroAlgo * BigInt(FEES.PLATFORM_BPS)) / 10_000n;
  const afterPlatform = totalMicroAlgo - platformFee;
  const royalty = (afterPlatform * BigInt(FEES.ROYALTY_BPS)) / 10_000n;
  const creatorAmount = afterPlatform - royalty;

  return {
    platformFee,
    royalty,
    creatorAmount,
  };
}
