// =========================================================================
// LIVRO-RAZAO ECONOMICO & INFLACAO (economy_ledger.js)
// =========================================================================
// Modo observacional (somente leitura da economia):
// - Registra emissao (faucets) e destruicao (sinks) de moedas em equivalente
//   de moeda de ferro (1 Ouro = 10 Ferro, 1 Ferro = 1 Ferro, 1 Cobre = 0.1 Ferro).
// - Registra mineracao virgem de ouro e diamante (sem Toque Suave) para evitar
//   falsos positivos de movimentacao em baus.
// - Comando administrativo /economia status (OP nivel 2+) e /economia salvar.
// =========================================================================

const ECONOMY_LEDGER_FILE = 'kubejs/data/economy_ledger.json';
const LEDGER_SAVE_INTERVAL_TICKS = 2400; // 2 minutos

const VIRGIN_ORE_MAP = {
    'minecraft:gold_ore': 'gold_ore',
    'minecraft:deepslate_gold_ore': 'deepslate_gold_ore',
    'minecraft:nether_gold_ore': 'nether_gold_ore',
    'minecraft:diamond_ore': 'diamond_ore',
    'minecraft:deepslate_diamond_ore': 'deepslate_diamond_ore'
};

let economyLedger = {
    startedAt: '',
    totalMintedIron: 0,
    totalSunkIron: 0,
    mintedBySource: {},
    sunkByTarget: {},
    minedResources: {
        gold_ore: 0,
        deepslate_gold_ore: 0,
        nether_gold_ore: 0,
        diamond_ore: 0,
        deepslate_diamond_ore: 0
    },
    dailyHistory: {}
};

let ledgerLoaded = false;
let ledgerDirty = false;
let ledgerTickCounter = 0;

function roundEcon(val) {
    return Math.round((Number(val) || 0) * 100) / 100;
}

function getEconDateKey(daysAgo) {
    let offsetDays = daysAgo || 0;
    let brtMs = Date.now() - (3 * 3600 * 1000) - (offsetDays * 86400 * 1000);
    let d = new Date(brtMs);
    let y = d.getUTCFullYear();
    let m = String(d.getUTCMonth() + 1).padStart(2, '0');
    let day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function ensureDailyBucket(dateKey) {
    if (!economyLedger.dailyHistory[dateKey]) {
        economyLedger.dailyHistory[dateKey] = {
            mintedIron: 0,
            sunkIron: 0,
            minedGold: 0,
            minedDiamond: 0,
            activePlayers: {}
        };
    }
    let b = economyLedger.dailyHistory[dateKey];
    if (!b.activePlayers) b.activePlayers = {};
    return b;
}

function loadEconomyLedger() {
    if (ledgerLoaded) return;
    ledgerLoaded = true;
    try {
        let data = JsonIO.read(ECONOMY_LEDGER_FILE);
        if (data) {
            economyLedger.startedAt = String(data.startedAt || new Date().toISOString());
            economyLedger.totalMintedIron = roundEcon(data.totalMintedIron || 0);
            economyLedger.totalSunkIron = roundEcon(data.totalSunkIron || 0);
            economyLedger.mintedBySource = data.mintedBySource || {};
            economyLedger.sunkByTarget = data.sunkByTarget || {};
            let mr = data.minedResources || {};
            economyLedger.minedResources = {
                gold_ore: Number(mr.gold_ore || 0),
                deepslate_gold_ore: Number(mr.deepslate_gold_ore || 0),
                nether_gold_ore: Number(mr.nether_gold_ore || 0),
                diamond_ore: Number(mr.diamond_ore || 0),
                deepslate_diamond_ore: Number(mr.deepslate_diamond_ore || 0)
            };
            economyLedger.dailyHistory = data.dailyHistory || {};
        } else {
            economyLedger.startedAt = new Date().toISOString();
            ledgerDirty = true;
        }
    } catch (e) {
        console.error('[EconomyLedger] Erro ao carregar economy_ledger.json: ' + e);
        if (!economyLedger.startedAt) economyLedger.startedAt = new Date().toISOString();
    }
}

function saveEconomyLedger(force) {
    if (!ledgerLoaded) return;
    if (!force && !ledgerDirty) return;
    try {
        JsonIO.write(ECONOMY_LEDGER_FILE, economyLedger);
        ledgerDirty = false;
    } catch (e) {
        console.error('[EconomyLedger] Erro ao salvar economy_ledger.json: ' + e);
    }
}

function recordActivePlayer(player) {
    if (!player) return;
    try {
        let uuid = player.uuid ? player.uuid.toString() : null;
        if (!uuid) return;
        let bucket = ensureDailyBucket(getEconDateKey(0));
        if (!bucket.activePlayers[uuid]) {
            bucket.activePlayers[uuid] = true;
            ledgerDirty = true;
        }
    } catch (e) {}
}

global.econCoinsToIron = (gold, iron, copper) => {
    return roundEcon((Number(gold || 0) * 10) + Number(iron || 0) + (Number(copper || 0) * 0.1));
};

global.econMint = (source, ironEq, player) => {
    if (!ledgerLoaded) loadEconomyLedger();
    let amt = roundEcon(ironEq);
    if (amt <= 0) return;

    let srcKey = String(source || 'unknown');
    economyLedger.totalMintedIron = roundEcon(economyLedger.totalMintedIron + amt);
    economyLedger.mintedBySource[srcKey] = roundEcon((economyLedger.mintedBySource[srcKey] || 0) + amt);

    let bucket = ensureDailyBucket(getEconDateKey(0));
    bucket.mintedIron = roundEcon((bucket.mintedIron || 0) + amt);
    if (player) recordActivePlayer(player);

    ledgerDirty = true;
};

global.econSink = (target, ironEq, player) => {
    if (!ledgerLoaded) loadEconomyLedger();
    let amt = roundEcon(ironEq);
    if (amt <= 0) return;

    let tgtKey = String(target || 'unknown');
    economyLedger.totalSunkIron = roundEcon(economyLedger.totalSunkIron + amt);
    economyLedger.sunkByTarget[tgtKey] = roundEcon((economyLedger.sunkByTarget[tgtKey] || 0) + amt);

    let bucket = ensureDailyBucket(getEconDateKey(0));
    bucket.sunkIron = roundEcon((bucket.sunkIron || 0) + amt);
    if (player) recordActivePlayer(player);

    ledgerDirty = true;
};

ServerEvents.loaded(() => {
    loadEconomyLedger();
});

ServerEvents.unloaded(() => {
    saveEconomyLedger(true);
});

ServerEvents.tick(() => {
    ledgerTickCounter++;
    if (ledgerTickCounter >= LEDGER_SAVE_INTERVAL_TICKS) {
        ledgerTickCounter = 0;
        saveEconomyLedger(false);
    }
});

PlayerEvents.loggedIn(event => {
    if (!ledgerLoaded) loadEconomyLedger();
    recordActivePlayer(event.player);
});

BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.creative) return;

    let oreKey = VIRGIN_ORE_MAP[String(event.block.id)];
    if (!oreKey) return;

    let hand = player.mainHandItem;
    let hasSilk = false;
    if (hand && !hand.isEmpty()) {
        try {
            hasSilk = hand.getEnchantmentLevel('minecraft:silk_touch') > 0;
        } catch (e) {
            try {
                if (String(hand.nbt || '').indexOf('silk_touch') !== -1) hasSilk = true;
            } catch (e2) {}
        }
    }
    if (hasSilk) return;

    if (!ledgerLoaded) loadEconomyLedger();
    economyLedger.minedResources[oreKey] = (economyLedger.minedResources[oreKey] || 0) + 1;

    let bucket = ensureDailyBucket(getEconDateKey(0));
    if (oreKey.indexOf('diamond') !== -1) {
        bucket.minedDiamond = (bucket.minedDiamond || 0) + 1;
    } else {
        bucket.minedGold = (bucket.minedGold || 0) + 1;
    }
    recordActivePlayer(player);
    ledgerDirty = true;
});

