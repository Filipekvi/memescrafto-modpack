// Sistema de Arena de Duelos, Apostas em Ouro & Recompensa com Emblemas do Gladiador

const DUEL_DATA_FILE = 'kubejs/data/duel_rankings.json';
let duelRankings = {}; // uuid -> { name, wins, losses, points }

function loadDuelRankings() {
    try {
        let data = JsonIO.read(DUEL_DATA_FILE);
        if (data) duelRankings = data;
    } catch (e) {}
}

function saveDuelRankings() {
    try {
        JsonIO.write(DUEL_DATA_FILE, duelRankings);
    } catch (e) {}
}

loadDuelRankings();

function recordDuelResult(winner, loser, wagerGold) {
    let wUUID = winner.uuid.toString();
    let lUUID = loser.uuid.toString();

    duelRankings[wUUID] = duelRankings[wUUID] || { name: winner.name.string, wins: 0, losses: 0, points: 100 };
    duelRankings[lUUID] = duelRankings[lUUID] || { name: loser.name.string, wins: 0, losses: 0, points: 100 };

    duelRankings[wUUID].name = winner.name.string;
    duelRankings[lUUID].name = loser.name.string;

    let ptsGain = 10 + (wagerGold ? Math.min(20, wagerGold * 2) : 0);
    duelRankings[wUUID].wins++;
    duelRankings[wUUID].points += ptsGain;

    duelRankings[lUUID].losses++;
    duelRankings[lUUID].points = Math.max(0, duelRankings[lUUID].points - 4);

    saveDuelRankings();
}

function showDuelRankings(player) {
    if (!player) return;
    let list = [];
    for (let u in duelRankings) {
        list.push(duelRankings[u]);
    }
    list.sort((a, b) => b.points - a.points);

    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lTOP 10 GLADIADORES DO COLISEU §6§l✦');
    if (list.length === 0) {
        player.tell('§7Nenhum guerreiro registrado no ranking ainda.');
    } else {
        let top = list.slice(0, 10);
        top.forEach((g, idx) => {
            let medal = idx === 0 ? '§e👑' : (idx === 1 ? '§7🥈' : (idx === 2 ? '§6🥉' : `§8#${idx + 1}`));
            player.tell(`${medal} §f${g.name.padEnd(16)} §e${g.points} pts §8(§a${g.wins}V §7/ §c${g.losses}D§8)`);
        });
    }
    player.tell('§6§m----------------------------------------');
}
global.showDuelRankings = showDuelRankings;

let activeInvites = {}; // challengedUUID -> { challengerUUID, wagerGold }
let activeDuels = [];   // array of { p1: UUID, p2: UUID, wagerGold: number, startTime: timestamp }
let pairDuelCooldowns = {}; // "uuidA_uuidB" -> timestamp

// Coordenadas da Arena do Coliseu dos Campeões na Capital (Carregadas dinamicamente)
const ARENA_CONFIG_PATH = 'kubejs/data/arena_config.json';
let arenaCoords = {
    lobby:  { x: -390.5, y: 65, z: 1863.5 },
    spawn1: { x: -390.5, y: 65, z: 1875.5 },
    spawn2: { x: -390.5, y: 65, z: 1889.5 }
};

function loadArenaCoords() {
    try {
        let data = JsonIO.read(ARENA_CONFIG_PATH);
        if (data && data.lobby) arenaCoords = data;
    } catch (e) {}
}
loadArenaCoords();

function saveArenaCoords() {
    try {
        JsonIO.write(ARENA_CONFIG_PATH, arenaCoords);
    } catch (e) {}
}

global.updateArenaCoords = function(lobby, s1, s2) {
    if (lobby) arenaCoords.lobby = lobby;
    if (s1) arenaCoords.spawn1 = s1;
    if (s2) arenaCoords.spawn2 = s2;
    saveArenaCoords();
};

const ENTRY_FEE_IRON = 3; // 3 Moedas de Ferro por lutador (quando não há aposta em Ouro)
const PAIR_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutos para ganhar Emblemas contra o mesmo oponente

function isNearArena(player) {
    let dx = player.x - arenaCoords.lobby.x;
    let dz = player.z - arenaCoords.lobby.z;
    return (dx * dx + dz * dz) <= (65 * 65);
}

