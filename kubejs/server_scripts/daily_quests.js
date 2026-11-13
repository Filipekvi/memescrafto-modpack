// =========================================================================
// SISTEMA DE CONTRATOS DIÁRIOS DA COROA (daily_quests.js)
// =========================================================================
// Rotação diária procedural (sem repetição de véspera), sem referências técnicas a mods,
// com persistência estrita em JSON (progresso de abates e conclusões por jogador).
// =========================================================================

const DAILY_QUESTS_FILE = 'kubejs/data/daily_quests_state.json';

// Estrutura de persistência:
// {
//   lastDate: "YYYY-MM-DD",
//   todaysQuests: [ { id, category, title, desc, reqType, reqTarget, reqCount, rewardIron, rewardGold, rewardTokens } ],
//   yesterdayQuests: [ id1, id2, id3 ],
//   players: {
//     uuid: {
//       date: "YYYY-MM-DD",
//       completed: [ id1, ... ],
//       progress: { huntCount: 0 }
//     }
//   }
// }
let dailyState = {
    lastDate: '',
    todaysQuests: [],
    yesterdayQuests: [],
    players: {}
};

function loadDailyState() {
    try {
        let data = JsonIO.read(DAILY_QUESTS_FILE);
        if (data) {
            dailyState.lastDate = String(data.lastDate || '');
            dailyState.todaysQuests = data.todaysQuests || [];
            dailyState.yesterdayQuests = data.yesterdayQuests || [];
            dailyState.players = data.players || {};
        }
    } catch (e) {
        console.error('[Quests] Erro ao carregar daily_quests_state.json: ' + e);
    }
}

function saveDailyState() {
    try {
        JsonIO.write(DAILY_QUESTS_FILE, dailyState);
    } catch (e) {
        console.error('[Quests] Erro ao salvar daily_quests_state.json: ' + e);
    }
}

loadDailyState();

function getBrasiliaDateString() {
    let now = new Date();
    // UTC - 3h
    let brTime = new Date(now.getTime() - (3 * 3600 * 1000));
    let y = brTime.getUTCFullYear();
    let m = brTime.getUTCMonth() + 1;
    let d = brTime.getUTCDate();
    return `${y}-${m < 10 ? '0' + m : m}-${d < 10 ? '0' + d : d}`;
}

// -------------------------------------------------------------------------
// CATÁLOGO DE CONTRATOS (SEM REFERÊNCIAS A NOMES DE MODS)
// -------------------------------------------------------------------------

// Categoria 1: Rotas e Caravanas Comerciais
const CARAVAN_POOL = [
    {
        id: 'caravan_badlands',
        category: 'caravana',
        title: 'Suprimentos das Terras Ermas',
        desc: 'A Capital necessita de terracota e minerais raros do cânion.',
        reqType: 'item',
        reqTarget: 'kubejs:fardo_badlands',
        reqCount: 1,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'caravan_selva',
        category: 'caravana',
        title: 'Carga Exótica da Selva',
        desc: 'Entregue bambu, cacau e melancias colhidos em biomas tropicais.',
        reqType: 'item',
        reqTarget: 'kubejs:fardo_selva',
        reqCount: 1,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'caravan_tundra',
        category: 'caravana',
        title: 'Remessa Glacial do Norte',
        desc: 'Traga gelo compacto e peles das montanhas congeladas.',
        reqType: 'item',
        reqTarget: 'kubejs:fardo_tundra',
        reqCount: 1,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'caravan_pantano',
        category: 'caravana',
        title: 'Extratos das Águas Turvas',
        desc: 'Entregue lodo, argila e vitórias-régias das regiões pantanosas.',
        reqType: 'item',
        reqTarget: 'kubejs:fardo_pantano',
        reqCount: 1,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'caravan_oceano',
        category: 'caravana',
        title: 'Carga Naval em Alto-Mar',
        desc: 'Transporte prismarinho e peixes nobres pescados no oceano.',
        reqType: 'item',
        reqTarget: 'kubejs:fardo_oceano',
        reqCount: 1,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'caravan_deserto',
        category: 'caravana',
        title: 'Especiarias das Dunas',
        desc: 'Traga cactos purificados, vidros e arenito dos desertos escaldantes.',
        reqType: 'item',
        reqTarget: 'kubejs:fardo_deserto',
        reqCount: 1,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    }
];

