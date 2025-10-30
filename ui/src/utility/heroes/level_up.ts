import { Transaction } from "@mysten/sui/transactions";

export function levelUpHero(packageId: string, heroId: string) {
    const tx = new Transaction();

    tx.moveCall({
        target: `${packageId}::hero::level_up`,
        arguments: [
            tx.object(heroId),
        ],
    });

    return tx;
}
