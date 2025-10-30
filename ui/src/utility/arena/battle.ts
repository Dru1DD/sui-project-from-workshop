import { Transaction } from "@mysten/sui/transactions";

export const battle = (packageId: string, heroId: string, arenaId: string) => {
  const tx = new Transaction();

  // Start a battle
  tx.moveCall({
    target: `${packageId}::arena::battle`,
    arguments: [tx.object(heroId), tx.object(arenaId)],
  });

  return tx;
};
