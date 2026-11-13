// =========================================================================
// WORLDBOSS GLOBAL: TITÃ FORJADOR DOS ANTIGOS (world_boss.js)
// =========================================================================
// Chefe de Mundo Épico com Barra de Vida Nativa (/bossbar), Habilidades de Área,
// Invocação de Autômatos da Forja em 50% HP e Espólio Lendário.
// =========================================================================

const WB_FILE = 'kubejs/data/world_boss_state.json';

let wbState = {
    active: false,
    x: 0,
    y: 64,
    z: 0,
    maxHp: 600,
    minionsSpawned: false,
    altarX: 3145,
    altarY: 65,
    altarZ: -860,
    lastSummonTime: 0,
    lastDefeatedBy: 'Ninguém',
    totalKills: 0
};

function loadWbState() {
    try {
        let data = JsonIO.read(WB_FILE);
        if (data) {
            wbState.active = !!data.active;
            wbState.x = Number(data.x || 0);
            wbState.y = Number(data.y || 64);
            wbState.z = Number(data.z || 0);
            wbState.maxHp = Number(data.maxHp || 600);
            wbState.minionsSpawned = !!data.minionsSpawned;
            wbState.altarX = Number(data.altarX !== undefined ? data.altarX : 3145);
            wbState.altarY = Number(data.altarY !== undefined ? data.altarY : 65);
            wbState.altarZ = Number(data.altarZ !== undefined ? data.altarZ : -860);
            wbState.lastSummonTime = Number(data.lastSummonTime || 0);
            wbState.lastDefeatedBy = String(data.lastDefeatedBy || 'Ninguém');
            wbState.totalKills = Number(data.totalKills || 0);
        }
    } catch (e) {
        console.error('[WorldBoss] Erro ao carregar estado: ' + e);
    }
}

function saveWbState() {
    try {
        JsonIO.write(WB_FILE, wbState);
    } catch (e) {
        console.error('[WorldBoss] Erro ao salvar estado: ' + e);
    }
}

ServerEvents.loaded(event => {
    loadWbState();
});

const CATALYST_POOL = [
    'kubejs:catalisador_selva',
    'kubejs:catalisador_pantano',
    'kubejs:catalisador_gelo',
    'kubejs:catalisador_deserto',
    'kubejs:catalisador_badlands',
    'kubejs:catalisador_oceano',
    'kubejs:catalisador_cogumelo',
    'kubejs:catalisador_cerejeira',
    'kubejs:catalisador_abismo',
    'kubejs:catalisador_nether',
    'kubejs:catalisador_end'
];

function getGoldCoinCountWb(player) {
    let total = 0;
    let inv = player.inventory;
    for (let i = 0; i < inv.containerSize; i++) {
        let it = inv.getItem(i);
        if (it && it.id === 'lightmanscurrency:coin_gold') {
            total += it.count;
        }
    }
    return total;
}

function consumeGoldCoinsWb(player, amount) {
    let remaining = amount;
    let inv = player.inventory;
    for (let i = 0; i < inv.containerSize; i++) {
        let it = inv.getItem(i);
        if (it && it.id === 'lightmanscurrency:coin_gold') {
            let take = Math.min(remaining, it.count);
            it.count -= take;
            remaining -= take;
            if (remaining <= 0) break;
        }
    }
}

function findBossEntity(server) {
    let overworld = server.overworld();
    if (!overworld) return null;
    let found = null;
    try {
        overworld.getEntities().forEach(ent => {
            if (ent && ent.alive && ent.tags && ent.tags.contains('world_boss_tita')) {
                found = ent;
            }
        });
    } catch (e) {}
    return found;
}

function setupBossbar(server, maxHp, currentHp) {
    server.runCommandSilent('bossbar add memescrafto:tita {"text":"⚔ Titã Forjador dos Antigos ⚔","color":"red","bold":true}');
    server.runCommandSilent('bossbar set memescrafto:tita style notched_10');
    server.runCommandSilent('bossbar set memescrafto:tita color red');
    server.runCommandSilent(`bossbar set memescrafto:tita max ${Math.round(maxHp)}`);
    server.runCommandSilent(`bossbar set memescrafto:tita value ${Math.round(currentHp)}`);
    server.runCommandSilent('bossbar set memescrafto:tita visible true');
}

