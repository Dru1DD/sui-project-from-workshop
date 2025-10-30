module challenge::arena;

use challenge::hero::Hero;
use sui::event;

// ========= STRUCTS =========
public struct Arena has key, store {
    id: UID,
    warrior: Hero,
    owner: address,
}

// ========= EVENTS =========
public struct ArenaCreated has copy, drop {
    arena_id: ID,
    timestamp: u64,
}

public struct ArenaCompleted has copy, drop {
    winner_hero_id: ID,
    loser_hero_id: ID,
    experience_gained: u64,
    timestamp: u64,
}

// ========= CONSTANTS =========
const BASE_EXPERIENCE_REWARD: u64 = 50;

// ========= FUNCTIONS =========
public fun create_arena(hero: Hero, ctx: &mut TxContext) {
    let arena = Arena {
        id: object::new(ctx),
        warrior: hero,
        owner: ctx.sender(),
    };

    event::emit(ArenaCreated {
        arena_id: object::id(&arena),
        timestamp: ctx.epoch_timestamp_ms(),
    });

    transfer::share_object(arena);
}

#[allow(lint(self_transfer))]
public fun battle(mut hero: Hero, arena: Arena, ctx: &mut TxContext) {
    let Arena { id, mut warrior, owner } = arena;

    let hero_id = object::id(&hero);
    let warrior_id = object::id(&warrior);

    let hero_level = hero.hero_level();
    let warrior_level = warrior.hero_level();
    let level_diff = if (hero_level > warrior_level) {
        hero_level - warrior_level
    } else {
        warrior_level - hero_level
    };
    let experience_reward = BASE_EXPERIENCE_REWARD + (level_diff * 10);

    if (hero.hero_power() > warrior.hero_power()) {
        hero.add_experience(experience_reward, ctx);

        transfer::public_transfer(warrior, ctx.sender());
        transfer::public_transfer(hero, ctx.sender());

        event::emit(ArenaCompleted {
            winner_hero_id: hero_id,
            loser_hero_id: warrior_id,
            experience_gained: experience_reward,
            timestamp: ctx.epoch_timestamp_ms(),
        });
    } else {
        warrior.add_experience(experience_reward, ctx);

        transfer::public_transfer(hero, owner);
        transfer::public_transfer(warrior, owner);

        event::emit(ArenaCompleted {
            winner_hero_id: warrior_id,
            loser_hero_id: hero_id,
            experience_gained: experience_reward,
            timestamp: ctx.epoch_timestamp_ms(),
        });
    };

    object::delete(id);
}