function getCoinCount(player, coinId) {
    let count = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === coinId) count += i.count;
    });
    return count;
}

function deductCoins(player, coinId, amount) {
    let rem = amount;
    player.inventory.allItems.forEach(i => {
        if (i.id === coinId && rem > 0) {
            let take = Math.min(i.count, rem);
            i.count -= take;
            rem -= take;
        }
    });
}

function isPlayerInActiveDuel(player) {
    if (!player || !player.uuid) return false;
    let u = player.uuid.toString();
    for (let i = 0; i < activeDuels.length; i++) {
        if (activeDuels[i].p1 === u || activeDuels[i].p2 === u) return true;
    }
    return false;
}
global.isPlayerInActiveDuel = isPlayerInActiveDuel;

function getPairKey(u1, u2) {
    return (u1 < u2) ? `${u1}_${u2}` : `${u2}_${u1}`;
}

function showArenaRules(player) {
    if (!player) return;
    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lREGRAS DO COLISEU DOS CAMPEÕES §6§l✦');
    player.tell('§71. Ambos devem estar no Coliseu e com vida cheia.');
    player.tell(`§72. Duelo Padrão: §f${ENTRY_FEE_IRON} Ferro §8(Pote: ${ENTRY_FEE_IRON * 2} Ferro).`);
    player.tell('§73. Duelo Apostado: §6/duelo desafiar <Nick> <Ouro>');
    player.tell('§74. Vencedor ganha §63x Emblemas §8(10m recarga/rival).');
    player.tell('§75. Sem morte física nem perda de equipamentos!');
    player.tell('§6§m----------------------------------------');
}

