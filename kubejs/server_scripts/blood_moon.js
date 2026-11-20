// =========================================================================
// LUA DE SANGUE (BLOOD MOON) — PATRULHA DA NOITE (blood_moon.js)
// =========================================================================
// - Aviso ao entardecer (~60s antes da noite) para jogadores buscarem abrigo
//   ou defenderem cidades reivindicadas.
// - Dobra os guardas guarnecidos nas cidades durante o evento (temporarios).
// - Dificuldade (quantidade de mobs) escala com o total de jogadores online.
// - Fora de cidades reivindicadas: hordas implacaveis e brutais.
// - Ranking persistente de abates em cidades reivindicadas + titulo #1
//   exclusivo: [Patrulha da Noite].
// =========================================================================

const BLOOD_MOON_FILE = 'kubejs/data/blood_moon_state.json';
const BM_CHANCE_PER_NIGHT = 0.05;
const BM_MIN_DAY_GAP = 2;
const BM_TITLE_ID = 'patrulha_noite';
const BM_TITLE_DISPLAY = '§4§l[Patrulha da Noite]';

let bmState = {
    lastCheckedDay: -1,
    lastBloodMoonDay: -99,
    currentChampionUUID: '',
    leaderboard: {}
};

let bmLoaded = false;
let bmPhase = 'idle'; // 'idle' | 'warning' | 'active'
let bmNightKills = {}; // uuid -> { name, kills }
let bmSpawnedGuardVillages = {}; // villageId -> true

function loadBloodMoonState() {
    if (bmLoaded) return;
    bmLoaded = true;
    try {
        let data = JsonIO.read(BLOOD_MOON_FILE);
        if (data) {
            bmState.lastCheckedDay = data.lastCheckedDay !== undefined ? data.lastCheckedDay : -1;
            bmState.lastBloodMoonDay = data.lastBloodMoonDay !== undefined ? data.lastBloodMoonDay : -99;
            bmState.currentChampionUUID = data.currentChampionUUID || '';
            bmState.leaderboard = data.leaderboard || {};
        }
    } catch (e) {
        console.error('[BloodMoon] Erro ao carregar blood_moon_state.json: ' + e);
    }
}

function saveBloodMoonState() {
    try {
        JsonIO.write(BLOOD_MOON_FILE, bmState);
    } catch (e) {
        console.error('[BloodMoon] Erro ao salvar blood_moon_state.json: ' + e);
    }
}

function getSortedBloodMoonRanking() {
    let list = [];
    let keys = Object.keys(bmState.leaderboard);
    for (let i = 0; i < keys.length; i++) {
        let uuid = keys[i];
        let entry = bmState.leaderboard[uuid];
        if (entry && entry.kills > 0) {
            list.push({
                uuid: uuid,
                name: entry.name || 'Desconhecido',
                kills: entry.kills || 0,
                nightsDefended: entry.nightsDefended || 0
            });
        }
    }
    list.sort((a, b) => b.kills - a.kills);
    return list;
}

function updateBloodMoonChampionTitle(server) {
    let ranked = getSortedBloodMoonRanking();
    if (ranked.length === 0) return;

    let top = ranked[0];
    if (bmState.currentChampionUUID === top.uuid) {
        if (global.grantPlayerTitle) {
            global.grantPlayerTitle(server, top.uuid, top.name, BM_TITLE_ID, BM_TITLE_DISPLAY, 'Lider do ranking da Lua de Sangue');
        }
        return;
    }

    let oldUuid = bmState.currentChampionUUID;
    if (oldUuid && global.revokePlayerTitle) {
        global.revokePlayerTitle(server, oldUuid, BM_TITLE_ID);
    }

    bmState.currentChampionUUID = top.uuid;
    saveBloodMoonState();

    if (global.grantPlayerTitle) {
        global.grantPlayerTitle(server, top.uuid, top.name, BM_TITLE_ID, BM_TITLE_DISPLAY, 'Lider do ranking da Lua de Sangue');
    }

    server.tell('§4§m==================================================');
    server.tell(`§c§l⚔ NOVO COMANDANTE DA PATRULHA DA NOITE!`);
    server.tell(`§e${top.name} §fassumiu o §6#1 §fno ranking da Lua de Sangue (§c${top.kills} abates§f) e recebeu ${BM_TITLE_DISPLAY}§f!`);
    server.tell('§4§m==================================================');
}

