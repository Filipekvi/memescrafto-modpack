// =========================================================================
// SISTEMA DE TITULOS NO CHAT (chat_titles.js)
// =========================================================================
// Permite conceder titulos coloridos no chat aos jogadores, com suporte a
// multiplos titulos desbloqueados e troca via /titulo usar <id>.
// =========================================================================

const PLAYER_TITLES_FILE = 'kubejs/data/player_titles.json';

const DEFAULT_TITLE_CATALOG = {
    pioneiro: {
        display: '§6§l[Pioneiro]',
        desc: 'Participou do primeiro dia do reino'
    },
    campeao_arena: {
        display: '§c§l[Campeao]',
        desc: 'Vencedor de destaque no Coliseu'
    },
    cacador_tita: {
        display: '§4§l[Matador de Titas]',
        desc: 'Derrotou o Tita Forjador dos Antigos'
    },
    soberano: {
        display: '§e§l[Soberano]',
        desc: 'Governante de vila prospera'
    }
};

let titlesState = {
    catalog: {},
    players: {},
    pendingByName: {}
};

let titlesLoaded = false;

function loadTitlesState() {
    if (titlesLoaded) return;
    titlesLoaded = true;
    try {
        let data = JsonIO.read(PLAYER_TITLES_FILE);
        if (data) {
            titlesState.catalog = data.catalog || {};
            titlesState.players = data.players || {};
            titlesState.pendingByName = data.pendingByName || {};
        }
    } catch (e) {
        console.error('[Titles] Erro ao carregar player_titles.json: ' + e);
    }

    // Garante o catalogo padrao
    let defKeys = Object.keys(DEFAULT_TITLE_CATALOG);
    for (let i = 0; i < defKeys.length; i++) {
        let k = defKeys[i];
        if (!titlesState.catalog[k]) {
            titlesState.catalog[k] = DEFAULT_TITLE_CATALOG[k];
        }
    }
}

function saveTitlesState() {
    try {
        JsonIO.write(PLAYER_TITLES_FILE, titlesState);
    } catch (e) {
        console.error('[Titles] Erro ao salvar player_titles.json: ' + e);
    }
}

function getTitleDisplay(titleId) {
    if (!titlesLoaded) loadTitlesState();
    let entry = titlesState.catalog[titleId];
    return entry ? entry.display : `§e[${titleId}]`;
}

function grantTitleToRecord(rec, titleId) {
    if (!rec.unlocked) rec.unlocked = [];
    if (rec.unlocked.indexOf(titleId) === -1) {
        rec.unlocked.push(titleId);
    }
    if (!rec.active) {
        rec.active = titleId;
    }
}

function getPlayerRecordByNameOrOnline(server, targetName) {
    let online = server ? server.getPlayer(targetName) : null;
    if (online) {
        let uuid = online.uuid.toString();
        if (!titlesState.players[uuid]) {
            titlesState.players[uuid] = { name: online.name.string, active: '', unlocked: [] };
        }
        titlesState.players[uuid].name = online.name.string;
        return { uuid: uuid, rec: titlesState.players[uuid], online: online };
    }

    let lower = String(targetName || '').toLowerCase();
    let uuids = Object.keys(titlesState.players);
    for (let i = 0; i < uuids.length; i++) {
        let rec = titlesState.players[uuids[i]];
        if (rec && String(rec.name || '').toLowerCase() === lower) {
            return { uuid: uuids[i], rec: rec, online: null };
        }
    }
    return null;
}

let lastTabTeamState = {};

