import { useSuiClientQueries } from "@mysten/dapp-kit";
import { Flex, Heading, Text, Card, Badge, Grid } from "@radix-ui/themes";
import { useNetworkVariable } from "../networkConfig";

export default function EventsHistory() {
  const packageId = useNetworkVariable("packageId");

  const eventQueries = useSuiClientQueries({
    queries: [
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::marketplace::HeroListed`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "HeroListed"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::marketplace::HeroBought`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "HeroBought"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::arena::ArenaCreated`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "ArenaCreated"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::arena::ArenaCompleted`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "ArenaCompleted"],
        enabled: !!packageId,
      },
      {
        method: "queryEvents",
        params: {
          query: {
            MoveEventType: `${packageId}::hero::HeroLeveledUp`,
          },
          limit: 20,
          order: "descending",
        },
        queryKey: ["queryEvents", packageId, "HeroLeveledUp"],
        enabled: !!packageId,
      },
    ],
  });

  const [
    { data: listedEvents, isPending: isListedPending },
    { data: boughtEvents, isPending: isBoughtPending },
    { data: battleCreatedEvents, isPending: isBattleCreatedPending },
    { data: battleCompletedEvents, isPending: isBattleCompletedPending },
    { data: levelUpEvents, isPending: isLevelUpPending },
  ] = eventQueries;

  const formatTimestamp = (timestamp: string) => {
    return new Date(Number(timestamp)).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: string) => {
    return (Number(price) / 1_000_000_000).toFixed(2);
  };

  if (
    isListedPending ||
    isBoughtPending ||
    isBattleCreatedPending ||
    isBattleCompletedPending ||
    isLevelUpPending
  ) {
    return (
      <Card>
        <Text>Loading events history...</Text>
      </Card>
    );
  }

  const allEvents = [
    ...(listedEvents?.data || []).map((event) => ({
      ...event,
      type: "listed" as const,
    })),
    ...(boughtEvents?.data || []).map((event) => ({
      ...event,
      type: "bought" as const,
    })),
    ...(battleCreatedEvents?.data || []).map((event) => ({
      ...event,
      type: "battle_created" as const,
    })),
    ...(battleCompletedEvents?.data || []).map((event) => ({
      ...event,
      type: "battle_completed" as const,
    })),
    ...(levelUpEvents?.data || []).map((event) => ({
      ...event,
      type: "level_up" as const,
    })),
  ].sort((a, b) => Number(b.timestampMs) - Number(a.timestampMs));

  return (
    <Flex direction="column" gap="4">
      <Heading size="6">Recent Events ({allEvents.length})</Heading>

      {allEvents.length === 0 ? (
        <Card>
          <Text>No events found</Text>
        </Card>
      ) : (
        <Grid columns="1" gap="3">
          {allEvents.map((event, index) => {
            const eventData = event.parsedJson as any;

            if (event.type === "level_up") {
              return (
                <Card
                  key={`${event.id.txDigest}-${index}`}
                  style={{
                    padding: "16px",
                    background: "var(--yellow-2)",
                    border: "1px solid var(--yellow-6)",
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="3" wrap="wrap">
                      <Badge color="yellow" size="3">
                        ⬆️ Hero Leveled Up!
                      </Badge>
                      <Text size="3" color="gray">
                        {formatTimestamp(event.timestampMs!)}
                      </Text>
                    </Flex>

                    <Grid columns="3" gap="3">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">
                          Old Level
                        </Text>
                        <Badge color="gray" size="2">
                          {eventData.old_level}
                        </Badge>
                      </Flex>

                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">
                          New Level
                        </Text>
                        <Badge color="purple" size="2">
                          {eventData.new_level}
                        </Badge>
                      </Flex>

                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold">
                          New Power
                        </Text>
                        <Badge color="blue" size="2">
                          {eventData.new_power}
                        </Badge>
                      </Flex>
                    </Grid>

                    <Text
                      size="3"
                      color="gray"
                      style={{ fontFamily: "monospace" }}
                    >
                      Hero: {eventData.hero_id.slice(0, 8)}...
                      {eventData.hero_id.slice(-8)}
                    </Text>
                  </Flex>
                </Card>
              );
            }

            if (event.type === "battle_completed") {
              return (
                <Card
                  key={`${event.id.txDigest}-${index}`}
                  style={{
                    padding: "16px",
                    background: "var(--green-2)",
                    border: "1px solid var(--green-6)",
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Flex align="center" gap="3" wrap="wrap">
                      <Badge color="green" size="3">
                        ⚔️ Battle Completed
                      </Badge>
                      {/* NEW: Show experience gained */}
                      <Badge color="orange" size="2">
                        +{eventData.experience_gained} XP
                      </Badge>
                      <Text size="3" color="gray">
                        {formatTimestamp(event.timestampMs!)}
                      </Text>
                    </Flex>

                    <Grid columns="2" gap="3">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold" color="green">
                          🏆 Winner
                        </Text>
                        <Text size="2" style={{ fontFamily: "monospace" }}>
                          ...{eventData.winner_hero_id.slice(-8)}
                        </Text>
                      </Flex>

                      <Flex direction="column" gap="1">
                        <Text size="2" weight="bold" color="red">
                          💀 Loser
                        </Text>
                        <Text size="2" style={{ fontFamily: "monospace" }}>
                          ...{eventData.loser_hero_id.slice(-8)}
                        </Text>
                      </Flex>
                    </Grid>

                    <Text size="2" color="gray">
                      Winner gained {eventData.experience_gained} experience
                      points!
                    </Text>
                  </Flex>
                </Card>
              );
            }
            return (
              <Card
                key={`${event.id.txDigest}-${index}`}
                style={{ padding: "16px" }}
              >
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="3" wrap="wrap">
                    <Badge
                      color={
                        event.type === "listed"
                          ? "blue"
                          : event.type === "bought"
                            ? "green"
                            : "orange"
                      }
                      size="2"
                    >
                      {event.type === "listed"
                        ? "Hero Listed"
                        : event.type === "bought"
                          ? "Hero Bought"
                          : "Arena Created"}
                    </Badge>
                    <Text size="3" color="gray">
                      {formatTimestamp(event.timestampMs!)}
                    </Text>
                  </Flex>

                  <Flex align="center" gap="4" wrap="wrap">
                    {(event.type === "listed" || event.type === "bought") && (
                      <>
                        <Text size="3">
                          <strong>Price:</strong> {formatPrice(eventData.price)}{" "}
                          SUI
                        </Text>

                        {event.type === "listed" ? (
                          <Text size="3">
                            <strong>Seller:</strong>{" "}
                            {formatAddress(eventData.seller)}
                          </Text>
                        ) : (
                          <Flex gap="4">
                            <Text size="3">
                              <strong>Buyer:</strong>{" "}
                              {formatAddress(eventData.buyer)}
                            </Text>
                            <Text size="3">
                              <strong>Seller:</strong>{" "}
                              {formatAddress(eventData.seller)}
                            </Text>
                          </Flex>
                        )}

                        <Text
                          size="3"
                          color="gray"
                          style={{ fontFamily: "monospace" }}
                        >
                          ID: {eventData.list_hero_id.slice(0, 8)}...
                        </Text>
                      </>
                    )}

                    {event.type === "battle_created" && (
                      <>
                        <Text size="3">
                          <strong>⚔️ Battle Arena Created</strong>
                        </Text>
                        <Text
                          size="3"
                          color="gray"
                          style={{ fontFamily: "monospace" }}
                        >
                          ID: {eventData.arena_id.slice(0, 8)}...
                        </Text>
                      </>
                    )}
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Grid>
      )}
    </Flex>
  );
}