function getOverworldDayTime(level) {
    if (!level) return 0;
    if (typeof level.getDayTime === 'function') return Number(level.getDayTime());
    if (typeof level.dayTime === 'function') return Number(level.dayTime());
    return Number(level.dayTime) || 0;
}

function findSafeSurfaceY(level, x, fallbackY, z) {
    let nx = Number(x);
    let nz = Number(z);
    let ny = Number(fallbackY);
    if (isNaN(ny)) ny = 64;
    if (isNaN(nx) || isNaN(nz)) return ny + 1;
    let ix = Math.floor(nx);
    let iz = Math.floor(nz);
    let startY = Math.min(250, Math.floor(ny) + 18);
    let minY = Math.max(-55, Math.floor(ny) - 18);
    for (let y = startY; y >= minY; y--) {
        let ground = level.getBlock(ix, y - 1, iz);
        let feet = level.getBlock(ix, y, iz);
        let head = level.getBlock(ix, y + 1, iz);
        if (ground && feet && head && ground.id !== 'minecraft:air' && ground.id !== 'minecraft:water' && ground.id !== 'minecraft:lava' && feet.id === 'minecraft:air' && head.id === 'minecraft:air') {
            return y + 0.1;
        }
    }
    return ny + 1;
}

function spawnDoubleVillageGuards(server, overworld) {
    if (!global.getClaimedVillages || !global.getVillageProsperityInfo) return;
    let villages = global.getClaimedVillages();
    let vIds = Object.keys(villages);

    for (let i = 0; i < vIds.length; i++) {
        let v = villages[vIds[i]];
        if (!v || !v.ownerUUID || bmSpawnedGuardVillages[v.id]) continue;

        let hasNearbyPlayer = false;
        server.players.forEach(p => {
            if (p.level.dimension.toString() === 'minecraft:overworld') {
                let dx = p.x - v.x;
                let dz = p.z - v.z;
                if ((dx * dx + dz * dz) <= 220 * 220) hasNearbyPlayer = true;
            }
        });
        if (!hasNearbyPlayer) continue;

        bmSpawnedGuardVillages[v.id] = true;
        let pInfo = global.getVillageProsperityInfo(v);
        let extraGuards = Math.max(2, pInfo.maxGuards || 2);

        for (let g = 0; g < extraGuards; g++) {
            let angle = (Math.PI * 2 * g) / extraGuards;
            let gx = v.x + Math.cos(angle) * 4.5;
            let gz = v.z + Math.sin(angle) * 4.5;
            let gy = findSafeSurfaceY(overworld, gx, v.y, gz);
            let nbt = `{CustomName:'{"text":"Patrulha da Noite","color":"dark_red","bold":true}',CustomNameVisible:1b,Tags:["bm_temp_guard"]}`;
            server.runCommandSilent(`summon guardvillagers:guard ${gx.toFixed(1)} ${gy.toFixed(1)} ${gz.toFixed(1)} ${nbt}`);
        }
    }
}

function cleanupBloodMoonEntities(server) {
    try {
        server.entities.forEach(ent => {
            if (!ent) return;
            if (ent.tags && (ent.tags.contains('bm_temp_guard') || ent.tags.contains('bm_mob'))) {
                ent.discard();
            }
        });
    } catch (e) {}
    bmSpawnedGuardVillages = {};
}