function sendDuelChallenge(challenger, target, wagerGold) {
    if (!challenger || !target) return 0;
    if (challenger.uuid.equals(target.uuid)) {
        challenger.tell('§c[Coliseu] Você não pode duelar contra si mesmo!');
        return 0;
    }
    if (global.playerHasCargoPack && (global.playerHasCargoPack(challenger) || global.playerHasCargoPack(target))) {
        challenger.tell('§c[Coliseu] É proibido entrar na Arena carregando Fardos Comerciais!');
        return 0;
    }
    if (!isNearArena(challenger) || !isNearArena(target)) {
        challenger.tell('§c[Coliseu] Ambos os duelistas precisam estar presentes no Coliseu (máx. 65 blocos)!');
        return 0;
    }

    let goldBet = (wagerGold && wagerGold > 0) ? Math.floor(wagerGold) : 0;
    if (goldBet > 0) {
        if (getCoinCount(challenger, 'lightmanscurrency:coin_gold') < goldBet) {
            challenger.tell(`§c[Coliseu] Você não possui §6${goldBet} Moedas de Ouro §cno inventário para esta aposta!`);
            return 0;
        }
    } else {
        if (getCoinCount(challenger, 'lightmanscurrency:coin_iron') < ENTRY_FEE_IRON) {
            challenger.tell(`§c[Coliseu] Você precisa de §f${ENTRY_FEE_IRON} Moedas de Ferro §cpara a inscrição (ou aposte Ouro com /duelo desafiar <Nick> <Ouro>)!`);
            return 0;
        }
    }

    activeInvites[target.uuid.toString()] = {
        challengerUUID: challenger.uuid.toString(),
        wagerGold: goldBet
    };

    let betLabel = goldBet > 0 ? `§6§l${goldBet} Moedas de Ouro §7(Pote: ${goldBet * 2} Ouro!)` : `§f${ENTRY_FEE_IRON} Moedas de Ferro`;
    challenger.tell(`§6[Coliseu] Desafio enviado para §e${target.name.string} §f(Aposta: ${betLabel}§f)!`);
    target.tell('§6§m----------------------------------------');
    target.tell('§6§l✦ §e§lDESAFIO DE DUELO NO COLISEU §6§l✦');
    target.tell(`§7Desafiante: §e${challenger.name.string}`);
    target.tell(`§7Aposta da Luta: ${betLabel}`);
    target.tell('§aDigite §2/duelo aceitar §aou §c/duelo recusar§a.');
    target.tell('§6§m----------------------------------------');
    return 1;
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('ranking')
            .then(Commands.literal('arena')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (p) showDuelRankings(p);
                    return 1;
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let targetName = Arguments.STRING.getResult(ctx, 'target');
                    let p = ctx.source.server.getPlayer(targetName) || ctx.source.player;
                    if (p) showDuelRankings(p);
                    return 1;
                }))
            )
            .then(Commands.literal('duelos')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (p) showDuelRankings(p);
                    return 1;
                })
            )
    );

    event.register(
        Commands.literal('duelo')
            .then(Commands.literal('regras')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (p) showArenaRules(p);
                    return 1;
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let targetName = Arguments.STRING.getResult(ctx, 'target');
                    let p = ctx.source.server.getPlayer(targetName) || ctx.source.player;
                    if (p) showArenaRules(p);
                    return 1;
                }))
            )
            .then(Commands.literal('desafiar')
                .then(Commands.argument('alvo', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        let challenger = ctx.source.player;
                        let target = Arguments.PLAYER.getResult(ctx, 'alvo');
                        return sendDuelChallenge(challenger, target, 0);
                    })
                    .then(Commands.argument('ouro', Arguments.INTEGER.create(event))
                        .executes(ctx => {
                            let challenger = ctx.source.player;
                            let target = Arguments.PLAYER.getResult(ctx, 'alvo');
                            let ouro = Arguments.INTEGER.getResult(ctx, 'ouro');
                            return sendDuelChallenge(challenger, target, ouro);
                        })
                    )
                )
            )
            .then(Commands.literal('aceitar').executes(ctx => {
                let target = ctx.source.player;
                if (!target) return 0;

                let inv = activeInvites[target.uuid.toString()];
                if (!inv) {
                    target.tell('§c[Coliseu] Você não possui nenhum convite de duelo pendente.');
                    return 0;
                }

                let challenger = ctx.source.server.getPlayer(inv.challengerUUID);
                if (!challenger) {
                    target.tell('§c[Coliseu] O desafiante não está mais online.');
                    delete activeInvites[target.uuid.toString()];
                    return 0;
                }

                if (global.playerHasCargoPack && (global.playerHasCargoPack(challenger) || global.playerHasCargoPack(target))) {
                    target.tell('§c[Coliseu] Duelo cancelado: não é permitido entrar na Arena com Fardos Comerciais!');
                    return 0;
                }
                if (!isNearArena(challenger) || !isNearArena(target)) {
                    target.tell('§c[Coliseu] Ambos os combatentes devem estar próximos ao Coliseu para iniciar o duelo!');
                    return 0;
                }
                if (challenger.health < challenger.maxHealth - 1 || target.health < target.maxHealth - 1) {
                    target.tell('§c[Coliseu] Ambos os combatentes devem estar com a vida cheia antes de entrar na Arena!');
                    return 0;
                }

                let goldBet = inv.wagerGold || 0;
                if (goldBet > 0) {
                    if (getCoinCount(challenger, 'lightmanscurrency:coin_gold') < goldBet || getCoinCount(target, 'lightmanscurrency:coin_gold') < goldBet) {
                        target.tell(`§c[Coliseu] Ambos os lutadores precisam ter §6${goldBet} Moedas de Ouro §cno inventário para esta aposta!`);
                        return 0;
                    }
                    deductCoins(challenger, 'lightmanscurrency:coin_gold', goldBet);
                    deductCoins(target, 'lightmanscurrency:coin_gold', goldBet);
                } else {
                    if (getCoinCount(challenger, 'lightmanscurrency:coin_iron') < ENTRY_FEE_IRON || getCoinCount(target, 'lightmanscurrency:coin_iron') < ENTRY_FEE_IRON) {
                        target.tell(`§c[Coliseu] Ambos os lutadores precisam ter §f${ENTRY_FEE_IRON} Moedas de Ferro §cpara a taxa da Arena!`);
                        return 0;
                    }
                    deductCoins(challenger, 'lightmanscurrency:coin_iron', ENTRY_FEE_IRON);
                    deductCoins(target, 'lightmanscurrency:coin_iron', ENTRY_FEE_IRON);
                }

                delete activeInvites[target.uuid.toString()];

                challenger.teleportTo('minecraft:overworld', arenaCoords.spawn1.x, arenaCoords.spawn1.y, arenaCoords.spawn1.z, 0, 0);
                target.teleportTo('minecraft:overworld', arenaCoords.spawn2.x, arenaCoords.spawn2.y, arenaCoords.spawn2.z, 180, 0);

                challenger.health = challenger.maxHealth;
                target.health = target.maxHealth;

                challenger.tell('§a§l[Coliseu] O DUELO COMEÇOU! Que vença o melhor!');
                target.tell('§a§l[Coliseu] O DUELO COMEÇOU! Que vença o melhor!');

                challenger.playSound('minecraft:entity.ender_dragon.growl', 0.8, 1.2);
                target.playSound('minecraft:entity.ender_dragon.growl', 0.8, 1.2);

                activeDuels.push({
                    p1: challenger.uuid.toString(),
                    p2: target.uuid.toString(),
                    wagerGold: goldBet,
                    startTime: Date.now()
                });

                let potMsg = goldBet > 0 ? ` §7(Pote: §6${goldBet * 2} Moedas de Ouro§7)` : '';
                ctx.source.server.tell(`§6[Coliseu] §e${challenger.name.string} §fe §e${target.name.string} §fentraram na Arena de Duelos!${potMsg}`);
                return 1;
            }))
            .then(Commands.literal('recusar').executes(ctx => {
                let target = ctx.source.player;
                if (!target) return 0;
                delete activeInvites[target.uuid.toString()];
                target.tell('§7[Coliseu] Desafio recusado.');
                return 1;
            }))
            .then(Commands.literal('sair').executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                let u = p.uuid.toString();
                let duelIdx = activeDuels.findIndex(d => d.p1 === u || d.p2 === u);
                if (duelIdx === -1) {
                    p.tell('§7[Coliseu] Você não está em um duelo ativo.');
                    return 0;
                }
                activeDuels.splice(duelIdx, 1);
                p.health = p.maxHealth;
                p.teleportTo('minecraft:overworld', arenaCoords.lobby.x, arenaCoords.lobby.y, arenaCoords.lobby.z, 0, 0);
                p.tell('§c[Coliseu] Você encerrou sua participação no duelo e retornou ao saguão.');
                return 1;
            }))
            .then(Commands.literal('cancelar').executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                let u = p.uuid.toString();
                let duelIdx = activeDuels.findIndex(d => d.p1 === u || d.p2 === u);
                if (duelIdx === -1) {
                    p.tell('§7[Coliseu] Você não está em um duelo ativo.');
                    return 0;
                }
                activeDuels.splice(duelIdx, 1);
                p.health = p.maxHealth;
                p.teleportTo('minecraft:overworld', arenaCoords.lobby.x, arenaCoords.lobby.y, arenaCoords.lobby.z, 0, 0);
                p.tell('§c[Coliseu] Duelo cancelado.');
                return 1;
            }))
            .then(Commands.literal('set_lobby').requires(src => src.hasPermission(2)).executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                arenaCoords.lobby = { x: Math.floor(p.x) + 0.5, y: Math.floor(p.y), z: Math.floor(p.z) + 0.5 };
                saveArenaCoords();
                p.tell(`§a[Coliseu] Saguão (Lobby) redefinido para: §e${arenaCoords.lobby.x}, ${arenaCoords.lobby.y}, ${arenaCoords.lobby.z}`);
                return 1;
            }))
            .then(Commands.literal('set_spawn1').requires(src => src.hasPermission(2)).executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                arenaCoords.spawn1 = { x: Math.floor(p.x) + 0.5, y: Math.floor(p.y), z: Math.floor(p.z) + 0.5 };
                saveArenaCoords();
                p.tell(`§a[Coliseu] Ponto de Combate 1 redefinido para: §e${arenaCoords.spawn1.x}, ${arenaCoords.spawn1.y}, ${arenaCoords.spawn1.z}`);
                return 1;
            }))
            .then(Commands.literal('set_spawn2').requires(src => src.hasPermission(2)).executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                arenaCoords.spawn2 = { x: Math.floor(p.x) + 0.5, y: Math.floor(p.y), z: Math.floor(p.z) + 0.5 };
                saveArenaCoords();
                p.tell(`§a[Coliseu] Ponto de Combate 2 redefinido para: §e${arenaCoords.spawn2.x}, ${arenaCoords.spawn2.y}, ${arenaCoords.spawn2.z}`);
                return 1;
            }))
            .then(Commands.literal('resetar_todos').requires(src => src.hasPermission(2)).executes(ctx => {
                activeDuels = [];
                ctx.source.server.tell('§6[Coliseu] Todos os duelos ativos foram resetados por um administrador.');
                return 1;
            }))
    );
});

