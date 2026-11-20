// Sistema de Soberania Territorial, Clãs, Cidades Vivas, Imposto Passivo & Cercos - Memescrafto RPG
// Limite estrito: 1 Vila por Clã/Facção
// Imposto Comercial Regional (8%) + Imposto Passivo por População de Aldeões (Censo a cada 30 min)
// Validação Anti-Dungeon (Bloqueia Spawners e Masmorras do YUNG's / Dungeons Enhanced)
// Proteção Total de Aldeões Fora de Guerra + Sistema de Cerco com Zona de Controle Anti-Bunker (12m)

const DATA_FILE_PATH = 'kubejs/data/claimed_villages.json';
const CLANS_FILE_PATH = 'kubejs/data/clans.json';
const SIEGE_FILE_PATH = 'kubejs/data/siege_state.json';
const SiegeAABB = Java.loadClass('net.minecraft.world.phys.AABB');

let claimedVillages = {};
let customClans = {};               // clanId -> { id, name, leaderUUID, leaderName, members: [uuid] }
let clanInvites = {};               // targetUUID -> clanId
let activeSieges = {};              // villageId -> { attackerParty, attackerUUID, attackerName, timeLeft, controlProgress }
let siegeCooldowns = {};            // villageId -> timestamp
let playerAttackMercenaries = {};   // playerUUID -> { count, tier, label }

// ----------------------------------------------------
// PERSISTÊNCIA EM DISCO (VILAS, CLÃS, CERCOS & MERCENÁRIOS)
// ----------------------------------------------------
function saveSiegeState() {
    try {
        JsonIO.write(SIEGE_FILE_PATH, {
            activeSieges: activeSieges,
            siegeCooldowns: siegeCooldowns,
            playerAttackMercenaries: playerAttackMercenaries
        });
    } catch (e) {}
}

function loadSiegeState() {
    try {
        let data = JsonIO.read(SIEGE_FILE_PATH);
        if (data) {
            activeSieges = data.activeSieges || {};
            siegeCooldowns = data.siegeCooldowns || {};
            playerAttackMercenaries = data.playerAttackMercenaries || {};
        }
    } catch (e) {}
}

function saveVillages() {
    try {
        JsonIO.write(DATA_FILE_PATH, claimedVillages);
    } catch (e) {
        try {
            let Paths = Java.loadClass('java.nio.file.Paths');
            let Files = Java.loadClass('java.nio.file.Files');
            let path = Paths.get(DATA_FILE_PATH);
            Files.createDirectories(path.getParent());
            Files.writeString(path, JSON.stringify(claimedVillages, null, 2));
        } catch (e2) {}
    }
}

function getEconomicTier(points) {
    let pts = points || 0;
    if (pts >= 800) return { tier: 3, name: '§6§lTier III (Hub Metropolitano)', discRate: 0.15, packBonus: 0.05 };
    if (pts >= 300) return { tier: 2, name: '§bNível II (Mercado Próspero)', discRate: 0.10, packBonus: 0.02 };
    if (pts >= 100) return { tier: 1, name: '§aNível I (Empório Local)', discRate: 0.05, packBonus: 0.00 };
    return { tier: 0, name: '§7Nível 0 (Incipiente)', discRate: 0.00, packBonus: 0.00 };
}

function loadVillages() {
    try {
        let data = JsonIO.read(DATA_FILE_PATH);
        if (data) {
            claimedVillages = data;
            console.log('[Soberania] ' + Object.keys(claimedVillages).length + ' vilas carregadas via JsonIO.');
            return;
        }
    } catch (e) {}
    claimedVillages = {};
}

function saveClans() {
    try {
        JsonIO.write(CLANS_FILE_PATH, customClans);
    } catch (e) {}
}

function loadClans() {
    try {
        let data = JsonIO.read(CLANS_FILE_PATH);
        if (data) {
            customClans = data;
            return;
        }
    } catch (e) {}
    customClans = {};
}

loadVillages();
loadClans();
loadSiegeState();

// ----------------------------------------------------
// FUNÇÕES DE CLÃ / FACÇÃO
// ----------------------------------------------------
function getPlayerClan(playerUUID) {
    let u = String(playerUUID);
    for (let id in customClans) {
        let c = customClans[id];
        if (c.leaderUUID === u) return c;
        if (c.members) {
            for (let i = 0; i < c.members.length; i++) {
                if (String(c.members[i]) === u) return c;
            }
        }
    }
    return null;
}

function getPlayerPartyName(player) {
    if (!player) return 'Forasteiro';
    let c = getPlayerClan(player.uuid.toString());
    if (c && c.name) return c.name;
    return `Facção de ${player.name.string}`;
}

function getNearestVillage(x, z, maxDist) {
    let nearest = null;
    let minDist = maxDist || 160;

    for (let id in claimedVillages) {
        let v = claimedVillages[id];
        let dx = x - v.x;
        let dz = z - v.z;
        let dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= minDist) {
            minDist = dist;
            nearest = v;
        }
    }
    return nearest;
}
global.getNearestVillage = getNearestVillage;

function getPartyOwnedVillage(partyName, playerUUID) {
    for (let id in claimedVillages) {
        let v = claimedVillages[id];
        if (v.partyName === partyName || v.ownerUUID === playerUUID) {
            return v;
        }
    }
    return null;
}

function getProsperityInfo(v) {
    let tier = 0;
    if (v) {
        if (v.prosperityTier !== undefined && v.prosperityTier !== null && !isNaN(Number(v.prosperityTier))) {
            tier = Number(v.prosperityTier);
        } else {
            // Migração única para vilas antigas baseadas em saldo de cofre
            let gold = v.taxGold || 0;
            tier = gold >= 150 ? 3 : (gold >= 50 ? 2 : (gold >= 15 ? 1 : 0));
            v.prosperityTier = tier;
        }
    }
    if (tier >= 3) return { tier: 3, name: '§6§lNível III (Metrópole)', nextHint: '§6Máximo', maxGuards: 12, taxBonus: 1.25, nextCost: 0, maxDebtIron: 2000 };
    if (tier === 2) return { tier: 2, name: '§bNível II (Bastião)',    nextHint: '§8Próx: 150 Ouro (/totem evoluir)', maxGuards: 8,  taxBonus: 1.25, nextCost: 150, maxDebtIron: 800 };
    if (tier === 1) return { tier: 1, name: '§aNível I (Mercantil)',   nextHint: '§8Próx: 50 Ouro (/totem evoluir)',  maxGuards: 4,  taxBonus: 1.0,  nextCost: 50, maxDebtIron: 300 };
    return { tier: 0, name: '§7Nível 0 (Assentamento)', nextHint: '§8Próx: 15 Ouro (/totem evoluir)', maxGuards: 2, taxBonus: 1.0, nextCost: 15, maxDebtIron: 100 };
}

function calculatePassiveTaxIron(pop, taxBonus) {
    if (!pop || pop < 5) return 0;
    let baseIron = Math.min(50, Math.floor(pop / 2));
    return Math.round(baseIron * (taxBonus || 1.0));
}

const VILLAGE_NPC_REQS = {
    armazem:    { name: 'Armazém Geral', villagers: 8,  goldCost: 5,  tier: 0 },
    fazendeiro: { name: 'Feirante Agrícola', villagers: 10, goldCost: 8, tier: 0 },
    guilda:     { name: 'Guilda Mercante', villagers: 12, goldCost: 50, tier: 1 },
    intendente: { name: 'Intendente de Guerra', villagers: 14, goldCost: 15, tier: 1 },
    banco:      { name: 'Banqueiro Local', villagers: 18, goldCost: 15, tier: 2 },
    padre:      { name: 'Padre Curandeiro', villagers: 20, goldCost: 12, tier: 2 },
    ferreiro:   { name: 'Mestre da Forja', villagers: 25, goldCost: 50, tier: 3 }
};

function calculateVillageUpkeep(v) {
    let pInfo = getProsperityInfo(v);
    let guardIron = (pInfo.maxGuards || 2) * 2;
    let npcIron = 0;
    let hired = (v && Array.isArray(v.hiredNpcs)) ? v.hiredNpcs : [];
    for (let i = 0; i < hired.length; i++) {
        let req = VILLAGE_NPC_REQS[hired[i]];
        if (req && req.goldCost > 0) {
            // 10% do custo do NPC em Ouro convertido para Ferro (1 Ouro = 10 Ferro)
            npcIron += Math.max(1, Math.round(req.goldCost * 10 * 0.10));
        }
    }
    return {
        guardIron: guardIron,
        npcIron: npcIron,
        totalIron: guardIron + npcIron,
        maxDebtIron: pInfo.maxDebtIron || 20
    };
}

function creditVillageTreasury(v, ironAmount) {
    if (!v || ironAmount <= 0) return { paidDebt: 0, netCredited: 0 };
    let debt = v.taxDebtIron || 0;
    let paidDebt = Math.min(debt, ironAmount);
    v.taxDebtIron = Math.max(0, debt - paidDebt);
    if (v.taxDebtIron === 0) v.debtStrikes = 0;

    let rem = ironAmount - paidDebt;
    if (rem > 0) {
        v.taxIron = (v.taxIron || 0) + rem;
        if (v.taxIron >= 10) {
            v.taxGold = (v.taxGold || 0) + Math.floor(v.taxIron / 10);
            v.taxIron = v.taxIron % 10;
        }
    }
    return { paidDebt: paidDebt, netCredited: rem };
}

function deductVillageUpkeep(v, upkeepIron, maxDebtIron) {
    if (!v || upkeepIron <= 0) return null;
    let treasuryTotalIron = ((v.taxGold || 0) * 10) + (v.taxIron || 0);
    let afterUpkeep = treasuryTotalIron - upkeepIron;
    let demotedMsg = null;

    if (afterUpkeep >= 0) {
        v.taxGold = Math.floor(afterUpkeep / 10);
        v.taxIron = afterUpkeep % 10;
        v.taxDebtIron = 0;
        v.debtStrikes = 0;
    } else {
        v.taxGold = 0;
        v.taxIron = 0;
        let addedDebt = -afterUpkeep;
        v.taxDebtIron = Math.min(maxDebtIron, (v.taxDebtIron || 0) + addedDebt);

        if (v.taxDebtIron >= maxDebtIron) {
            v.debtStrikes = (v.debtStrikes || 0) + 1;
            let curTier = Number(v.prosperityTier) || 0;
            if (v.debtStrikes >= 2 && curTier > 0) {
                v.prosperityTier = curTier - 1;
                v.debtStrikes = 0;
                let demInfo = getProsperityInfo(v);
                v.taxDebtIron = Math.min(v.taxDebtIron, demInfo.maxDebtIron);
                demotedMsg = `§c§l[⚠ REBAIXAMENTO POR DÍVIDA] §e${v.name} §catingiu o limite de dívida por 2 censos seguidos e foi rebaixada para ${demInfo.name}§c!`;
                if (global.chronicleEvent) global.chronicleEvent('village', `Vila "${v.name}" foi rebaixada para ${demInfo.name} por insolvência.`);
            }
        } else {
            v.debtStrikes = 0;
        }
    }
    return demotedMsg;
}

function getVillageCenterCoords(v, level) {
    if (!v) return { x: 0, y: 64, z: 0 };
    return { x: v.x, y: (v.y || 64), z: v.z };
}
global.getVillageCenterCoords = getVillageCenterCoords;

// ----------------------------------------------------
// VALIDAÇÃO ANTI-DUNGEON E CENSO DE ALDEÕES
// ----------------------------------------------------
function countLivingVillagers(level, x, y, z, radius) {
    let count = 0;
    try {
        let entities = level.getEntities();
        entities.forEach(ent => {
            if (ent && String(ent.type) === 'minecraft:villager' && (typeof ent.isAlive === 'function' ? ent.isAlive() : ent.alive)) {
                let dx = ent.x - x;
                let dz = ent.z - z;
                if ((dx * dx + dz * dz) <= (radius * radius)) {
                    count++;
                }
            }
        });
    } catch (e) {
        console.error("Erro em countLivingVillagers:", e);
    }
    return count;
}

function validateVillageLocation(player) {
    let level = player.level;
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    // 1. Verifica presença de Sino da Vila e ausência de Mob Spawners num raio próximo
    let foundBell = false;
    let foundSpawner = false;

    for (let dx = -32; dx <= 32; dx += 1) {
        for (let dy = -16; dy <= 24; dy += 1) {
            for (let dz = -32; dz <= 32; dz += 1) {
                let b = level.getBlock(px + dx, py + dy, pz + dz);
                let bId = b ? b.id : '';
                if (bId === 'minecraft:spawner') {
                    foundSpawner = true;
                    break;
                }
                if (bId === 'minecraft:bell') {
                    foundBell = true;
                }
            }
            if (foundSpawner) break;
        }
        if (foundSpawner) break;
    }

    if (foundSpawner) {
        return { valid: false, reason: '§c[Soberania] Proibido reivindicar território próximo a Masmorras ou Spawners de Monstros!' };
    }

    if (!foundBell) {
        return {
            valid: false,
            reason: '§c[Soberania] Você precisa estar próximo a um Sino Central (minecraft:bell) para fundar um governo!\n§7(Dica: Coloque ou aproxime-se de um Sino num raio de até 32 blocos).'
        };
    }

    // 2. Exige mínimo de 5 Aldeões vivos num raio de 85 blocos
    let villagerCount = countLivingVillagers(level, px, py, pz, 85);
    if (villagerCount < 5) {
        return {
            valid: false,
            reason: `§c[Soberania] Uma vila legítima exige pelo menos §e5 Aldeões vivos §c(Encontrados: ${villagerCount}). Masmorras e ruínas vazias não podem ser reivindicadas!`
        };
    }

    return { valid: true, villagers: villagerCount };
}

function registerVillageTotem(id, name, x, y, z) {
    if (!claimedVillages[id]) {
        claimedVillages[id] = {
            id: id,
            name: name,
            x: x,
            y: y,
            z: z,
            ownerUUID: null,
            ownerName: null,
            partyName: null,
            citizens: [],
            taxGold: 0,
            taxIron: 0,
            population: 5,
            economicPoints: 0,
            prosperityTier: 0,
            ruinStrikes: 0,
            hiredNpcs: [],
            ruined: false,
            claimedAt: 0
        };
        saveVillages();
    }
    return claimedVillages[id];
}
global.registerVillageTotem = registerVillageTotem;

// ----------------------------------------------------
// REIVINDICAÇÃO, COFRE E GERENCIAMENTO DA VILA
// ----------------------------------------------------
function claimVillage(player, server) {
    if (!player) return 0;

    let v = getNearestVillage(player.x, player.z, 160);

    // Se a vila ainda não está registrada ou está sem dono, valida Anti-Dungeon e 5+ Aldeões
    if (!v || !v.ownerUUID) {
        let check = validateVillageLocation(player);
        if (!check.valid) {
            player.tell(check.reason);
            player.playSound('minecraft:entity.villager.no', 1.0, 0.8);
            return 0;
        }
        if (!v) {
            let id = `vila_${Math.floor(player.x)}_${Math.floor(player.z)}`;
            let defaultName = `Vila de ${player.name.string}`;
            v = registerVillageTotem(id, defaultName, Math.floor(player.x), Math.floor(player.y), Math.floor(player.z));
        }
        v.population = check.villagers;
        v.ruined = false;
    }

    let party = getPlayerPartyName(player);
    let existing = getPartyOwnedVillage(party, player.uuid.toString());

    if (existing && existing.id !== v.id) {
        player.tell(`§c[Soberania] Seu clã já governa a vila de §e${existing.name}§c!`);
        player.tell('§7O limite é de 1 vila por clã. Renuncie à anterior para governar esta.');
        return 0;
    }

    // Permite tomar vila se estiver em Ruína (< 5 aldeões no último censo) ou sem dono
    if (v.ownerUUID && v.ownerUUID !== player.uuid.toString() && !v.ruined) {
        player.tell(`§c[Soberania] Esta vila já é governada por §6${v.partyName}§c!`);
        player.tell('§7Para conquistá-la à força, fabrique e toque um §4Clarim de Cerco Territorial§7!');
        return 0;
    }

    v.ownerUUID = player.uuid.toString();
    v.ownerName = player.name.string;
    v.partyName = party;
    v.claimedAt = Date.now();
    v.ruined = false;
    v.citizens = v.citizens || [];

    saveVillages();
    if (global.chronicleEvent) global.chronicleEvent('village', `${player.name.string} (${v.partyName}) reivindicou a vila "${v.name}".`);

    player.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.0);
    server.tell('§6§l==================================================');
    server.tell('§e§l👑 NOVO SOBERANO RECONHECIDO PELA COROA!');
    server.tell(`§fA vila de §e§l${v.name} §ffoi reivindicada por §6§l${v.partyName}§f!`);
    server.tell(`§7Governador: §f${player.name.string} §8| §7População: §a${v.population || 5} Aldeões`);
    server.tell('§6§l==================================================');

    return 1;
}