function triggerBloodMoonWarning(server, day) {
    bmPhase = 'warning';
    bmNightKills = {};
    bmSpawnedGuardVillages = {};
    bmState.lastBloodMoonDay = day;
    saveBloodMoonState();

    server.tell('§4§m==================================================');
    server.tell('§c§l🩸 A LUA DE SANGUE ESTÁ SE ERGUENDO...');
    server.tell('§fVocês têm §e~1 minuto §fpara buscar abrigo ou guarnecer uma §6Cidade Reivindicada§f!');
    server.tell('§7Defensores de cidades recebem §a2x Guardas §7e recompensas da §cPatrulha da Noite§7.');
    server.tell('§4§lAVISO: §7A selva lá fora será implacável esta noite!');
    server.tell('§4§m==================================================');

    server.players.forEach(p => {
        p.playSound('minecraft:entity.wither.spawn', 0.8, 0.7);
        server.runCommandSilent(`title ${p.name.string} title {"text":"🩸 LUA DE SANGUE","color":"dark_red","bold":true}`);
        server.runCommandSilent(`title ${p.name.string} subtitle {"text":"Procurem abrigo ou defendam uma cidade!","color":"red"}`);
    });
}

function startBloodMoonActive(server, overworld) {
    bmPhase = 'active';
    server.runCommandSilent('bossbar add minecraft:blood_moon {"text":"🩸 LUA DE SANGUE — PATRULHA DA NOITE 🩸","color":"dark_red","bold":true}');
    server.runCommandSilent('bossbar set minecraft:blood_moon color red');
    server.runCommandSilent('bossbar set minecraft:blood_moon style notched_10');
    server.runCommandSilent('bossbar set minecraft:blood_moon max 10000');
    server.runCommandSilent('bossbar set minecraft:blood_moon value 10000');
    server.runCommandSilent('bossbar set minecraft:blood_moon players @a');
    server.runCommandSilent('weather thunder 10000');

    spawnDoubleVillageGuards(server, overworld);

    server.tell('§4§l🩸 A LUA DE SANGUE ALCANÇOU O ÁPICE! §fCamas estão bloqueadas e as muralhas foram reforçadas com §a2x Guardas§f!');
    server.players.forEach(p => {
        p.playSound('minecraft:event.raid.horn', 1.0, 0.8);
    });
}

function endBloodMoonAtDawn(server, cancelledByAdmin) {
    bmPhase = 'idle';
    server.runCommandSilent('bossbar remove minecraft:blood_moon');
    server.runCommandSilent('weather clear');
    cleanupBloodMoonEntities(server);

    if (cancelledByAdmin) {
        server.tell('§e[Lua de Sangue] Evento encerrado pela administração.');
        bmNightKills = {};
        return;
    }

    let defenderUuids = Object.keys(bmNightKills);
    if (defenderUuids.length > 0) {
        server.tell('§6§m==================================================');
        server.tell('§e§l☀ A LUA DE SANGUE RECUOU COM O AMANHECER!');
        server.tell('§fRecompensas da §cPatrulha da Noite §fpara defensores de cidades:');

        for (let i = 0; i < defenderUuids.length; i++) {
            let uuid = defenderUuids[i];
            let nk = bmNightKills[uuid];
            if (!nk || nk.kills <= 0) continue;

            if (!bmState.leaderboard[uuid]) {
                bmState.leaderboard[uuid] = { name: nk.name, kills: 0, nightsDefended: 0 };
            }
            bmState.leaderboard[uuid].nightsDefended = (bmState.leaderboard[uuid].nightsDefended || 0) + 1;

            let ironReward = Math.min(12, Math.max(1, Math.floor(nk.kills / 3)));
            let goldReward = Math.min(3, Math.floor(nk.kills / 10));
            let tokenWon = nk.kills >= 30 && Math.random() < 0.35;

            let p = server.getPlayer(nk.name);
            if (p) {
                p.give(Item.of('lightmanscurrency:coin_iron', ironReward));
                if (goldReward > 0) p.give(Item.of('lightmanscurrency:coin_gold', goldReward));
                if (tokenWon) p.give(Item.of('kubejs:token_gladiador', 1));
                p.playSound('minecraft:ui.toast.challenge_complete', 0.9, 1.1);
                p.tell(`§a✦ [Patrulha da Noite] §fVocê abateu §c${nk.kills} monstros §fdefendendo cidades e ganhou §7${ironReward} Ferro${goldReward > 0 ? ' §f+ §6' + goldReward + ' Ouro' : ''}${tokenWon ? ' §f+ §61 Emblema do Gladiador' : ''}§f!`);
            }

            if (global.econMint) {
                global.econMint('blood_moon_bounty', ironReward + (goldReward * 10), p);
            }
            server.tell(`§7• §e${nk.name}§f: §c${nk.kills} abates`);
        }

        saveBloodMoonState();
        updateBloodMoonChampionTitle(server);
        server.tell('§6§m==================================================');
    } else {
        server.tell('§e☀ A Lua de Sangue recuou com o amanhecer.');
    }

    bmNightKills = {};
}

