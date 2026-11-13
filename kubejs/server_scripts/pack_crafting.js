// Receitas dos 12 Fardos Comerciais + Itens de Soberania, Validação de Bioma (Sintéticos) e Anti-Exploits

// Mapa de Biomas Nativos aceitos para cada Fardo (Autenticidade)
const NATIVE_BIOME_PATTERNS = {
    'kubejs:fardo_planicie':  ['plains', 'meadow', 'sunflower', 'savanna', 'steppe', 'prairie', 'field', 'pasture'],
    'kubejs:fardo_floresta':  ['forest', 'taiga', 'birch', 'dark_forest', 'grove', 'wood', 'autumn', 'maple', 'orchard'],
    'kubejs:fardo_deserto':   ['desert', 'dune', 'oasis', 'lush_stacks', 'red_rock'],
    'kubejs:fardo_tundra':    ['snowy', 'ice', 'frozen', 'tundra', 'glacier', 'alps', 'cold', 'frost'],
    'kubejs:fardo_selva':     ['jungle', 'bamboo', 'rainforest', 'tropical', 'crag'],
    'kubejs:fardo_pantano':   ['swamp', 'mangrove', 'marsh', 'bog', 'bayou', 'wetland', 'fen'],
    'kubejs:fardo_badlands':  ['badlands', 'mesa', 'eroded', 'canyon', 'sierra', 'wasteland'],
    'kubejs:fardo_oceano':    ['ocean', 'beach', 'river', 'shore', 'sea', 'archipelago', 'reef'],
    'kubejs:fardo_montanha':  ['peaks', 'slopes', 'hills', 'mountain', 'windswept', 'cliff', 'highland', 'crag'],
    'kubejs:fardo_cerejeira': ['cherry', 'sakura', 'blossom', 'floral', 'flower']
};

function isNativeBiomeForPack(packId, biomeStr, dimStr) {
    let b = (biomeStr || '').toLowerCase();
    let d = (dimStr || '').toLowerCase();

    if (packId === 'kubejs:fardo_nether') {
        return d.includes('nether');
    }
    if (packId === 'kubejs:fardo_end') {
        return d.includes('the_end') || d.includes('end');
    }

    // Fardos do Overworld exigem estar no Overworld e no bioma correspondente
    if (!d.includes('overworld')) return false;

    let patterns = NATIVE_BIOME_PATTERNS[packId];
    if (!patterns) return true;
    for (let i = 0; i < patterns.length; i++) {
        if (b.includes(patterns[i])) return true;
    }
    return false;
}