// Categoria 2: Caçada e Patrulha de Fronteira
const HUNT_POOL = [
    {
        id: 'hunt_legionarios',
        category: 'cacada',
        title: 'Pacificação dos Legionários',
        desc: 'Abata 6 Legionários blindados que sitiam as estradas do reino.',
        reqType: 'kill',
        reqTarget: 'takesapillage:legioner',
        reqCount: 6,
        rewardIron: 30,
        rewardGold: 1,
        rewardTokens: 3
    },
    {
        id: 'hunt_escaramucadores',
        category: 'cacada',
        title: 'Emboscada aos Saqueadores Ágeis',
        desc: 'Derrote 6 Escaramuçadores que atacam carroças comerciais.',
        reqType: 'kill',
        reqTarget: 'takesapillage:skirmisher',
        reqCount: 6,
        rewardIron: 28,
        rewardGold: 1,
        rewardTokens: 3
    },
    {
        id: 'hunt_arqueiros',
        category: 'cacada',
        title: 'Eliminação de Arqueiros Renegados',
        desc: 'Neutralize 6 Arqueiros Saqueadores em seus acampamentos fortificados.',
        reqType: 'kill',
        reqTarget: 'takesapillage:archer',
        reqCount: 6,
        rewardIron: 25,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'hunt_pillagers_geral',
        category: 'cacada',
        title: 'Patrulha das Fronteiras Reais',
        desc: 'Abata 8 Saqueadores ou Invasores que ameaçam as vilas vizinhas.',
        reqType: 'kill_any_raider',
        reqTarget: 'raiders',
        reqCount: 8,
        rewardIron: 30,
        rewardGold: 1,
        rewardTokens: 3
    }
];

// Categoria 3: Provisões, Culinária & Fornecimento
const PROVISION_POOL = [
    {
        id: 'prov_burgers',
        category: 'provisao',
        title: 'Refeições Fortificantes para a Guarda',
        desc: 'Entregue 4 Hambúrgueres ou Sanduíches de carne fresca.',
        reqType: 'item',
        reqTarget: 'farmersdelight:hamburger',
        reqCount: 4,
        rewardIron: 20,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'prov_stew',
        category: 'provisao',
        title: 'Panelas de Ensopado Farto',
        desc: 'Entregue 2 Tigelas de Ensopado de Carne e Legumes para a estalagem.',
        reqType: 'item',
        reqTarget: 'farmersdelight:beef_stew',
        reqCount: 2,
        rewardIron: 22,
        rewardGold: 1,
        rewardTokens: 2
    },
    {
        id: 'prov_beer',
        category: 'provisao',
        title: 'Barris para a Taverna Real',
        desc: 'Entregue 2 Canecas de Cerveja ou Hidromel Fermentado.',
        reqType: 'item',
        reqTarget: 'brewinandchewin:beer',
        reqCount: 2,
        rewardIron: 24,
        rewardGold: 1,
        rewardTokens: 3
    },
    {
        id: 'prov_bread',
        category: 'provisao',
        title: 'Pão para os Viajantes',
        desc: 'Entregue 16 Pães artesanais assados para abastecer a praça.',
        reqType: 'item',
        reqTarget: 'minecraft:bread',
        reqCount: 16,
        rewardIron: 18,
        rewardGold: 0,
        rewardTokens: 2
    },
    {
        id: 'prov_mead',
        category: 'provisao',
        title: 'Reserva Nobre de Hidromel',
        desc: 'Entregue 2 Canecas de Hidromel Envelhecido.',
        reqType: 'item',
        reqTarget: 'brewinandchewin:mead',
        reqCount: 2,
        rewardIron: 26,
        rewardGold: 1,
        rewardTokens: 3
    }
];

// Helper seguro para listas carregadas via JsonIO (Rhino compatível)
function listContains(list, item) {
    if (!list) return false;
    for (let i = 0; i < list.length; i++) {
        if (String(list[i]) === String(item)) return true;
    }
    return false;
}

// Sorteador determinístico baseado na data para rotação justa e compartilhada
function pickRandomExcluding(pool, excludeIds, dateSeedStr) {
    let available = pool.filter(q => !listContains(excludeIds, q.id));
    if (available.length === 0) available = pool;

    let hash = 0;
    for (let i = 0; i < dateSeedStr.length; i++) {
        hash = (hash * 31 + dateSeedStr.charCodeAt(i)) & 0x7FFFFFFF;
    }
    let idx = hash % available.length;
    return available[idx];
}