// ----------------------------------------------------
// HANDLERS DE ITENS DE SOBERANIA (MARCO, CONTRATOS, CLARIM)
// ----------------------------------------------------
function consumeHeldItem(p, item) {
    if (!p || !item) return;
    let handStack = (p.mainHandItem && p.mainHandItem.id === item.id) ? p.mainHandItem : ((p.offHandItem && p.offHandItem.id === item.id) ? p.offHandItem : item);
    if (typeof handStack.shrink === 'function') handStack.shrink(1);
    else handStack.count--;
}

let playerActionDebounce = {};

function handleMarcoFundacao(p, item) {
    if (!p || !item) return;

    try {
        let now = Date.now();
        let key = p.uuid.toString() + '_marco';
        let lastUse = playerActionDebounce[key] || 0;
        if (now - lastUse < 1200) return; // Debounce 1.2s para evitar disparo duplo em cliques rápidos
        playerActionDebounce[key] = now;

        let existingNear = getNearestVillage(p.x, p.z, 180);
        if (existingNear && existingNear.ownerUUID && !existingNear.ruined) {
            p.tell(`§c[Soberania] Já existe a vila governada de §e${existingNear.name} §cnestas redondezas!`);
            p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
            return;
        }

        let check = validateVillageLocation(p);
        if (!check.valid) {
            p.tell(check.reason);
            p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
            return;
        }

        let party = getPlayerPartyName(p);
        let owned = getPartyOwnedVillage(party, p.uuid.toString());
        if (owned && (!existingNear || owned.id !== existingNear.id)) {
            p.tell(`§c[Soberania] Seu clã já governa §e${owned.name}§c! Renuncie antes de fundar outra.`);
            p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
            return;
        }

        let res = claimVillage(p, p.server);
        if (res === 1) {
            consumeHeldItem(p, item);
            let x = p.x.toFixed(2);
            let y = p.y.toFixed(2);
            let z = p.z.toFixed(2);

            if (global.getNpcNbt) {
                let nbt = global.getNpcNbt('totem');
                if (nbt) {
                    p.server.runCommandSilent(`summon easy_npc:humanoid ${x} ${y} ${z} ${nbt}`);
                }
            }
        }
    } catch (err) {
        console.error("Erro em handleMarcoFundacao:", err);
    }
}

function isNpcContractItem(item) {
    if (!item) return false;
    if (item.id.startsWith('kubejs:contrato_')) return true;
    if (item.nbt && item.nbt.npcContract) return true;
    return false;
}

function getNpcContractType(item) {
    if (item.nbt && item.nbt.npcContract) return String(item.nbt.npcContract);
    return item.id.replace('kubejs:contrato_', '');
}

function createNpcContractItem(npcType, displayName) {
    if (npcType === 'fazendeiro') {
        return Item.of('kubejs:contrato_armazem', 1, {
            npcContract: 'fazendeiro',
            display: {
                Name: '{"text":"§a📜 Contrato: Feirante Agrícola","italic":false}',
                Lore: ['{"text":"Clique direito no chão da sua vila para posicionar o Feirante.","color":"gray","italic":false}']
            }
        });
    }
    return Item.of(`kubejs:contrato_${npcType}`, 1);
}

function handleContratoNpc(p, item) {
    if (!p || !item) return;

    try {
        let now = Date.now();
        let key = p.uuid.toString() + '_contrato';
        let lastUse = playerActionDebounce[key] || 0;
        if (now - lastUse < 1200) return;
        playerActionDebounce[key] = now;

        let npcType = getNpcContractType(item);
        let v = getNearestVillage(p.x, p.z, 160);
        if (!v || !v.ownerUUID || v.ruined) {
            p.tell('§c[Soberania] Você precisa estar dentro dos limites de uma vila ativa para estabelecer o ponto de moradia do NPC!');
            p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
            return;
        }
        if (v.ownerUUID !== p.uuid.toString()) {
            p.tell('§c[Soberania] Apenas o Governador da cidade pode posicionar os profissionais contratados!');
            p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
            return;
        }

        let x = p.x.toFixed(2);
        let y = p.y.toFixed(2);
        let z = p.z.toFixed(2);

        if (global.getNpcNbt) {
            let nbt = global.getNpcNbt(npcType);
            if (nbt) {
                consumeHeldItem(p, item);
                p.server.runCommandSilent(`summon easy_npc:humanoid ${x} ${y} ${z} ${nbt}`);
                v.hiredNpcs = v.hiredNpcs || [];
                if (v.hiredNpcs.indexOf(npcType) === -1) v.hiredNpcs.push(npcType);
                saveVillages();

                p.playSound('minecraft:block.bell.use', 1.0, 1.0);
                p.tell(`§a[Soberania] Profissional §6${npcType.toUpperCase()} §aestabelecido com sucesso neste ponto de atendimento!`);
            }
        }
    } catch (err) {
        console.error("Erro em handleContratoNpc:", err);
    }
}

function handleClarimCerco(p, item) {
    if (!p || !item) return;

    try {
        let now = Date.now();
        let key = p.uuid.toString() + '_clarim';
        let lastUse = playerActionDebounce[key] || 0;
        if (now - lastUse < 1200) return;
        playerActionDebounce[key] = now;

        startVillageSiege(p, item, p.server);
    } catch (err) {
        console.error("Erro em handleClarimCerco:", err);
    }
}

// Disparo tanto no clique do item (no ar) quanto no clique de bloco (no chão)
ItemEvents.firstRightClicked(event => {
    if (event.hand != 'MAIN_HAND') return;
    let p = event.player;
    let item = event.item;
    if (!p || !item) return;

    if (item.id === 'kubejs:marco_fundacao') {
        handleMarcoFundacao(p, item);
        event.cancel();
    } else if (isNpcContractItem(item)) {
        handleContratoNpc(p, item);
        event.cancel();
    } else if (item.id === 'kubejs:clarim_cerco') {
        handleClarimCerco(p, item);
        event.cancel();
    }
});

BlockEvents.rightClicked(event => {
    if (event.hand != 'MAIN_HAND') return;
    let p = event.player;
    let item = event.item;
    if (!p || !item) return;

    if (item.id === 'kubejs:marco_fundacao') {
        handleMarcoFundacao(p, item);
        event.cancel();
    } else if (isNpcContractItem(item)) {
        handleContratoNpc(p, item);
        event.cancel();
    } else if (item.id === 'kubejs:clarim_cerco') {
        handleClarimCerco(p, item);
        event.cancel();
    }
});

ItemEvents.rightClicked(event => {
    if (event.hand != 'MAIN_HAND') return;
    let p = event.player;
    let item = event.item;
    if (!p || !item) return;

    if (item.id === 'kubejs:marco_fundacao') {
        handleMarcoFundacao(p, item);
        event.cancel();
    } else if (isNpcContractItem(item)) {
        handleContratoNpc(p, item);
        event.cancel();
    } else if (item.id === 'kubejs:clarim_cerco') {
        handleClarimCerco(p, item);
        event.cancel();
    }
});

// ----------------------------------------------------
// SISTEMA DE CERCO TERRITORIAL (ZONA DE CONTROLE 12M) & TROPAS MERCENÁRIAS
// ----------------------------------------------------

function spawnSiegeMercenaries(server, v, attacker, siege) {
    if (!server || !v) return;
    let cx = Number(v.x);
    let cy = Number(v.y || 64);
    let cz = Number(v.z);

    // 1. Mobiliza Guarnição de Reserva (Defensiva) da Vila
    if (v.defenseMercenaries && v.defenseMercenaries.count > 0) {
        let def = v.defenseMercenaries;
        let count = def.count || 4;
        let tier = def.tier || 1;
        let nameTag = tier >= 3 ? `§6👑 Guarda Real (${v.name})` : (tier === 2 ? `§b🛡️ Soldado de Elite (${v.name})` : `§9🛡️ Infantaria (${v.name})`);
        let hp = tier >= 3 ? 80.0 : (tier === 2 ? 60.0 : 40.0);
        let chest = tier >= 3 ? 'minecraft:diamond_chestplate' : 'minecraft:iron_chestplate';
        let helm = tier >= 3 ? 'minecraft:golden_helmet' : (tier === 2 ? 'minecraft:iron_helmet' : 'minecraft:chainmail_helmet');
        let sword = tier >= 3 ? 'spartanweaponry:greatsword_iron' : (tier === 2 ? 'spartanweaponry:halberd_iron' : 'spartanweaponry:sword_iron');
        let shield = tier >= 2 ? 'spartanshields:iron_tower_shield' : 'spartanshields:bronze_basic_shield';

        for (let i = 0; i < count; i++) {
            let angle = (i / count) * 2 * Math.PI;
            let sx = (cx + 4 * Math.cos(angle)).toFixed(1);
            let sz = (cz + 4 * Math.sin(angle)).toFixed(1);
            let nbt = `{PersistenceRequired:1b,Health:${hp}f,Attributes:[{Name:"minecraft:generic.max_health",Base:${hp}d},{Name:"minecraft:generic.knockback_resistance",Base:0.4d}],CustomName:'{"text":"${nameTag}","bold":true}',CustomNameVisible:1b,Tags:["mercenary_siege","merc_def_${v.id}"],HandItems:[{id:"${sword}",Count:1b},{id:"${shield}",Count:1b}],ArmorItems:[{id:"minecraft:iron_boots",Count:1b},{id:"minecraft:iron_leggings",Count:1b},{id:"${chest}",Count:1b},{id:"${helm}",Count:1b}]}`;
            server.runCommandSilent(`summon guardvillagers:guard ${sx} ${cy + 1} ${sz} ${nbt}`);
            server.runCommandSilent(`particle minecraft:poof ${sx} ${cy + 1.5} ${sz} 0.3 0.5 0.3 0.02 10 force`);
        }
        server.tell(`§9§l🛡️ [Intendência Militar] §fA Guarnição de Reserva de §e${v.name} §7(${count}x ${def.label || 'Soldados'}) §ffoi mobilizada na Praça Central!`);
    }

    // 2. Mobiliza Batalhão de Assalto (Ofensivo) do Atacante
    let atkUUID = attacker ? attacker.uuid.toString() : null;
    if (atkUUID && playerAttackMercenaries[atkUUID] && playerAttackMercenaries[atkUUID].count > 0) {
        let atk = playerAttackMercenaries[atkUUID];
        let count = atk.count || 4;
        let tier = atk.tier || 1;
        let nameTag = `§c⚔️ Mercenário Invasor (${siege ? siege.attackerParty : 'Assalto'})`;
        let hp = tier >= 2 ? 60.0 : 40.0;
        let ax = Number(attacker.x);
        let ay = Number(attacker.y);
        let az = Number(attacker.z);

        for (let i = 0; i < count; i++) {
            let angle = (i / count) * 2 * Math.PI;
            let sx = (ax + 2.5 * Math.cos(angle)).toFixed(1);
            let sz = (az + 2.5 * Math.sin(angle)).toFixed(1);
            let nbt = `{PersistenceRequired:1b,Health:${hp}f,Attributes:[{Name:"minecraft:generic.max_health",Base:${hp}d}],CustomName:'{"text":"${nameTag}","bold":true}',CustomNameVisible:1b,Tags:["mercenary_siege","merc_atk_${v.id}"],HandItems:[{id:"spartanweaponry:battleaxe_iron",Count:1b},{id:"spartanshields:iron_basic_shield",Count:1b}],ArmorItems:[{id:"minecraft:iron_boots",Count:1b},{id:"minecraft:chainmail_leggings",Count:1b},{id:"minecraft:iron_chestplate",Count:1b},{id:"minecraft:chainmail_helmet",Count:1b}]}`;
            server.runCommandSilent(`summon guardvillagers:guard ${sx} ${ay + 0.5} ${sz} ${nbt}`);
            server.runCommandSilent(`particle minecraft:flame ${sx} ${ay + 1.0} ${sz} 0.3 0.5 0.3 0.02 10 force`);
        }
        server.tell(`§c§l⚔️ [Batalhão de Assalto] §e${attacker.name.string} §fconvocou §c${count}x ${atk.label || 'Mercenários de Assalto'} §fpara o cerco!`);
        if (!siege || !siege.isTest) {
            delete playerAttackMercenaries[atkUUID];
        }
    }
}

function despawnSiegeMercenaries(server, v, consumeContract) {
    if (!server || !v) return;
    server.runCommandSilent(`execute as @e[tag=merc_def_${v.id}] at @s run particle minecraft:poof ~ ~1 ~ 0.3 0.5 0.3 0.02 12 force`);
    server.runCommandSilent(`execute as @e[tag=merc_atk_${v.id}] at @s run particle minecraft:poof ~ ~1 ~ 0.3 0.5 0.3 0.02 12 force`);
    server.runCommandSilent(`kill @e[tag=merc_def_${v.id}]`);
    server.runCommandSilent(`kill @e[tag=merc_atk_${v.id}]`);
    if (consumeContract && v.defenseMercenaries) {
        delete v.defenseMercenaries;
        saveVillages();
    }
    saveSiegeState();
}

function isPlayerDefenderOfVillage(player, village) {
    return isPlayerAuthorizedInVillage(player, village);
}

function isAnyDefenderOnline(server, village) {
    let online = false;
    server.playerList.players.forEach(p => {
        if (isPlayerAuthorizedInVillage(p, village)) online = true;
    });
    return online;
}

// Verifica Janela de Guerra (Horário de Brasília: Seg-Sex 19h-23h | Sáb-Dom 10h-23h)
function isWarWindowOpen() {
    let now = new Date();
    // Ajusta para fuso horário de Brasília (UTC-3)
    let brHour = (now.getUTCHours() - 3 + 24) % 24;
    let brDay = now.getUTCDay(); // 0 = Domingo, 6 = Sábado
    if (now.getUTCHours() < 3) {
        brDay = (brDay - 1 + 7) % 7;
    }

    // Fim de semana (Sábado ou Domingo): 10h às 23h
    if (brDay === 0 || brDay === 6) {
        return (brHour >= 10 && brHour < 23);
    }
    // Dias úteis (Segunda a Sexta): 19h às 23h
    return (brHour >= 19 && brHour < 23);
}