// Listener de dano: Detecta golpe final no duelo sem perder itens
EntityEvents.hurt(event => {
    try {
        let victim = event.entity;
        if (!victim || !victim.isPlayer()) return;

        let duelIdx = activeDuels.findIndex(d => d.p1 === victim.uuid.toString() || d.p2 === victim.uuid.toString());
        if (duelIdx === -1) return;

        let duel = activeDuels[duelIdx];
        let dmg = 1.0;
        try {
            dmg = (typeof event.getDamage === 'function') ? event.getDamage() : (event.damage || 1.0);
        } catch (ed) {
            dmg = 1.0;
        }

        // Se a vida atual da vítima for <= 2.5 (1 coração) OU o golpe levar a <= 1.0
        if (victim.health <= 2.5 || (victim.health - dmg <= 1.0)) {
            // Executa toda a finalização do duelo ANTES do cancel,
            // pois event.cancel() lança EventExit (interrompendo o fluxo subsequente no KubeJS)
            let winnerUUID = (duel.p1 === victim.uuid.toString()) ? duel.p2 : duel.p1;
            let server = victim.server;
            let winner = server ? server.getPlayer(winnerUUID) : null;

            activeDuels.splice(duelIdx, 1);

            victim.health = victim.maxHealth;
            victim.teleportTo('minecraft:overworld', arenaCoords.lobby.x, arenaCoords.lobby.y, arenaCoords.lobby.z, 0, 0);

            if (winner) {
                winner.health = winner.maxHealth;
                winner.teleportTo('minecraft:overworld', arenaCoords.lobby.x, arenaCoords.lobby.y, arenaCoords.lobby.z, 0, 0);

                let goldBet = duel.wagerGold || 0;
                let potText = '';
                if (goldBet > 0) {
                    let potGold = goldBet * 2;
                    winner.give(Item.of('lightmanscurrency:coin_gold', potGold));
                    potText = `§6+ ${potGold}x Moedas de Ouro (Aposta da Arena)`;
                } else {
                    let potIron = ENTRY_FEE_IRON * 2;
                    winner.give(Item.of('lightmanscurrency:coin_iron', potIron));
                    potText = `§a+ ${potIron}x Moedas de Ferro (Pote da Arena)`;
                }

                // Cooldown anti-wintrading para Emblemas do Gladiador
                let pairKey = getPairKey(duel.p1, duel.p2);
                let now = Date.now();
                let lastFight = pairDuelCooldowns[pairKey] || 0;
                let earnedTokens = (now - lastFight) >= PAIR_COOLDOWN_MS;

                if (earnedTokens) {
                    pairDuelCooldowns[pairKey] = now;
                    winner.give(Item.of('kubejs:token_gladiador', 3));
                }

                winner.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.0);
                winner.tell('§6§m----------------------------------------');
                winner.tell('§6§l✦ §e§lVITÓRIA NO COLISEU! §6§l✦');
                winner.tell(potText);
                if (earnedTokens) {
                    winner.tell('§a+ 3x Emblema do Gladiador');
                } else {
                    let waitMin = Math.ceil((PAIR_COOLDOWN_MS - (now - lastFight)) / 60000);
                    winner.tell(`§7(Emblemas em recarga contra este rival: ${waitMin}m)`);
                }
                winner.tell('§6§m----------------------------------------');

                recordDuelResult(winner, victim, goldBet);

                let winBroadcast = goldBet > 0
                    ? `§6[Coliseu] §e§l${winner.name.string} §fvenceu §c${victim.name.string} §fe levou o pote de §6${goldBet * 2} Moedas de Ouro§f!`
                    : `§6[Coliseu] §e§l${winner.name.string} §fvenceu §c${victim.name.string} §fna Arena de Duelos!`;
                if (server) server.tell(winBroadcast);
            }

            victim.playSound('minecraft:entity.villager.no', 1.0, 0.9);
            victim.tell('§c[Coliseu] Você foi derrotado! Treine suas habilidades e tente novamente.');

            // Cancela o dano final para evitar morte real e perda de inventário
            event.cancel();
        }
    } catch (err) {
        console.error("Erro em duel_arena EntityEvents.hurt:", err);
    }
});