function removeBossbar(server) {
    server.runCommandSilent('bossbar set memescrafto:tita players');
    server.runCommandSilent('bossbar remove memescrafto:tita');
}

function spawnWorldBoss(server, x, y, z, summonerName) {
    let existing = findBossEntity(server);
    if (existing) {
        return { ok: false, msg: `§c[Worldboss] O Titã Forjador dos Antigos já está desperto em X: ${Math.round(existing.x)}, Z: ${Math.round(existing.z)}!` };
    }

    let bx = Math.round(Number(x));
    let by = Math.round(Number(y));
    let bz = Math.round(Number(z));

    wbState.active = true;
    wbState.x = bx;
    wbState.y = by;
    wbState.z = bz;
    wbState.maxHp = 600;
    wbState.minionsSpawned = false;
    wbState.lastSummonTime = Date.now();
    saveWbState();
    bossDamageTracker = {};

    // Invoca um Ravager / Iron Golem / Wither Skeleton colosso?
    // Usamos minecraft:wither_skeleton ou minecraft:iron_golem ou minecraft:ravager?
    // Wither Skeleton é naturalmente hostil a todos os jogadores, empunha armas Spartan e recebe armadura completa!
    // Vamos usar minecraft:wither_skeleton com 600 HP, armadura Netherite encantada, Martelo de Guerra e resistência a knockback!
    let bossNbt = `{CustomName:'{"text":"⚔ Titã Forjador dos Antigos ⚔","color":"dark_red","bold":true}',CustomNameVisible:1b,PersistenceRequired:1b,FireImmune:1b,Glowing:1b,Health:600.0f,Tags:["world_boss_tita"],HandItems:[{id:"spartanweaponry:netherite_warhammer",Count:1b,tag:{Enchantments:[{id:"minecraft:sharpness",lvl:6s},{id:"minecraft:fire_aspect",lvl:2s}]}},{id:"spartanshields:netherite_tower_shield",Count:1b}],ArmorItems:[{id:"minecraft:netherite_boots",Count:1b,tag:{Enchantments:[{id:"minecraft:protection",lvl:4s}]}},{id:"minecraft:netherite_leggings",Count:1b,tag:{Enchantments:[{id:"minecraft:protection",lvl:4s}]}},{id:"minecraft:netherite_chestplate",Count:1b,tag:{Enchantments:[{id:"minecraft:protection",lvl:5s}]}},{id:"minecraft:netherite_helmet",Count:1b,tag:{Enchantments:[{id:"minecraft:protection",lvl:5s}]}}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:600.0d},{Name:"generic.attack_damage",Base:16.0d},{Name:"generic.movement_speed",Base:0.30d},{Name:"generic.knockback_resistance",Base:0.95d},{Name:"generic.follow_range",Base:64.0d},{Name:"generic.armor",Base:16.0d}]}`;

    server.runCommandSilent(`summon minecraft:wither_skeleton ${bx} ${by} ${bz} ${bossNbt}`);
    server.runCommandSilent(`particle minecraft:explosion_emitter ${bx} ${by + 1} ${bz} 1 1 1 0.1 2 force`);
    server.runCommandSilent(`particle minecraft:lava ${bx} ${by + 2} ${bz} 2 2 2 0.2 60 force`);
    server.runCommandSilent(`playsound minecraft:entity.wither.spawn master @a ${bx} ${by} ${bz} 10.0 0.7`);

    setupBossbar(server, 600, 600);

    server.tell('§4§l==================================================');
    server.tell('§c§l🔥 [EVENTO GLOBAL: WORLDBOSS DESPERTOU!] 🔥');
    if (summonerName) {
        server.tell(`§e${summonerName} §frealizou o Ritual da Forja Primordial e despertou o §4§lTitã Forjador dos Antigos§f!`);
    } else {
        server.tell('§fO §4§lTitã Forjador dos Antigos §femergiu das profundezas da terra!');
    }
    server.tell(`§fLocalização: §eX: ${bx}, Y: ${by}, Z: ${bz} §7(Vida: §c600 HP§7)`);
    server.tell('§6Reúna seu clã! Recompensas: §e30 Moedas de Ouro, Catalisadores Raros, Tokens e Arma Lendária!');
    server.tell('§4§l==================================================');

    return { ok: true };
}