function startVillageSiege(attacker, hornItem, server) {
    let isOp = attacker.op || (attacker.hasPermissions && attacker.hasPermissions(2)) || attacker.isCreative();

    if (!isWarWindowOpen() && !isOp) {
        attacker.tell('§c§l[Janela de Guerra Fechada] §fCercos Territoriais só podem ser declarados durante as Janelas de Batalha:');
        attacker.tell('§e• Segunda a Sexta: §619:00 às 23:00 (Brasília)');
        attacker.tell('§e• Sábado e Domingo: §610:00 às 23:00 (Brasília)');
        attacker.playSound('minecraft:entity.villager.no', 1.0, 1.0);
        return 0;
    }

    let v = getNearestVillage(attacker.x, attacker.z, 160);
    if (!v || !v.ownerUUID) {
        attacker.tell('§c[Cerco] Nenhuma vila governada por perto para declarar cerco!');
        return 0;
    }

    if (isPlayerAuthorizedInVillage(attacker, v)) {
        attacker.tell('§c[Cerco] Você não pode declarar cerco contra a sua própria vila!');
        return 0;
    }

    if (activeSieges[v.id]) {
        attacker.tell('§c[Cerco] Esta vila já está sob um Cerco Territorial ativo!');
        return 0;
    }

    let truceUntil = siegeCooldowns[v.id] || 0;
    // Compatibilidade com formato antigo (timestamp de início + 6h)
    if (truceUntil > 0 && truceUntil < Date.now() && (Date.now() - truceUntil) < 6 * 3600 * 1000) {
        truceUntil = truceUntil + (6 * 3600 * 1000);
    }
    if (Date.now() < truceUntil && !isOp) {
        let waitMin = Math.ceil((truceUntil - Date.now()) / 60000);
        let waitHours = Math.floor(waitMin / 60);
        let remainMins = waitMin % 60;
        attacker.tell(`§c[Cerco] Esta vila está em trégua pós-batalha! Aguarde §e${waitHours}h ${remainMins}m§c.`);
        return 0;
    }

    if (!isAnyDefenderOnline(server, v)) {
        attacker.tell(`§c[Cerco] Nenhum membro de §e${v.partyName} §cestá online no momento para defender a cidade!`);
        return 0;
    }

    let attackerParty = getPlayerPartyName(attacker);
    let attackerOwned = getPartyOwnedVillage(attackerParty, attacker.uuid.toString());
    if (attackerOwned) {
        attacker.tell(`§c[Cerco] Seu clã já governa §e${attackerOwned.name}§c! Renuncie à sua vila atual caso queira tomar outra.`);
        return 0;
    }

    hornItem.count--;
    siegeCooldowns[v.id] = Date.now() + (6 * 3600 * 1000);

    activeSieges[v.id] = {
        villageId: v.id,
        attackerParty: attackerParty,
        attackerUUID: attacker.uuid.toString(),
        attackerName: attacker.name.string,
        prepTimeLeft: 180, // 3 minutos de mobilização antes da zona abrir
        timeLeft: 1200,    // 20 minutos (1200 segundos)
        controlProgress: 100.0
    };
    saveSiegeState();
    if (global.chronicleEvent) global.chronicleEvent('siege', `${attackerParty} (${attacker.name.string}) declarou cerco contra ${v.name} (${v.partyName})!`);

    server.tell('§4§l==================================================');
    server.tell('§c§l📯 [DECLARAÇÃO DE CERCO TERRITORIAL!]');
    server.tell(`§e${attackerParty} §finiciou um cerco militar contra §6§l${v.name} §7(${v.partyName})§f!`);
    server.tell('§fPreparação: §e3 Minutos §8| §fDuração Máx: §c20 Minutos §8| §fObjetivo: §eDominar a Praça (Raio 12m)');
    server.tell('§4§l==================================================');
    server.runCommandSilent(`playsound minecraft:event.raid.horn hostile @a ${v.x} ${v.y} ${v.z} 10.0 0.8`);
    try {
        let pList = server.players || (server.playerList ? server.playerList.players : []);
        pList.forEach(p => {
            let dx = p.x - v.x;
            let dz = p.z - v.z;
            if (dx * dx + dz * dz <= 180 * 180) {
                server.runCommandSilent(`playsound minecraft:event.raid.horn hostile ${p.name.string} ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)} 2.0 0.8`);
            }
        });
    } catch(e) {}
    spawnSiegeMercenaries(server, v, attacker, activeSieges[v.id]);
    return 1;
}

// ----------------------------------------------------
// FERRAMENTAS DE TESTE DE CERCO (ADMIN / DEV)
// ----------------------------------------------------
function startTestSiege(player, durationSeconds, mode, server) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !v.ownerUUID) {
        player.tell('§c[Cerco Teste] Nenhuma vila governada nas redondezas (raio de 160m)!');
        return 0;
    }

    let dur = durationSeconds || 180;
    let isAttacker = (mode === 'invasor');
    let isSimulated = (mode === 'simulado' || mode === 'auto' || !mode || mode === 'defensor');

    if (!v.originalBackup) {
        v.originalBackup = {
            ownerUUID: v.ownerUUID,
            ownerName: v.ownerName,
            partyName: v.partyName,
            taxGold: v.taxGold || 0,
            taxIron: v.taxIron || 0
        };
    }

    activeSieges[v.id] = {
        villageId: v.id,
        attackerParty: isAttacker ? 'Horda Invasora (Teste)' : 'Clã Rival (Teste)',
        attackerUUID: isAttacker ? player.uuid.toString() : '00000000-0000-0000-0000-000000000001',
        attackerName: isAttacker ? player.name.string : 'Invasor Simulado',
        prepTimeLeft: 0,
        timeLeft: dur,
        controlProgress: 100.0,
        isTest: true,
        testMode: mode || 'auto',
        testAttackerUUID: isAttacker ? player.uuid.toString() : null,
        simulatedAttacker: isSimulated
    };

    server.tell('§4§l==================================================');
    server.tell('§c§l📯 [MODO DE TESTE: CERCO TERRITORIAL INICIADO!]');
    server.tell(`§fVila Alvo: §e${v.name} §8| §fDuração: §c${dur}s §8| §fPapel do Teste: §b${isAttacker ? 'Invasor (Você captura)' : 'Defensor (Você defende)'}`);
    server.tell('§7- Entre no anel de fogo (12m do Emissário) para disputar o domínio!');
    server.tell('§7- Use §b/cerco_teste progresso <0-100> §7para simular avanço da barra.');
    server.tell('§7- Use §b/cerco_teste restaurar §7para devolver a vila ao dono original após o teste.');
    server.tell('§4§l==================================================');
    server.runCommandSilent(`playsound minecraft:event.raid.horn hostile @a ${v.x} ${v.y} ${v.z} 10.0 0.8`);
    try {
        let pList = server.players || (server.playerList ? server.playerList.players : []);
        pList.forEach(p => {
            let dx = p.x - v.x;
            let dz = p.z - v.z;
            if (dx * dx + dz * dz <= 180 * 180) {
                server.runCommandSilent(`playsound minecraft:event.raid.horn hostile ${p.name.string} ${p.x.toFixed(1)} ${p.y.toFixed(1)} ${p.z.toFixed(1)} 2.0 0.8`);
            }
        });
    } catch(e) {}
    spawnSiegeMercenaries(server, v, player, activeSieges[v.id]);
    return 1;
}

function setSiegeProgress(player, progressVal) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !activeSieges[v.id]) {
        player.tell('§c[Cerco Teste] Não há nenhum cerco ativo nesta vila no momento!');
        return 0;
    }
    let s = activeSieges[v.id];
    let val = Math.max(0, Math.min(100, progressVal));
    s.controlProgress = val;
    player.tell(`§e[Cerco Teste] Progresso do cerco ajustado para §b${val}%§e!`);
    return 1;
}

function stopSiege(player) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !activeSieges[v.id]) {
        player.tell('§c[Cerco Teste] Não há nenhum cerco ativo nesta vila para encerrar!');
        return 0;
    }
    despawnSiegeMercenaries(player.server, v, false);
    delete activeSieges[v.id];
    player.tell('§a[Cerco Teste] Cerco cancelado e tropas mercenárias recolhidas com sucesso.');
    return 1;
}

function restoreVillageAfterTest(player) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v) return 0;
    despawnSiegeMercenaries(player.server, v, false);
    if (activeSieges[v.id]) {
        delete activeSieges[v.id];
    }
    if (v.originalBackup) {
        v.ownerUUID = v.originalBackup.ownerUUID;
        v.ownerName = v.originalBackup.ownerName;
        v.partyName = v.originalBackup.partyName;
        v.taxGold = v.originalBackup.taxGold;
        v.taxIron = v.originalBackup.taxIron;
        delete v.originalBackup;
        saveVillages();
        player.tell(`§a[Cerco Teste] Vila §e${v.name} §arestaurada com sucesso para o governo de §6${v.ownerName} (${v.partyName})§a com cofre intacto!`);
        return 1;
    } else {
        player.tell('§e[Cerco Teste] Nenhum backup de teste pendente para restaurar nesta vila.');
        return 0;
    }
}

// ----------------------------------------------------
// SAQUE E DEPÓSITO DO COFRE DO EMISSÁRIO
// ----------------------------------------------------
function collectTaxes(player, amountStr) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || v.ownerUUID !== player.uuid.toString()) {
        player.tell('§c[Soberania] Apenas o Governador da vila pode retirar moedas do Cofre do Emissário!');
        return 0;
    }

    if ((v.taxDebtIron || 0) > 0) {
        player.tell(`§c[Cofre da Vila] Saque bloqueado! §e${v.name} §cpossui uma dívida ativa de §4-${v.taxDebtIron} Ferro§c. Deposite Ouro para quitar.`);
        return 0;
    }

    let gold = v.taxGold || 0;
    let iron = v.taxIron || 0;

    if (gold <= 0 && iron <= 0) {
        player.tell(`§6[Cofre da Vila] §fO cofre está vazio no momento. Saldo: §60 Ouro§f.`);
        return 0;
    }

    let withdrawGold = gold;
    let withdrawIron = iron;

    if (amountStr && amountStr !== 'tudo' && amountStr !== 'all') {
        let reqGold = parseInt(amountStr);
        if (!isNaN(reqGold) && reqGold > 0) {
            let totalAvailableIron = (gold * 10) + iron;
            let reqTotalIron = reqGold * 10;

            if (totalAvailableIron < reqTotalIron) {
                player.tell(`§c[Cofre da Vila] Saldo insuficiente para sacar ${reqGold} Ouro! Saldo atual: §6${gold} Ouro §fe §f${iron} Ferro§c.`);
                return 0;
            }

            let remainingTotalIron = totalAvailableIron - reqTotalIron;
            v.taxGold = Math.floor(remainingTotalIron / 10);
            v.taxIron = remainingTotalIron % 10;

            withdrawGold = reqGold;
            withdrawIron = 0;
        }
    } else {
        v.taxGold = 0;
        v.taxIron = 0;
    }

    let withdrawnPts = (withdrawGold * 10) + Math.floor(withdrawIron);
    v.economicPoints = Math.max(0, (v.economicPoints || 0) - withdrawnPts);
    saveVillages();

    if (withdrawGold > 0) player.give(Item.of('lightmanscurrency:coin_gold', withdrawGold));
    if (withdrawIron > 0) player.give(Item.of('lightmanscurrency:coin_iron', withdrawIron));

    player.playSound('minecraft:entity.experience_orb.pickup', 1.0, 1.0);
    let pInfo = getProsperityInfo(v);
    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lCOFRE DA VILA: SAQUE §6§l✦');
    if (withdrawGold > 0) player.tell(`§7Retirado: §6${withdrawGold} Moedas de Ouro`);
    if (withdrawIron > 0) player.tell(`§7Retirado: §f${withdrawIron} Moedas de Ferro`);
    player.tell(`§7Saldo no Cofre: §6${v.taxGold} Ouro§7, §f${v.taxIron} Ferro`);
    player.tell(`§7Prosperidade: ${pInfo.name}`);
    player.tell('§6§m----------------------------------------');
    return 1;
}

function depositTaxes(player, amountStr) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !v.ownerUUID) {
        player.tell('§c[Soberania] Esta vila não possui um governo ativo para receber depósitos!');
        return 0;
    }

    if (!isPlayerAuthorizedInVillage(player, v)) {
        player.tell('§c[Soberania] Apenas membros do clã ou cidadãos podem depositar no tesouro da vila!');
        return 0;
    }

    let invGold = 0;
    let invIron = 0;
    player.inventory.allItems.forEach(item => {
        if (item.id === 'lightmanscurrency:coin_gold') invGold += item.count;
        if (item.id === 'lightmanscurrency:coin_iron') invIron += item.count;
    });

    if (invGold <= 0 && invIron <= 0) {
        player.tell('§c[Tesouro da Vila] Você não possui Moedas de Ouro ou de Ferro no inventário para depositar!');
        return 0;
    }

    let goldToDeposit = 0;
    let ironToDeposit = 0;

    if (amountStr && amountStr !== 'tudo' && amountStr !== 'all') {
        let reqGold = parseInt(amountStr);
        if (!isNaN(reqGold) && reqGold > 0) {
            if (invGold < reqGold) {
                player.tell(`§c[Tesouro da Vila] Você não tem §6${reqGold} Moedas de Ouro §cno inventário (Você tem: ${invGold})!`);
                return 0;
            }
            goldToDeposit = reqGold;
        }
    } else {
        let mainHand = player.mainHandItem;
        if (mainHand && mainHand.id === 'lightmanscurrency:coin_gold') {
            goldToDeposit = mainHand.count;
        } else if (mainHand && mainHand.id === 'lightmanscurrency:coin_iron') {
            ironToDeposit = mainHand.count;
        } else {
            goldToDeposit = invGold;
            ironToDeposit = invIron;
        }
    }

    let remGold = goldToDeposit;
    let remIron = ironToDeposit;
    player.inventory.allItems.forEach(item => {
        if (item.id === 'lightmanscurrency:coin_gold' && remGold > 0) {
            let take = Math.min(item.count, remGold);
            item.count -= take;
            remGold -= take;
        }
        if (item.id === 'lightmanscurrency:coin_iron' && remIron > 0) {
            let take = Math.min(item.count, remIron);
            item.count -= take;
            remIron -= take;
        }
    });

    let totalDepositIron = (goldToDeposit * 10) + ironToDeposit;
    let depRes = creditVillageTreasury(v, totalDepositIron);
    v.economicPoints = (v.economicPoints || 0) + (goldToDeposit * 10) + Math.floor(ironToDeposit);

    saveVillages();

    let pInfo = getProsperityInfo(v);
    player.playSound('minecraft:block.amethyst_block.chime', 1.0, 1.2);
    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lCOFRE DA VILA: DEPÓSITO §6§l✦');
    if (depRes.paidDebt > 0) {
        player.tell(`§aQuitado da dívida: §f${depRes.paidDebt} Ferro §7(Dívida restante: §c-${v.taxDebtIron || 0} Ferro§7)`);
    }
    if (goldToDeposit > 0) player.tell(`§7Depositado: §6+${goldToDeposit} Moedas de Ouro`);
    if (ironToDeposit > 0) player.tell(`§7Depositado: §f+${ironToDeposit} Moedas de Ferro`);
    player.tell(`§7Saldo no Cofre: §6${v.taxGold || 0} Ouro§7, §f${v.taxIron || 0} Ferro`);
    player.tell(`§7Prosperidade: ${pInfo.name} §8(Máx. ${pInfo.maxGuards} Guardas)`);
    player.tell('§6§m----------------------------------------');

    if (player.server) {
        replenishVillageGuards(player.server, v);
    }
    return 1;
}