ServerEvents.recipes(event => {
    // --- ITENS DE SOBERANIA E CERCO ---
    // Marco de Fundação da Vila (Para reivindicar vilas virgens sem Admin)
    event.shaped('kubejs:marco_fundacao', [
        'GEG',
        'LBL',
        'OOO'
    ], {
        G: 'minecraft:gold_block',
        E: 'minecraft:emerald_block',
        L: '#minecraft:banners',
        B: 'minecraft:bell',
        O: 'minecraft:obsidian'
    }).id('kubejs:marco_fundacao');

    // Clarim de Cerco Territorial (Para declarar guerra a uma vila rival)
    event.shaped('kubejs:clarim_cerco', [
        'GGG',
        'RHR',
        'III'
    ], {
        G: 'minecraft:gold_ingot',
        R: 'minecraft:redstone_block',
        H: 'minecraft:tnt',
        I: 'minecraft:iron_block'
    }).id('kubejs:clarim_cerco');

    // --- 12 FARDOS COMERCIAIS ---
    // 1. Planície: Feno + Lã + Couro + Trigo
    event.shaped('kubejs:fardo_planicie', [
        'LLL',
        'CHC',
        'FFF'
    ], {
        L: '#minecraft:wool',
        C: 'minecraft:leather',
        H: 'minecraft:hay_block',
        F: 'minecraft:wheat'
    }).id('kubejs:fardo_planicie');

    // 2. Floresta: Troncos + Maçãs + Flores
    event.shaped('kubejs:fardo_floresta', [
        'MMM',
        'TTT',
        'DDD'
    ], {
        M: 'minecraft:apple',
        T: '#minecraft:logs',
        D: 'minecraft:dandelion'
    }).id('kubejs:fardo_floresta');

    // 3. Deserto: Vidro + Cacto + Arenito
    event.shaped('kubejs:fardo_deserto', [
        'VVV',
        'CCC',
        'AAA'
    ], {
        V: 'minecraft:glass',
        C: 'minecraft:cactus',
        A: 'minecraft:sandstone'
    }).id('kubejs:fardo_deserto');

    // 4. Tundra: Neve + Gelo Compacto + Couro
    event.shaped('kubejs:fardo_tundra', [
        'NNN',
        'GGG',
        'CCC'
    ], {
        N: 'minecraft:snow_block',
        G: 'minecraft:packed_ice',
        C: 'minecraft:leather'
    }).id('kubejs:fardo_tundra');

    // 5. Selva: Bambu + Cacau + Melancia
    event.shaped('kubejs:fardo_selva', [
        'BBB',
        'CCC',
        'MMM'
    ], {
        B: 'minecraft:bamboo',
        C: 'minecraft:cocoa_beans',
        M: 'minecraft:melon'
    }).id('kubejs:fardo_selva');

    // 6. Pântano: Vitória-Régia + Slime + Argila
    event.shaped('kubejs:fardo_pantano', [
        'VVV',
        'SSS',
        'AAA'
    ], {
        V: 'minecraft:lily_pad',
        S: 'minecraft:slime_ball',
        A: 'minecraft:clay'
    }).id('kubejs:fardo_pantano');

    // 7. Terras Ermas (Badlands): Terracota + Ouro Bruto + Areia Vermelha
    event.shaped('kubejs:fardo_badlands', [
        'TTT',
        'OOO',
        'AAA'
    ], {
        T: 'minecraft:terracotta',
        O: 'minecraft:raw_gold',
        A: 'minecraft:red_sand'
    }).id('kubejs:fardo_badlands');

    // 8. Oceano: Prismarinho + Bacalhau + Algas Secas
    event.shaped('kubejs:fardo_oceano', [
        'PPP',
        'DDD',
        'AAA'
    ], {
        P: 'minecraft:prismarine_shard',
        D: 'minecraft:cod',
        A: 'minecraft:dried_kelp'
    }).id('kubejs:fardo_oceano');

    // 9. Montanha / Picos: Esmeralda + Ferro Bruto + Carvão
    event.shaped('kubejs:fardo_montanha', [
        'EEE',
        'FFF',
        'CCC'
    ], {
        E: 'minecraft:emerald',
        F: 'minecraft:raw_iron',
        C: 'minecraft:coal'
    }).id('kubejs:fardo_montanha');

    // 10. Cerejeira: Pétalas + Madeira de Cerejeira + Mel
    event.shaped('kubejs:fardo_cerejeira', [
        'PPP',
        'MMM',
        'HHH'
    ], {
        P: 'minecraft:pink_petals',
        M: 'minecraft:cherry_log',
        H: 'minecraft:honey_bottle'
    }).id('kubejs:fardo_cerejeira');

    // 11. Nether: Quartzo + Creme de Magma + Fungos/Areia das Almas
    event.shaped('kubejs:fardo_nether', [
        'QQQ',
        'MMM',
        'SSS'
    ], {
        Q: 'minecraft:quartz',
        M: 'minecraft:magma_cream',
        S: 'minecraft:soul_sand'
    }).id('kubejs:fardo_nether');

    // 12. End: Fruta do Coro + Pedra do Fim + Pérola do Fim
    event.shaped('kubejs:fardo_end', [
        'CCC',
        'PPP',
        'EEE'
    ], {
        C: 'minecraft:chorus_fruit',
        P: 'minecraft:ender_pearl',
        E: 'minecraft:end_stone'
    }).id('kubejs:fardo_end');
});

// Cooldown de Rumores de Taverna por jogador (5 minutos)
let caravanRumorCooldowns = {};

const PACK_REGION_NAMES = {
    'kubejs:fardo_planicie':  'as Planícies Verdes',
    'kubejs:fardo_floresta':  'as Florestas Antigas',
    'kubejs:fardo_deserto':   'as Dunas do Deserto',
    'kubejs:fardo_tundra':    'a Tundra Congelada',
    'kubejs:fardo_selva':     'a Selva Tropical',
    'kubejs:fardo_pantano':   'o Pântano Profundo',
    'kubejs:fardo_badlands':  'as Terras Ermas (Badlands)',
    'kubejs:fardo_oceano':    'a Costa Oceânica',
    'kubejs:fardo_montanha':  'as Cordilheiras e Picos',
    'kubejs:fardo_cerejeira': 'o Bosque de Cerejeiras',
    'kubejs:fardo_nether':    'as Profundezas do Nether',
    'kubejs:fardo_end':       'o Vazio Astral do End'
};

function countPlayerCargoPacks(player) {
    if (!player || !player.inventory) return 0;
    let total = 0;
    try {
        player.inventory.allItems.forEach(item => {
            if (item && item.id && item.id.startsWith('kubejs:fardo_')) {
                total += item.count;
            }
        });
    } catch (e) {}
    return total;
}

