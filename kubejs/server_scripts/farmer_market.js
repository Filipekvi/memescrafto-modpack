// =========================================================================
// MERCADO AGRICOLA - MODELO HIBRIDO (farmer_market.js)
// =========================================================================
// - Compra de sementes: via Trade nativo do Easy NPC (OPEN_TRADING_SCREEN).
// - Venda de caixas/sacos do Farmer's Delight: via /fazendeiro vender,
//   com cota diaria anti-farm (64 caixas/dia), imposto territorial para
//   a vila local e registro no economy_ledger.js.
// =========================================================================

const FARMER_MARKET_FILE = 'kubejs/data/farmer_market_state.json';
const DAILY_CRATE_LIMIT = 64;

const CRATE_PRICES_COPPER = {
    'farmersdelight:cabbage_crate':  { name: 'Caixa de Repolho',   copper: 4 },
    'farmersdelight:tomato_crate':   { name: 'Caixa de Tomate',    copper: 4 },
    'farmersdelight:onion_crate':    { name: 'Caixa de Cebola',    copper: 4 },
    'farmersdelight:rice_bag':       { name: 'Saco de Arroz',      copper: 4 },
    'farmersdelight:carrot_crate':   { name: 'Caixa de Cenoura',   copper: 3 },
    'farmersdelight:potato_crate':   { name: 'Caixa de Batata',    copper: 3 },
    'farmersdelight:beetroot_crate': { name: 'Caixa de Beterraba', copper: 3 }
};

let farmerState = {
    lastDate: '',
    players: {}
};
let farmerLoaded = false;