function upgradeVillageProsperity(player, server) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !v.ownerUUID) {
        player.tell('§c[Soberania] Nenhuma vila governada nas redondezas.');
        return 0;
    }
    if (v.ownerUUID !== player.uuid.toString()) {
        player.tell('§c[Soberania] Apenas o Governador da vila pode investir na evolução da cidade!');
        return 0;
    }
    if (v.ruined) {
        player.tell('§c[Soberania] A vila está em ruínas! Repovoe para pelo menos 5 aldeões antes de evoluir.');
        return 0;
    }

    let pInfo = getProsperityInfo(v);
    if (pInfo.tier >= 3 || !pInfo.nextCost) {
        player.tell('§6[Soberania] Sua cidade já atingiu o nível máximo de prosperidade (§6§lNível III - Metrópole§6)!');
        return 0;
    }

    let cost = pInfo.nextCost;
    let invGold = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold') invGold += i.count;
    });

    let paidFromTreasury = false;
    if (invGold >= cost) {
        let rem = cost;
        player.inventory.allItems.forEach(i => {
            if (i.id === 'lightmanscurrency:coin_gold' && rem > 0) {
                let take = Math.min(i.count, rem);
                i.count -= take;
                rem -= take;
            }
        });
    } else if ((v.taxGold || 0) >= cost) {
        v.taxGold -= cost;
        paidFromTreasury = true;
    } else {
        player.tell(`§c[Soberania] Evoluir para o próximo nível custa §6${cost} Moedas de Ouro§c (Seu inventário: ${invGold} | Cofre: ${v.taxGold || 0}).`);
        player.playSound('minecraft:entity.villager.no', 1.0, 0.8);
        return 0;
    }

    v.prosperityTier = pInfo.tier + 1;
    v.economicPoints = (v.economicPoints || 0) + (cost * 10);
    if (global.econSink && cost > 0) global.econSink('village_upgrade', cost * 10, player);
    saveVillages();

    let newInfo = getProsperityInfo(v);
    if (global.chronicleEvent) global.chronicleEvent('village', `Vila "${v.name}" (${v.partyName}) evoluiu para ${newInfo.name}.`);
    if (server) {
        replenishVillageGuards(server, v);
        server.tell(`§6§l👑 [REINO] §e${v.name} §fevoluiu para ${newInfo.name}§f!`);
    }
    player.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.1);
    player.tell('§6§m----------------------------------------');
    player.tell(`§a§l✦ CIDADE EVOLUÍDA PARA ${newInfo.name} §a§l✦`);
    player.tell(`§7Pagamento: §6${cost} Ouro §8(${paidFromTreasury ? 'Tesouro Municipal' : 'Inventário'})`);
    player.tell(`§7Nova Guarnição: §b${newInfo.maxGuards} Guardas §8| §7Bônus de Imposto: §a${Math.round((newInfo.taxBonus - 1) * 100)}%`);
    player.tell('§6§m----------------------------------------');
    return 1;
}

function isVillageAreaLoaded(server, v) {
    if (!server || !v) return false;
    let pList = server.players || (server.playerList ? server.playerList.players : []);
    for (let i = 0; i < pList.length; i++) {
        let p = pList[i];
        let dx = p.x - v.x;
        let dz = p.z - v.z;
        if ((dx * dx + dz * dz) <= 160 * 160) {
            return true;
        }
    }
    return false;
}

function replenishVillageGuards(server, v) {
    if (!server || !v || !v.ownerUUID || v.ruined) return;
    if ((v.taxDebtIron || 0) > 0) return; // Guardas não são repostos enquanto houver dívida ativa
    // Só processa se houver algum jogador perto da vila (chunks comprovadamente carregados)
    if (!isVillageAreaLoaded(server, v)) return;

    let overworld = server.overworld();
    if (!overworld) return;
    let pInfo = getProsperityInfo(v);
    let guards = 0;
    try {
        overworld.getEntities().forEach(ent => {
            if (ent && ent.type === 'guardvillagers:guard' && ent.alive) {
                let dx = ent.x - v.x;
                let dz = ent.z - v.z;
                if (dx * dx + dz * dz <= 120 * 120) guards++;
            }
        });
    } catch (e) {}

    let needed = pInfo.maxGuards - guards;
    if (needed > 0) {
        let toSpawn = Math.min(needed, 2);
        for (let i = 0; i < toSpawn; i++) {
            let offX = ((Math.random() - 0.5) * 6).toFixed(1);
            let offZ = ((Math.random() - 0.5) * 6).toFixed(1);
            let spawnX = (v.x + parseFloat(offX)).toFixed(1);
            let spawnZ = (v.z + parseFloat(offZ)).toFixed(1);
            server.runCommandSilent(`summon guardvillagers:guard ${spawnX} ${v.y + 1} ${spawnZ}`);
        }
    }
}

function toggleProtection(player, type) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !v.ownerUUID) {
        player.tell('§c[Soberania] Nenhuma vila governada nas redondezas.');
        return 0;
    }

    if (v.ownerUUID !== player.uuid.toString()) {
        player.tell('§c[Soberania] Apenas o Governador da vila pode alterar os parâmetros de proteção!');
        return 0;
    }

    let key = null;
    let name = '';
    if (type === 'quebrar') { key = 'protectBreak'; name = 'Quebra de Blocos'; }
    else if (type === 'colocar') { key = 'protectPlace'; name = 'Colocação de Blocos'; }
    else if (type === 'baus') { key = 'protectChests'; name = 'Acesso a Baús e Barris'; }
    else if (type === 'pvp') { key = 'protectPvp'; name = 'Bloqueio de PVP'; }
    else if (type === 'itens') { key = 'protectGrief'; name = 'Proteção contra Lava/Fogo/TNT'; }

    if (!key) {
        player.tell('§cUso: /totem toggle <quebrar | colocar | baus | pvp | itens>');
        return 0;
    }

    let current = (v[key] !== false);
    v[key] = !current;
    saveVillages();

    let statusText = v[key] ? '§a§lATIVADA (Protegido)' : '§c§lDESATIVADA (Liberado para visitantes)';
    player.playSound('minecraft:block.note_block.pling', 1.0, v[key] ? 1.5 : 0.8);
    player.tell(`§6[Soberania] §fA configuração §e${name} §ffoi alterada para: ${statusText}§f.`);
    return 1;
}

function hireVillageNpc(player, npcType, server) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !v.ownerUUID || v.ruined) {
        player.tell('§c[Soberania] Nenhuma vila governada ativa nas redondezas.');
        return 0;
    }
    if (v.ownerUUID !== player.uuid.toString()) {
        player.tell('§c[Soberania] Apenas o Governador da vila pode contratar profissionais municipais!');
        return 0;
    }

    let req = VILLAGE_NPC_REQS[npcType];
    if (!req) return 0;

    let livePop = countLivingVillagers(player.level, v.x, v.y, v.z, 120);
    if (livePop < req.villagers) {
        player.tell(`§c[Soberania] Requisito não atingido: exige pelo menos §e${req.villagers} Aldeões vivos §c(População atual: ${livePop}).`);
        return 0;
    }

    let pInfo = getProsperityInfo(v);
    if (pInfo.tier < req.tier) {
        player.tell(`§c[Soberania] Requisito de Prosperidade: exige nível de prosperidade da cidade superior para contratar este profissional!`);
        return 0;
    }

    let goldCount = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold') goldCount += i.count;
    });

    if (goldCount < req.goldCost) {
        player.tell(`§c[Soberania] Você precisa de §6${req.goldCost} Moedas de Ouro §cpara o contrato (Você tem: ${goldCount}).`);
        return 0;
    }

    let remGold = req.goldCost;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold' && remGold > 0) {
            let take = Math.min(i.count, remGold);
            i.count -= take;
            remGold -= take;
        }
    });
    if (global.econSink && req.goldCost > 0) global.econSink('village_npc_contract', req.goldCost * 10, player);

    player.give(createNpcContractItem(npcType, req.name));
    player.playSound('minecraft:item.totem.use', 0.8, 1.2);
    player.tell('§6§m----------------------------------------');
    player.tell(`§a§l✦ CONTRATO DE MORADIA ADQUIRIDO! ✦`);
    player.tell(`§fProfissional: §e${req.name}`);
    player.tell(`§7Você recebeu o item §6Contrato: ${req.name}§7.`);
    player.tell(`§bCaminhe até o local da loja ou balcão e clique com o Botão Direito no chão para posicioná-lo!`);
    player.tell('§6§m----------------------------------------');
    return 1;
}

function relocateVillageNpc(player, npcType, server) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || !v.ownerUUID || v.ownerUUID !== player.uuid.toString()) {
        player.tell('§c[Soberania] Apenas o Governador da vila pode reposicionar este profissional!');
        return 0;
    }

    // Busca o NPC mais próximo desse tipo e remove
    let keywordsMap = {
        armazem: ['armazém', 'armazem'],
        fazendeiro: ['feirante', 'fazendeiro'],
        guilda: ['guilda'],
        intendente: ['intendente'],
        banco: ['banqueiro', 'banco'],
        padre: ['padre'],
        ferreiro: ['armeiro', 'forja', 'ferreiro']
    };
    let kws = keywordsMap[npcType] || [String(npcType || '').toLowerCase()];

    let bestEnt = null;
    let bestDistSq = 12 * 12;
    let entities = player.level.getEntities();
    entities.forEach(ent => {
        if (ent && String(ent.type) === 'easy_npc:humanoid') {
            let n = (ent.customName ? ent.customName.string : (ent.name ? ent.name.string : '')).toLowerCase();
            let matches = false;
            for (let i = 0; i < kws.length; i++) {
                if (n.includes(kws[i])) { matches = true; break; }
            }
            if (matches) {
                let dx = ent.x - player.x;
                let dy = ent.y - player.y;
                let dz = ent.z - player.z;
                let d2 = dx * dx + dy * dy + dz * dz;
                if (d2 <= bestDistSq) {
                    bestDistSq = d2;
                    bestEnt = ent;
                }
            }
        }
    });

    if (!bestEnt) {
        player.tell('§c[Soberania] Não encontrei esse profissional por perto para recolher.');
        return 0;
    }

    let targetEnt = bestEnt;
    if (server) {
        server.scheduleInTicks(1, () => {
            try { if (targetEnt && targetEnt.alive) targetEnt.discard(); } catch (e) {}
        });
    } else {
        targetEnt.discard();
    }

    let namesMap = {
        armazem: 'Armazém Geral',
        fazendeiro: 'Feirante Agrícola',
        guilda: 'Guilda Mercante',
        intendente: 'Intendente de Guerra',
        banco: 'Banqueiro Local',
        padre: 'Padre Curandeiro',
        ferreiro: 'Mestre da Forja'
    };
    player.give(createNpcContractItem(npcType, namesMap[npcType] || npcType));
    player.playSound('minecraft:block.chest.open', 1.0, 1.0);
    player.tell(`§e[Soberania] O profissional foi recolhido em um §6Contrato de Moradia§e! Clique com o botão direito no novo local desejado.`);
    return 1;
}

function hireSiegeMercenaries(player, packKey) {
    if (!player) return 0;
    let packs = {
        defesa_leve:    { type: 'defesa', count: 4,  tier: 1, cost: 15, label: 'Infantaria de Reserva' },
        defesa_pesada:  { type: 'defesa', count: 6,  tier: 2, cost: 25, label: 'Elite Pesada' },
        defesa_real:    { type: 'defesa', count: 10, tier: 3, cost: 40, label: 'Guarda Real de Cerco' },
        ataque_leve:    { type: 'ataque', count: 4,  tier: 1, cost: 20, label: 'Invasores Mercenários' },
        ataque_pesado:  { type: 'ataque', count: 6,  tier: 2, cost: 32, label: 'Batalhão de Vanguarda' }
    };

    let pack = packs[packKey];
    if (!pack) {
        player.tell('§c[Intendente] Pacote militar inválido!');
        return 0;
    }

    let v = null;
    if (pack.type === 'defesa') {
        v = getNearestVillage(player.x, player.z, 160);
        if (!v || !v.ownerUUID || v.ruined) {
            player.tell('§c[Intendente] Você precisa estar em uma vila governada para contratar uma Guarnição de Reserva!');
            return 0;
        }
        if (!isPlayerAuthorizedInVillage(player, v)) {
            player.tell('§c[Intendente] Apenas membros da facção governante podem contratar defesas para esta vila!');
            return 0;
        }
    }

    let goldInv = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold') goldInv += i.count;
    });

    if (goldInv < pack.cost) {
        if (pack.type === 'defesa' && v && (v.taxGold || 0) >= pack.cost && v.ownerUUID === player.uuid.toString()) {
            v.taxGold -= pack.cost;
            v.defenseMercenaries = { count: pack.count, tier: pack.tier, label: pack.label };
            if (global.econSink && pack.cost > 0) global.econSink('village_mercenary', pack.cost * 10, player);
            saveVillages();
            player.playSound('minecraft:block.anvil.use', 0.8, 1.2);
            player.tell('§6§m----------------------------------------');
            player.tell('§9§l🛡️ GUARNIÇÃO DE RESERVA CONTRATADA (TESOURO MUNICIPAL)!');
            player.tell(`§fTropa: §b${pack.count}x ${pack.label} §8(Pago via Cofre: ${pack.cost} Ouro)`);
            player.tell(`§7Eles serão mobilizados automaticamente na Praça Central se §e${v.name} §7sofrer um cerco!`);
            player.tell('§6§m----------------------------------------');
            return 1;
        }
        player.tell(`§c[Intendente] Você precisa de §6${pack.cost} Moedas de Ouro §cem seu inventário (Você tem: ${goldInv}).`);
        player.playSound('minecraft:entity.villager.no', 1.0, 0.8);
        return 0;
    }

    let rem = pack.cost;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold' && rem > 0) {
            let take = Math.min(i.count, rem);
            i.count -= take;
            rem -= take;
        }
    });
    if (global.econSink && pack.cost > 0) global.econSink('village_mercenary', pack.cost * 10, player);

    if (pack.type === 'defesa') {
        v.defenseMercenaries = { count: pack.count, tier: pack.tier, label: pack.label };
        saveVillages();
        player.playSound('minecraft:block.anvil.use', 0.8, 1.2);
        player.tell('§6§m----------------------------------------');
        player.tell('§9§l🛡️ GUARNIÇÃO DE RESERVA EM PRONTIDÃO!');
        player.tell(`§fTropa: §b${pack.count}x ${pack.label} §8(Vila: ${v.name})`);
        player.tell('§7Suas tropas estão aquarteladas e entrarão em ação imediatamente caso um cerco seja declarado contra a cidade!');
        player.tell('§6§m----------------------------------------');
    } else {
        playerAttackMercenaries[player.uuid.toString()] = { count: pack.count, tier: pack.tier, label: pack.label };
        saveSiegeState();
        player.playSound('minecraft:item.crossbow.loading_end', 1.0, 0.9);
        player.tell('§6§m----------------------------------------');
        player.tell('§c§l⚔️ BATALHÃO DE ASSALTO CONTRATADO!');
        player.tell(`§fTropa: §c${pack.count}x ${pack.label}`);
        player.tell('§7Quando você soprar o §6Clarim de Cerco Territorial §7contra uma vila rival, seus mercenários surgirão ao seu lado!');
        player.tell('§6§m----------------------------------------');
    }
    return 1;
}

function buySiegeHornFromQuartermaster(player) {
    if (!player) return 0;
    let cost = 30;
    let goldInv = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold') goldInv += i.count;
    });
    if (goldInv < cost) {
        player.tell(`§c[Intendente] O Clarim de Cerco Territorial custa §6${cost} Moedas de Ouro §c(Você tem: ${goldInv}).`);
        player.playSound('minecraft:entity.villager.no', 1.0, 0.8);
        return 0;
    }
    let rem = cost;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold' && rem > 0) {
            let take = Math.min(i.count, rem);
            i.count -= take;
            rem -= take;
        }
    });
    if (global.econSink && cost > 0) global.econSink('village_clarim', cost * 10, player);
    player.give(Item.of('kubejs:clarim_cerco', 1));
    player.playSound('minecraft:event.raid.horn', 1.0, 1.2);
    player.tell('§a[Intendente] Você adquiriu 1x §4§l📯 Clarim de Cerco Territorial§a!');
    return 1;
}

function showQuartermasterStatus(player) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    let defStr = (v && v.defenseMercenaries) ? `§a${v.defenseMercenaries.count}x ${v.defenseMercenaries.label}` : '§7Nenhuma contratada';
    let atk = playerAttackMercenaries[player.uuid.toString()];
    let atkStr = atk ? `§c${atk.count}x ${atk.label}` : '§7Nenhum contratado';

    player.tell('§6§m----------------------------------------');
    player.tell('§4§l⚔ RELATÓRIO DA INTENDÊNCIA MILITAR ⚔');
    if (v) player.tell(`§fVila Local (§e${v.name}§f) - Reserva Defensiva: ${defStr}`);
    player.tell(`§fSeu Batalhão de Assalto (Ofensivo): ${atkStr}`);
    player.tell('§7Nota: Tropas de cerco não consomem recursos no dia a dia e só aparecem durante cercos ativos.');
    player.tell('§6§m----------------------------------------');
    return 1;
}