// Ao fabricar um fardo, carimba as coordenadas de origem e verifica se é Autêntico ou Sintético
ItemEvents.crafted(event => {
    let item = event.item;
    if (item.id.startsWith('kubejs:fardo_')) {
        let player = event.player;
        let x = Math.round(player.x);
        let y = Math.round(player.y);
        let z = Math.round(player.z);

        let biomeStr = 'minecraft:plains';
        let dimStr = 'minecraft:overworld';
        try {
            biomeStr = player.level.getBiome(player.blockPosition()).unwrapKey().get().location().toString();
            dimStr = player.level.dimension.toString();
        } catch (e) {}

        let isAuthentic = isNativeBiomeForPack(item.id, biomeStr, dimStr);
        let isDimensional = (item.id === 'kubejs:fardo_nether' || item.id === 'kubejs:fardo_end') && isAuthentic;

        item.nbt = item.nbt || {};
        item.nbt.putInt('originX', x);
        item.nbt.putInt('originY', y);
        item.nbt.putInt('originZ', z);
        item.nbt.putString('originDim', dimStr);
        item.nbt.putBoolean('synthetic', !isAuthentic);
        item.nbt.putBoolean('dimensionalBonus', isDimensional);
        item.nbt.putString('craftedBy', player.name.string);
        item.nbt.putLong('craftedTime', Date.now());

        let authText = isAuthentic
            ? `{"text":"§a✔ Carga Autêntica de Origem (Valor 100%)","italic":false}`
            : `{"text":"§c⚠ Carga Sintética: Fora do Bioma (-60% Valor)","italic":false}`;

        let loreList = [
            authText,
            `{"text":"§7Origem: §fX: ${x}, Z: ${z} (${biomeStr.split(':')[1] || biomeStr})","italic":false}`,
            `{"text":"§7Produzido por: §e${player.name.string}","italic":false}`,
            `{"text":"§aTransporte até um entreposto da Guilda Mercante!","italic":false}`
        ];

        let displayTag = item.nbt.getCompound('display');
        let tagList = Utils.newList();
        loreList.forEach(l => tagList.add(Utils.newString(l)));
        displayTag.put('Lore', tagList);
        item.nbt.put('display', displayTag);

        if (isAuthentic) {
            player.tell(`§6[Rotas Mercantis] §fVocê produziu um §aFardo Autêntico§f: §e${item.displayName.string}§f em §b[${x}, ${z}]§f!`);

            // Rumor de Taverna nas Estradas (Quando acumula 3+ fardos autênticos, sem revelar coordenadas!)
            let packCount = countPlayerCargoPacks(player) + 1;
            let now = Date.now();
            let pUUID = player.uuid.toString();
            if (packCount >= 3 && (!caravanRumorCooldowns[pUUID] || (now - caravanRumorCooldowns[pUUID]) >= 300000)) {
                caravanRumorCooldowns[pUUID] = now;
                let regionName = PACK_REGION_NAMES[item.id] || 'terras distantes';
                if (player.server) {
                    player.server.tell(`§6🍻 [Rumor de Estrada] §fViajantes avistaram uma caravana carregada se preparando em §e${regionName} §frumo às vilas...`);
                }
            }
        } else {
            player.tell(`§c[Rotas Mercantis] §eAtenção: §fVocê fabricou este fardo fora de seu bioma nativo! Ele foi classificado como §cCarga Sintética (-60% de valor)§f.`);
        }
    }
});

// -------------------------------------------------------------------------
// MECÂNICAS FÍSICAS DE CARGA PESADA & ANTI-EXPLOITS (ENDER CHEST / NETHER)
// -------------------------------------------------------------------------

function playerHasCargoPack(player) {
    if (!player || !player.inventory) return false;
    let found = false;
    try {
        player.inventory.allItems.forEach(item => {
            if (!item || !item.id) return;
            if (item.id.startsWith('kubejs:fardo_')) {
                found = true;
            } else if (item.nbt && item.nbt.toString().includes('kubejs:fardo_')) {
                found = true;
            }
        });
    } catch (e) {}
    return found;
}
global.playerHasCargoPack = playerHasCargoPack;

// Rastreia a última dimensão do jogador para neutralizar o atalho 8x do Nether
let lastPlayerDimension = {};

