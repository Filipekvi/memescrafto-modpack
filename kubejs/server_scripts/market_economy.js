// Sistema de Cotação Dinâmica (Bolsa de Valores de Cargas) & Entrega de Fardos
// Economia dinâmica baseada em Oferta & Demanda, Distância e Autenticidade de Bioma

const MARKET_FILE = 'kubejs/data/market_saturation.json';

let marketSaturation = {
    planicie: 0,
    floresta: 0,
    deserto: 0,
    tundra: 0,
    selva: 0,
    pantano: 0,
    badlands: 0,
    oceano: 0,
    montanha: 0,
    cerejeira: 0,
    nether: 0,
    end: 0
};

function loadMarketData() {
    try {
        let data = JsonIO.read(MARKET_FILE);
        if (data) {
            for (let k in marketSaturation) {
                if (data[k] !== undefined) marketSaturation[k] = Number(data[k]);
            }
        }
    } catch (e) {}
}

function saveMarketData() {
    try {
        JsonIO.write(MARKET_FILE, marketSaturation);
    } catch (e) {}
}

loadMarketData();

// Nomes e descrições dos biomas e dimensões
const BIOME_INFO = {
    planicie:  { name: 'Planícies',            item: 'kubejs:fardo_planicie',  cat: 'kubejs:catalisador_planicie',  baseCoin: 12 },
    floresta:  { name: 'Floresta',             item: 'kubejs:fardo_floresta',  cat: 'kubejs:catalisador_floresta',  baseCoin: 14 },
    deserto:   { name: 'Deserto',              item: 'kubejs:fardo_deserto',   cat: 'kubejs:catalisador_deserto',   baseCoin: 18 },
    tundra:    { name: 'Tundra Congelada',     item: 'kubejs:fardo_tundra',    cat: 'kubejs:catalisador_tundra',    baseCoin: 22 },
    selva:     { name: 'Selva Tropical',       item: 'kubejs:fardo_selva',     cat: 'kubejs:catalisador_selva',     baseCoin: 20 },
    pantano:   { name: 'Pântano Profundo',     item: 'kubejs:fardo_pantano',   cat: 'kubejs:catalisador_pantano',   baseCoin: 18 },
    badlands:  { name: 'Terras Ermas (Mesa)',  item: 'kubejs:fardo_badlands',  cat: 'kubejs:catalisador_badlands',  baseCoin: 24 },
    oceano:    { name: 'Oceano / Alto-Mar',    item: 'kubejs:fardo_oceano',    cat: 'kubejs:catalisador_oceano',    baseCoin: 26 },
    montanha:  { name: 'Picos Nevados',        item: 'kubejs:fardo_montanha',  cat: 'kubejs:catalisador_montanha',  baseCoin: 25 },
    cerejeira: { name: 'Bosque de Cerejeiras', item: 'kubejs:fardo_cerejeira', cat: 'kubejs:catalisador_cerejeira', baseCoin: 22 },
    nether:    { name: 'Profundezas do Nether',item: 'kubejs:fardo_nether',    cat: 'kubejs:catalisador_nether',    baseCoin: 28 },
    end:       { name: 'Vazio Astral do End',  item: 'kubejs:fardo_end',       cat: 'kubejs:catalisador_end',       baseCoin: 34 }
};

// "Contrato Real da Hora" — 2 Biomas em Alta Demanda (+35% de bônus) sorteados a cada 60 minutos
let royalContractBiomes = ['deserto', 'selva'];

function rollNewRoyalContracts(server) {
    let keys = Object.keys(BIOME_INFO);
    let idx1 = Math.floor(Math.random() * keys.length);
    let idx2 = Math.floor(Math.random() * keys.length);
    while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * keys.length);
    }
    royalContractBiomes = [keys[idx1], keys[idx2]];

    if (server) {
        let b1 = BIOME_INFO[royalContractBiomes[0]].name;
        let b2 = BIOME_INFO[royalContractBiomes[1]].name;
        server.tell('§6§m----------------------------------------');
        server.tell('§e§l📣 [CONTRATO REAL DA HORA] §6§l(+35% LUCRO)');
        server.tell(`§fA Guilda Mercante abriu incentivo para cargas autênticas de:`);
        server.tell(` §a✦ §e§l${b1} §7e §e§l${b2}`);
        server.tell('§7Consulte as cotações a qualquer momento com §a/mercado§7!');
        server.tell('§6§m----------------------------------------');
    }
}

// Inicializa um sorteio ao carregar o script
rollNewRoyalContracts(null);