function buyFromGeneralStore(player, itemKey) {
    if (!player) return 0;
    let catalog = {
        tocha:  { id: 'minecraft:torch', count: 16, costCoin: 'lightmanscurrency:coin_copper', costAmt: 4, name: '16x Tochas' },
        sela:   { id: 'minecraft:saddle', count: 1,  costCoin: 'lightmanscurrency:coin_iron',   costAmt: 5, name: '1x Sela' },
        laco:   { id: 'minecraft:lead', count: 1,    costCoin: 'lightmanscurrency:coin_iron',   costAmt: 2, name: '1x Laço' },
        flecha: { id: 'minecraft:arrow', count: 16,  costCoin: 'lightmanscurrency:coin_iron',   costAmt: 4, name: '16x Flechas' },
        balde:  { id: 'minecraft:bucket', count: 1,  costCoin: 'lightmanscurrency:coin_iron',   costAmt: 2, name: '1x Balde Vazio' },
        pao:    { id: 'minecraft:bread', count: 8,   costCoin: 'lightmanscurrency:coin_copper', costAmt: 5, name: '8x Pães' },
        maca:   { id: 'minecraft:apple', count: 4,   costCoin: 'lightmanscurrency:coin_copper', costAmt: 4, name: '4x Maçãs' },
        feno:   { id: 'minecraft:hay_block', count: 16, costCoin: 'lightmanscurrency:coin_iron', costAmt: 3, name: '16x Blocos de Feno' },
        frasco: { id: 'minecraft:glass_bottle', count: 3, costCoin: 'lightmanscurrency:coin_copper', costAmt: 2, name: '3x Frascos de Vidro' }
    };

    let prod = catalog[itemKey];
    if (!prod) {
        player.tell('§c[Armazém] Mercadoria não encontrada.');
        return 0;
    }

    let coinCount = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === prod.costCoin) coinCount += i.count;
    });

    if (coinCount < prod.costAmt) {
        let coinName = prod.costCoin.includes('iron') ? 'Moedas de Ferro' : 'Moedas de Cobre';
        player.tell(`§c[Armazém] Você precisa de §e${prod.costAmt} ${coinName} §cpara comprar ${prod.name}!`);
        return 0;
    }

    // Deduz o custo
    let rem = prod.costAmt;
    player.inventory.allItems.forEach(i => {
        if (i.id === prod.costCoin && rem > 0) {
            let take = Math.min(i.count, rem);
            i.count -= take;
            rem -= take;
        }
    });

    player.give(Item.of(prod.id, prod.count));
    player.playSound('minecraft:entity.item.pickup', 1.0, 1.2);
    player.tell(`§a[Armazém] Compra realizada: §e${prod.name} §aentregue!`);

    // IVA Municipal (8% revertido para o cofre da vila)
    let paidIron = prod.costCoin.includes('iron') ? prod.costAmt : (prod.costAmt * 0.1);
    let ivaIron = 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (v && v.ownerUUID && !v.ruined) {
        let isIron = prod.costCoin.includes('iron');
        ivaIron = isIron ? Math.max(1, Math.round(prod.costAmt * 0.08)) : 0;
        if (ivaIron > 0) {
            creditVillageTreasury(v, ivaIron);
        }
        v.economicPoints = (v.economicPoints || 0) + 1;
        saveVillages();
    }
    let netBurned = Math.max(0, paidIron - ivaIron);
    if (global.econSink && netBurned > 0) global.econSink('village_store', netBurned, player);
    return 1;
}

function showCityRankings(player) {
    if (!player) return;
    let list = [];
    for (let id in claimedVillages) {
        let v = claimedVillages[id];
        if (v && v.ownerUUID && !v.ruined) {
            let pop = v.population || 5;
            let gold = v.taxGold || 0;
            let econ = v.economicPoints || 0;
            let debtPenalty = Math.floor((v.taxDebtIron || 0) / 2);
            let score = Math.max(0, (pop * 10) + (gold * 5) + (econ * 2) - debtPenalty);
            list.push({
                name: v.name,
                party: v.partyName,
                pop: pop,
                gold: gold,
                score: score
            });
        }
    }
    list.sort((a, b) => b.score - a.score);

    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lTOP CIDADES POR PRESTÍGIO DO REINO §6§l✦');
    if (list.length === 0) {
        player.tell('§7Nenhuma cidade governada registrada no momento.');
    } else {
        list.slice(0, 10).forEach((c, idx) => {
            let medal = idx === 0 ? '§e👑' : (idx === 1 ? '§7🥈' : (idx === 2 ? '§6🥉' : `§8#${idx + 1}`));
            player.tell(`${medal} §6${c.name.padEnd(16)} §e${c.score} pts §8(§a${c.pop} Hab. §7| §6${c.gold} Ouro§8)`);
        });
    }
    player.tell('§6§m----------------------------------------');
}
global.showCityRankings = showCityRankings;

function showVillageInfo(player) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v) {
        player.tell('§c[Soberania] Nenhum Emissário ou vila registrada por perto.');
        return 0;
    }

    let livePop = countLivingVillagers(player.level, v.x, v.y, v.z, 120);
    v.population = livePop;
    let pInfo = getProsperityInfo(v);
    let eInfo = getEconomicTier(v.economicPoints || 0);
    let passiveIron = calculatePassiveTaxIron(livePop, pInfo.taxBonus);
    let upkeep = calculateVillageUpkeep(v);
    let debt = v.taxDebtIron || 0;

    player.tell('§6§m----------------------------------------');
    player.tell(`§6§l✦ §e§lDOMÍNIO: ${v.name.toUpperCase()} §6§l✦`);
    player.tell(`§7Clã: §6${v.partyName ? v.partyName : '§7[Neutro]'} §8| §7Líder: §e${v.ownerName ? v.ownerName : '§7[Nenhum]'}`);
    player.tell(`§7Habitantes: ${livePop >= 5 ? '§a' + livePop + ' Aldeões §2(Viva)' : '§c' + livePop + ' Aldeões §4(Ruína)'} §8| §7Guarda: §b${pInfo.maxGuards} Guardas`);
    player.tell(`§7Prosperidade: ${pInfo.name} §7(${pInfo.nextHint}§7)`);
    player.tell(`§7Poderio Econômico: ${eInfo.name} §8(§e${v.economicPoints || 0} pts§8)`);
    player.tell(`§7Cofre: §6${v.taxGold || 0} Ouro§7, §f${v.taxIron || 0} Ferro §8(§a+${passiveIron} §7/ §c-${upkeep.totalIron} Ferro/30m§8)`);
    if (debt > 0) {
        player.tell(`§4Dívida Ativa: §c-${debt} Ferro §8(§7Limite do Nível: §4-${upkeep.maxDebtIron} Ferro§8 | §7Avisos: §c${v.debtStrikes || 0}/2§8)`);
    } else {
        player.tell(`§7Manutenção: §e${upkeep.guardIron} Ferro (Guardas) §7+ §e${upkeep.npcIron} Ferro (NPCs) §8| §7Limite dívida: §c-${upkeep.maxDebtIron} Ferro`);
    }
    player.tell('§7Leis para Visitantes (Fora de Cerco):');
    player.tell(` §8▪ §fAldeões: §aProtegidos §8| §fPvP: ${v.protectPvp !== false ? '§aBloqueado' : '§cLiberado'}`);
    player.tell(` §8▪ §fQuebrar: ${v.protectBreak !== false ? '§aProtegido' : '§cLiberado'} §8| §fColocar: ${v.protectPlace !== false ? '§aProtegido' : '§cLiberado'}`);
    player.tell(` §8▪ §fBaús: ${v.protectChests !== false ? '§aProtegido' : '§cLiberado'} §8| §fFogo/TNT: ${v.protectGrief !== false ? '§aProtegido' : '§cLiberado'}`);
    player.tell('§6§m----------------------------------------');
    return 1;
}

function renounceVillage(player, server) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v || v.ownerUUID !== player.uuid.toString()) {
        player.tell('§c[Soberania] Você não é o soberano desta vila!');
        return 0;
    }

    let oldName = v.name;
    v.ownerUUID = null;
    v.ownerName = null;
    v.partyName = null;
    v.citizens = [];
    saveVillages();

    server.tell(`§6[Soberania] §e${player.name.string} §frenunciou ao domínio de §e${oldName}§f! O território agora está livre.`);
    return 1;
}

function renameVillage(player, newName) {
    if (!player) return 0;
    let v = getNearestVillage(player.x, player.z, 160);
    if (!v) {
        player.tell('§c[Soberania] Nenhuma vila governada nas redondezas.');
        return 0;
    }
    let isGov = (v.ownerUUID === player.uuid.toString());
    let isAdmin = player.op || (player.hasPermissions && player.hasPermissions(2));
    if (!isGov && !isAdmin) {
        player.tell('§c[Soberania] Apenas o Governador da vila pode alterar o seu nome!');
        return 0;
    }
    if (!newName || newName.trim().length === 0) {
        player.tell('§cUso: /totem renomear <Novo Nome da Vila>');
        return 0;
    }
    let oldName = v.name;
    v.name = newName.trim();
    saveVillages();
    player.tell(`§a[Soberania] O território foi renomeado de §e${oldName} §apara §6§l${v.name}§a!`);
    player.playSound('minecraft:block.note_block.bell', 1.0, 1.2);
    return 1;
}

function isPlayerAuthorizedInVillage(player, village) {
    if (!player || !village || !village.ownerUUID) return true;

    let pUUID = player.uuid ? player.uuid.toString() : '';
    let oUUID = village.ownerUUID ? village.ownerUUID.toString() : '';

    if (pUUID === oUUID) return true;

    // Checa membros do mesmo Clã (/cla)
    let pClan = getPlayerClan(pUUID);
    let oClan = getPlayerClan(oUUID);
    if (pClan && oClan && pClan.id === oClan.id) return true;

    // Checa lista de cidadãos
    if (village.citizens) {
        try {
            for (let i = 0; i < village.citizens.length; i++) {
                if (String(village.citizens[i]) === pUUID) return true;
            }
        } catch (e) {}
    }

    // Checa Party no OPAC
    try {
        let ServerData = Java.loadClass('xaero.pac.common.server.ServerData');
        let serverData = ServerData.from(player.server);
        if (serverData) {
            let partyMgr = serverData.getPartyManager();
            let pParty = partyMgr.getPartyByMember(player.uuid);
            let UUIDClass = Java.loadClass('java.util.UUID');
            let oUUIDObj = UUIDClass.fromString(oUUID);
            let oParty = partyMgr.getPartyByMember(oUUIDObj);
            if (pParty && oParty && pParty.getId().equals(oParty.getId())) {
                return true;
            }
        }
    } catch (e) {}

    return false;
}

// ----------------------------------------------------
// MOTOR DE TICK: CERCOS (1s), BUFFS/GUARDAS (20s) & CENSO PASSIVO (30m)
// ----------------------------------------------------
let territorySecCounter = 0;
let censusCounter = 0;
let garrisonCounter = 0;

