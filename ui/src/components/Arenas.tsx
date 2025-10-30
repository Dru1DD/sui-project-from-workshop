import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  Flex,
  Heading,
  Text,
  Card,
  Grid,
  Button,
  Badge,
  Box,
} from "@radix-ui/themes";
import { useState } from "react";
import { useNetworkVariable } from "../networkConfig";
import { Hero, Arena } from "../types/hero";
import { battle } from "../utility/arena/battle";
import { RefreshProps } from "../types/props";

export default function Arenas({ refreshKey, setRefreshKey }: RefreshProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [isBattling, setIsBattling] = useState<{ [key: string]: boolean }>({});
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const { data: userHeroes } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        StructType: `${packageId}::hero::Hero`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account && !!packageId,
      queryKey: [
        "getOwnedObjects",
        "Heroes",
        account?.address,
        packageId,
        refreshKey,
      ],
    },
  );

  const { data: battleEvents, isPending: eventsLoading } = useSuiClientQuery(
    "queryEvents",
    {
      query: {
        MoveEventType: `${packageId}::arena::ArenaCreated`,
      },
      limit: 50,
      order: "descending",
    },
    {
      enabled: !!packageId,
      queryKey: ["queryEvents", packageId, "ArenaCreated", refreshKey],
    },
  );

  const { data, isPending, error } = useSuiClientQuery(
    "multiGetObjects",
    {
      ids:
        battleEvents?.data?.map(
          (event) => (event.parsedJson as any).arena_id,
        ) || [],
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!packageId && battleEvents?.data !== undefined,
      queryKey: [
        "multiGetObjects",
        "Arenas",
        battleEvents?.data?.map((event) => (event.parsedJson as any).arena_id),
        refreshKey,
      ],
    },
  );

  const handleBattle = (arenaId: string, heroId: string) => {
    if (!account || !packageId) return;

    setIsBattling((prev) => ({ ...prev, [`${arenaId}_${heroId}`]: true }));

    const tx = battle(packageId, heroId, arenaId);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          await suiClient.waitForTransaction({
            digest,
            options: {
              showEffects: true,
              showObjectChanges: true,
            },
          });

          setRefreshKey(refreshKey + 1);
          setIsBattling((prev) => ({
            ...prev,
            [`${arenaId}_${heroId}`]: false,
          }));
        },
        onError: () => {
          setIsBattling((prev) => ({
            ...prev,
            [`${arenaId}_${heroId}`]: false,
          }));
        },
      },
    );
  };

  if (error) {
    return (
      <Card>
        <Text color="red">Error loading arenas: {error.message}</Text>
      </Card>
    );
  }

  if (eventsLoading || isPending || !data) {
    return (
      <Card>
        <Text>Loading arenas...</Text>
      </Card>
    );
  }

  if (!battleEvents?.data?.length) {
    return (
      <Flex direction="column" gap="4">
        <Heading size="6">Battle Arena (0)</Heading>
        <Card>
          <Text>No arenas are currently available</Text>
        </Card>
      </Flex>
    );
  }

  const activeArenas =
    data?.filter((obj) => obj.data?.content && "fields" in obj.data.content) ||
    [];
  const availableHeroes =
    userHeroes?.data?.filter(
      (obj) => obj.data?.content && "fields" in obj.data.content,
    ) || [];

  return (
    <Flex direction="column" gap="4">
      <Heading size="6">Battle Arena ({activeArenas.length})</Heading>

      {!account && (
        <Card>
          <Text>Please connect your wallet to participate in battles</Text>
        </Card>
      )}

      {account && availableHeroes.length === 0 && (
        <Card>
          <Text color="orange">
            You need heroes to participate in battles. Create some heroes first!
          </Text>
        </Card>
      )}

      {activeArenas.length === 0 ? (
        <Card>
          <Text>No active arenas found</Text>
        </Card>
      ) : (
        <Grid columns="3" gap="4">
          {activeArenas.map((obj) => {
            const arena = obj.data?.content as any;
            const arenaId = obj.data?.objectId!;
            const fields = arena.fields as Arena;
            const warriorFields = fields.warrior.fields as Hero;

            const warriorLevel = Number(warriorFields.level);
            const warriorPower = Number(warriorFields.power);

            return (
              <Card key={arenaId} style={{ padding: "16px" }}>
                <Flex direction="column" gap="3">
                  <img
                    src={warriorFields.image_url}
                    alt={warriorFields.name}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "2px solid orange",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="between">
                      <Text size="5" weight="bold">
                        {warriorFields.name}
                      </Text>
                      <Badge color="purple" size="2">
                        ⭐ Lvl {warriorLevel}
                      </Badge>
                    </Flex>

                    <Flex gap="2" wrap="wrap">
                      <Badge color="blue" size="2">
                        ⚔️ Power: {warriorPower}
                      </Badge>
                      <Badge color="orange" size="2">
                        ⚔️ Battle Ready
                      </Badge>
                    </Flex>

                    <Box
                      p="3"
                      style={{
                        background: "var(--orange-2)",
                        borderRadius: "8px",
                        border: "1px solid var(--orange-6)",
                      }}
                    >
                      <Text
                        size="2"
                        weight="bold"
                        style={{ display: "block", marginBottom: "8px" }}
                      >
                        🏆 Victory Rewards:
                      </Text>
                      <Flex direction="column" gap="1">
                        <Text size="2" color="gray">
                          • Win both heroes
                        </Text>
                        <Text size="2" color="gray">
                          • Gain 50+ XP (bonus for level difference)
                        </Text>
                        <Text size="2" color="gray">
                          • Possible automatic level up!
                        </Text>
                      </Flex>
                    </Box>

                    <Text size="3" color="gray">
                      Owner: {fields.owner.slice(0, 6)}...
                      {fields.owner.slice(-4)}
                    </Text>
                  </Flex>

                  {account && availableHeroes.length > 0 && (
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold">
                        Challenge with your hero:
                      </Text>
                      {availableHeroes.slice(0, 3).map((heroObj) => {
                        const heroContent = heroObj.data?.content as any;
                        const heroId = heroObj.data?.objectId!;
                        const heroFields = heroContent.fields as Hero;
                        const battleKey = `${arenaId}_${heroId}`;
                        const isMyArena = fields.owner === account.address;

                        const heroLevel = Number(heroFields.level);
                        const heroPower = Number(heroFields.power);
                        const levelDiff = Math.abs(heroLevel - warriorLevel);
                        const expectedXP = 50 + levelDiff * 10;

                        return (
                          <Flex
                            key={heroId}
                            direction="column"
                            gap="2"
                            p="2"
                            style={{
                              background: "var(--gray-a2)",
                              borderRadius: "6px",
                            }}
                          >
                            <Flex align="center" justify="between">
                              <Flex direction="column" gap="1">
                                <Text size="2" weight="bold">
                                  {heroFields.name}
                                </Text>
                                <Flex gap="2">
                                  <Badge color="purple" size="1">
                                    Lvl {heroLevel}
                                  </Badge>
                                  <Badge color="blue" size="1">
                                    Power: {heroPower}
                                  </Badge>
                                  <Badge color="green" size="1">
                                    +{expectedXP} XP
                                  </Badge>
                                </Flex>
                              </Flex>
                              <Button
                                onClick={() => handleBattle(arenaId, heroId)}
                                disabled={isBattling[battleKey]}
                                loading={isBattling[battleKey]}
                                color={isMyArena ? "gray" : "orange"}
                                size="2"
                              >
                                {isBattling[battleKey]
                                  ? "Battling..."
                                  : "Battle!"}
                              </Button>
                            </Flex>
                          </Flex>
                        );
                      })}

                      {availableHeroes.length > 3 && (
                        <Text
                          size="2"
                          color="gray"
                          style={{ textAlign: "center" }}
                        >
                          +{availableHeroes.length - 3} more heroes available
                        </Text>
                      )}
                    </Flex>
                  )}
                </Flex>
              </Card>
            );
          })}
        </Grid>
      )}
    </Flex>
  );
}
