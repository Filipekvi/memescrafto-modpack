// =========================================================================
// CRONICAS DO REINO (chronicle_log.js)
// =========================================================================
// Registra marcos e acontecimentos relevantes do mundo para gerar boletins
// e manter a lore do servidor organizada por data (BRT UTC-3).
// =========================================================================

const WORLD_CHRONICLE_FILE = 'kubejs/data/world_chronicle.json';
const CHRONICLE_SAVE_INTERVAL_TICKS = 2400; // 2 minutos

let worldChronicle = {
    startedAt: '',
    serverFirsts: {},
    days: {}
};

let chronicleLoaded = false;
let chronicleDirty = false;
let chronicleTickCounter = 0;

function getChronicleDateKey() {
    let brtMs = Date.now() - (3 * 3600 * 1000);
    let d = new Date(brtMs);
    let y = d.getUTCFullYear();
    let m = String(d.getUTCMonth() + 1).padStart(2, '0');
    let day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getChronicleTimeStr() {
    let brtMs = Date.now() - (3 * 3600 * 1000);
    let d = new Date(brtMs);
    let hh = String(d.getUTCHours()).padStart(2, '0');
    let mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function ensureChronicleDay(dateKey) {
    if (!worldChronicle.days[dateKey]) {
        worldChronicle.days[dateKey] = {
            events: [],
            deaths: {
                total: 0,
                byPlayer: {},
                byCause: {}
            },
            pvpKills: []
        };
    }
    let day = worldChronicle.days[dateKey];
    if (!day.events) day.events = [];
    if (!day.deaths) day.deaths = { total: 0, byPlayer: {}, byCause: {} };
    if (!day.deaths.byPlayer) day.deaths.byPlayer = {};
    if (!day.deaths.byCause) day.deaths.byCause = {};
    if (!day.pvpKills) day.pvpKills = [];
    return day;
}

function loadChronicle() {
    if (chronicleLoaded) return;
    chronicleLoaded = true;
    try {
        let data = JsonIO.read(WORLD_CHRONICLE_FILE);
        if (data) {
            worldChronicle.startedAt = String(data.startedAt || new Date().toISOString());
            worldChronicle.serverFirsts = data.serverFirsts || {};
            worldChronicle.days = data.days || {};
        } else {
            worldChronicle.startedAt = new Date().toISOString();
            chronicleDirty = true;
        }
    } catch (e) {
        console.error('[Chronicle] Erro ao carregar world_chronicle.json: ' + e);
        if (!worldChronicle.startedAt) worldChronicle.startedAt = new Date().toISOString();
    }
}

function saveChronicle(force) {
    if (!chronicleLoaded) return;
    if (!force && !chronicleDirty) return;
    try {
        JsonIO.write(WORLD_CHRONICLE_FILE, worldChronicle);
        chronicleDirty = false;
    } catch (e) {
        console.error('[Chronicle] Erro ao salvar world_chronicle.json: ' + e);
    }
}

global.chronicleEvent = (type, text) => {
    if (!chronicleLoaded) loadChronicle();
    let day = ensureChronicleDay(getChronicleDateKey());
    day.events.push({
        time: getChronicleTimeStr(),
        type: String(type || 'geral'),
        text: String(text || '')
    });
    chronicleDirty = true;
};

global.chronicleFirst = (key, playerName, description) => {
    if (!chronicleLoaded) loadChronicle();
    let k = String(key || '');
    if (!k || worldChronicle.serverFirsts[k]) return false;

    let dateKey = getChronicleDateKey();
    let timeStr = getChronicleTimeStr();
    worldChronicle.serverFirsts[k] = {
        player: String(playerName || 'Desconhecido'),
        date: dateKey,
        time: timeStr,
        description: String(description || '')
    };
    let day = ensureChronicleDay(dateKey);
    day.events.push({
        time: timeStr,
        type: 'first',
        text: `[Marco do Reino] ${playerName}: ${description}`
    });
    chronicleDirty = true;
    return true;
};

ServerEvents.loaded(() => {
    loadChronicle();
});

ServerEvents.unloaded(() => {
    saveChronicle(true);
});

ServerEvents.tick(() => {
    chronicleTickCounter++;
    if (chronicleTickCounter >= CHRONICLE_SAVE_INTERVAL_TICKS) {
        chronicleTickCounter = 0;
        saveChronicle(false);
    }
});

PlayerEvents.tick(event => {
    let p = event.player;
    if (!p || (p.age % 40) !== 0) return;
    if (worldChronicle.serverFirsts.nether && worldChronicle.serverFirsts.end) return;
    let dim = String(p.level.dimension);
    if (dim === 'minecraft:the_nether') {
        global.chronicleFirst('nether', p.name.string, 'Primeiro desbravador a cruzar para o Nether!');
    } else if (dim === 'minecraft:the_end') {
        global.chronicleFirst('end', p.name.string, 'Primeiro desbravador a alcancar o End!');
    }
});

EntityEvents.death(event => {
    let ent = event.entity;
    if (!ent) return;
    if (!chronicleLoaded) loadChronicle();

    // Morte de jogador
    if (ent.isPlayer && ent.isPlayer()) {
        let day = ensureChronicleDay(getChronicleDateKey());
        let pName = ent.name.string;
        day.deaths.total = (day.deaths.total || 0) + 1;
        day.deaths.byPlayer[pName] = (day.deaths.byPlayer[pName] || 0) + 1;

        let causeKey = 'ambiente';
        try {
            if (event.source && event.source.player) {
                let killerName = event.source.player.name.string;
                causeKey = `PvP (${killerName})`;
                if (killerName !== pName) {
                    day.pvpKills.push({
                        time: getChronicleTimeStr(),
                        killer: killerName,
                        victim: pName
                    });
                    global.chronicleEvent('pvp', `${killerName} abateu ${pName} em combate PvP.`);
                }
            } else if (event.source && event.source.actual) {
                causeKey = String(event.source.actual.type || event.source.type || 'mob');
            } else if (event.source && event.source.type) {
                causeKey = String(event.source.type);
            }
        } catch (e) {}

        day.deaths.byCause[causeKey] = (day.deaths.byCause[causeKey] || 0) + 1;
        chronicleDirty = true;
        return;
    }

    // Chefes vanilla (Ender Dragon, Wither, Warden)
    let entType = String(ent.type || '');
    if (entType === 'minecraft:ender_dragon' || entType === 'minecraft:wither' || entType === 'minecraft:warden') {
        let killer = 'Desconhecido';
        try {
            if (event.source && event.source.player) {
                killer = event.source.player.name.string;
            }
        } catch (e) {}
        let label = entType === 'minecraft:ender_dragon' ? 'Dragao do End' : (entType === 'minecraft:wither' ? 'Wither' : 'Warden');
        let key = entType.replace('minecraft:', 'boss_');
        if (!global.chronicleFirst(key, killer, `Primeiro a derrotar o ${label}!`)) {
            global.chronicleEvent('boss', `${killer} derrotou o ${label}.`);
        }
    }
});

function showChronicleReport(ctx, targetDate) {
    if (!chronicleLoaded) loadChronicle();
    let dateKey = targetDate || getChronicleDateKey();
    let sender = ctx.source.player;
    function sendLine(msg) {
        if (sender) sender.tell(msg);
        else console.info(String(msg).replace(/§[0-9a-fk-or]/gi, ''));
    }

    let day = worldChronicle.days[dateKey];
    sendLine('§6§m==================================================');
    sendLine(`§e§l📜 CRÔNICAS DO REINO — ${dateKey}`);
    if (!day) {
        sendLine('§7Nenhum acontecimento registrado nesta data.');
        sendLine('§6§m==================================================');
        return 1;
    }

    let evs = day.events || [];
    sendLine(`§bEventos registrados: §f${evs.length} §7| §cMortes: §f${day.deaths ? day.deaths.total : 0}`);
    let maxShow = Math.min(evs.length, 15);
    for (let i = Math.max(0, evs.length - maxShow); i < evs.length; i++) {
        let ev = evs[i];
        sendLine(`§7[${ev.time}] §e(${ev.type}) §f${ev.text}`);
    }
    sendLine('§6§m==================================================');
    return 1;
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal('cronica')
            .requires(src => src.hasPermission(2))
            .then(Commands.literal('hoje')
                .executes(ctx => showChronicleReport(ctx, null))
            )
            .then(Commands.literal('salvar')
                .executes(ctx => {
                    saveChronicle(true);
                    if (ctx.source.player) ctx.source.player.tell('§a[Cronica] world_chronicle.json salvo.');
                    else console.info('[Chronicle] world_chronicle.json salvo.');
                    return 1;
                })
            )
            .then(Commands.argument('data', Arguments.STRING.create(event))
                .executes(ctx => showChronicleReport(ctx, Arguments.STRING.getResult(ctx, 'data')))
            )
            .executes(ctx => showChronicleReport(ctx, null))
    );
});