function syncPlayerTabTeam(server, p) {
    if (!server || !p) return;
    if (!titlesLoaded) loadTitlesState();

    let uuid = p.uuid.toString();
    let rec = titlesState.players[uuid];
    let prefix = (rec && rec.active) ? `${getTitleDisplay(rec.active)} §r` : '';

    let clan = (typeof getPlayerClan === 'function') ? getPlayerClan(uuid) : null;
    let suffix = (clan && clan.name) ? ` §7[§e${clan.name}§7]` : '';

    let stateKey = `${prefix}|${suffix}`;
    if (lastTabTeamState[uuid] === stateKey) return;
    lastTabTeamState[uuid] = stateKey;

    let teamId = 't_' + uuid.replace(/-/g, '').substring(0, 14);
    server.runCommandSilent(`team add ${teamId}`);
    server.runCommandSilent(`team modify ${teamId} prefix ${JSON.stringify({ text: prefix })}`);
    server.runCommandSilent(`team modify ${teamId} suffix ${JSON.stringify({ text: suffix })}`);
    server.runCommandSilent(`team join ${teamId} ${p.name.string}`);
}

ServerEvents.loaded(event => {
    loadTitlesState();
    lastTabTeamState = {};
    if (event && event.server) {
        event.server.players.forEach(p => syncPlayerTabTeam(event.server, p));
    }
});

ServerEvents.tick(event => {
    let server = event.server;
    if (!server || server.tickCount % 100 !== 0) return;
    server.players.forEach(p => syncPlayerTabTeam(server, p));
});

PlayerEvents.loggedIn(event => {
    let p = event.player;
    if (!p) return;
    if (!titlesLoaded) loadTitlesState();

    let uuid = p.uuid.toString();
    let lower = p.name.string.toLowerCase();
    let changed = false;

    if (!titlesState.players[uuid]) {
        titlesState.players[uuid] = { name: p.name.string, active: '', unlocked: [] };
    }
    let rec = titlesState.players[uuid];
    if (rec.name !== p.name.string) {
        rec.name = p.name.string;
        changed = true;
    }

    if (titlesState.pendingByName[lower] && titlesState.pendingByName[lower].length > 0) {
        let pend = titlesState.pendingByName[lower];
        for (let i = 0; i < pend.length; i++) {
            grantTitleToRecord(rec, pend[i]);
        }
        delete titlesState.pendingByName[lower];
        changed = true;
    }

    if (changed) saveTitlesState();
    syncPlayerTabTeam(event.server, p);

    // Entrega unica das reliquias comemorativas para quem possui o titulo 'pioneiro'
    if (rec.unlocked && rec.unlocked.indexOf('pioneiro') !== -1 && !p.persistentData.getBoolean('pioneer_gift_v1')) {
        p.persistentData.putBoolean('pioneer_gift_v1', true);

        let banner = Item.of('minecraft:black_banner', 1, {
            BlockEntityTag: {
                Patterns: [
                    { Pattern: 'gra', Color: 1 },
                    { Pattern: 'cbo', Color: 4 },
                    { Pattern: 'cr', Color: 15 },
                    { Pattern: 'flo', Color: 4 }
                ]
            },
            display: {
                Name: '{"text":"Estandarte dos Pioneiros","color":"gold","bold":true,"italic":false}',
                Lore: [
                    '{"text":"✦ Relíquia Exclusiva do Dia 1 ✦","color":"yellow","italic":false}',
                    '{"text":"Forjado para os cinco primeiros desbravadores.","color":"gray","italic":false}'
                ]
            }
        });

        let spyglass = Item.of('minecraft:spyglass', 1, {
            Enchantments: [{ id: 'minecraft:unbreaking', lvl: 1 }],
            HideFlags: 1,
            display: {
                Name: '{"text":"Luneta dos Pioneiros","color":"gold","bold":true,"italic":false}',
                Lore: [
                    '{"text":"✦ Relíquia Exclusiva do Dia 1 ✦","color":"yellow","italic":false}',
                    '{"text":"Aos primeiros olhos que avistaram estas terras.","color":"gray","italic":false}'
                ]
            }
        });

        p.give(banner);
        p.give(spyglass);
        p.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.1);
        p.tell('§6§m==================================================');
        p.tell('§e§l✦ PRESENTE DA COROA AOS PIONEIROS ✦');
        p.tell('§fPor ter participado do Dia 1 do reino, você recebeu:');
        p.tell('§6• §l[Pioneiro] §7no chat §8(/titulo para gerenciar)');
        p.tell('§6• §e1x Estandarte dos Pioneiros §7+ §e1x Luneta dos Pioneiros');
        p.tell('§6§m==================================================');
    }
});