function updateDailyQuestsIfNeeded() {
    let today = getBrasiliaDateString();
    if (dailyState.lastDate !== today || !dailyState.todaysQuests || dailyState.todaysQuests.length < 3) {
        let prevIds = (dailyState.todaysQuests || []).map(q => q.id);

        let q1 = pickRandomExcluding(CARAVAN_POOL, prevIds, today + '_caravan');
        let q2 = pickRandomExcluding(HUNT_POOL, prevIds, today + '_hunt');
        let q3 = pickRandomExcluding(PROVISION_POOL, prevIds, today + '_prov');

        dailyState.yesterdayQuests = prevIds;
        dailyState.todaysQuests = [ q1, q2, q3 ];
        dailyState.lastDate = today;

        saveDailyState();
        console.log(`[Quests] Novos contratos do dia gerados para ${today}: ${q1.id}, ${q2.id}, ${q3.id}`);
    }
}

updateDailyQuestsIfNeeded();

function getPlayerQuestProfile(player) {
    let today = getBrasiliaDateString();
    let u = player.uuid.toString();
    dailyState.players[u] = dailyState.players[u] || { date: today, completed: [], progress: {} };

    let prof = dailyState.players[u];
    if (prof.date !== today) {
        prof.date = today;
        prof.completed = [];
        prof.progress = {};
        saveDailyState();
    }
    return prof;
}

// -------------------------------------------------------------------------
// RASTREAMENTO DE CAÇADA / ABATES (PERSISTENTE EM DISCO)
// -------------------------------------------------------------------------
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity) return;

    let killer = event.source ? event.source.actual : null;
    if (!killer || !killer.isPlayer()) return;

    updateDailyQuestsIfNeeded();

    let eType = String(entity.type);
    let huntQuest = dailyState.todaysQuests.find(q => q.category === 'cacada');
    if (!huntQuest) return;

    let prof = getPlayerQuestProfile(killer);
    if (listContains(prof.completed, huntQuest.id)) return;

    let match = false;
    if (huntQuest.reqType === 'kill' && eType === huntQuest.reqTarget) {
        match = true;
    } else if (huntQuest.reqType === 'kill_any_raider') {
        if (eType.includes('takesapillage:') || eType.includes('pillager') || eType.includes('vindicator')) {
            match = true;
        }
    }

    if (match) {
        prof.progress[huntQuest.id] = (prof.progress[huntQuest.id] || 0) + 1;
        saveDailyState();

        let cur = prof.progress[huntQuest.id];
        let req = huntQuest.reqCount;
        if (cur <= req) {
            killer.tell(`§6[Contrato de Caça] §fProgresso: §e${cur}/${req} §7(${huntQuest.title})`);
            if (cur === req) {
                killer.tell('§a§l✔ Contrato de Caça Concluído! §fRetorne ao Quadro de Avisos na Capital para resgatar sua recompensa.');
                killer.playSound('minecraft:entity.experience_orb.pickup', 1.0, 1.2);
            }
        }
    }
});

// -------------------------------------------------------------------------
// INTERAÇÃO E RESGATE DE CONTRATOS
// -------------------------------------------------------------------------
function countPlayerItems(player, itemId) {
    let count = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === itemId) count += i.count;
    });
    return count;
}

function removePlayerItems(player, itemId, amount) {
    let rem = amount;
    player.inventory.allItems.forEach(i => {
        if (i.id === itemId && rem > 0) {
            let take = Math.min(i.count, rem);
            i.count -= take;
            rem -= take;
        }
    });
}

