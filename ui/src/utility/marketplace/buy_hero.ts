import { Transaction } from "@mysten/sui/transactions";

export const buyHero = (packageId: string, listHeroId: string, priceInSui: string) => {
  const tx = new Transaction();

  // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
  const priceInMist = BigInt(priceInSui) * 1_000_000_000n;

  // Split coin for exact payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);

  // Buy a hero
  tx.moveCall({
    target: `${packageId}::marketplace::buy_hero`,
    arguments: [tx.object(listHeroId), paymentCoin],
  });

  return tx;
};