function isRoyalContractBiome(biomeKey) {
    return royalContractBiomes.indexOf(biomeKey) !== -1;
}

function getDemandPercentage(biomeKey) {
    let sat = marketSaturation[biomeKey] || 0;
    let rate = 150 - (sat * 10);
    if (rate < 50) rate = 50;
    if (isRoyalContractBiome(biomeKey)) {
        rate += 35;
    }
    return rate;
}

// Decadência de saturação a cada 5 minutos e Sorteio de Contrato Real a cada 60 minutos (72000 ticks)
ServerEvents.tick(event => {
    let tc = event.server.tickCount;
    if (tc > 0 && tc % 6000 === 0) {
        let changed = false;
        for (let key in marketSaturation) {
            if (marketSaturation[key] > 0) {
                marketSaturation[key]--;
                changed = true;
            }
        }
        if (changed) saveMarketData();
    }
    if (tc > 0 && tc % 72000 === 0) {
        rollNewRoyalContracts(event.server);
    }
});

function showCotacao(player) {
    if (!player) return;
    let b1 = BIOME_INFO[royalContractBiomes[0]].name;
    let b2 = BIOME_INFO[royalContractBiomes[1]].name;

    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lBOLSA DE CARGAS DA GUILDA §6§l✦');
    player.tell(`§6📣 Contrato Real (+35%): §a${b1} §7& §a${b2}`);
    player.tell('§6§m----------------------------------------');

    for (let key in BIOME_INFO) {
        let info = BIOME_INFO[key];
        let rate = getDemandPercentage(key);
        let isContract = isRoyalContractBiome(key);
        let color = isContract ? '§b' : (rate >= 120 ? '§a' : (rate >= 80 ? '§e' : '§c'));
        let status = isContract ? '§b[★ CONTRATO +35%]' : (rate >= 120 ? '§a[ALTA]' : (rate >= 80 ? '§e[ESTÁVEL]' : '§c[SATURADO]'));
        player.tell(` ${color}▪ §f${info.name}: ${color}${rate}% ${status}`);
    }
    player.tell('§6§m----------------------------------------');
}