function spawnBloodMoonWaves(server, overworld) {
    let onlineCount = Math.max(1, server.players.size());
    let scale = Math.min(3.0, 1.0 + (onlineCount - 1) * 0.35);

    // 1. Cidades reivindicadas com defensores dentro (<= 160m)
    let activeCities = {};
    let wildPlayers = [];

    server.players.forEach(p => {
        if (p.level.dimension.toString() !== 'minecraft:overworld') return;
        if (p.isSpectator()) return;

        let v = global.getNearestClaimedVillage ? global.getNearestClaimedVillage(p.x, p.z, 160) : null;
        if (v && v.ownerUUID) {
            activeCities[v.id] = v;
        } else {
            wildPlayers.push(p);
        }
    });

    const cityMobs = ['minecraft:zombie', 'minecraft:husk', 'minecraft:skeleton', 'minecraft:stray', 'minecraft:pillager'];
    const wildMobs = ['minecraft:zombie', 'minecraft:skeleton', 'minecraft:spider', 'minecraft:witch', 'minecraft:pillager', 'minecraft:vindicator'];

    let cityIds = Object.keys(activeCities);
    for (let i = 0; i < cityIds.length; i++) {
        let v = activeCities[cityIds[i]];
        let count = Math.max(2, Math.round(4 * scale));
        for (let m = 0; m < count; m++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 45 + Math.random() * 20;
            let sx = v.x + Math.cos(angle) * dist;
            let sz = v.z + Math.sin(angle) * dist;
            let sy = findSafeSurfaceY(overworld, sx, v.y, sz);
            let mobType = cityMobs[Math.floor(Math.random() * cityMobs.length)];
            let strAmp = onlineCount >= 3 ? 0 : -1;
            let eff = strAmp >= 0
                ? `ActiveEffects:[{Id:1b,Amplifier:0b,Duration:6000,ShowParticles:0b},{Id:5b,Amplifier:0b,Duration:6000,ShowParticles:0b}]`
                : `ActiveEffects:[{Id:1b,Amplifier:0b,Duration:6000,ShowParticles:0b}]`;
            let nbt = `{CustomName:'{"text":"Horda da Lua de Sangue","color":"red"}',Tags:["bm_mob","bm_city_mob"],${eff}}`;
            server.runCommandSilent(`summon ${mobType} ${sx.toFixed(1)} ${sy.toFixed(1)} ${sz.toFixed(1)} ${nbt}`);
        }
    }

    // 2. Jogadores fora de cidades reivindicadas: selva implacavel
    for (let i = 0; i < wildPlayers.length; i++) {
        let wp = wildPlayers[i];
        let count = Math.max(3, Math.round(4 * scale));
        for (let m = 0; m < count; m++) {
            let angle = Math.random() * Math.PI * 2;
            let dist = 16 + Math.random() * 12;
            let sx = wp.x + Math.cos(angle) * dist;
            let sz = wp.z + Math.sin(angle) * dist;
            let sy = findSafeSurfaceY(overworld, sx, wp.y, sz);
            let mobType = wildMobs[Math.floor(Math.random() * wildMobs.length)];
            let nbt = `{CustomName:'{"text":"Fera da Lua de Sangue","color":"dark_red","bold":true}',Tags:["bm_mob","bm_wild_mob"],ActiveEffects:[{Id:1b,Amplifier:1b,Duration:6000,ShowParticles:0b},{Id:5b,Amplifier:0b,Duration:6000,ShowParticles:0b}]}`;
            server.runCommandSilent(`summon ${mobType} ${sx.toFixed(1)} ${sy.toFixed(1)} ${sz.toFixed(1)} ${nbt}`);
        }
    }
}