ServerEvents.tick(event => {
    let server = event.server;
    if (!server) return;

    territorySecCounter++;
    censusCounter++;
    garrisonCounter++;

    // Guarnição de Guardas Reais: mantida a cada 20 segundos (400 ticks)
    if (garrisonCounter >= 400) {
        garrisonCounter = 0;
        for (let id in claimedVillages) {
            let v = claimedVillages[id];
            if (v && v.ownerUUID && !v.ruined && isAnyDefenderOnline(server, v)) {
                replenishVillageGuards(server, v);
            }
        }
    }

    // 1. Atualização de Cercos Territoriais e Buffs de Prosperidade a cada 1 segundo (20 ticks)
    if (territorySecCounter >= 20) {
        territorySecCounter = 0;

        // A. Processa Cercos Ativos (Zona de Controle de 12m ao redor do Emissário)
        let overworld = server.overworld();
        for (let vId in activeSieges) {
            let siege = activeSieges[vId];
            let v = claimedVillages[vId];
            if (!v) {
                delete activeSieges[vId];
                continue;
            }

            let cx = v.x;
            let cy = v.y || 64;
            let cz = v.z;

            // Exibe anel visual terrestre de partículas de fogo delimitando os 12m da zona de controle
            for (let angle = 0; angle < 360; angle += 15) {
                let rad = angle * (Math.PI / 180);
                let px = (cx + 12 * Math.cos(rad)).toFixed(2);
                let pz = (cz + 12 * Math.sin(rad)).toFixed(2);
                server.runCommandSilent(`particle minecraft:flame ${px} ${cy + 1.0} ${pz} 0.1 0.5 0.1 0.02 2 force`);
            }

            // Farol de Guerra no Céu: sinal de fumaça e labaredas visíveis a longa distância
            server.runCommandSilent(`particle minecraft:campfire_signal_smoke ${cx} ${cy + 18} ${cz} 0.5 4 0.5 0.02 6 force`);
            server.runCommandSilent(`particle minecraft:flame ${cx} ${cy + 14} ${cz} 0.8 1.5 0.8 0.04 4 force`);

            // Fase de Preparação (3 minutos antes da barra começar a cair)
            if (siege.prepTimeLeft && siege.prepTimeLeft > 0) {
                siege.prepTimeLeft--;
                let pMins = Math.floor(siege.prepTimeLeft / 60);
                let pSecs = siege.prepTimeLeft % 60;
                let pTimeStr = `${pMins}:${pSecs < 10 ? '0' + pSecs : pSecs}`;
                server.runCommandSilent(`execute positioned ${cx} ${cy} ${cz} run title @a[distance=..160] actionbar {"text":"§4⚔ [CERCO: ${v.name}] §e⏳ Preparação: ${pTimeStr} §8| §7Mobilize as defesas!"}`);
                if (siege.prepTimeLeft === 0) {
                    server.tell(`§c§l⚔ [CERCO LIBERADO!] §fA fase de preparação em §e${v.name} §fterminou! A zona de controle de 12m está aberta!`);
                    server.runCommandSilent(`playsound minecraft:event.raid.horn hostile @a ${cx} ${cy} ${cz} 10.0 1.0`);
                }
                continue;
            }

            siege.timeLeft--;

            let attackersInZone = 0;
            let defendersInZone = 0;

            let pList = server.players || (server.playerList ? server.playerList.players : []);
            pList.forEach(p => {
                if (!p.alive || p.isSpectator()) return;
                let dx = p.x - cx;
                let dz = p.z - cz;
                let distSq = dx * dx + dz * dz;

                // Raio de 12 blocos da Praça do Emissário
                if (distSq <= 12 * 12) {
                    if (siege.testAttackerUUID && p.uuid.toString() === siege.testAttackerUUID) {
                        attackersInZone++;
                    } else if (isPlayerAuthorizedInVillage(p, v)) {
                        defendersInZone++;
                    } else {
                        attackersInZone++;
                    }
                }
            });

            // Mercenários de defesa vivos dentro da zona de 12m também disputam a praça!
            if (overworld) {
                try {
                    let zoneBox = new SiegeAABB(cx - 12, cy - 10, cz - 12, cx + 12, cy + 14, cz + 12);
                    let zoneEnts = overworld.getEntitiesWithin(zoneBox);
                    let defTag = `merc_def_${v.id}`;
                    for (let i = 0; i < zoneEnts.length; i++) {
                        let ent = zoneEnts[i];
                        if (ent && ent.alive && ent.tags && ent.tags.contains(defTag)) {
                            let dx = ent.x - cx;
                            let dz = ent.z - cz;
                            if (dx * dx + dz * dz <= 12 * 12) {
                                defendersInZone++;
                            }
                        }
                    }
                } catch (e) {}
            }

            // Se for cerco de teste com invasores simulados
            if (siege.simulatedAttacker) {
                if (defendersInZone === 0) {
                    if (attackersInZone === 0) attackersInZone = 1;
                } else {
                    attackersInZone = 0;
                }
            }

            let pInfo = getProsperityInfo(v);
            let dropRate = (pInfo.tier >= 3) ? 0.35 : 0.55; // ~3m de ocupação limpa (~4m45s em Metrópole)

            let statusColor;
            if (attackersInZone > 0 && defendersInZone === 0) {
                statusColor = '§c▼ Ocupada por Invasores';
                siege.controlProgress = Math.max(0, siege.controlProgress - dropRate);
            } else if (defendersInZone > 0 && attackersInZone === 0) {
                statusColor = '§a▲ Defendida';
                siege.controlProgress = Math.min(100, siege.controlProgress + 0.6);
            } else if (attackersInZone > 0 && defendersInZone > 0) {
                statusColor = '§e⚔ Disputada';
            } else {
                statusColor = '§7⚪ Neutra';
            }

            let mins = Math.floor(siege.timeLeft / 60);
            let secs = siege.timeLeft % 60;
            let timeStr = `${mins}:${secs < 10 ? '0' + secs : secs}`;

            // Mostra placar na Actionbar para todos na vila (160m)
            server.runCommandSilent(`execute positioned ${cx} ${cy} ${cz} run title @a[distance=..160] actionbar {"text":"§4⚔ [CERCO: ${v.name}] §fDomínio: §e${Math.round(siege.controlProgress)}% §7(${statusColor}§7) §8| §fTempo: §b${timeStr}"}`);

            // Verifica Vitória dos Atacantes (Domínio chegou a 0%)
            if (siege.controlProgress <= 0) {
                let oldParty = v.partyName;
                v.ownerUUID = siege.attackerUUID;
                v.ownerName = siege.attackerName;
                v.partyName = siege.attackerParty;
                v.citizens = [];

                // Saque de 25% do Cofre do Emissário para o Conquistador
                let lootGold = Math.floor((v.taxGold || 0) * 0.25);
                let lootIron = Math.floor((v.taxIron || 0) * 0.25);
                v.taxGold = (v.taxGold || 0) - lootGold;
                v.taxIron = (v.taxIron || 0) - lootIron;
                saveVillages();

                let winnerPlayer = server.getPlayer(siege.attackerUUID);
                if (winnerPlayer) {
                    if (lootGold > 0) winnerPlayer.give(Item.of('lightmanscurrency:coin_gold', lootGold));
                    if (lootIron > 0) winnerPlayer.give(Item.of('lightmanscurrency:coin_iron', lootIron));
                }

                let wasTest = siege.isTest;
                despawnSiegeMercenaries(server, v, !wasTest);
                delete activeSieges[vId];
                if (!wasTest) {
                    siegeCooldowns[v.id] = Date.now() + (24 * 3600 * 1000); // 24h de trégua após conquista
                }
                saveSiegeState();
                if (!wasTest && global.chronicleEvent) {
                    global.chronicleEvent('siege', `${v.partyName} conquistou a vila "${v.name}" de ${oldParty} em cerco militar!`);
                }

                server.tell('§4§l==================================================');
                server.tell('§6§l👑 VILA CONQUISTADA EM CERCO MILITAR!');
                server.tell(`§e${v.partyName} §fdomina a praça central e toma o governo de §6§l${v.name} §fde §c${oldParty}§f!`);
                server.tell(`§fEspólio de Guerra Saqueado do Cofre (25%): §6${lootGold} Moedas de Ouro §fe §f${lootIron} Ferro!`);
                if (wasTest) {
                    server.tell('§b[Cerco Teste] Conquista simulada concluída! Use §e/cerco_teste restaurar §bpara desfazer.');
                }
                server.tell('§4§l==================================================');
                server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete master @a ${cx} ${cy} ${cz} 10.0 1.0`);
                continue;
            }

            // Verifica Vitória dos Defensores (Tempo esgotado)
            if (siege.timeLeft <= 0) {
                let wasTest = siege.isTest;
                despawnSiegeMercenaries(server, v, !wasTest);
                delete activeSieges[vId];
                if (!wasTest) {
                    siegeCooldowns[v.id] = Date.now() + (6 * 3600 * 1000); // 6h de trégua após defesa
                }
                saveSiegeState();
                if (!wasTest && global.chronicleEvent) {
                    global.chronicleEvent('siege', `${v.partyName} repeliu o cerco e manteve a soberania sobre "${v.name}".`);
                }
                server.tell('§a§l==================================================');
                server.tell('§2§l🛡️ CERCO REPELIDO COM SUCESSO!');
                server.tell(`§fOs defensores de §6§l${v.partyName} §fmantiveram a soberania sobre §e${v.name}§f!`);
                server.tell('§a§l==================================================');
                server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete master @a ${cx} ${cy} ${cz} 10.0 1.0`);
            }
        }

        // B. Aplica Buffs de Prosperidade aos membros do clã dentro de sua própria vila (desativado em cerco)
        server.playerList.players.forEach(p => {
            if (!p.alive) return;
            let v = getNearestVillage(p.x, p.z, 160);
            if (v && v.ownerUUID && !v.ruined && !activeSieges[v.id] && isPlayerAuthorizedInVillage(p, v)) {
                let pInfo = getProsperityInfo(v);
                if (pInfo.tier >= 1 && p.potionEffects) {
                    p.potionEffects.add('minecraft:regeneration', 60, 0, true, false);
                }
                if (pInfo.tier >= 2 && p.potionEffects) {
                    p.potionEffects.add('minecraft:speed', 60, 0, true, false);
                }
            }
        });
    }

    // 2. Censo Demográfico de Aldeões, Imposto Passivo no Cofre & Guarnição (A cada 30 minutos = 36000 ticks)
    if (censusCounter >= 36000) {
        censusCounter = 0;
        let overworld = server.overworld();
        if (!overworld) return;

        for (let id in claimedVillages) {
            let v = claimedVillages[id];
            if (!v || !v.ownerUUID) continue;

            // Só processa se houver ao menos 1 membro do clã online
            if (!isAnyDefenderOnline(server, v)) continue;

            let areaLoaded = isVillageAreaLoaded(server, v);
            let pop = v.population || 0;

            if (areaLoaded) {
                pop = countLivingVillagers(overworld, v.x, v.y, v.z, 120);
                v.population = pop;

                if (pop < 5) {
                    v.ruinStrikes = (v.ruinStrikes || 0) + 1;
                    if (v.ruinStrikes >= 2) {
                        v.ruined = true;
                        saveVillages();
                        server.playerList.players.forEach(p => {
                            if (isPlayerAuthorizedInVillage(p, v)) {
                                p.tell(`§c§l[⚠ ALERTA DE RUÍNA] §fA população de §e${v.name} §fpermaneceu abaixo de 5 (§c${pop} Aldeões§f) por 2 censos seguidos! O imposto passivo e as proteções caíram.`);
                            }
                        });
                        continue;
                    } else {
                        saveVillages();
                        server.playerList.players.forEach(p => {
                            if (isPlayerAuthorizedInVillage(p, v)) {
                                p.tell(`§e§l[⚠ AVISO DE DESPOVOAMENTO] §f${v.name} está com apenas §c${pop} Aldeões§f! Repovoe para 5+ antes do próximo censo (30m) ou a vila entrará em Ruína.`);
                            }
                        });
                        continue;
                    }
                } else {
                    v.ruinStrikes = 0;
                    v.ruined = false;
                }
            } else if (v.ruined || pop < 5) {
                continue;
            }

            let pInfo = getProsperityInfo(v);
            let totalIron = calculatePassiveTaxIron(pop, pInfo.taxBonus);
            if (global.econMint && totalIron > 0) global.econMint('village_census', totalIron, null);

            creditVillageTreasury(v, totalIron);

            // Deduz Manutenção (Upkeep: Guardas + 10% do custo dos NPCs contratados)
            let upkeep = calculateVillageUpkeep(v);
            let demotedMsg = deductVillageUpkeep(v, upkeep.totalIron, upkeep.maxDebtIron);

            v.lastCensusAt = Date.now();
            saveVillages();

            // Verifica guarnição apenas quando a área está carregada (pula se estiver em dívida)
            if (areaLoaded) {
                replenishVillageGuards(server, v);
            }

            let netIron = totalIron - upkeep.totalIron;
            let netStr = netIron >= 0 ? `§a+${netIron}` : `§c${netIron}`;
            server.playerList.players.forEach(p => {
                if (isPlayerAuthorizedInVillage(p, v)) {
                    if ((v.taxDebtIron || 0) > 0) {
                        p.tell(`§6[Censo Real: ${v.name}] §fPop: §a${pop} §8| §fImposto: §a+${totalIron} §7/ §cManutenção: -${upkeep.totalIron} §8(${netStr} Ferro§8) §8| §4Dívida: §c-${v.taxDebtIron}/${upkeep.maxDebtIron} Ferro`);
                    } else {
                        p.tell(`§6[Censo Real: ${v.name}] §fPop: §a${pop} §8| §fImposto: §a+${totalIron} §7/ §cManutenção: -${upkeep.totalIron} §8(${netStr} Ferro§8) §7(Cofre: §6${v.taxGold} Ouro§7, §f${v.taxIron} Ferro§7)`);
                    }
                    if (demotedMsg) p.tell(demotedMsg);
                }
            });
        }
    }
});

// ----------------------------------------------------
// PROTEÇÃO FÍSICA DE BLOCOS, BAÚS, ALDEÕES E PVP
// ----------------------------------------------------
function enforceProtection(event, player, x, z, typeKey, actionMsg) {
    if (!player || !player.isPlayer()) return;
    let isOp = player.op || (player.hasPermissions && player.hasPermissions(2));
    if (player.isCreative() && isOp) return;

    let v = getNearestVillage(x, z, 160);
    if (v && v.ownerUUID && !v.ruined) {
        if (v[typeKey] === false) return;

        if (!isPlayerAuthorizedInVillage(player, v)) {
            event.cancel();
            player.tell(`§c[Soberania] Território protegido de §e${v.partyName}§c! Você não pode ${actionMsg} aqui.`);
            player.playSound('minecraft:entity.villager.no', 0.8, 1.0);
        }
    }
}

BlockEvents.broken(event => {
    let p = event.player;
    let b = event.block;
    if (p && p.isPlayer() && b) {
        enforceProtection(event, p, b.x, b.z, 'protectBreak', 'quebrar blocos');
    }
});

BlockEvents.placed(event => {
    let p = event.player;
    let b = event.block;
    if (p && p.isPlayer() && b) {
        enforceProtection(event, p, b.x, b.z, 'protectPlace', 'colocar blocos');
    }
});

BlockEvents.leftClicked(event => {
    let p = event.player;
    let b = event.block;
    if (p && p.isPlayer() && b && !p.isCreative()) {
        enforceProtection(event, p, b.x, b.z, 'protectBreak', 'alterar estruturas');
    }
});

BlockEvents.rightClicked(event => {
    let p = event.player;
    let b = event.block;
    if (!p || !p.isPlayer() || !b) return;
    if (event.item && isProtectedVehicleType(event.item.id)) {
        recordShipPlacer(p);
    }
    let isOp = p.op || (p.hasPermissions && p.hasPermissions(2));
    if (p.isCreative() && isOp) return;

    let id = b.id;
    if (id.includes('chest') || id.includes('barrel') || id.includes('shulker') || id.includes('furnace') || id.includes('hopper') || id.includes('dispenser') || id.includes('dropper')) {
        let v = getNearestVillage(b.x, b.z, 160);
        if (v && v.ownerUUID && !v.ruined && v.protectChests !== false && !isPlayerAuthorizedInVillage(p, v)) {
            event.cancel();
            p.tell(`§c[Soberania] Você não tem permissão para saquear recipientes no território de §e${v.partyName}§c!`);
            p.playSound('minecraft:block.chest.locked', 0.8, 1.0);
        }
    }
});

ItemEvents.rightClicked(event => {
    let p = event.player;
    let item = event.item;
    if (!p || !p.isPlayer() || !item) return;
    let id = item.id;
    if (isProtectedVehicleType(id)) {
        recordShipPlacer(p);
    }
    let isOp = p.op || (p.hasPermissions && p.hasPermissions(2));
    if (p.isCreative() && isOp) return;
    if (id.includes('bucket') || id.includes('flint_and_steel') || id.includes('fire_charge') || id.includes('tnt') || id.includes('end_crystal')) {
        let v = getNearestVillage(p.x, p.z, 160);
        if (v && v.ownerUUID && !v.ruined && v.protectGrief !== false && !isPlayerAuthorizedInVillage(p, v)) {
            event.cancel();
            p.tell(`§c[Soberania] Você não pode usar este item no território de §e${v.partyName}§c!`);
        }
    }
});

// ----------------------------------------------------
// PROTEÇÃO NAVAL & VEÍCULOS (SMALL SHIPS + CARROÇAS + BARCOS VANILLA)
// ----------------------------------------------------
let pendingShipPlacers = [];

function isProtectedVehicleType(typeStr) {
    let s = String(typeStr || '');
    return s.startsWith('smallships:') || s.startsWith('astikorcartsredux:') || s.startsWith('immersive_aircraft:');
}

// Zona Aérea Protegida: impede sobrevoar centros de cidades rivais ou cercos ativos em aeronaves
let airspaceTickCounter = 0;
ServerEvents.tick(event => {
    airspaceTickCounter++;
    if (airspaceTickCounter < 20) return;
    airspaceTickCounter = 0;

    let server = event.server;
    if (!server) return;
    server.playerList.players.forEach(p => {
        if (!p || !p.alive || !p.isPassenger() || !p.vehicle) return;
        let vType = String(p.vehicle.type || '');
        if (!vType.startsWith('immersive_aircraft:')) return;

        let isOp = p.op || (p.hasPermissions && p.hasPermissions(2));
        if (p.isCreative() && isOp) return;

        let v = getNearestVillage(p.x, p.z, 160);
        if (!v || !v.ownerUUID || v.ruined || isPlayerAuthorizedInVillage(p, v)) return;

        let dx = p.x - v.x;
        let dz = p.z - v.z;
        let distSq = dx * dx + dz * dz;
        let inSiege = !!activeSieges[v.id];
        if (inSiege || distSq <= 40 * 40) {
            p.stopRiding();
            p.tell(`§c[Soberania Aérea] §fEspaço aéreo protegido de §e${v.partyName}§f! Pouse fora das muralhas.`);
            p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
        }
    });
});

function recordShipPlacer(p) {
    if (!p) return;
    let now = Date.now();
    pendingShipPlacers = pendingShipPlacers.filter(entry => (now - entry.time) < 1500);
    pendingShipPlacers.push({
        uuid: p.uuid.toString(),
        name: p.name.string,
        x: p.x,
        y: p.y,
        z: p.z,
        time: now
    });
}

function isShipOwnerOrClan(player, ship) {
    if (!player || !ship) return false;
    let isOp = player.op || (player.hasPermissions && player.hasPermissions(2));
    if (isOp && player.isCreative()) return true;
    if (!ship.persistentData || !ship.persistentData.contains('shipOwnerUUID')) {
        return true;
    }
    let ownerUUID = String(ship.persistentData.getString('shipOwnerUUID'));
    let pUUID = player.uuid.toString();
    if (ownerUUID === pUUID) return true;

    let ownerClan = getPlayerClan(ownerUUID);
    let playerClan = getPlayerClan(pUUID);
    if (ownerClan && playerClan && ownerClan.id === playerClan.id) {
        return true;
    }
    return false;
}

EntityEvents.spawned(event => {
    try {
        let ent = event.entity;
        if (!ent || !isProtectedVehicleType(ent.type)) return;
        if (ent.persistentData.contains('shipOwnerUUID')) return;

        let now = Date.now();
        let bestIdx = -1;
        let bestDist = 144; // Máximo 12 blocos de distância
        for (let i = pendingShipPlacers.length - 1; i >= 0; i--) {
            let entry = pendingShipPlacers[i];
            if (now - entry.time > 1500) {
                pendingShipPlacers.splice(i, 1);
                continue;
            }
            let dx = ent.x - entry.x;
            let dy = ent.y - entry.y;
            let dz = ent.z - entry.z;
            let dSq = dx * dx + dy * dy + dz * dz;
            if (dSq < bestDist) {
                bestDist = dSq;
                bestIdx = i;
            }
        }

        if (bestIdx !== -1) {
            let owner = pendingShipPlacers[bestIdx];
            ent.persistentData.putString('shipOwnerUUID', owner.uuid);
            ent.persistentData.putString('shipOwnerName', owner.name);
            let eTypeStr = String(ent.type);
            let isCart = eTypeStr.startsWith('astikorcartsredux:');
            console.log(`[Proteção Veículos] ${eTypeStr} registrado para ${owner.name} em (${Math.round(ent.x)}, ${Math.round(ent.z)})`);
            if (eTypeStr !== 'smallships:ship_part' && ent.server) {
                let opPlayer = ent.server.getPlayer(owner.name);
                if (opPlayer) {
                    if (isCart) {
                        opPlayer.tell(`§a[Soberania] Carroça registrada em seu nome (§e${owner.name}§a).`);
                    } else {
                        opPlayer.tell(`§a[Porto Real] Embarcação registrada em seu nome (§e${owner.name}§a).`);
                    }
                }
            }
        }
    } catch (e) {
        console.error('[Proteção Veículos] Erro ao registrar dono: ' + e);
    }
});