function spawnForgeMinions(server, bx, by, bz) {
    let minionNbt = `{CustomName:'{"text":"⚙ Autômato da Forja","color":"gold","bold":true}',CustomNameVisible:1b,PersistenceRequired:1b,Health:80.0f,Tags:["world_boss_minion"],HandItems:[{id:"spartanweaponry:iron_battleaxe",Count:1b},{id:"spartanshields:iron_basic_shield",Count:1b}],ArmorItems:[{id:"minecraft:iron_boots",Count:1b},{id:"minecraft:iron_leggings",Count:1b},{id:"minecraft:iron_chestplate",Count:1b},{id:"minecraft:iron_helmet",Count:1b}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:80.0d},{Name:"generic.attack_damage",Base:9.0d},{Name:"generic.knockback_resistance",Base:0.5d}]}`;

    let offsets = [[3, 0], [-3, 0], [0, 3]];
    for (let i = 0; i < offsets.length; i++) {
        let mx = bx + offsets[i][0];
        let mz = bz + offsets[i][1];
        server.runCommandSilent(`summon minecraft:wither_skeleton ${mx} ${by} ${mz} ${minionNbt}`);
        server.runCommandSilent(`particle minecraft:flame ${mx} ${by + 1} ${mz} 0.5 1 0.5 0.08 25 force`);
    }
    server.runCommandSilent(`playsound minecraft:block.anvil.place master @a ${bx} ${by} ${bz} 4.0 0.6`);
    server.runCommandSilent(`execute positioned ${bx} ${by} ${bz} run tellraw @a[distance=..80] {"text":"§4§l[Titã Forjador] §6\\"Ergam-se das cinzas, Autômatos da Forja! Esfacalem os invasores!\\""}`);
}

let wbTickCounter = 0;
let wbAbilityCounter = 0;