ServerEvents.loaded(() => {
    loadBloodMoonState();
});

ServerEvents.tick(event => {
    let server = event.server;
    if (!server) return;
    if (!bmLoaded) loadBloodMoonState();

    // Checa a cada 20 ticks (1 segundo)
    if (server.tickCount % 20 !== 0) return;

    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return;

    let dayTime = getOverworldDayTime(overworld);
    let day = Math.floor(dayTime / 24000);
    let timeOfDay = dayTime % 24000;

    if (bmPhase === 'idle') {
        if (timeOfDay >= 11500 && timeOfDay < 12800 && bmState.lastCheckedDay !== day) {
            bmState.lastCheckedDay = day;
            saveBloodMoonState();

            if (server.players.size() > 0 && (day - bmState.lastBloodMoonDay) >= BM_MIN_DAY_GAP) {
                if (Math.random() < BM_CHANCE_PER_NIGHT) {
                    triggerBloodMoonWarning(server, day);
                }
            }
        }
    } else if (bmPhase === 'warning') {
        if (timeOfDay >= 13000 && timeOfDay < 23000) {
            startBloodMoonActive(server, overworld);
        } else if (timeOfDay < 11000) {
            bmPhase = 'idle';
        }
    } else if (bmPhase === 'active') {
        if (timeOfDay >= 23000 || timeOfDay < 11000) {
            endBloodMoonAtDawn(server, false);
            return;
        }

        let remaining = Math.max(0, Math.min(10000, 23000 - timeOfDay));
        server.runCommandSilent(`bossbar set minecraft:blood_moon value ${remaining}`);

        // Garante reforcos em cidades onde jogadores entraram durante a noite + ondas a cada 20s
        if (server.tickCount % 400 === 0) {
            spawnDoubleVillageGuards(server, overworld);
            spawnBloodMoonWaves(server, overworld);
        }
    }
});

// Bloqueia dormir durante aviso ou Lua de Sangue ativa
BlockEvents.rightClicked(event => {
    if (bmPhase === 'idle') return;
    let b = event.block;
    let p = event.player;
    if (!b || !p || !p.isPlayer()) return;
    if (b.hasTag('minecraft:beds')) {
        p.tell('§4🩸 [Lua de Sangue] §cVocê não consegue dormir enquanto a Lua de Sangue brilha no céu!');
        p.playSound('minecraft:entity.villager.no', 1.0, 0.8);
        event.cancel();
    }
});