let shipMsgCooldowns = {};

function shouldBlockShipInteraction(p, target) {
    if (!p || !p.isPlayer() || !target) return false;
    let tType = String(target.type);
    if (!isProtectedVehicleType(tType)) return false;

    let v = getNearestVillage(target.x, target.z, 160);
    if (!v || !v.ownerUUID || v.ruined) return false;

    let siegeActive = !!activeSieges[v.id];
    if (siegeActive) return false;

    let isCart = tType.startsWith('astikorcartsredux:');

    // Se for uma parte do navio sem dono direto, busca o casco principal próximo
    let ownerShip = target;
    if (!ownerShip.persistentData.contains('shipOwnerUUID')) {
        let box = target.boundingBox.inflate(8);
        let nearby = target.level.getEntitiesWithin(box);
        for (let i = 0; i < nearby.length; i++) {
            let e = nearby[i];
            if (isProtectedVehicleType(e.type) && e.persistentData && e.persistentData.contains('shipOwnerUUID')) {
                ownerShip = e;
                break;
            }
        }
    }

    if (!ownerShip.persistentData.contains('shipOwnerUUID')) {
        if (isPlayerAuthorizedInVillage(p, v)) {
            ownerShip.persistentData.putString('shipOwnerUUID', p.uuid.toString());
            ownerShip.persistentData.putString('shipOwnerName', p.name.string);
            p.tell(isCart
                ? `§a[Soberania] Carroça sem registro vinculada ao seu nome (§e${p.name.string}§a).`
                : `§a[Porto Real] Navio sem registro vinculado ao seu nome (§e${p.name.string}§a).`);
        }
        return false;
    }

    if (!isShipOwnerOrClan(p, ownerShip)) {
        let pUUID = p.uuid.toString();
        let now = Date.now();
        if (now - (shipMsgCooldowns[pUUID] || 0) > 600) {
            shipMsgCooldowns[pUUID] = now;
            let ownerName = ownerShip.persistentData.getString('shipOwnerName') || 'outro jogador';
            if (isCart) {
                p.tell(`§c[Soberania] Esta carroça pertence a §e${ownerName} §ce sua facção! Você não pode acessá-la em território pacífico.`);
            } else {
                p.tell(`§c[Porto Real] Este navio pertence a §e${ownerName} §ce sua facção! Você não pode embarcar ou abrir o porão em território pacífico.`);
            }
            p.playSound('minecraft:entity.villager.no', 0.8, 1.0);
        }
        return true;
    }
    return false;
}
global.shouldBlockShipInteraction = shouldBlockShipInteraction;

ItemEvents.entityInteracted(event => {
    if (shouldBlockShipInteraction(event.player, event.target)) {
        event.cancel();
    }
});

// ----------------------------------------------------
// PROTEÇÃO CONTRA EXPLOSÕES (ANTI-BURACOS DE CREEPERS & GRIEFING)
// ----------------------------------------------------
LevelEvents.afterExplosion(event => {
    try {
        let affected = event.getAffectedBlocks();
        if (!affected || affected.isEmpty()) return;

        let exploder = event.exploder;
        let isCreeper = exploder && exploder.type === 'minecraft:creeper';

        // 1. Se a explosão ocorreu dentro de uma vila reivindicada
        let vCenter = getNearestVillage(event.x, event.z, 160);
        if (vCenter && vCenter.ownerUUID && !vCenter.ruined) {
            let siegeActive = !!activeSieges[vCenter.id];
            // Em tempo de paz, NENHUMA explosão quebra blocos na vila.
            // Em cerco, Creepers (PvE) ainda assim nunca quebram blocos da vila.
            if (!siegeActive || isCreeper) {
                event.removeAllAffectedBlocks();
                return;
            }
        }

        // 2. Se a explosão foi na borda, protege os blocos que caem dentro do perímetro de 160m
        for (let i = affected.size() - 1; i >= 0; i--) {
            let b = affected.get(i);
            let v = getNearestVillage(b.x, b.z, 160);
            if (v && v.ownerUUID && !v.ruined) {
                let siegeActive = !!activeSieges[v.id];
                if (!siegeActive || isCreeper) {
                    event.removeAffectedBlock(b);
                }
            }
        }
    } catch (e) {
        console.error('[Soberania] Erro ao filtrar explosão: ' + e);
    }
});

// Proteção de Aldeões, Guardas, Animais e Controle de PVP (Fora de Guerra vs Durante Cerco)
EntityEvents.hurt(event => {
    let victim = event.entity;
    let attacker = event.source ? event.source.actual : null;
    if (!victim) return;

    let v = getNearestVillage(victim.x, victim.z, 160);
    if (!v || !v.ownerUUID || v.ruined) return;

    let siegeActive = !!activeSieges[v.id];

    // 0. Proteção de Barcos Vanilla, Navios Small Ships e Carroças em Cidades (Fora de Cerco)
    if (!siegeActive) {
        let vType = String(victim.type);
        let isModVehicle = isProtectedVehicleType(vType);
        let isVanillaBoat = (vType === 'minecraft:boat' || vType === 'minecraft:chest_boat');

        if (isModVehicle) {
            if (!attacker || !attacker.isPlayer()) {
                event.cancel();
                return;
            }
            if (!isShipOwnerOrClan(attacker, victim)) {
                event.cancel();
                attacker.tell(`§c[Soberania] Veículos estacionados em §e${v.name} §cestão protegidos contra danos fora de um Cerco Territorial!`);
                return;
            }
        } else if (isVanillaBoat) {
            if (attacker && attacker.isPlayer() && !isPlayerAuthorizedInVillage(attacker, v)) {
                event.cancel();
                attacker.tell(`§c[Porto Real] Você não pode danificar barcos dentro da cidade pacífica de §e${v.name}§c!`);
                return;
            }
        }
    }

    // 1. Proteção Absoluta de Aldeões, Guardas, Golems e Animais contra jogadores de fora enquanto NÃO há cerco!
    if (!victim.isPlayer() && attacker && attacker.isPlayer()) {
        let vType = String(victim.type);
        let isProtectedMob = vType === 'minecraft:villager' || vType === 'guardvillagers:guard' || vType === 'minecraft:iron_golem' || vType === 'easy_npc:humanoid' || vType.includes('horse') || vType.includes('cow') || vType.includes('sheep') || vType.includes('pig') || vType.includes('chicken');
        if (isProtectedMob && !siegeActive && !isPlayerAuthorizedInVillage(attacker, v)) {
            event.cancel();
            attacker.tell(`§c[Soberania] Os habitantes e guardas de §e${v.name} §cestão sob proteção real! Você não pode feri-los fora de um Cerco Territorial.`);
            return;
        }
    }

    // 2. Controle de PVP entre Jogadores (Bloqueado se protectPvp estiver ativo, MAS liberado durante um Cerco ou Duelo na Arena!)
    if (victim.isPlayer() && attacker && attacker.isPlayer()) {
        let isDuel = (global.isPlayerInActiveDuel && (global.isPlayerInActiveDuel(victim) || global.isPlayerInActiveDuel(attacker)));
        if (!siegeActive && !isDuel && v.protectPvp !== false) {
            event.cancel();
            attacker.tell(`§c[Soberania] O combate entre jogadores está desativado no território pacífico de §e${v.name}§c!`);
        }
    }
});

// Imposto Comercial de 8% nas rotas de fardos (Depositado direto no mesmo Cofre do Emissário)
global.recordVillageTax = function(x, z, totalIronCoins) {
    let v = getNearestVillage(x, z, 160);
    if (v && v.ownerUUID && !v.ruined) {
        let pInfo = getProsperityInfo(v);
        let rate = (pInfo.tier >= 3) ? 0.12 : 0.08;
        let taxIronTotal = Math.round(totalIronCoins * rate);
        if (taxIronTotal >= 1) {
            creditVillageTreasury(v, taxIronTotal);
            v.economicPoints = (v.economicPoints || 0) + (taxIronTotal * 2);
            if (global.econMint) global.econMint('village_trade_tax', taxIronTotal, null);
            saveVillages();
            return { village: v.name, party: v.partyName, taxIron: taxIronTotal };
        }
    }
    return null;
};

global.getVillageTreasuryTotalIron = function() {
    let total = 0;
    let keys = Object.keys(claimedVillages || {});
    for (let i = 0; i < keys.length; i++) {
        let v = claimedVillages[keys[i]];
        if (v && v.ownerUUID && !v.ruined) {
            total += ((Number(v.taxGold || 0) * 10) + Number(v.taxIron || 0));
        }
    }
    return total;
};

// ----------------------------------------------------
// REGISTRO DE COMANDOS (/totem e /cla)
// ----------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function getPlayerFromContext(ctx) {
        let player = null;
        try {
            let targetName = Arguments.STRING.getResult(ctx, 'target');
            player = ctx.source.server.getPlayer(targetName);
        } catch (e) {}
        if (!player) player = ctx.source.player;
        return player;
    }

    function parseArgs(ctx) {
        let p = null;
        let amount = null;
        try {
            let a1 = Arguments.STRING.getResult(ctx, 'arg1');
            if (a1) {
                let num = parseInt(a1);
                if (!isNaN(num) || a1 === 'tudo' || a1 === 'all') {
                    amount = a1;
                } else {
                    p = ctx.source.server.getPlayer(a1);
                }
            }
        } catch (e) {}
        try {
            let a2 = Arguments.STRING.getResult(ctx, 'arg2');
            if (a2) {
                let p2 = ctx.source.server.getPlayer(a2);
                if (p2) p = p2;
                else {
                    let num = parseInt(a2);
                    if (!isNaN(num) || a2 === 'tudo' || a2 === 'all') {
                        amount = a2;
                    }
                }
            }
        } catch (e) {}
        if (!p) p = ctx.source.player;
        return { player: p, amount: amount };
    }

    // COMANDO DE CLÃS (/cla) — Sem necessidade de ter cidade!
    event.register(
        Commands.literal('cla')
            .then(Commands.literal('criar')
                .then(Commands.argument('nome', Arguments.GREEDY_STRING.create(event))
                    .executes(ctx => {
                        let p = ctx.source.player;
                        if (!p) return 0;
                        let nome = Arguments.GREEDY_STRING.getResult(ctx, 'nome').trim();
                        if (!nome) return 0;

                        let existing = getPlayerClan(p.uuid.toString());
                        if (existing) {
                            p.tell(`§c[Clã] Você já pertence ao clã §e${existing.name}§c! Use /cla sair primeiro.`);
                            return 0;
                        }

                        let cId = `cla_${p.uuid.toString()}`;
                        customClans[cId] = {
                            id: cId,
                            name: nome,
                            leaderUUID: p.uuid.toString(),
                            leaderName: p.name.string,
                            members: [p.uuid.toString()]
                        };
                        saveClans();
                        if (global.chronicleEvent) global.chronicleEvent('clan', `${p.name.string} fundou o cla "${nome}".`);

                        // Atualiza nome da facção na vila caso o jogador já seja Governador
                        for (let vId in claimedVillages) {
                            if (claimedVillages[vId].ownerUUID === p.uuid.toString()) {
                                claimedVillages[vId].partyName = nome;
                            }
                        }
                        saveVillages();

                        p.tell(`§a[Clã] O clã §6§l${nome} §afoi fundado com sucesso! Use §e/cla convidar <jogador> §apara recrutar membros.`);
                        p.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.2);
                        return 1;
                    })
                )
            )
            .then(Commands.literal('convidar')
                .then(Commands.argument('alvo', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        let p = ctx.source.player;
                        let target = Arguments.PLAYER.getResult(ctx, 'alvo');
                        if (!p || !target) return 0;

                        let clan = getPlayerClan(p.uuid.toString());
                        if (!clan || clan.leaderUUID !== p.uuid.toString()) {
                            p.tell('§c[Clã] Apenas o líder de um clã pode convidar membros! Crie um com §e/cla criar <Nome>§c.');
                            return 0;
                        }

                        clanInvites[target.uuid.toString()] = clan.id;
                        p.tell(`§a[Clã] Convite enviado para §e${target.name.string}§a!`);
                        target.tell(`§6[Clã] Você foi convidado por §e${p.name.string} §6para integrar o clã §e§l${clan.name}§6! Digite §a/cla aceitar §6para entrar.`);
                        return 1;
                    })
                )
            )
            .then(Commands.literal('aceitar').executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                let u = p.uuid.toString();
                let invClanId = clanInvites[u];
                if (!invClanId || !customClans[invClanId]) {
                    p.tell('§c[Clã] Você não possui convites de clã pendentes.');
                    return 0;
                }

                let existing = getPlayerClan(u);
                if (existing) {
                    p.tell(`§c[Clã] Você já está no clã §e${existing.name}§c! Use /cla sair primeiro.`);
                    return 0;
                }

                let clan = customClans[invClanId];
                delete clanInvites[u];
                clan.members = clan.members || [];
                clan.members.push(u);
                saveClans();

                p.tell(`§a[Clã] Bem-vindo ao clã §6§l${clan.name}§a!`);
                return 1;
            }))
            .then(Commands.literal('sair').executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                let u = p.uuid.toString();
                let clan = getPlayerClan(u);
                if (!clan) {
                    p.tell('§c[Clã] Você não pertence a nenhum clã.');
                    return 0;
                }

                if (clan.leaderUUID === u) {
                    delete customClans[clan.id];
                    saveClans();
                    p.tell(`§e[Clã] O clã §6${clan.name} §efoi dissolvido.`);
                } else {
                    let idx = clan.members.indexOf(u);
                    if (idx >= 0) clan.members.splice(idx, 1);
                    saveClans();
                    p.tell(`§e[Clã] Você saiu do clã §6${clan.name}§e.`);
                }
                return 1;
            }))
            .then(Commands.literal('info').executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                let clan = getPlayerClan(p.uuid.toString());
                if (!clan) {
                    p.tell('§7[Clã] Você ainda não tem clã. Crie um a qualquer momento com §a/cla criar <Nome do Clã>§7!');
                    return 0;
                }
                p.tell('§6§m--------------------------------------------------');
                p.tell(`§e§l🛡️ CLÃ: ${clan.name.toUpperCase()}`);
                p.tell(`§fLíder: §a${clan.leaderName}`);
                p.tell(`§fTotal de Membros: §e${clan.members ? clan.members.length : 1}`);
                p.tell('§6§m--------------------------------------------------');
                return 1;
            }))
    );