function formatGoldIron(ironVal) {
    let iron = roundEcon(ironVal);
    let goldEq = (iron / 10).toFixed(1);
    return `${iron} Fe (${goldEq} Ouro)`;
}

function getSortedEntries(obj) {
    let arr = [];
    let keys = Object.keys(obj || {});
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i];
        arr.push({ key: k, val: roundEcon(obj[k]) });
    }
    arr.sort((a, b) => b.val - a.val);
    return arr;
}

function showEconomyStatus(ctx) {
    if (!ledgerLoaded) loadEconomyLedger();

    let sender = ctx.source.player;
    function sendLine(msg) {
        if (sender) {
            sender.tell(msg);
        } else {
            console.info(String(msg).replace(/§[0-9a-fk-or]/gi, ''));
        }
    }

    let minted = roundEcon(economyLedger.totalMintedIron);
    let sunk = roundEcon(economyLedger.totalSunkIron);
    let netSupply = roundEcon(minted - sunk);

    let treasuryIron = 0;
    try {
        if (global.getVillageTreasuryTotalIron) {
            treasuryIron = roundEcon(global.getVillageTreasuryTotalIron());
        }
    } catch (e) {}

    // Escaneia moedas reais nos inventários dos jogadores online
    let onlinePlayerIron = 0;
    try {
        let srv = ctx.source.server;
        if (srv && srv.playerList && srv.playerList.players) {
            srv.playerList.players.forEach(p => {
                if (!p || !p.inventory) return;
                p.inventory.allItems.forEach(st => {
                    if (!st || !st.id) return;
                    let cnt = st.count || 1;
                    if (st.id === 'lightmanscurrency:coin_gold') onlinePlayerIron += cnt * 10;
                    else if (st.id === 'lightmanscurrency:coin_iron') onlinePlayerIron += cnt;
                    else if (st.id === 'lightmanscurrency:coin_copper') onlinePlayerIron += cnt * 0.1;
                });
            });
        }
    } catch (e) {}
    onlinePlayerIron = roundEcon(onlinePlayerIron);
    let observedTotalIron = roundEcon(treasuryIron + onlinePlayerIron);
    let untrackedExternalIron = roundEcon(Math.max(0, observedTotalIron - netSupply));

    let todayKey = getEconDateKey(0);
    let todayBucket = economyLedger.dailyHistory[todayKey] || { mintedIron: 0, sunkIron: 0, activePlayers: {}, minedGold: 0, minedDiamond: 0 };
    let todayNet = roundEcon((todayBucket.mintedIron || 0) - (todayBucket.sunkIron || 0));
    let todayActiveCount = Object.keys(todayBucket.activePlayers || {}).length;

    let active7dMap = {};
    for (let d = 0; d < 7; d++) {
        let b = economyLedger.dailyHistory[getEconDateKey(d)];
        if (b && b.activePlayers) {
            let uuids = Object.keys(b.activePlayers);
            for (let j = 0; j < uuids.length; j++) {
                active7dMap[uuids[j]] = true;
            }
        }
    }
    let active7dCount = Object.keys(active7dMap).length;
    let perCapitaIron = active7dCount > 0 ? roundEcon(netSupply / active7dCount) : netSupply;

    let mr = economyLedger.minedResources || {};
    let totalGoldMined = (mr.gold_ore || 0) + (mr.deepslate_gold_ore || 0) + (mr.nether_gold_ore || 0);
    let totalDiamondMined = (mr.diamond_ore || 0) + (mr.deepslate_diamond_ore || 0);

    let topFaucets = getSortedEntries(economyLedger.mintedBySource);
    let topSinks = getSortedEntries(economyLedger.sunkByTarget);

    sendLine('§6§m==================================================');
    sendLine('§e§l📊 LIVRO-RAZÃO ECONÔMICO (MODO OBSERVACIONAL)');
    sendLine(`§7Base: 1 Ouro = 10 Ferro | 1 Cobre = 0.1 Ferro | Hoje: §f${todayKey}`);
    sendLine('§6§m--------------------------------------------------');
    sendLine(`§a(+) Emissão Scripts (Faucets): §f${formatGoldIron(minted)}`);
    sendLine(`§c(-) Queima Scripts (Sinks):    §f${formatGoldIron(sunk)}`);
    sendLine(`§e(=) Saldo Líquido (Scripts):   §l§f${formatGoldIron(netSupply)}`);
    sendLine(`§7    ├─ Cofres de Vilas Ativos: §f${formatGoldIron(treasuryIron)}`);
    sendLine(`§7    ├─ Bolso Players Online:   §f${formatGoldIron(onlinePlayerIron)}`);
    if (untrackedExternalIron > 0) {
        sendLine(`§7    └─ Fontes Externas/Drops:  §a+${formatGoldIron(untrackedExternalIron)} §8(loot mobs/pré-ledger)`);
    }
    sendLine('§6§m--------------------------------------------------');
    sendLine(`§bFluxo Hoje (${todayKey}): §a+${roundEcon(todayBucket.mintedIron || 0)} Fe §7/ §c-${roundEcon(todayBucket.sunkIron || 0)} Fe §7(Saldo: §f${todayNet >= 0 ? '+' : ''}${todayNet} Fe§7)`);
    sendLine(`§bJogadores Únicos: §f${todayActiveCount} hoje §7| §f${active7dCount} nos últimos 7d`);
    sendLine(`§bLiquidez Per Capita (7d): §e${formatGoldIron(perCapitaIron)} / jogador`);
    sendLine('§6§m--------------------------------------------------');
    sendLine(`§6Minérios Virgens Minerados: §e${totalGoldMined} Ouro §7(${mr.nether_gold_ore || 0} Nether) | §b${totalDiamondMined} Diamante`);
    if (topFaucets.length > 0) {
        let fText = topFaucets.slice(0, 4).map(e => `§f${e.key}§7(${e.val} Fe)`).join(', ');
        sendLine(`§aTop Fontes: ${fText}`);
    }
    if (topSinks.length > 0) {
        let sText = topSinks.slice(0, 4).map(e => `§f${e.key}§7(${e.val} Fe)`).join(', ');
        sendLine(`§cTop Sumidouros: ${sText}`);
    }
    sendLine('§6§m==================================================');
    return 1;
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('economia')
            .requires(src => src.hasPermission(2))
            .then(Commands.literal('status')
                .executes(ctx => showEconomyStatus(ctx))
            )
            .then(Commands.literal('salvar')
                .executes(ctx => {
                    saveEconomyLedger(true);
                    if (ctx.source.player) {
                        ctx.source.player.tell('§a[Economia] economy_ledger.json salvo no disco.');
                    } else {
                        console.info('[EconomyLedger] economy_ledger.json salvo no disco.');
                    }
                    return 1;
                })
            )
            .executes(ctx => showEconomyStatus(ctx))
    );
});

