module challenge::hero;

use std::string::String;

// ========= STRUCTS =========
public struct Hero has key, store {
    id: UID,
    name: String,
    image_url: String,
    power: u64,
    level: u64,
    experience: u64,
}

public struct HeroMetadata has key, store {
    id: UID,
    timestamp: u64,
}

// ========= EVENTS =========
public struct HeroLeveledUp has copy, drop {
    hero_id: ID,
    old_level: u64,
    new_level: u64,
    new_power: u64,
    timestamp: u64,
}

// ========= CONSTANTS =========
const ENotEnoughExperience: u64 = 1;
const EMaxLevelReached: u64 = 2;

const MAX_LEVEL: u64 = 100;
const POWER_INCREASE_PER_LEVEL: u64 = 10;

// ========= FUNCTIONS =========
#[allow(lint(self_transfer))]
public fun create_hero(name: String, image_url: String, power: u64, ctx: &mut TxContext) {
    let hero = Hero {
        id: object::new(ctx),
        name,
        image_url,
        power,
        level: 1,
        experience: 0,
    };

    transfer::public_transfer(hero, ctx.sender());

    let metadata = HeroMetadata {
        id: object::new(ctx),
        timestamp: ctx.epoch_timestamp_ms(),
    };

    transfer::freeze_object(metadata);
}

fun experience_for_level(level: u64): u64 {
    level * level * 100
}

public fun add_experience(hero: &mut Hero, exp: u64, ctx: &mut TxContext) {
    hero.experience = hero.experience + exp;

    try_level_up(hero, ctx);
}

public fun level_up(hero: &mut Hero, ctx: &mut TxContext) {
    assert!(hero.level < MAX_LEVEL, EMaxLevelReached);

    let exp_needed = experience_for_level(hero.level);
    assert!(hero.experience >= exp_needed, ENotEnoughExperience);

    let old_level = hero.level;

    hero.experience = hero.experience - exp_needed;
    hero.level = hero.level + 1;
    hero.power = hero.power + POWER_INCREASE_PER_LEVEL;

    sui::event::emit(HeroLeveledUp {
        hero_id: object::id(hero),
        old_level,
        new_level: hero.level,
        new_power: hero.power,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

fun try_level_up(hero: &mut Hero, ctx: &mut TxContext) {
    while (hero.level < MAX_LEVEL && hero.experience >= experience_for_level(hero.level)) {
        level_up(hero, ctx);
    }
}

// ========= GETTER FUNCTIONS =========
public fun hero_power(hero: &Hero): u64 {
    hero.power
}

public fun hero_level(hero: &Hero): u64 {
    hero.level
}

public fun hero_experience(hero: &Hero): u64 {
    hero.experience
}

public fun experience_needed_for_next_level(hero: &Hero): u64 {
    if (hero.level >= MAX_LEVEL) {
        0
    } else {
        let needed = experience_for_level(hero.level);
        if (hero.experience >= needed) {
            0
        } else {
            needed - hero.experience
        }
    }
}

#[test_only]
public fun hero_name(hero: &Hero): String {
    hero.name
}

#[test_only]
public fun hero_image_url(hero: &Hero): String {
    hero.image_url
}

#[test_only]
public fun hero_id(hero: &Hero): ID {
    object::id(hero)
}