// Contabiliza abates e recompensas da Patrulha da Noite
EntityEvents.death(event => {
    if (bmPhase !== 'active') return;
    let ent = event.entity;
    if (!ent || !ent.isLiving()) return;

    let killer = event.source ? event.source.player : null;
    if (!killer || !killer.isPlayer()) return;

    let isBmMob = ent.tags && ent.tags.contains('bm_mob');
    let isMonster = isBmMob || (ent.monster !== undefined && ent.monster);
    if (!isMonster) return;

    if (!bmLoaded) loadBloodMoonState();

    // Verifica se o abate ocorreu dentro de uma cidade reivindicada
    let v = (ent.level.dimension.toString() === 'minecraft:overworld' && global.getNearestClaimedVillage)
        ? global.getNearestClaimedVillage(ent.x, ent.z, 160)
        : null;

    if (v && v.ownerUUID) {
        let uuid = killer.uuid.toString();
        let name = killer.name.string;

        if (!bmNightKills[uuid]) bmNightKills[uuid] = { name: name, kills: 0 };
        bmNightKills[uuid].name = name;
        bmNightKills[uuid].kills += 1;

        if (!bmState.leaderboard[uuid]) {
            bmState.leaderboard[uuid] = { name: name, kills: 0, nightsDefended: 0 };
        }
        bmState.leaderboard[uuid].name = name;
        bmState.leaderboard[uuid].kills += 1;

        if (isBmMob) {
            let roll = Math.random();
            if (roll < 0.15) {
                ent.block.popItem(Item.of('lightmanscurrency:coin_iron', 1));
                if (global.econMint) global.econMint('blood_moon', 1, killer);
            } else if (roll < 0.50) {
                let cAmt = 1 + Math.floor(Math.random() * 2);
                ent.block.popItem(Item.of('lightmanscurrency:coin_copper', cAmt));
                if (global.econMint) global.econMint('blood_moon', cAmt * 0.1, killer);
            }
        }

        if (bmState.leaderboard[uuid].kills % 10 === 0) {
            saveBloodMoonState();
        }
    } else if (isBmMob) {
        // Selva de alto risco: drop extra de moedas sem contar no ranking da Patrulha da Noite
        let roll = Math.random();
        if (roll < 0.20) {
            ent.block.popItem(Item.of('lightmanscurrency:coin_iron', 1));
            if (global.econMint) global.econMint('blood_moon_wild', 1, killer);
        } else if (roll < 0.60) {
            let cAmt = 1 + Math.floor(Math.random() * 3);
            ent.block.popItem(Item.of('lightmanscurrency:coin_copper', cAmt));
            if (global.econMint) global.econMint('blood_moon_wild', cAmt * 0.1, killer);
        }
    }
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    function showRanking(p) {
        if (!p) return 0;
        if (!bmLoaded) loadBloodMoonState();

        let ranked = getSortedBloodMoonRanking();
        p.tell('§4§m----------------------------------------');
        p.tell('§c§l🩸 RANKING — PATRULHA DA NOITE');
        p.tell('§7Abates de monstros em §6Cidades Reivindicadas §7durante a Lua de Sangue.');
        if (ranked.length === 0) {
            p.tell('§8Nenhum defensor registrado ainda.');
        } else {
            let limit = Math.min(10, ranked.length);
            for (let i = 0; i < limit; i++) {
                let r = ranked[i];
                let crown = i === 0 ? ` §4§l[Patrulha da Noite]` : '';
                p.tell(`§e#${i + 1} §f${r.name} §7— §c${r.kills} abates §8(${r.nightsDefended} noites)${crown}`);
            }
        }
        let mine = bmState.leaderboard[p.uuid.toString()];
        p.tell(`§7Seus abates totais: §c${mine ? mine.kills : 0}`);
        p.tell('§4§m----------------------------------------');
        return 1;
    }

    event.register(
        Commands.literal('bloodmoon')
            .then(Commands.literal('ranking').executes(ctx => showRanking(ctx.source.player)))
            .then(Commands.literal('status').executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                p.tell(`§c[Lua de Sangue] §fEstado atual: §e${bmPhase.toUpperCase()}`);
                if (bmPhase === 'active') {
                    let nk = bmNightKills[p.uuid.toString()];
                    p.tell(`§7Seus abates nesta noite (em cidades): §c${nk ? nk.kills : 0}`);
                }
                return 1;
            }))
            .then(Commands.literal('start')
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    let server = ctx.source.server;
                    let overworld = server.getLevel('minecraft:overworld');
                    if (!overworld) return 0;
                    let dayTime = getOverworldDayTime(overworld);
                    let day = Math.floor(dayTime / 24000);
                    let timeOfDay = dayTime % 24000;
                    if (timeOfDay < 11500 || timeOfDay >= 13000) {
                        server.runCommandSilent('time set 11600');
                    }
                    bmState.lastCheckedDay = day;
                    triggerBloodMoonWarning(server, day);
                    return 1;
                })
            )
            .then(Commands.literal('now')
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    let server = ctx.source.server;
                    let overworld = server.getLevel('minecraft:overworld');
                    if (!overworld) return 0;
                    let day = Math.floor(getOverworldDayTime(overworld) / 24000);
                    bmState.lastCheckedDay = day;
                    bmState.lastBloodMoonDay = day;
                    bmNightKills = {};
                    bmSpawnedGuardVillages = {};
                    saveBloodMoonState();
                    server.runCommandSilent('time set 13100');
                    startBloodMoonActive(server, overworld);
                    return 1;
                })
            )
            .then(Commands.literal('stop')
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    endBloodMoonAtDawn(ctx.source.server, true);
                    return 1;
                })
            )
            .executes(ctx => showRanking(ctx.source.player))
    );
});