function getFarmerTodayKey() {
    let brtMs = Date.now() - (3 * 3600 * 1000);
    let d = new Date(brtMs);
    let y = d.getUTCFullYear();
    let m = String(d.getUTCMonth() + 1).padStart(2, '0');
    let day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function loadFarmerState() {
    if (farmerLoaded) return;
    farmerLoaded = true;
    try {
        let data = JsonIO.read(FARMER_MARKET_FILE);
        if (data) {
            farmerState.lastDate = String(data.lastDate || '');
            farmerState.players = data.players || {};
        }
    } catch (e) {
        console.error('[FarmerMarket] Erro ao carregar farmer_market_state.json: ' + e);
    }
}

function saveFarmerState() {
    try {
        JsonIO.write(FARMER_MARKET_FILE, farmerState);
    } catch (e) {
        console.error('[FarmerMarket] Erro ao salvar farmer_market_state.json: ' + e);
    }
}

function getPlayerSoldToday(player) {
    if (!farmerLoaded) loadFarmerState();
    let today = getFarmerTodayKey();
    if (farmerState.lastDate !== today) {
        farmerState.lastDate = today;
        farmerState.players = {};
        saveFarmerState();
    }
    let uuid = player.uuid.toString();
    return Number(farmerState.players[uuid] || 0);
}

function showFarmerPrices(player) {
    if (!player) return 0;
    let sold = getPlayerSoldToday(player);
    let remaining = Math.max(0, DAILY_CRATE_LIMIT - sold);

    player.tell('§6§m==================================================');
    player.tell('§a§l🌾 FEIRANTE AGRÍCOLA — TABELA DE COMPRA');
    player.tell('§7Traga caixas/sacos de colheita (Farmer\'s Delight):');
    player.tell('§f• Repolho, Tomate, Cebola, Arroz: §e4 Cobre §7/ caixa');
    player.tell('§f• Cenoura, Batata, Beterraba:       §e3 Cobre §7/ caixa');
    player.tell(`§bSua cota hoje: §f${sold}/${DAILY_CRATE_LIMIT} caixas §7(Restam: §a${remaining}§7)`);
    player.tell('§8Sementes são vendidas direto na aba "Comprar Sementes".');
    player.tell('§6§m==================================================');
    return 1;
}

function sellFarmerCrates(player) {
    if (!player) return 0;
    if (global.isPlayerNearNpc && !global.isPlayerNearNpc(player, ['Feirante', 'Fazendeiro', 'Agrícola'], 12)) {
        player.tell('§c[Feirante] Você precisa estar perto do Feirante Agrícola para vender suas caixas!');
        return 0;
    }

    let soldToday = getPlayerSoldToday(player);
    let remainingQuota = Math.max(0, DAILY_CRATE_LIMIT - soldToday);
    if (remainingQuota <= 0) {
        player.tell(`§c[Feirante] O estoque de compra para você hoje (§e${DAILY_CRATE_LIMIT} caixas§c) já lotou! Volte amanhã.`);
        player.playSound('minecraft:entity.villager.no', 1.0, 0.9);
        return 0;
    }

    let totalCrates = 0;
    let totalCopper = 0;
    let inv = player.inventory;

    for (let i = 0; i < inv.containerSize; i++) {
        if (remainingQuota <= 0) break;
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let cfg = CRATE_PRICES_COPPER[String(st.id)];
        if (!cfg) continue;

        let take = Math.min(st.count, remainingQuota);
        if (take > 0) {
            st.count -= take;
            remainingQuota -= take;
            totalCrates += take;
            totalCopper += (take * cfg.copper);
        }
    }

    if (totalCrates <= 0) {
        player.tell('§e[Feirante] Você não tem nenhuma caixa ou saco de colheita no inventário.');
        player.playSound('minecraft:entity.villager.ambient', 1.0, 1.0);
        return 0;
    }

    farmerState.players[player.uuid.toString()] = soldToday + totalCrates;
    saveFarmerState();

    let ironCoins = Math.floor(totalCopper / 10);
    let copperCoins = totalCopper % 10;
    if (ironCoins > 0) player.give(Item.of('lightmanscurrency:coin_iron', ironCoins));
    if (copperCoins > 0) player.give(Item.of('lightmanscurrency:coin_copper', copperCoins));

    let ironEq = Math.round(totalCopper * 10) / 100; // totalCopper * 0.1
    if (global.econMint) global.econMint('farmer_market', ironEq, player);

    let taxInfo = null;
    if (global.recordVillageTax && ironEq >= 1) {
        taxInfo = global.recordVillageTax(player.x, player.z, ironEq);
    }

    player.playSound('minecraft:entity.experience_orb.pickup', 1.0, 1.2);
    player.tell('§6§m--------------------------------------------------');
    player.tell('§a§l🌾 VENDA AGRÍCOLA CONCLUÍDA!');
    player.tell(`§fCaixas Entregues: §e${totalCrates}x §7(Cota hoje: ${soldToday + totalCrates}/${DAILY_CRATE_LIMIT})`);
    player.tell(`§fPagamento: §f${ironCoins} Ferro §fe §6${copperCoins} Cobre`);
    if (taxInfo) {
        player.tell(`§7[Imposto Territorial] +${taxInfo.taxIron} Ferro recolhido para o cofre de ${taxInfo.party}!`);
    }
    player.tell('§6§m--------------------------------------------------');
    return 1;
}

ServerEvents.loaded(() => {
    loadFarmerState();
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function getTargetPlayer(ctx) {
        let player = null;
        try {
            let targetName = Arguments.STRING.getResult(ctx, 'target');
            player = ctx.source.server.getPlayer(targetName);
        } catch (e) {}
        if (!player) player = ctx.source.player;
        return player;
    }

    event.register(
        Commands.literal('fazendeiro')
            .then(Commands.literal('vender')
                .executes(ctx => sellFarmerCrates(getTargetPlayer(ctx)))
                .then(Commands.argument('target', Arguments.STRING.create(event))
                    .executes(ctx => sellFarmerCrates(getTargetPlayer(ctx)))
                )
            )
            .then(Commands.literal('tabela')
                .executes(ctx => showFarmerPrices(getTargetPlayer(ctx)))
                .then(Commands.argument('target', Arguments.STRING.create(event))
                    .executes(ctx => showFarmerPrices(getTargetPlayer(ctx)))
                )
            )
            .executes(ctx => showFarmerPrices(getTargetPlayer(ctx)))
    );
});
