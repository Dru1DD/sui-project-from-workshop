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
  TextField,
  Badge,
  Tabs,
  Progress,
  Box,
} from "@radix-ui/themes";
import { useState } from "react";
import { useNetworkVariable } from "../networkConfig";
import { transferHero } from "../utility/helpers/transfer_hero";
import { createArena } from "../utility/arena/create_arena";
import { listHero } from "../utility/marketplace/list_hero";
import { levelUpHero } from "../utility/heroes/level_up";
import { Hero } from "../types/hero";

interface RefreshProps {
  refreshKey: number;
  setRefreshKey: (key: number) => void;
}

export function OwnedObjects({ refreshKey, setRefreshKey }: RefreshProps) {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [transferAddress, setTransferAddress] = useState<{
    [key: string]: string;
  }>({});
  const [listPrice, setListPrice] = useState<{ [key: string]: string }>({});
  const [isTransferring, setIsTransferring] = useState<{
    [key: string]: boolean;
  }>({});
  const [isListing, setIsListing] = useState<{ [key: string]: boolean }>({});
  const [isCreatingBattle, setIsCreatingBattle] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLevelingUp, setIsLevelingUp] = useState<{
    [key: string]: boolean;
  }>({});
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {},
  );

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const { data, isPending, error } = useSuiClientQuery(
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
      queryKey: ["getOwnedObjects", account?.address, packageId, refreshKey],
    },
  );

  const copyToClipboard = (text: string, heroId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates((prev) => ({ ...prev, [heroId]: true }));

    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [heroId]: false }));
    }, 2000);
  };

  const handleLevelUp = (heroId: string) => {
    if (!packageId) return;

    setIsLevelingUp((prev) => ({ ...prev, [heroId]: true }));

    const tx = levelUpHero(packageId, heroId);
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
          setIsLevelingUp((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsLevelingUp((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  const handleTransfer = (heroId: string, address: string) => {
    if (!address.trim() || !packageId) return;

    setIsTransferring((prev) => ({ ...prev, [heroId]: true }));

    const tx = transferHero(heroId, address);
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

          setTransferAddress((prev) => ({ ...prev, [heroId]: "" }));
          setRefreshKey(refreshKey + 1);
          setIsTransferring((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsTransferring((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  const handleList = (heroId: string, price: string) => {
    if (!price.trim() || !packageId) return;

    setIsListing((prev) => ({ ...prev, [heroId]: true }));

    const tx = listHero(packageId, heroId, price);
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

          setListPrice((prev) => ({ ...prev, [heroId]: "" }));
          setRefreshKey(refreshKey + 1);
          setIsListing((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsListing((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  const handleCreateBattle = (heroId: string) => {
    if (!packageId) return;

    setIsCreatingBattle((prev) => ({ ...prev, [heroId]: true }));

    const tx = createArena(packageId, heroId);
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
          setIsCreatingBattle((prev) => ({ ...prev, [heroId]: false }));
        },
        onError: () => {
          setIsCreatingBattle((prev) => ({ ...prev, [heroId]: false }));
        },
      },
    );
  };

  if (!account) {
    return (
      <Card>
        <Text>Please connect your wallet to see your heroes</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text color="red">Error: {error.message}</Text>
      </Card>
    );
  }

  if (isPending || !data) {
    return (
      <Card>
        <Text>Loading your heroes...</Text>
      </Card>
    );
  }

  const heroes = data.data.filter(
    (obj) => obj.data?.content && "fields" in obj.data.content,
  );

  return (
    <Flex direction="column" gap="4">
      <Heading size="6">Your Heroes ({heroes.length})</Heading>

      {heroes.length === 0 ? (
        <Card>
          <Text>No heroes found in your wallet</Text>
        </Card>
      ) : (
        <Grid columns="3" gap="4">
          {heroes.map((obj) => {
            const hero = obj.data?.content as any;
            const heroId = obj.data?.objectId!;
            const fields = hero.fields as Hero;

            const level = Number(fields.level);
            const experience = Number(fields.experience);
            const power = Number(fields.power);
            const expNeeded = level * level * 100;
            const expProgress = Math.min((experience / expNeeded) * 100, 100);
            const canLevelUp = experience >= expNeeded && level < 100;

            return (
              <Card
                key={heroId}
                style={{
                  padding: "16px",
                  border: canLevelUp ? "3px solid gold" : undefined,
                  boxShadow: canLevelUp
                    ? "0 0 20px rgba(255, 215, 0, 0.3)"
                    : undefined,
                }}
              >
                <Flex direction="column" gap="3">
                  <Box style={{ position: "relative" }}>
                    <img
                      src={fields.image_url}
                      alt={fields.name}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                    {canLevelUp && (
                      <Badge
                        color="yellow"
                        size="2"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          animation: "pulse 2s infinite",
                        }}
                      >
                        ✨ Ready!
                      </Badge>
                    )}
                  </Box>

                  <Flex direction="column" gap="2">
                    <Flex align="center" justify="between">
                      <Text size="5" weight="bold">
                        {fields.name}
                      </Text>
                      <Badge color="purple" size="3">
                        ⭐ Lvl {level}
                      </Badge>
                    </Flex>

                    <Badge color="blue" size="2">
                      ⚔️ Power: {power}
                    </Badge>

                    <Flex direction="column" gap="1">
                      <Flex justify="between">
                        <Text size="2" color="gray">
                          Experience
                        </Text>
                        <Text
                          size="2"
                          weight="bold"
                          color={canLevelUp ? "yellow" : "gray"}
                        >
                          {experience} / {expNeeded}
                        </Text>
                      </Flex>
                      <Progress
                        value={expProgress}
                        color={canLevelUp ? "yellow" : "blue"}
                        size="2"
                      />
                    </Flex>

                    {level >= 100 ? (
                      <Badge
                        color="gold"
                        size="2"
                        style={{ textAlign: "center" }}
                      >
                        🏆 MAX LEVEL
                      </Badge>
                    ) : canLevelUp ? (
                      <Badge
                        color="yellow"
                        size="2"
                        style={{ textAlign: "center" }}
                      >
                        ✨ Ready to Level Up! ✨
                      </Badge>
                    ) : (
                      <Text
                        size="2"
                        color="gray"
                        style={{ textAlign: "center" }}
                      >
                        Need {expNeeded - experience} more XP
                      </Text>
                    )}

                    <Flex align="center" gap="2">
                      <Text
                        size="3"
                        color="gray"
                        style={{
                          fontFamily: "monospace",
                        }}
                      >
                        {heroId.slice(0, 6)}...{heroId.slice(-6)}
                      </Text>
                      <Button
                        size="1"
                        variant="ghost"
                        onClick={() => copyToClipboard(heroId, heroId)}
                        color={copiedStates[heroId] ? "green" : undefined}
                      >
                        {copiedStates[heroId] ? "Copied!" : "Copy"}
                      </Button>
                    </Flex>
                  </Flex>

                  <Tabs.Root defaultValue="levelup">
                    <Tabs.List size="2">
                      <Tabs.Trigger value="levelup">Level Up</Tabs.Trigger>
                      <Tabs.Trigger value="transfer">Transfer</Tabs.Trigger>
                      <Tabs.Trigger value="list">List</Tabs.Trigger>
                      <Tabs.Trigger value="battle">Battle</Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="levelup">
                      <Flex
                        direction="column"
                        gap="3"
                        mt="3"
                        p="3"
                        style={{
                          background: "var(--gold-2)",
                          borderRadius: "8px",
                          border: "1px solid var(--gold-6)",
                        }}
                      >
                        <Flex direction="column" gap="2">
                          <Text size="3" weight="bold" color="gold">
                            ⬆️ Level Up Hero
                          </Text>
                          <Text size="2" color="gray">
                            Leveling up increases power by +10 and costs{" "}
                            {expNeeded} XP
                          </Text>
                        </Flex>

                        <Box>
                          <Text size="2" weight="medium">
                            Preview:
                          </Text>
                          <Flex gap="2" mt="2" wrap="wrap">
                            <Badge color="purple">
                              Lvl: {level} → {level + 1}
                            </Badge>
                            <Badge color="blue">
                              Power: {power} → {power + 10}
                            </Badge>
                            <Badge color="orange">
                              XP: {experience} →{" "}
                              {Math.max(0, experience - expNeeded)}
                            </Badge>
                          </Flex>
                        </Box>

                        <Button
                          onClick={() => handleLevelUp(heroId)}
                          disabled={!canLevelUp || isLevelingUp[heroId]}
                          loading={isLevelingUp[heroId]}
                          color="yellow"
                          size="3"
                          style={{ width: "100%" }}
                        >
                          {isLevelingUp[heroId]
                            ? "Leveling Up..."
                            : level >= 100
                              ? "🏆 Max Level"
                              : !canLevelUp
                                ? `Need ${expNeeded - experience} XP`
                                : "⬆️ Level Up!"}
                        </Button>
                      </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="transfer">
                      <Flex direction="column" gap="2" mt="3">
                        <TextField.Root
                          placeholder="Recipient address"
                          value={transferAddress[heroId] || ""}
                          onChange={(e) =>
                            setTransferAddress((prev) => ({
                              ...prev,
                              [heroId]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          onClick={() =>
                            handleTransfer(heroId, transferAddress[heroId])
                          }
                          disabled={
                            !transferAddress[heroId]?.trim() ||
                            isTransferring[heroId]
                          }
                          loading={isTransferring[heroId]}
                          color="blue"
                        >
                          {isTransferring[heroId]
                            ? "Transferring..."
                            : "Transfer Hero"}
                        </Button>
                      </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="list">
                      <Flex direction="column" gap="2" mt="3">
                        <TextField.Root
                          placeholder="Price in SUI"
                          type="number"
                          value={listPrice[heroId] || ""}
                          onChange={(e) =>
                            setListPrice((prev) => ({
                              ...prev,
                              [heroId]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          onClick={() => handleList(heroId, listPrice[heroId])}
                          disabled={
                            !listPrice[heroId]?.trim() || isListing[heroId]
                          }
                          loading={isListing[heroId]}
                          color="green"
                        >
                          {isListing[heroId] ? "Listing..." : "List for Sale"}
                        </Button>
                      </Flex>
                    </Tabs.Content>

                    <Tabs.Content value="battle">
                      <Flex direction="column" gap="2" mt="3">
                        <Text size="2" color="gray">
                          Create a battle arena for others to challenge your
                          hero.
                        </Text>
                        <Button
                          onClick={() => handleCreateBattle(heroId)}
                          disabled={isCreatingBattle[heroId]}
                          loading={isCreatingBattle[heroId]}
                          color="orange"
                        >
                          {isCreatingBattle[heroId]
                            ? "Creating Arena..."
                            : "Create Arena"}
                        </Button>
                      </Flex>
                    </Tabs.Content>
                  </Tabs.Root>
                </Flex>
              </Card>
            );
          })}
        </Grid>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Flex>
  );
}