ServerEvents.tick(event => {
    let server = event.server;
    if (!server || !wbState.active) return;

    wbTickCounter++;
    if (wbTickCounter < 20) return; // Executa a cada 1 segundo (20 ticks)
    wbTickCounter = 0;
    wbAbilityCounter++;

    let boss = findBossEntity(server);
    if (!boss) return;

    let bx = Math.round(boss.x);
    let by = Math.round(boss.y);
    let bz = Math.round(boss.z);
    let hp = Math.max(0, Math.round(boss.health));

    wbState.x = bx;
    wbState.y = by;
    wbState.z = bz;

    // Atualiza barra de vida no topo da tela para jogadores num raio de 100 blocos
    setupBossbar(server, wbState.maxHp, hp);
    server.runCommandSilent(`execute positioned ${bx} ${by} ${bz} run bossbar set memescrafto:tita players @a[distance=..100]`);

    // Aura constante de brasas e fumaça ao redor do Worldboss
    server.runCommandSilent(`particle minecraft:flame ${bx} ${by + 1.2} ${bz} 0.6 0.8 0.6 0.03 8 force`);
    server.runCommandSilent(`particle minecraft:large_smoke ${bx} ${by + 2.0} ${bz} 0.4 0.5 0.4 0.02 4 force`);

    // Fase 2 (50% HP): Invocação dos Autômatos da Forja
    if (!wbState.minionsSpawned && hp <= (wbState.maxHp * 0.5) && hp > 0) {
        wbState.minionsSpawned = true;
        saveWbState();
        spawnForgeMinions(server, bx, by, bz);
    }

    // Habilidade 1 (A cada 12 segundos): IMPACTO SÍSMICO DA BIGORNA
    if (wbAbilityCounter % 12 === 0) {
        let pList = server.players || (server.playerList ? server.playerList.players : []);
        let hitAny = false;
        pList.forEach(p => {
            if (!p.alive || p.isSpectator() || p.isCreative()) return;
            let dx = p.x - boss.x;
            let dz = p.z - boss.z;
            if ((dx * dx + dz * dz) <= 10 * 10) {
                hitAny = true;
                p.attack(8.0); // 4 corações de dano sísmico
                if (p.potionEffects) {
                    p.potionEffects.add('minecraft:slowness', 60, 1, false, true);
                }
                p.tell('§c§l💥 [Impacto Sísmico] §7O Titã Forjador golpeou o chão com sua marreta colossal!');
            }
        });

        if (hitAny) {
            server.runCommandSilent(`particle minecraft:explosion_emitter ${bx} ${by + 0.5} ${bz} 2 0.5 2 0.1 1 force`);
            server.runCommandSilent(`particle minecraft:lava ${bx} ${by + 1} ${bz} 3 0.5 3 0.1 35 force`);
            server.runCommandSilent(`playsound minecraft:entity.generic.explode master @a ${bx} ${by} ${bz} 3.0 0.7`);
        }
    }

    // Habilidade 2 (A cada 18 segundos): TEMPESTADE DE ESCÓRIA INCANDESCENTE
    if (wbAbilityCounter % 18 === 0) {
        let pList = server.players || (server.playerList ? server.playerList.players : []);
        pList.forEach(p => {
            if (!p.alive || p.isSpectator() || p.isCreative()) return;
            let dx = p.x - boss.x;
            let dz = p.z - boss.z;
            let distSq = dx * dx + dz * dz;
            if (distSq <= 18 * 18) {
                let px = Math.round(p.x);
                let py = Math.round(p.y);
                let pz = Math.round(p.z);
                server.runCommandSilent(`particle minecraft:flame ${px} ${py + 1} ${pz} 0.8 1.2 0.8 0.06 25 force`);
                server.runCommandSilent(`particle minecraft:lava ${px} ${py + 2} ${pz} 0.5 0.5 0.5 0.1 10 force`);
                p.setRemainingFireTicks(100); // 5 segundos em chamas
                p.attack(5.0);
                p.tell('§6§l🔥 [Tempestade de Escória] §7Brasas incandescentes da forja antiga caem sobre você!');
            }
        });
        server.runCommandSilent(`playsound minecraft:item.firecharge.use master @a ${bx} ${by} ${bz} 3.0 0.6`);
    }

    // Habilidade 3 (Anti-Cheese / Anti-Pilar - A cada 6 segundos): ONDA MAGNÉTICA DA BIGORNA
    // Puxa e derruba jogadores empoleirados em pilares (Y > boss.y + 2.5) ou que atiram de longe (> 12m)
    if (wbAbilityCounter % 6 === 0) {
        let pList = server.players || (server.playerList ? server.playerList.players : []);
        pList.forEach(p => {
            if (!p.alive || p.isSpectator() || p.isCreative()) return;
            let dx = p.x - boss.x;
            let dy = p.y - boss.y;
            let dz = p.z - boss.z;
            let distHorizontalSq = dx * dx + dz * dz;

            // Se o jogador estiver acima de 2.5 blocos em relação ao boss num raio de até 25m, OU se estiver atirando de longe (> 12m e <= 28m)
            let isPillaring = (dy >= 2.5 && distHorizontalSq <= 25 * 25);
            let isRangedSniping = (distHorizontalSq > 12 * 12 && distHorizontalSq <= 28 * 28);

            if (isPillaring || isRangedSniping) {
                // Puxão Magnético em direção à base do Titã
                let pullX = (boss.x + (dx > 0 ? 2.0 : -2.0)).toFixed(2);
                let pullY = (boss.y).toFixed(2);
                let pullZ = (boss.z + (dz > 0 ? 2.0 : -2.0)).toFixed(2);

                server.runCommandSilent(`tp ${p.name.string} ${pullX} ${pullY} ${pullZ}`);
                p.attack(4.0);
                if (p.potionEffects) {
                    p.potionEffects.add('minecraft:slowness', 60, 2, false, true);
                }
                server.runCommandSilent(`particle minecraft:reverse_portal ${p.x} ${p.y + 1} ${p.z} 0.5 0.5 0.5 0.1 30 force`);
                server.runCommandSilent(`playsound minecraft:entity.iron_golem.damage master ${p.name.string} ${p.x} ${p.y} ${p.z} 2.0 0.6`);
                p.tell('§4§l🧲 [Gravidade Primordial] §cO Titã magnetizou sua armadura e puxou você para o solo da forja!');
            }
        });
    }
});

// Rastreamento de Dano de Jogadores para Distribuição Justa de Espólio
let bossDamageTracker = {}; // playerUUID -> { name: string, damage: number }