let cargoTickCounter = 0;
ServerEvents.tick(event => {
    cargoTickCounter++;
    if (cargoTickCounter < 20) return;
    cargoTickCounter = 0;

    let server = event.server;
    if (!server) return;

    let players = server.playerList.players;
    players.forEach(p => {
        if (!p.alive) return;
        let uuid = p.uuid.toString();
        let currentDim = p.level.dimension.toString();
        let prevDim = lastPlayerDimension[uuid];

        // 1. Verifica travessia de portal com Fardos (Anti-Atalho Dimensional 8x)
        if (prevDim && prevDim !== currentDim && playerHasCargoPack(p)) {
            let px = Math.round(p.x);
            let py = Math.round(p.y);
            let pz = Math.round(p.z);

            p.inventory.allItems.forEach(item => {
                if (item && item.id && item.id.startsWith('kubejs:fardo_')) {
                    item.nbt = item.nbt || {};
                    item.nbt.putInt('originX', px);
                    item.nbt.putInt('originY', py);
                    item.nbt.putInt('originZ', pz);
                }
            });

            p.tell('§e[Alfândega Dimensional] §fAo cruzar o portal, o marco de distância dos seus fardos foi sincronizado para a posição do portal de saída!');
        }
        lastPlayerDimension[uuid] = currentDim;

        // 2. Confisca/Ejeta fardos caso alguém tente injetar em Ender Chest
        try {
            if (p.enderChestInventory) {
                p.enderChestInventory.allItems.forEach(ecItem => {
                    if (ecItem && ecItem.id && (ecItem.id.startsWith('kubejs:fardo_') || (ecItem.nbt && ecItem.nbt.toString().includes('kubejs:fardo_')))) {
                        let copy = ecItem.copy();
                        ecItem.count = 0;
                        p.drop(copy, false);
                        p.tell('§c[Rotas Mercantis] Cargas comerciais não cabem na dimensão do Baú do Fim e foram ejetadas!');
                    }
                });
            }
        } catch (e) {}

        // 3. Aplica Lentidão Física a pé ao transportar fardos
        if (playerHasCargoPack(p)) {
            let isRiding = p.isPassenger() || (p.vehicle != null);
            if (!isRiding) {
                try {
                    p.potionEffects.add('minecraft:slowness', 40, 1, false, false);
                } catch (e) {
                    server.runCommandSilent(`effect give ${p.name.string} minecraft:slowness 2 1 true`);
                }
                server.runCommandSilent(`title ${p.name.string} actionbar {"text":"§6⚖ [Carga Pesada] §fTransportando Fardo a pé. Use montarias, carroças ou navios!"}`);
            }
        }
    });
});

// Bloqueia abrir Ender Chest ou Mochilas no chão carregando fardos
BlockEvents.rightClicked(event => {
    let b = event.block;
    let p = event.player;
    if (!b || !p) return;
    if ((b.id === 'minecraft:ender_chest' || b.id.includes('sophisticatedbackpacks:') || b.id.includes('shulker_box')) && playerHasCargoPack(p)) {
        event.cancel();
        p.tell('§c[Rotas Mercantis] Você não pode guardar fardos em Baús do Fim, Shulkers ou Mochilas! Use Carroças ou Navios.');
        p.playSound('minecraft:block.chest.locked', 1.0, 1.0);
    }
});

// Bloqueio de Teleporte Rápido (Pérolas do Fim / Frutas do Coro)
ItemEvents.rightClicked(event => {
    let p = event.player;
    let item = event.item;
    if (!p || !item) return;
    let id = item.id;
    if (id === 'minecraft:ender_pearl' || id === 'minecraft:chorus_fruit') {
        if (playerHasCargoPack(p)) {
            event.cancel();
            p.tell('§c[Rotas Mercantis] O peso excessivo do fardo impede o uso de teleporte ou pérolas do fim!');
            p.playSound('minecraft:block.anvil.hit', 0.8, 1.0);
        }
    }
});

// Alerta de Pirataria ao morrer com fardos valiosos
EntityEvents.death(event => {
    let ent = event.entity;
    if (ent && ent.isPlayer()) {
        let p = ent;
        if (playerHasCargoPack(p)) {
            let x = Math.round(p.x);
            let y = Math.round(p.y);
            let z = Math.round(p.z);
            let server = p.server;
            server.tell('§4§l==================================================');
            server.tell(`§c§l☠ [ALERTA DE PIRATARIA] MERCADOR ABATIDO!`);
            server.tell(`§e${p.name.string} §ffoi abatido transportando fardos em §c[X: ${x}, Y: ${y}, Z: ${z}]§f!`);
            server.tell(`§7A carga comercial foi derramada no chão à mercê de saqueadores!`);
            server.tell('§4§l==================================================');
            server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder master @a ${x} ${y} ${z} 1.0 1.0`);
        }
    }
});
