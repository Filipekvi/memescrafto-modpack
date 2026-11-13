// Banco Central - Memescrafto RPG
// Sistema de Câmbio de Ouro com Controle de Inflação Persistente em JSON (Cotas Diárias + Câmbio Flutuante)
// Utiliza exclusivamente a moeda física do Lightman's Currency

const BANK_DATA_FILE = 'kubejs/data/bank_data.json';

let playerDailyQuotas = {};
let globalGoldSaturation = 0;

function loadBankData() {
    try {
        let data = JsonIO.read(BANK_DATA_FILE);
        if (data) {
            if (data.globalGoldSaturation !== undefined) {
                globalGoldSaturation = Number(data.globalGoldSaturation);
            }
            if (data.playerDailyQuotas) {
                for (let k in data.playerDailyQuotas) {
                    let q = data.playerDailyQuotas[k];
                    playerDailyQuotas[k] = {
                        date: String(q.date || ''),
                        goldExchangedToday: Number(q.goldExchangedToday || 0)
                    };
                }
            }
        }
    } catch (e) {}
}

function saveBankData() {
    try {
        JsonIO.write(BANK_DATA_FILE, {
            globalGoldSaturation: globalGoldSaturation,
            playerDailyQuotas: playerDailyQuotas
        });
    } catch (e) {}
}

loadBankData();

function getTodayString() {
    let d = new Date();
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function getPlayerQuota(uuid) {
    let today = getTodayString();
    let data = playerDailyQuotas[uuid];
    if (!data || data.date !== today) {
        data = { date: today, goldExchangedToday: 0 };
        playerDailyQuotas[uuid] = data;
        saveBankData();
    }
    return data;
}

const BASE_RATE_IRON = 5.0;
const ROYAL_MINT_TAX = 0.10; // 10% de taxa de cunhagem da coroa

function getGlobalMultiplier() {
    let mult = 1.0 - (globalGoldSaturation / 100.0) * 0.05;
    if (mult < 0.50) mult = 0.50;
    return mult;
}

// Decaimento da saturação global a cada 10 minutos
ServerEvents.tick(event => {
    if (event.server.tickCount % 12000 === 0) {
        if (globalGoldSaturation > 0) {
            globalGoldSaturation = Math.max(0, globalGoldSaturation - 50);
            saveBankData();
        }
    }
});

function showBankRates(player) {
    if (!player) return;
    let quota = getPlayerQuota(player.uuid.toString());
    let globalMult = getGlobalMultiplier();
    let currentRate = (BASE_RATE_IRON * globalMult * (1.0 - ROYAL_MINT_TAX)).toFixed(1);

    player.tell('§6§m--------------------------------------------------');
    player.tell('§e§l  🏦 BANCO REAL');
    player.tell('§6§m--------------------------------------------------');
    player.tell(`§fCotação Atual: §6${currentRate} Moedas de Ferro §f/ barra`);
    player.tell(`§fCota Preferencial Restante (100%): §a${Math.max(0, 64 - quota.goldExchangedToday)} barras`);
    player.tell(`§fCota Secundária Restante (50%): §e${Math.max(0, 192 - quota.goldExchangedToday)} barras`);
    player.tell('§6§m--------------------------------------------------');
    player.tell('§7Segure as barras de ouro na mão principal para trocar.');
}

function exchangeGold(player, server) {
    if (!player) return 0;
    let mainHand = player.mainHandItem;

    if (mainHand.id !== 'minecraft:gold_ingot') {
        player.tell('§c[Banco] Segure barras de ouro na mão principal para trocar.');
        return 0;
    }

    let countToExchange = mainHand.count;
    if (countToExchange <= 0) return 0;

    let quota = getPlayerQuota(player.uuid.toString());
    let globalMult = getGlobalMultiplier();

    let totalIronCoinsGross = 0;

    for (let i = 0; i < countToExchange; i++) {
        let currentTotal = quota.goldExchangedToday + i;
        let bracketMult = 1.0;

        if (currentTotal < 64) {
            bracketMult = 1.0;
        } else if (currentTotal < 192) {
            bracketMult = 0.50;
        } else {
            bracketMult = 0.15;
        }

        totalIronCoinsGross += (BASE_RATE_IRON * globalMult * bracketMult);
    }

    let totalIronCoinsNet = Math.round(totalIronCoinsGross * (1.0 - ROYAL_MINT_TAX));
    if (totalIronCoinsNet < 1) totalIronCoinsNet = 1;

    quota.goldExchangedToday += countToExchange;
    globalGoldSaturation += countToExchange;
    saveBankData();

    mainHand.count = 0;

    let goldCoins = Math.floor(totalIronCoinsNet / 10);
    let ironCoins = totalIronCoinsNet % 10;

    if (goldCoins > 0) {
        player.give(Item.of('lightmanscurrency:coin_gold', goldCoins));
    }
    if (ironCoins > 0) {
        player.give(Item.of('lightmanscurrency:coin_iron', ironCoins));
    }

    player.playSound('minecraft:block.bell.use', 1.0, 1.2);
    player.playSound('minecraft:entity.experience_orb.pickup', 1.0, 1.0);

    player.tell('§6§m--------------------------------------------------');
    player.tell('§e§l🏦 BANCO REAL: CÂMBIO REALIZADO');
    player.tell(`§fOuro Entregue: §e${countToExchange}x Barras`);
    player.tell(`§fMoedas Recebidas: §6${goldCoins} Ouro §fe §f${ironCoins} Ferro`);
    player.tell('§6§m--------------------------------------------------');

    return 1;
}

ServerEvents.recipes(event => {
    // Remove receitas de cunhagem/derretimento da Coin Mint Machine para evitar inflação e exploits
    event.remove({ output: 'lightmanscurrency:coin_mint' });
    event.remove({ id: /lightmanscurrency:coin_mint/ });
    event.remove({ type: 'lightmanscurrency:coin_mint' });
});

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

    event.register(
        Commands.literal('banco')
            .then(Commands.literal('cotacao')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    if (p) showBankRates(p);
                    return 1;
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    if (p) showBankRates(p);
                    return 1;
                }))
            )
            .then(Commands.literal('trocar')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return exchangeGold(p, ctx.source.server);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return exchangeGold(p, ctx.source.server);
                }))
            )
            .executes(ctx => {
                let p = getPlayerFromContext(ctx);
                if (p) showBankRates(p);
                return 1;
            })
    );
});