PlayerEvents.chat(event => {
    let p = event.player;
    if (!p) return;
    if (!titlesLoaded) loadTitlesState();

    let rec = titlesState.players[p.uuid.toString()];
    if (!rec || !rec.active) return;

    let display = getTitleDisplay(rec.active);
    let msg = String(event.message || '');
    let formatted = `${display} §f${p.name.string}§7: §f${msg}`;

    event.server.tell(formatted);
    console.info(`[CHAT] ${rec.active} ${p.name.string}: ${msg}`);
    event.cancel();
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function listPlayerTitles(p) {
        if (!p) return 0;
        if (!titlesLoaded) loadTitlesState();
        let rec = titlesState.players[p.uuid.toString()];
        let unlocked = (rec && rec.unlocked) ? rec.unlocked : [];
        let active = rec ? rec.active : '';

        p.tell('§6§m----------------------------------------');
        p.tell('§e§l🏷️ SEUS TÍTULOS DE CHAT');
        if (unlocked.length === 0) {
            p.tell('§7Você ainda não possui nenhum título desbloqueado.');
        } else {
            for (let i = 0; i < unlocked.length; i++) {
                let id = unlocked[i];
                let disp = getTitleDisplay(id);
                let mark = (id === active) ? ' §a✔ (Ativo)' : '';
                p.tell(`§7• §f${id} §7-> ${disp}${mark}`);
            }
            p.tell('§7Use §e/titulo usar <id> §7para trocar ou §e/titulo limpar §7para ocultar.');
        }
        p.tell('§6§m----------------------------------------');
        return 1;
    }

    event.register(
        Commands.literal('titulo')
            .then(Commands.literal('listar')
                .executes(ctx => listPlayerTitles(ctx.source.player))
            )
            .then(Commands.literal('limpar')
                .executes(ctx => {
                    let p = ctx.source.player;
                    if (!p) return 0;
                    if (!titlesLoaded) loadTitlesState();
                    let rec = titlesState.players[p.uuid.toString()];
                    if (rec) {
                        rec.active = '';
                        saveTitlesState();
                        syncPlayerTabTeam(ctx.source.server, p);
                    }
                    p.tell('§e[Títulos] Seu título no chat foi ocultado.');
                    return 1;
                })
            )
            .then(Commands.literal('usar')
                .then(Commands.argument('id', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let p = ctx.source.player;
                        if (!p) return 0;
                        if (!titlesLoaded) loadTitlesState();
                        let id = String(Arguments.STRING.getResult(ctx, 'id')).toLowerCase();
                        let rec = titlesState.players[p.uuid.toString()];
                        if (!rec || !rec.unlocked || rec.unlocked.indexOf(id) === -1) {
                            p.tell(`§c[Títulos] Você não possui o título "${id}".`);
                            return 0;
                        }
                        rec.active = id;
                        saveTitlesState();
                        syncPlayerTabTeam(ctx.source.server, p);
                        p.tell(`§a[Títulos] Título ativo alterado para ${getTitleDisplay(id)}§a!`);
                        return 1;
                    })
                )
            )
            .then(Commands.literal('dar')
                .requires(src => src.hasPermission(2))
                .then(Commands.argument('jogador', Arguments.STRING.create(event))
                    .then(Commands.argument('id', Arguments.STRING.create(event))
                        .executes(ctx => {
                            if (!titlesLoaded) loadTitlesState();
                            let target = String(Arguments.STRING.getResult(ctx, 'jogador'));
                            let id = String(Arguments.STRING.getResult(ctx, 'id')).toLowerCase();
                            if (!titlesState.catalog[id]) {
                                titlesState.catalog[id] = { display: `§6§l[${id}]`, desc: 'Titulo especial' };
                            }
                            let found = getPlayerRecordByNameOrOnline(ctx.source.server, target);
                            if (found) {
                                grantTitleToRecord(found.rec, id);
                                saveTitlesState();
                                if (found.online) {
                                    syncPlayerTabTeam(ctx.source.server, found.online);
                                    found.online.tell(`§6§l✦ [Título Concedido] §fVocê recebeu o título ${getTitleDisplay(id)}§f!`);
                                }
                            } else {
                                let lower = target.toLowerCase();
                                if (!titlesState.pendingByName[lower]) titlesState.pendingByName[lower] = [];
                                if (titlesState.pendingByName[lower].indexOf(id) === -1) {
                                    titlesState.pendingByName[lower].push(id);
                                }
                                saveTitlesState();
                                if (found.online) syncPlayerTabTeam(ctx.source.server, found.online);
                            }
                            if (ctx.source.player) ctx.source.player.tell(`§a[Títulos] Título "${id}" concedido a ${target}.`);
                            else console.info(`[Titles] Titulo "${id}" concedido a ${target}.`);
                            return 1;
                        })
                        .then(Commands.argument('display', Arguments.GREEDY_STRING.create(event))
                            .executes(ctx => {
                                if (!titlesLoaded) loadTitlesState();
                                let target = String(Arguments.STRING.getResult(ctx, 'jogador'));
                                let id = String(Arguments.STRING.getResult(ctx, 'id')).toLowerCase();
                                let disp = String(Arguments.STRING.getResult(ctx, 'display')).replace(/&/g, '§');
                                titlesState.catalog[id] = { display: disp, desc: 'Titulo especial' };

                                let found = getPlayerRecordByNameOrOnline(ctx.source.server, target);
                                if (found) {
                                    grantTitleToRecord(found.rec, id);
                                    saveTitlesState();
                                    if (found.online) {
                                        syncPlayerTabTeam(ctx.source.server, found.online);
                                        found.online.tell(`§6§l✦ [Título Concedido] §fVocê recebeu o título ${disp}§f!`);
                                    }
                                } else {
                                    let lower = target.toLowerCase();
                                    if (!titlesState.pendingByName[lower]) titlesState.pendingByName[lower] = [];
                                    if (titlesState.pendingByName[lower].indexOf(id) === -1) {
                                        titlesState.pendingByName[lower].push(id);
                                    }
                                    saveTitlesState();
                                }
                                if (ctx.source.player) ctx.source.player.tell(`§a[Títulos] Título "${id}" (${disp}§a) concedido a ${target}.`);
                                else console.info(`[Titles] Titulo "${id}" concedido a ${target}.`);
                                return 1;
                            })
                        )
                    )
                )
            )
            .then(Commands.literal('remover')
                .requires(src => src.hasPermission(2))
                .then(Commands.argument('jogador', Arguments.STRING.create(event))
                    .then(Commands.argument('id', Arguments.STRING.create(event))
                        .executes(ctx => {
                            if (!titlesLoaded) loadTitlesState();
                            let target = String(Arguments.STRING.getResult(ctx, 'jogador'));
                            let id = String(Arguments.STRING.getResult(ctx, 'id')).toLowerCase();
                            let found = getPlayerRecordByNameOrOnline(ctx.source.server, target);
                            if (found && found.rec.unlocked) {
                                found.rec.unlocked = found.rec.unlocked.filter(t => t !== id);
                                if (found.rec.active === id) {
                                    found.rec.active = found.rec.unlocked.length > 0 ? found.rec.unlocked[0] : '';
                                }
                                saveTitlesState();
                                if (found.online) syncPlayerTabTeam(ctx.source.server, found.online);
                            }
                            if (ctx.source.player) ctx.source.player.tell(`§e[Títulos] Título "${id}" removido de ${target}.`);
                            else console.info(`[Titles] Titulo "${id}" removido de ${target}.`);
                            return 1;
                        })
                    )
                )
            )
            .executes(ctx => listPlayerTitles(ctx.source.player))
    );
});
