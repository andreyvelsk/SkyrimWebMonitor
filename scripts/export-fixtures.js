#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const WS_URL = process.env.VITE_WS_SERVER_URL || process.env.WS_URL;
const TIMEOUT_MS = parseInt(process.env.EXPORT_FIXTURES_TIMEOUT_MS || '8000', 10);
const OUTPUT_PATH = process.env.EXPORT_FIXTURES_PATH || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/fixtures.json');

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
    'magic.shouts': { items: 'Magic::Items::Shouts' },

    // Character / hotkeys
    'hotkeys.items': { items: 'Hotkey::Items' },

    // Quests
    'quests.questsList': { quests: 'Player::Quests' },

    // Map
    'map.player': { position: 'Player::Position' },
    'map.hotspots': { hot: 'Map::Markers::Locations' },
    'map.questMarkers': { marker: 'Map::Markers::Quests' },

    // Dynamic system data (language and server-provided features)
    system: {
        language: 'Game::Language',
        features: 'App::Features',
    },

    // Global subscriptions
    'game.status': { status: 'Game::Status' },
};

const EXPECTED_SUBSCRIPTION_COUNT = Object.keys(SUBSCRIPTIONS).length;

function buildQueryMessage(id, fields) {
    return JSON.stringify({ type: 'query', id, fields });
}

async function run() {
    const ws = new WebSocket(WS_URL);
    const pending = new Set(Object.keys(SUBSCRIPTIONS));
    const results = {};
    let finished = false;

    const finish = async () => {
        if (finished) return;
        finished = true;
        try {
            const fixtureJson = `${JSON.stringify(results, null, 4)}\n`;
            await fs.writeFile(OUTPUT_PATH, fixtureJson, 'utf8');
            const receivedCount = Object.keys(results).length;
            console.log(`Fixtures written to ${OUTPUT_PATH}`);
            console.log(`Updated at ${new Date().toISOString()}; received ${receivedCount}/${EXPECTED_SUBSCRIPTION_COUNT} subscriptions`);
        } catch (err) {
            console.error('Failed to write fixtures', err);
            process.exitCode = 1;
        }
        ws.close();
    };

    ws.on('open', () => {
        console.log(`Connected to ${WS_URL}, sending ${pending.size} queries...`);
        for (const [id, fields] of Object.entries(SUBSCRIPTIONS)) {
            ws.send(buildQueryMessage(id, fields));
        }
        // safety timeout
        setTimeout(() => {
            console.warn('Export timeout reached, finishing with partial results');
            void finish();
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
                    void finish();
                }
            }
        } catch (err) {
            console.warn('Failed to parse incoming message', err);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        void finish();
    });

    ws.on('close', () => {
        if (!finished) {
            console.warn('Connection closed before all data received');
            void finish();
        }
    });
}

run().catch((err) => {
    console.error('Export fixtures failed:', err);
    process.exit(1);
});