function stopVillageRaid(server, villageName, player) {
    if (!server) return 0;
    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return 0;

    let targetV = null;
    if (villageName) {
        let q = String(villageName).toLowerCase();
        for (let id in claimedVillages) {
            let v = claimedVillages[id];
            if (v && v.name && v.name.toLowerCase() === q) {
                targetV = v;
                break;
            }
        }
    } else if (player) {
        targetV = getNearestVillage(player.x, player.z, 160);
    }

    if (!targetV) {
        let msg = '§c[Soberania] Vila não encontrada para encerrar raid.';
        if (player) player.tell(msg);
        else console.log(msg);
        return 0;
    }

    let stopped = false;
    try {
        let BlockPos = Java.loadClass('net.minecraft.core.BlockPos');
        let raid = overworld.getRaidAt(new BlockPos(Math.floor(targetV.x), Math.floor(targetV.y || 66), Math.floor(targetV.z)));
        if (raid) {
            let active = typeof raid.isStopped === 'function' ? !raid.isStopped() : true;
            if (active && typeof raid.stop === 'function') {
                raid.stop();
                stopped = true;
            }
        }
    } catch (e) {
        console.error('[Soberania] Erro ao encerrar raid:', e);
    }

    server.runCommandSilent(`execute positioned ${Math.floor(targetV.x)} ${Math.floor(targetV.y || 66)} ${Math.floor(targetV.z)} run kill @e[distance=..180,type=#minecraft:raiders]`);

    let out = stopped
        ? `§a[Soberania] Raid em §e${targetV.name} §aencerrada e raiders removidos.`
        : `§e[Soberania] Nenhuma raid ativa encontrada no centro de §e${targetV.name}§e (raiders próximos limpos).`;
    if (player) player.tell(out);
    else console.log(out);
    return stopped ? 1 : 0;
}

// Mantém referência global atualizável em `kubejs reload server_scripts` para evitar closures antigas no commandRegistry
global.vtCmd = {
    showCityRankings: showCityRankings,
    hireVillageNpc: hireVillageNpc,
    relocateVillageNpc: relocateVillageNpc,
    claimVillage: claimVillage,
    collectTaxes: collectTaxes,
    depositTaxes: depositTaxes,
    toggleProtection: toggleProtection,
    showVillageInfo: showVillageInfo,
    upgradeVillageProsperity: upgradeVillageProsperity,
    stopVillageRaid: stopVillageRaid
};

    // Ranking de Cidades / Vilas (/ranking cidades)
    event.register(
        Commands.literal('ranking')
            .then(Commands.literal('cidades')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (p) global.vtCmd.showCityRankings(p);
                    return 1;
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let targetName = Arguments.STRING.getResult(ctx, 'target');
                    let p = ctx.source.server.getPlayer(targetName) || ctx.source.player;
                    if (p) global.vtCmd.showCityRankings(p);
                    return 1;
                }))
            )
            .then(Commands.literal('vilas')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (p) global.vtCmd.showCityRankings(p);
                    return 1;
                })
            )
    );

    // Compra no Armazém Geral com IVA Municipal retido direto para o cofre da cidade
    event.register(
        Commands.literal('comprar_armazem')
            .then(Commands.argument('item', Arguments.STRING.create(event))
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    let itemKey = Arguments.STRING.getResult(ctx, 'item');
                    return buyFromGeneralStore(p, itemKey);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    let itemKey = Arguments.STRING.getResult(ctx, 'item');
                    return buyFromGeneralStore(p, itemKey);
                }))
            )
    );

    // COMANDO DO EMISSÁRIO (/totem)
    event.register(
        Commands.literal('totem')
            .then(Commands.literal('respawn_emissario')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    if (!p) return 0;
                    let v = getNearestVillage(p.x, p.z, 160);
                    let isGov = v && v.ownerUUID === p.uuid.toString();
                    let isOp = p.op || p.isCreative();
                    if (!v || (!isGov && !isOp)) {
                        p.tell('§c[Soberania] Apenas o Governador da vila (ou administradores) pode invocar o Emissário dentro de sua vila!');
                        return 0;
                    }
                    if (global.getNpcNbt) {
                        let nbt = global.getNpcNbt('totem');
                        if (nbt) {
                            let x = p.x.toFixed(2);
                            let y = p.y.toFixed(2);
                            let z = p.z.toFixed(2);
                            p.server.runCommandSilent(`summon easy_npc:humanoid ${x} ${y} ${z} ${nbt}`);
                            p.tell('§a[Soberania] O Emissário da Soberania foi re-invocado à sua posição!');
                            p.playSound('minecraft:block.bell.use', 1.0, 1.0);
                            return 1;
                        }
                    }
                    return 0;
                })
            )
            .then(Commands.literal('contratar')
                .then(Commands.argument('tipo', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let tipo = Arguments.STRING.getResult(ctx, 'tipo');
                        return global.vtCmd.hireVillageNpc(p, tipo, ctx.source.server);
                    })
                    .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let tipo = Arguments.STRING.getResult(ctx, 'tipo');
                        return global.vtCmd.hireVillageNpc(p, tipo, ctx.source.server);
                    }))
                )
            )
            .then(Commands.literal('recolher_npc')
                .then(Commands.argument('tipo', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let tipo = Arguments.STRING.getResult(ctx, 'tipo');
                        return global.vtCmd.relocateVillageNpc(p, tipo, ctx.source.server);
                    })
                    .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let tipo = Arguments.STRING.getResult(ctx, 'tipo');
                        return global.vtCmd.relocateVillageNpc(p, tipo, ctx.source.server);
                    }))
                )
            )
            .then(Commands.literal('reivindicar')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return global.vtCmd.claimVillage(p, ctx.source.server);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return global.vtCmd.claimVillage(p, ctx.source.server);
                }))
            )
            .then(Commands.literal('coletar')
                .executes(ctx => {
                    let { player, amount } = parseArgs(ctx);
                    return global.vtCmd.collectTaxes(player, amount);
                })
                .then(Commands.argument('arg1', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let { player, amount } = parseArgs(ctx);
                        return global.vtCmd.collectTaxes(player, amount);
                    })
                    .then(Commands.argument('arg2', Arguments.STRING.create(event))
                        .executes(ctx => {
                            let { player, amount } = parseArgs(ctx);
                            return global.vtCmd.collectTaxes(player, amount);
                        })
                    )
                )
            )
            .then(Commands.literal('depositar')
                .executes(ctx => {
                    let { player, amount } = parseArgs(ctx);
                    return global.vtCmd.depositTaxes(player, amount);
                })
                .then(Commands.argument('arg1', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let { player, amount } = parseArgs(ctx);
                        return global.vtCmd.depositTaxes(player, amount);
                    })
                    .then(Commands.argument('arg2', Arguments.STRING.create(event))
                        .executes(ctx => {
                            let { player, amount } = parseArgs(ctx);
                            return global.vtCmd.depositTaxes(player, amount);
                        })
                    )
                )
            )
            .then(Commands.literal('toggle')
                .then(Commands.argument('tipo', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let tipo = Arguments.STRING.getResult(ctx, 'tipo');
                        return global.vtCmd.toggleProtection(p, tipo);
                    })
                    .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let tipo = Arguments.STRING.getResult(ctx, 'tipo');
                        return global.vtCmd.toggleProtection(p, tipo);
                    }))
                )
            )
            .then(Commands.literal('info')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return global.vtCmd.showVillageInfo(p);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return global.vtCmd.showVillageInfo(p);
                }))
            )
            .then(Commands.literal('evoluir')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return global.vtCmd.upgradeVillageProsperity(p, ctx.source.server);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return global.vtCmd.upgradeVillageProsperity(p, ctx.source.server);
                }))
            )
            .then(Commands.literal('renunciar')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return renounceVillage(p, ctx.source.server);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return renounceVillage(p, ctx.source.server);
                }))
            )
            .then(Commands.literal('encerrar_raid')
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    return global.vtCmd.stopVillageRaid(ctx.source.server, null, ctx.source.player);
                })
                .then(Commands.argument('vila', Arguments.STRING.create(event)).executes(ctx => {
                    let vila = Arguments.STRING.getResult(ctx, 'vila');
                    return global.vtCmd.stopVillageRaid(ctx.source.server, vila, ctx.source.player);
                }))
            )
            .then(Commands.literal('renomear')
                .then(Commands.argument('nome', Arguments.GREEDY_STRING.create(event))
                    .executes(ctx => {
                        let p = ctx.source.player;
                        let nome = Arguments.GREEDY_STRING.getResult(ctx, 'nome');
                        return renameVillage(p, nome);
                    })
                )
            )
            .then(Commands.literal('cidadao')
                .then(Commands.literal('adicionar')
                    .then(Commands.argument('alvo', Arguments.PLAYER.create(event))
                        .executes(ctx => {
                            let p = ctx.source.player;
                            let target = Arguments.PLAYER.getResult(ctx, 'alvo');
                            if (!p || !target) return 0;
                            let v = getNearestVillage(p.x, p.z, 160);
                            if (!v || v.ownerUUID !== p.uuid.toString()) {
                                p.tell('§c[Soberania] Apenas o Governador da vila pode conceder cidadania!');
                                return 0;
                            }
                            v.citizens = v.citizens || [];
                            let tUUID = target.uuid.toString();
                            let alreadyCitizen = false;
                            for (let ci = 0; ci < v.citizens.length; ci++) {
                                if (String(v.citizens[ci]) === tUUID) {
                                    alreadyCitizen = true;
                                    break;
                                }
                            }
                            if (!alreadyCitizen) {
                                v.citizens.push(tUUID);
                                saveVillages();
                                p.tell(`§a[Soberania] §e${target.name.string} §aagora é cidadão oficial da vila e tem permissão para construir!`);
                                target.tell(`§a[Soberania] Você recebeu cidadania na vila de §e${v.name}§a!`);
                            } else {
                                p.tell(`§6[Soberania] §e${target.name.string} §fjá é cidadão desta vila.`);
                            }
                            return 1;
                        })
                    )
                )
                .then(Commands.literal('remover')
                    .then(Commands.argument('alvo', Arguments.PLAYER.create(event))
                        .executes(ctx => {
                            let p = ctx.source.player;
                            let target = Arguments.PLAYER.getResult(ctx, 'alvo');
                            if (!p || !target) return 0;
                            let v = getNearestVillage(p.x, p.z, 160);
                            if (!v || v.ownerUUID !== p.uuid.toString()) {
                                p.tell('§c[Soberania] Apenas o Governador pode revogar cidadanias!');
                                return 0;
                            }
                            v.citizens = v.citizens || [];
                            let idx = v.citizens.indexOf(target.uuid.toString());
                            if (idx >= 0) {
                                v.citizens.splice(idx, 1);
                                saveVillages();
                                p.tell(`§c[Soberania] Cidadania de §e${target.name.string} §crevogada.`);
                                target.tell(`§c[Soberania] Sua cidadania na vila de §e${v.name} §cfoi revogada.`);
                            }
                            return 1;
                        })
                    )
                )
            )
    );

    event.register(
        Commands.literal('cerco_teste')
            .requires(src => (src.player ? (src.player.op || src.player.isCreative()) : true))
            .then(Commands.literal('iniciar')
                .executes(ctx => startTestSiege(ctx.source.player, 180, 'defensor', ctx.source.server))
                .then(Commands.literal('defensor')
                    .executes(ctx => startTestSiege(ctx.source.player, 180, 'defensor', ctx.source.server))
                    .then(Commands.argument('tempo', Arguments.INTEGER.create(event))
                        .executes(ctx => {
                            let t = Arguments.INTEGER.getResult(ctx, 'tempo');
                            return startTestSiege(ctx.source.player, t, 'defensor', ctx.source.server);
                        })
                    )
                )
                .then(Commands.literal('invasor')
                    .executes(ctx => startTestSiege(ctx.source.player, 180, 'invasor', ctx.source.server))
                    .then(Commands.argument('tempo', Arguments.INTEGER.create(event))
                        .executes(ctx => {
                            let t = Arguments.INTEGER.getResult(ctx, 'tempo');
                            return startTestSiege(ctx.source.player, t, 'invasor', ctx.source.server);
                        })
                    )
                )
            )
            .then(Commands.literal('progresso')
                .then(Commands.argument('valor', Arguments.INTEGER.create(event))
                    .executes(ctx => {
                        let val = Arguments.INTEGER.getResult(ctx, 'valor');
                        return setSiegeProgress(ctx.source.player, val);
                    })
                )
            )
            .then(Commands.literal('parar')
                .executes(ctx => stopSiege(ctx.source.player))
            )
            .then(Commands.literal('clarim')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (p) {
                        p.give(Item.of('kubejs:clarim_cerco', 1));
                        p.tell('§e[Cerco] Você recebeu o Clarim de Guerra Territorial oficial!');
                    }
                    return 1;
                })
            )
            .then(Commands.literal('restaurar')
                .executes(ctx => restoreVillageAfterTest(ctx.source.player))
            )
            .executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                p.tell('§6§l✦ COMANDOS DE TESTE DE CERCO TERRITORIAL ✦');
                p.tell('§e/cerco_teste iniciar defensor [segundos] §7- Simula invasão na sua vila (você defende no anel).');
                p.tell('§e/cerco_teste iniciar invasor [segundos] §7- Você age como o atacante (entra no anel para capturar).');
                p.tell('§e/cerco_teste progresso <0-100> §7- Altera a barra de domínio instantaneamente.');
                p.tell('§e/cerco_teste parar §7- Cancela o cerco atual.');
                p.tell('§e/cerco_teste restaurar §7- Devolve o governo e cofre da vila ao dono original após o teste.');
                p.tell('§e/cerco_teste clarim §7- Dá 1x Clarim de Guerra Territorial para teste autêntico com 2 jogadores.');
                return 1;
            })
    );

    // COMANDO DO INTENDENTE DE GUERRA (/intendente)
    event.register(
        Commands.literal('intendente')
            .then(Commands.literal('status')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return showQuartermasterStatus(p);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return showQuartermasterStatus(p);
                }))
            )
            .then(Commands.literal('contratar')
                .then(Commands.argument('pacote', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let pkg = Arguments.STRING.getResult(ctx, 'pacote');
                        return hireSiegeMercenaries(p, pkg);
                    })
                    .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let pkg = Arguments.STRING.getResult(ctx, 'pacote');
                        return hireSiegeMercenaries(p, pkg);
                    }))
                )
            )
            .then(Commands.literal('comprar_clarim')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return buySiegeHornFromQuartermaster(p);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return buySiegeHornFromQuartermaster(p);
                }))
            )
            .executes(ctx => {
                let p = ctx.source.player;
                return showQuartermasterStatus(p);
            })
    );
});

global.getClaimedVillages = () => claimedVillages;
global.getNearestClaimedVillage = (x, z, maxDist) => getNearestVillage(x, z, maxDist);
global.getVillageProsperityInfo = (v) => getProsperityInfo(v);

function applyOfflineCensusCatchup() {
    let now = Date.now();
    let changed = false;
    const CYCLE_MS = 30 * 60 * 1000;
    const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
    const INITIAL_FALLBACK_AT = 1794980054000; // 2026-11-18 02:34:14 BRT

    for (let id in claimedVillages) {
        let v = claimedVillages[id];
        if (!v || !v.ownerUUID) continue;
        let pop = v.population || 0;
        let lastAt = v.lastCensusAt || INITIAL_FALLBACK_AT;
        let elapsed = Math.min(MAX_OFFLINE_MS, Math.max(0, now - lastAt));
        let cycles = Math.floor(elapsed / CYCLE_MS);

        if (cycles >= 1 && !v.ruined && pop >= 5) {
            let pInfo = getProsperityInfo(v);
            let perCycle = calculatePassiveTaxIron(pop, pInfo.taxBonus);
            let offlineIron = Math.floor(perCycle * cycles * 0.5);

            if (offlineIron > 0) {
                creditVillageTreasury(v, offlineIron);
                if (global.econMint) global.econMint('village_census_offline', offlineIron, null);
            }
            let upkeep = calculateVillageUpkeep(v);
            let offlineUpkeep = Math.floor(upkeep.totalIron * cycles * 0.5);
            if (offlineUpkeep > 0) {
                deductVillageUpkeep(v, offlineUpkeep, upkeep.maxDebtIron);
            }
            console.info(`[Soberania] Censo offline (50%): ${v.name} +${offlineIron} Ferro / -${offlineUpkeep} Manutenção (${cycles} ciclos / ~${(cycles * 0.5).toFixed(1)}h).`);
            v.lastCensusAt = now;
            changed = true;
        } else if (!v.lastCensusAt) {
            v.lastCensusAt = now;
            changed = true;
        }
    }
    if (changed) saveVillages();
}

ServerEvents.loaded(() => {
    applyOfflineCensusCatchup();
});
