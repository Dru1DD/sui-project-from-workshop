import { Transaction } from "@mysten/sui/transactions";

export const changePrice = (packageId: string, listHeroId: string, newPriceInSui: string, adminCapId: string) => {
  const tx = new Transaction();

  // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
  const newPriceInMist = BigInt(newPriceInSui) * 1_000_000_000n;

  // Change hero price (Admin only)
  tx.moveCall({
    target: `${packageId}::marketplace::change_the_price`,
    arguments: [
      tx.object(adminCapId),
      tx.object(listHeroId),
      tx.pure.u64(newPriceInMist),
    ],
  });

  return tx;
};