function claimDailyContract(player, questIndex) {
    if (!player) return 0;
    if (global.isPlayerNearNpc && !global.isPlayerNearNpc(player, ['Arauto', 'Avisos'], 12)) {
        player.tell('§c[Avisos] Você precisa estar diante do Arauto dos Avisos Reais para entregar um contrato!');
        return 0;
    }
    updateDailyQuestsIfNeeded();

    let quest = dailyState.todaysQuests[questIndex];
    if (!quest) {
        player.tell('§c[Avisos] Contrato não encontrado.');
        return 0;
    }

    let prof = getPlayerQuestProfile(player);
    if (listContains(prof.completed, quest.id)) {
        player.tell(`§e[Avisos] Você já concluiu o contrato §6"${quest.title}" §ehoje! Novos contratos amanhã.`);
        return 0;
    }

    // Validação de Requisito
    if (quest.reqType === 'item') {
        let count = countPlayerItems(player, quest.reqTarget);
        if (count < quest.reqCount) {
            player.tell(`§c[Avisos] Itens insuficientes para cumprir o contrato: você precisa de §e${quest.reqCount}x §c(Você tem: ${count}).`);
            player.playSound('minecraft:entity.villager.no', 1.0, 0.9);
            return 0;
        }
        removePlayerItems(player, quest.reqTarget, quest.reqCount);
    } else if (quest.reqType === 'kill' || quest.reqType === 'kill_any_raider') {
        let kills = prof.progress[quest.id] || 0;
        if (kills < quest.reqCount) {
            player.tell(`§c[Avisos] Você ainda não abateu os alvos necessários (§e${kills}/${quest.reqCount}§c)!`);
            player.playSound('minecraft:entity.villager.no', 1.0, 0.9);
            return 0;
        }
    }

    // Marca como concluído e persiste em disco
    prof.completed.push(quest.id);
    saveDailyState();

    // Entrega recompensas
    if (quest.rewardIron > 0) {
        player.give(Item.of('lightmanscurrency:coin_iron', quest.rewardIron));
    }
    if (quest.rewardGold > 0) {
        player.give(Item.of('lightmanscurrency:coin_gold', quest.rewardGold));
    }
    if (quest.rewardTokens > 0) {
        player.give(Item.of('kubejs:token_gladiador', quest.rewardTokens));
    }

    player.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.0);
    player.tell('§6§l==================================================');
    player.tell(`§a§l✔ CONTRATO REAL CONCLUÍDO: §e${quest.title.toUpperCase()}`);
    let rewardMsg = `§fRecompensa: §f+${quest.rewardIron} Ferro`;
    if (quest.rewardGold > 0) rewardMsg += `§7, §6+${quest.rewardGold} Ouro`;
    if (quest.rewardTokens > 0) rewardMsg += `§7, §b+${quest.rewardTokens} Tokens de Gladiador`;
    player.tell(rewardMsg);
    player.tell('§6§l==================================================');
    return 1;
}

function showDailyQuestsMenu(player) {
    if (!player) return 0;
    if (global.isPlayerNearNpc && !global.isPlayerNearNpc(player, ['Arauto', 'Avisos'], 12)) {
        player.tell('§c[Avisos] Vá até o Arauto dos Avisos Reais na Capital para consultar os contratos do dia!');
        return 0;
    }
    updateDailyQuestsIfNeeded();

    let prof = getPlayerQuestProfile(player);

    player.tell('§6§m==================================================');
    player.tell(`§e§l📜 QUADRO DE AVISOS DA COROA §7(${getBrasiliaDateString()})`);
    player.tell('§7Missões diárias renovadas à meia-noite (Horário de Brasília):');
    player.tell('§6§m--------------------------------------------------');

    let quests = dailyState.todaysQuests || [];
    for (let i = 0; i < quests.length; i++) {
        let q = quests[i];
        let num = i + 1;
        let isDone = prof.completed && listContains(prof.completed, q.id);
        let status = isDone ? '§a[CONCLUÍDO]' : '§e[DISPONÍVEL]';
        player.tell(`§f${num}. ${status} §6§l${q.title}`);
        player.tell(`   §7${q.desc}`);
        if (!isDone && (q.reqType === 'kill' || q.reqType === 'kill_any_raider')) {
            let prog = (prof.progress && prof.progress[q.id]) ? prof.progress[q.id] : 0;
            player.tell(`   §8Progresso de Abates: §e${prog}/${q.reqCount}`);
        }
        let rew = `§8Recompensa: §f${q.rewardIron} Ferro`;
        if (q.rewardGold > 0) rew += `§7, §6${q.rewardGold} Ouro`;
        if (q.rewardTokens > 0) rew += `§7, §b${q.rewardTokens} Tokens`;
        player.tell(`   ${rew}`);
    }
    player.tell('§6§m--------------------------------------------------');
    player.tell('§7Use §a/contratos entregar <1|2|3> §7para entregar seus itens ou validar suas caçadas!');
    return 1;
}

// -------------------------------------------------------------------------
// COMANDOS DO SISTEMA DE CONTRATOS (/contratos)
// -------------------------------------------------------------------------
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
        Commands.literal('contratos')
            .then(Commands.literal('ver')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return showDailyQuestsMenu(p);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return showDailyQuestsMenu(p);
                }))
            )
            .then(Commands.literal('entregar')
                .then(Commands.argument('numero', Arguments.INTEGER.create(event))
                    .executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let num = Arguments.INTEGER.getResult(ctx, 'numero');
                        return claimDailyContract(p, num - 1);
                    })
                    .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                        let p = getPlayerFromContext(ctx);
                        let num = Arguments.INTEGER.getResult(ctx, 'numero');
                        return claimDailyContract(p, num - 1);
                    }))
                )
            )
            .executes(ctx => {
                let p = getPlayerFromContext(ctx);
                return showDailyQuestsMenu(p);
            })
    );
});

