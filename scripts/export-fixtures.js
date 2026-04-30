#!/usr/bin/env node

import WebSocket from 'ws';

const WS_URL = process.env.VITE_WS_URL || process.env.WS_URL || 'ws://10.14.211.14:8765';
const TIMEOUT_MS = parseInt(process.env.EXPORT_FIXTURES_TIMEOUT_MS || '8000', 10);

// Subscriptions and fields (mirrors app pageRegistry)
const SUBSCRIPTIONS = {
    'character.stats': {
        health: 'ActorValue::kHealth',
        magicka: 'ActorValue::kMagicka',
        stamina: 'ActorValue::kStamina',
        healthBase: 'ActorValue::kHealth::Base',
        magickaBase: 'ActorValue::kMagicka::Base',
        staminaBase: 'ActorValue::kStamina::Base',
        level: 'Player::Level',
        xp: 'Player::XP::Current',
        xpNext: 'Player::XP::Next',
        inventoryWeight: 'Player::InventoryWeight',
        carryWeight: 'Player::CarryWeight',
        gold: 'Inventory::Gold',
    },
    'inventory.weapons': { items: 'Inventory::Items::Weapons', ammo: 'Inventory::Items::Ammo' },
    'inventory.apparel': { items: 'Inventory::Items::Apparel' },
    'inventory.food': { items: 'Inventory::Items::Food' },
    'inventory.potions': { items: 'Inventory::Items::Potions' },
    'inventory.ingredients': { items: 'Inventory::Items::Ingredients' },
    'inventory.scrolls': { items: 'Inventory::Items::Scrolls' },
    'inventory.keys': { items: 'Inventory::Items::Keys' },
    'inventory.books': { items: 'Inventory::Items::Books' },
    'inventory.misc': { items: 'Inventory::Items::Misc', gems: 'Inventory::Items::SoulGems' },
    'inventory.categories': { categories: 'Inventory::Categories' },

    // Magic
    'magic.categories': { categories: 'Magic::Categories' },
    'magic.destruction': { items: 'Magic::Items::Destruction' },
    'magic.alteration': { items: 'Magic::Items::Alteration' },
    'magic.conjuration': { items: 'Magic::Items::Conjuration' },
    'magic.illusion': { items: 'Magic::Items::Illusion' },
    'magic.restoration': { items: 'Magic::Items::Restoration' },
    'magic.enchanting': { items: 'Magic::Items::Enchanting' },

    // Character / hotkeys
    'hotkeys.items': { items: 'Hotkey::Items' },

    // Map
    'map.player': { position: 'Player::Position' },
    'map.hotspots': { hot: 'Map::Markers::Locations' },

    // Global subscriptions
    'game.status': { status: 'Game::Status' },
};

function buildQueryMessage(id, fields) {
    return JSON.stringify({ type: 'query', id, fields });
}

async function run() {
    const ws = new WebSocket(WS_URL);
    const pending = new Set(Object.keys(SUBSCRIPTIONS));
    const results = {};
    let finished = false;

    const finish = () => {
        if (finished) return;
        finished = true;
        try {
            console.log(JSON.stringify(results, null, 2));
        } catch (err) {
            console.error('Failed to stringify results', err);
        }
        ws.close();
        process.exit(0);
    };

    ws.on('open', () => {
        console.log(`Connected to ${WS_URL}, sending ${pending.size} queries...`);
        for (const [id, fields] of Object.entries(SUBSCRIPTIONS)) {
            ws.send(buildQueryMessage(id, fields));
        }
        // safety timeout
        setTimeout(() => {
            console.warn('Export timeout reached, finishing with partial results');
            finish('timeout');
        }, TIMEOUT_MS);
    });

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            if (msg && msg.type === 'data' && msg.id && pending.has(msg.id)) {
                results[msg.id] = msg.fields ?? null;
                pending.delete(msg.id);
                if (pending.size === 0) {
                    console.log('All queries answered');
                    finish('complete');
                }
            }
        } catch (err) {
            console.warn('Failed to parse incoming message', err);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        finish('error');
    });

    ws.on('close', () => {
        if (!finished) {
            console.warn('Connection closed before all data received');
            finish('closed');
        }
    });
}

run().catch((err) => {
    console.error('Export fixtures failed:', err);
    process.exit(1);
});