function processPackDelivery(player, server) {
    if (!player) return 0;
    let mainHand = player.mainHandItem;
    let foundKey = null;

    for (let key in BIOME_INFO) {
        if (mainHand.id === BIOME_INFO[key].item) {
            foundKey = key;
            break;
        }
    }

    if (!foundKey) {
        player.tell('§c[Guilda Mercante] Segure um Fardo de Mercadoria na mão principal para entregar!');
        return 0;
    }

    let info = BIOME_INFO[foundKey];
    let tag = mainHand.nbt;
    let origX = (tag && tag.contains('originX')) ? tag.getInt('originX') : player.x;
    let origZ = (tag && tag.contains('originZ')) ? tag.getInt('originZ') : player.z;
    let isSynthetic = (tag && tag.contains('synthetic')) ? tag.getBoolean('synthetic') : false;
    let hasDimBonus = (tag && tag.contains('dimensionalBonus')) ? tag.getBoolean('dimensionalBonus') : false;

    // Cálculo de distância euclidiana da origem até a entrega
    let dx = player.x - origX;
    let dz = player.z - origZ;
    let dist = Math.round(Math.sqrt(dx * dx + dz * dz));
    if (hasDimBonus) {
        dist += 500; // Bônus fixo de risco dimensional para cargas legítimas do Nether/End
    }

    // Multiplicador de distância: +0.15x a cada 100 blocos (teto de 4.5x)
    let distMult = 1.0 + (dist / 1000.0) * 1.5;
    if (distMult > 4.5) distMult = 4.5;

    // Multiplicador de demanda (50% a 150%)
    let demandRate = getDemandPercentage(foundKey);
    let demandMult = demandRate / 100.0;

    // Penalidade de Fardo Sintético (-60% se fabricado fora do bioma nativo)
    let authMult = isSynthetic ? 0.40 : 1.0;

    // Bônus de Metrópole Real (Nível 3 de Prosperidade da Vila = +10% de pagamento)
    let nearVillage = global.getNearestVillage ? global.getNearestVillage(player.x, player.z, 160) : null;
    let metropolisMult = (nearVillage && (nearVillage.taxGold || 0) >= 150) ? 1.10 : 1.0;

    // Pagamento final em moedas de ferro
    let totalIronCoins = Math.round(info.baseCoin * distMult * demandMult * authMult * metropolisMult);
    if (totalIronCoins < 1) totalIronCoins = 1;

    // Remove 1 fardo da mão
    mainHand.count--;

    let goldCoins = Math.floor(totalIronCoins / 10);
    let ironCoins = totalIronCoins % 10;

    if (goldCoins > 0) {
        player.give(Item.of('lightmanscurrency:coin_gold', goldCoins));
    }
    if (ironCoins > 0) {
        player.give(Item.of('lightmanscurrency:coin_iron', ironCoins));
    }

    // Entrega Catalisador de Bioma (Apenas para cargas autênticas com pelo menos 150 blocos de viagem!)
    let earnedCatalyst = (!isSynthetic && dist >= 150);
    if (earnedCatalyst) {
        player.give(Item.of(info.cat, 1));
    }

    marketSaturation[foundKey] = (marketSaturation[foundKey] || 0) + 1;
    saveMarketData();

    player.playSound('minecraft:entity.player.levelup', 1.0, 1.0);
    player.playSound('minecraft:entity.experience_orb.pickup', 1.0, 1.2);

    player.tell('§a§l==================================================');
    player.tell('§6§l🏛️ GUILDA MERCANTE: CARGA ENTREGUE COM SUCESSO!');
    player.tell(`§fMercadoria: §e${info.name} ${isSynthetic ? '§c[Carga Sintética -60%]' : '§a[Autêntica]'}`);
    player.tell(`§fDistância Contabilizada: §b${dist} blocos §7(Mult: ${(distMult).toFixed(2)}x)`);
    player.tell(`§fCotação da Bolsa: §e${demandRate}%`);
    if (metropolisMult > 1.0) {
        player.tell(`§b[Bônus de Metrópole Real] §a+10% de lucro comercial em ${nearVillage.name}!`);
    }
    player.tell(`§fPagamento: §6${goldCoins} Moedas de Ouro §fe §f${ironCoins} Moedas de Ferro!`);
    if (earnedCatalyst) {
        player.tell(`§fRecompensa Especial: §d1x ${Item.of(info.cat).displayName.string}`);
    } else if (isSynthetic) {
        player.tell('§cNota: Cargas sintéticas não concedem Catalisador Elemental.');
    } else {
        player.tell('§7Nota: Viagens curtas (<150m) não concedem Catalisador Elemental.');
    }

    // Recolhimento de taxa regional para o cofre da facção dona da vila
    if (global.recordVillageTax) {
        let tax = global.recordVillageTax(player.x, player.z, totalIronCoins);
        if (tax) {
            player.tell(`§7[Imposto Territorial] Taxa comercial recolhida para o cofre de ${tax.party}!`);
        }
    }

    player.tell('§a§l==================================================');

    if (dist >= 1000 && server) {
        let destName = (nearVillage && nearVillage.name) ? nearVillage.name : 'um entreposto comercial';
        server.tell(`§6[Bolsa Mercante] §e${player.name.string} §ftransportou uma caravana de §e${info.name} §fpor §b${dist} blocos §fe faturou alto em §a${destName}§f!`);
    }

    return 1;
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function getTargetOrSender(ctx) {
        let player = null;
        try {
            let targetName = Arguments.STRING.getResult(ctx, 'target');
            player = ctx.source.server.getPlayer(targetName);
        } catch (e) {}
        if (!player) player = ctx.source.player;
        if (player && global.isPlayerNearNpc && !global.isPlayerNearNpc(player, ['Guilda', 'Inspetor'], 12)) {
            player.tell('§c[Guilda Mercante] Você precisa falar pessoalmente com o Inspetor da Guilda Mercante!');
            return null;
        }
        return player;
    }

    event.register(
        Commands.literal('cotacao')
            .executes(ctx => {
                let p = getTargetOrSender(ctx);
                if (!p) return 0;
                showCotacao(p);
                return 1;
            })
            .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                let p = getTargetOrSender(ctx);
                if (!p) return 0;
                showCotacao(p);
                return 1;
            }))
    );

    event.register(
        Commands.literal('mercado')
            .executes(ctx => {
                let p = getTargetOrSender(ctx);
                if (!p) return 0;
                showCotacao(p);
                return 1;
            })
    );

    event.register(
        Commands.literal('entregar_fardo')
            .executes(ctx => {
                let p = getTargetOrSender(ctx);
                if (!p) return 0;
                return processPackDelivery(p, ctx.source.server);
            })
            .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                let p = getTargetOrSender(ctx);
                return processPackDelivery(p, ctx.source.server);
            }))
    );
});