EntityEvents.hurt(event => {
    let victim = event.entity;
    if (!victim || !victim.tags || !victim.tags.contains('world_boss_tita')) return;

    let attacker = event.source ? event.source.actual : null;
    if (attacker && attacker.isPlayer()) {
        let u = attacker.uuid.toString();
        bossDamageTracker[u] = bossDamageTracker[u] || { name: attacker.name.string, damage: 0 };
        bossDamageTracker[u].damage += (event.damage || 1.0);
    }
});
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.tags || !entity.tags.contains('world_boss_tita')) return;

    let server = event.server;
    if (!server) return;

    let bx = Math.round(entity.x);
    let by = Math.round(entity.y);
    let bz = Math.round(entity.z);

    let killer = event.source ? event.source.actual : null;
    let killerPlayer = (killer && killer.isPlayer()) ? killer : null;

    // Se morreu para dano indireto, busca o jogador mais próximo num raio de 40m
    if (!killerPlayer) {
        let nearestDist = 999999;
        let pList = server.players || (server.playerList ? server.playerList.players : []);
        pList.forEach(p => {
            if (p.alive) {
                let d = (p.x - bx) * (p.x - bx) + (p.z - bz) * (p.z - bz);
                if (d < nearestDist && d <= 40 * 40) {
                    nearestDist = d;
                    killerPlayer = p;
                }
            }
        });
    }

    let killerName = killerPlayer ? killerPlayer.name.string : 'Heróis do Reino';

    wbState.active = false;
    wbState.minionsSpawned = false;
    wbState.lastDefeatedBy = killerName;
    wbState.totalKills = (wbState.totalKills || 0) + 1;
    saveWbState();

    removeBossbar(server);

    // Remove autômatos restantes
    server.runCommandSilent('kill @e[tag=world_boss_minion]');
    server.runCommandSilent(`particle minecraft:totem_of_undying ${bx} ${by + 1.5} ${bz} 1.5 1.5 1.5 0.3 120 force`);
    server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete master @a ${bx} ${by} ${bz} 10.0 0.9`);

    // Sorteia 2 Catalisadores Elementais Raros
    let cat1 = CATALYST_POOL[Math.floor(Math.random() * CATALYST_POOL.length)];
    let cat2 = CATALYST_POOL[Math.floor(Math.random() * CATALYST_POOL.length)];

    // Cria a Arma Lendária do Titã
    let legendaryWeapon = Item.of(
        'spartanweaponry:diamond_warhammer',
        '{CustomModelData:1,Enchantments:[{id:"minecraft:sharpness",lvl:6s},{id:"minecraft:unbreaking",lvl:4s},{id:"minecraft:fire_aspect",lvl:2s},{id:"minecraft:knockback",lvl:2s}],display:{Name:\'{"text":"✦ Marreta Primordial do Titã Forjador ✦","color":"gold","bold":true,"italic":false}\',Lore:[\'{"text":"Relíquia de Boss Mundial (Tier Lendário)","color":"red","italic":false}\',\'{"text":"Forjada no coração incandescente dos Antigos","color":"gray","italic":true}\']}}'
    );

    // Distribuição Justa de Espólio baseada na contribuição de dano (Mínimo 5% de dano = 30 de dano)
    let totalBossHp = wbState.maxHp || 600;
    let minDmgThreshold = totalBossHp * 0.05; // 30 de dano mínimo para ter direito a espólio

    // Coleta todos os heróis participantes válidos que causaram dano e estão vivos/conectados
    let participants = [];
    for (let uId in bossDamageTracker) {
        let entry = bossDamageTracker[uId];
        if (entry.damage >= minDmgThreshold) {
            let pObj = server.getPlayer(uId);
            if (pObj && pObj.alive) {
                participants.push({ player: pObj, damage: entry.damage });
            }
        }
    }

    // Se ninguém alcançou o threshold (ex: morreu para ambiente ou dano indireto), adiciona o killer se existir
    if (participants.length === 0 && killerPlayer) {
        participants.push({ player: killerPlayer, damage: totalBossHp });
    }

    if (participants.length > 0) {
        // Ordena por maior dano
        participants.sort((a, b) => b.damage - a.damage);

        let topDamager = participants[0].player;
        // O jogador com maior dano garante a Arma Lendária do Titã!
        topDamager.give(legendaryWeapon);
        topDamager.tell('§6§l🏆 [Espólio de Honra] §fPor ter causado o maior impacto em combate, você forjou e empunhou a §6§l✦ Marreta Primordial do Titã Forjador ✦§f!');

        // Divide o pote de ouro (30 Moedas de Ouro) e distribui Catalisadores e Tokens para todos os guerreiros do grupo
        let goldPerPlayer = Math.max(5, Math.floor(30 / participants.length));

        participants.forEach(pt => {
            let p = pt.player;
            p.give(Item.of('lightmanscurrency:coin_gold', goldPerPlayer));
            p.give(Item.of('kubejs:token_gladiador', 3));
            let randomCat = CATALYST_POOL[Math.floor(Math.random() * CATALYST_POOL.length)];
            p.give(Item.of(randomCat, 1));
            p.tell(`§6§l[Espólio do Titã] §aSua bravura em combate concedeu: §e${goldPerPlayer} Moedas de Ouro§a, §b3 Tokens de Gladiador §ae §d1x ${randomCat.replace('kubejs:', '')}§a!`);
        });
    } else {
        // Fallback: se nenhum jogador estiver presente, dropa o espólio básico no chão
        server.runCommandSilent(`summon minecraft:item ${bx} ${by + 1} ${bz} {Item:{id:"lightmanscurrency:coin_gold",Count:30b}}`);
        server.runCommandSilent(`summon minecraft:item ${bx} ${by + 1} ${bz} {Item:{id:"${cat1}",Count:1b}}`);
        server.runCommandSilent(`summon minecraft:item ${bx} ${by + 1} ${bz} {Item:{id:"${cat2}",Count:1b}}`);
    }

    // Limpa o rastreador de dano da batalha
    bossDamageTracker = {};

    server.tell('§6§l==================================================');
    server.tell('§e§l🏆 [WORLDBOSS DERROTADO!] 🏆');
    server.tell(`§fO temível §4§lTitã Forjador dos Antigos §ffoi abatido por §a§l${killerName} §fe seus aliados!`);
    server.tell(`§fTotal de Guerreiros que receberam espólio: §e${participants.length}`);
    server.tell('§6§l==================================================');
});

// Comandos do Worldboss (/worldboss)
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('worldboss')
            .then(Commands.literal('info')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (!p) return 0;
                    let boss = findBossEntity(ctx.source.server);
                    p.tell('§4§m==================================================');
                    p.tell('§c§l🔥 WORLDBOSS: TITÃ FORJADOR DOS ANTIGOS 🔥');
                    if (boss) {
                        p.tell(`§fStatus: §c§lDESPERTO EM COMBATE! §7(Vida: §e${Math.round(boss.health)}/${wbState.maxHp} HP§7)`);
                        p.tell(`§fCoordenadas Atuais: §eX: ${Math.round(boss.x)}, Y: ${Math.round(boss.y)}, Z: ${Math.round(boss.z)}`);
                    } else {
                        let now = Date.now();
                        let cdMs = 12 * 3600 * 1000; // 12 horas de cooldown
                        let elapsed = now - (wbState.lastSummonTime || 0);
                        if (elapsed < cdMs) {
                            let remainSec = Math.ceil((cdMs - elapsed) / 1000);
                            let hours = Math.floor(remainSec / 3600);
                            let mins = Math.floor((remainSec % 3600) / 60);
                            p.tell(`§fStatus: §7Adormecido (Recarga: §e${hours}h ${mins}m restantes§7).`);
                        } else {
                            p.tell('§fStatus: §aPronto para o Ritual no Altar Primordial!');
                        }
                        p.tell(`§fAltar da Forja: §eX: ${wbState.altarX}, Y: ${wbState.altarY}, Z: ${wbState.altarZ}`);
                        p.tell('§fCusto do Ritual: §635 Moedas de Ouro §7(Vá até o Altar e use /worldboss ritual)');
                    }
                    p.tell(`§fÚltimo Matador: §a${wbState.lastDefeatedBy} §8| §fTotal de Abates: §e${wbState.totalKills}`);
                    p.tell('§4§m==================================================');
                    return 1;
                })
            )
            .then(Commands.literal('set_altar')
                .requires(src => (src.player ? (src.player.op || src.player.isCreative()) : true))
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (!p) return 0;
                    wbState.altarX = Math.round(p.x);
                    wbState.altarY = Math.round(p.y);
                    wbState.altarZ = Math.round(p.z);
                    saveWbState();
                    p.tell(`§a[Worldboss] Altar Primordial definido para: §eX: ${wbState.altarX}, Y: ${wbState.altarY}, Z: ${wbState.altarZ}`);
                    return 1;
                })
            )
            .then(Commands.literal('ritual')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (!p) return 0;
                    let existing = findBossEntity(ctx.source.server);
                    if (existing) {
                        p.tell(`§c[Worldboss] O Titã já está vivo em X: ${Math.round(existing.x)}, Z: ${Math.round(existing.z)}!`);
                        return 0;
                    }

                    // Validação do Altar Primordial (raio de 16 blocos)
                    let dx = p.x - wbState.altarX;
                    let dy = p.y - wbState.altarY;
                    let dz = p.z - wbState.altarZ;
                    let distSq = dx * dx + dy * dy + dz * dz;
                    if (distSq > 16 * 16) {
                        p.tell(`§c[Ritual do Titã] Você precisa estar no Altar Primordial para iniciar o ritual!`);
                        p.tell(`§7Localização do Altar: §eX: ${wbState.altarX}, Y: ${wbState.altarY}, Z: ${wbState.altarZ}`);
                        return 0;
                    }

                    // Validação de Cooldown de 12 horas
                    let now = Date.now();
                    let cdMs = 12 * 3600 * 1000;
                    let elapsed = now - (wbState.lastSummonTime || 0);
                    if (elapsed < cdMs && !(p.op || p.isCreative())) {
                        let remainSec = Math.ceil((cdMs - elapsed) / 1000);
                        let hours = Math.floor(remainSec / 3600);
                        let mins = Math.floor((remainSec % 3600) / 60);
                        p.tell(`§c[Ritual do Titã] O Titã ainda se recupera nas profundezas! Aguarde §e${hours}h ${mins}m§c.`);
                        return 0;
                    }

                    let gold = getGoldCoinCountWb(p);
                    if (gold < 35) {
                        p.tell(`§c[Ritual do Titã] São necessárias §635 Moedas de Ouro §cno inventário para realizar o Ritual da Forja Primordial (Você tem: ${gold}).`);
                        return 0;
                    }
                    consumeGoldCoinsWb(p, 35);
                    spawnWorldBoss(ctx.source.server, wbState.altarX, wbState.altarY, wbState.altarZ, p.name.string);
                    return 1;
                })
            )
            .then(Commands.literal('invocar')
                .requires(src => (src.player ? (src.player.op || src.player.isCreative()) : true))
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (!p) return 0;
                    let res = spawnWorldBoss(ctx.source.server, p.x + 4, p.y, p.z + 4, p.name.string);
                    if (!res.ok) p.tell(res.msg);
                    return 1;
                })
            )
            .then(Commands.literal('remover')
                .requires(src => (src.player ? (src.player.op || src.player.isCreative()) : true))
                .executes(ctx => {
                    let server = ctx.source.server;
                    server.runCommandSilent('kill @e[tag=world_boss_tita]');
                    server.runCommandSilent('kill @e[tag=world_boss_minion]');
                    removeBossbar(server);
                    wbState.active = false;
                    wbState.minionsSpawned = false;
                    saveWbState();
                    if (ctx.source.player) {
                        ctx.source.player.tell('§e[Worldboss] O Titã Forjador e seus autômatos foram removidos e a barra de chefe foi limpa.');
                    }
                    return 1;
                })
            )
            .executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                p.tell('§c§l✦ COMANDOS DO WORLDBOSS ✦');
                p.tell('§e/worldboss info §7- Consulta se o Titã está vivo, tempo de recarga e posição do Altar.');
                p.tell('§e/worldboss ritual §7- Realiza o ritual no Altar (35 Moedas de Ouro, 12h recarga).');
                if (p.op || p.isCreative()) {
                    p.tell('§c/worldboss invocar §7- [Admin] Invoca o Worldboss onde você estiver.');
                    p.tell('§c/worldboss set_altar §7- [Admin] Define a sua posição atual como o Altar Primordial.');
                    p.tell('§c/worldboss remover §7- [Admin] Remove o Worldboss ativo e limpa a bossbar.');
                }
                return 1;
            })
    );
});
