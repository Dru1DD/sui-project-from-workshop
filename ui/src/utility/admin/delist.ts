import { Transaction } from "@mysten/sui/transactions";

export const delist = (
  packageId: string,
  listHeroId: string,
  adminCapId: string,
) => {
  const tx = new Transaction();

  // Delist a hero (Admin only)
  tx.moveCall({
    target: `${packageId}::marketplace::delist`,
    arguments: [tx.object(adminCapId), tx.object(listHeroId)],
  });

  return tx;
};
