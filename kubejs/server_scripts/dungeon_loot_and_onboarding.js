// Integração de Loot de Masmorras (Rates Ultra-Baixos) & Onboarding do Novo Jogador - Memescrafto RPG

const ALL_CATALYSTS = [
    'kubejs:catalisador_planicie',
    'kubejs:catalisador_floresta',
    'kubejs:catalisador_deserto',
    'kubejs:catalisador_tundra',
    'kubejs:catalisador_selva',
    'kubejs:catalisador_pantano',
    'kubejs:catalisador_badlands',
    'kubejs:catalisador_oceano',
    'kubejs:catalisador_montanha',
    'kubejs:catalisador_cerejeira',
    'kubejs:catalisador_nether',
    'kubejs:catalisador_end'
];

// 1. Injeção de Espólios em Baús de Masmorras (Com taxas extremamente baixas para Catalisadores e Emblemas)
BlockEvents.rightClicked(event => {
    let p = event.player;
    let b = event.block;
    if (!p || !p.isPlayer() || !b) return;

    let id = b.id;
    if (id !== 'minecraft:chest' && id !== 'minecraft:trapped_chest' && id !== 'minecraft:barrel') return;

    let beData = b.entityData;
    if (!beData || !beData.contains('LootTable')) return;

    let lootTableStr = String(beData.getString('LootTable'));
    // Ignora caso não seja baú de estrutura/masmorra
    if (!lootTableStr) return;

    // Sorteio de Moedas e Relíquias quando o baú de estrutura é aberto pela primeira vez
    let rollCopper = Math.random();
    let rollGold   = Math.random();
    let rollCat    = Math.random();
    let rollToken  = Math.random();

    // 55% de chance: Moedas de Cobre e Ferro
    if (rollCopper < 0.55) {
        let copperAmt = 2 + Math.floor(Math.random() * 6);
        let ironAmt   = 1 + Math.floor(Math.random() * 2);
        b.popItem(Item.of('lightmanscurrency:coin_copper', copperAmt));
        b.popItem(Item.of('lightmanscurrency:coin_iron', ironAmt));
    }

    // 10% de chance: 1 Moeda de Ouro
    if (rollGold < 0.10) {
        b.popItem(Item.of('lightmanscurrency:coin_gold', 1));
    }

    // 1.5% de chance (Extremamente Baixo): 1 Catalisador Elemental aleatório
    if (rollCat < 0.015) {
        let randomCat = ALL_CATALYSTS[Math.floor(Math.random() * ALL_CATALYSTS.length)];
        b.popItem(Item.of(randomCat, 1));
        p.tell('§d§l✨ [Relíquia de Masmorra] §fVocê encontrou um raro §dCatalisador Elemental §fno baú antigo!');
        p.playSound('minecraft:block.amethyst_block.chime', 1.0, 1.2);
    }

    // 0.5% de chance (Raríssimo): 1 Emblema do Gladiador
    if (rollToken < 0.005) {
        b.popItem(Item.of('kubejs:token_gladiador', 1));
        p.tell('§6§l🏆 [Tesouro Ancestral] §fVocê desenterrou um §6Emblema do Gladiador §fperdido nas profundezas!');
        p.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.2);
    }
});

const SERVER_EXCLUSIVE_RECIPES = [
    'kubejs:marco_fundacao',
    'kubejs:clarim_cerco',
    'kubejs:fardo_planicie',
    'kubejs:fardo_floresta',
    'kubejs:fardo_deserto',
    'kubejs:fardo_tundra',
    'kubejs:fardo_selva',
    'kubejs:fardo_pantano',
    'kubejs:fardo_badlands',
    'kubejs:fardo_oceano',
    'kubejs:fardo_montanha',
    'kubejs:fardo_cerejeira',
    'kubejs:fardo_nether',
    'kubejs:fardo_end'
];

// Pré-registra no Livro Verde da Bancada APENAS os 14 itens exclusivos de mecânica do servidor (mantendo a descoberta para o resto do jogo!)
function unlockServerExclusiveRecipes(player) {
    if (!player || !player.server) return;
    SERVER_EXCLUSIVE_RECIPES.forEach(rId => {
        player.server.runCommandSilent(`recipe give ${player.name.string} ${rId}`);
    });
}

// 2. Criação do Livro "Guia do Aventureiro"
function giveAdventurerGuide(player) {
    if (!player || !player.server) return;

    unlockServerExclusiveRecipes(player);

    // Remove cópias antigas ou sem NBT do Guia caso existam no inventário
    try {
        player.inventory.allItems.forEach(item => {
            if (item && item.id === 'minecraft:written_book') {
                if (!item.nbt || !item.nbt.contains('title') || item.nbt.getString('title') === 'Guia do Aventureiro') {
                    item.count = 0;
                }
            }
        });
    } catch (e) {}

    let rawPages = [
        "§0§l✦ GUIA DO REINO ✦\n§4§lMEMESCRAFTO RPG\n\n§0Bem-vindo, viajante!\nTrilhe a jornada de\n§1Mercador§0, §4Campeão§0,\n§2Explorador§0 ou §6Rei§0.\n\n§2Dica:§0 As 14 receitas\ndo reino já estão no\n§2Livro Verde§0 da sua\nBancada de Trabalho!",
        "§0§l1. ECONOMIA & BANCO\n\n§0As moedas oficiais\nsão §6Cobre§0, §7Ferro§0\ne §6Ouro§0.\n\nTroque barras de\nouro no §6Banqueiro§0.\n\n§8Cota preferencial:\n64 barras/dia por\njogador.",
        "§0§l2. ROTAS E FARDOS\n\n§0Cada bioma produz um\n§6Fardo Comercial§0.\n\n• Dão §cLentidão a pé§0!\nUse §2Cavalos, Navios§0\nou §2Carroças§0.\n• Faça no bioma\ncerto! Fora dele,\nvira §cSintético§0 e\npaga §c-60%§0.",
        "§0§l3. ARENA & FORJA\n\n§0No §4Coliseu§0, use\n§2/duelo desafiar§0 p/\nganhar §6Emblemas§0.\n\nNa §8Forja Mística§0,\nuse Ouro, Emblemas\ne Catalisadores p/\nelevar §1Armas, Escudos§0\ne §1Armaduras§0 até o\n§4Tier V Mítico§0!",
        "§0§l4. TIERS DA FORJA\n§8(Catalisadores)§0\n\n§6Tier I:§0 2x Comuns\n§8(Planície/Flor./Mar)\n§5Tier II:§0 4x Regionais\n§8(Deserto/Mont./Pânt.)\n§bTier III:§0 6x Exóticos\n§8(Tundra/Selva/Badl.)\n§cTier IV:§0 4 Nether\n§8+ 4 Exóticos\n§4Tier V:§0 4 End +\n§84 Nether + 4 Livre",
        "§0§l5. CLÃS & VILAS\n\n§0• Crie seu clã com:\n§1/cla criar <Nome>\n§1/cla convidar <Nick>\n\n§0• Para fundar vila\n(mín. 5 Aldeões e\n1 Sino), use o\n§6Marco de Fundação§0.\n• Aldeões geram\n§2Imposto§0 a cada 30m!",
        "§0§l6. CERCOS & GUERRA\n\n§0• Guarde Ouro no\nCofre da Vila para\nsubir §6Prosperidade§0\ne ter até §b12 Guardas§0!\n\n• Para tomar vila\nrival, use o §4Clarim§0\ne domine a praça\ndo Emissário (12m)\npor 20 minutos!",
        "§0§l7. ITENS DE REINO\n\n§6Marco de Fundação:§0\n§81ª:§0 Ouro, Esmer., Ouro\n§8   (em Blocos)\n§82ª:§0 Ban., Sino, Ban.\n§83ª:§0 3x Obsidiana\n\n§4Clarim de Cerco:§0\n§81ª:§0 3x Barra de Ouro\n§82ª:§0 Redst, TNT, Redst\n§83ª:§0 3x Bloco de Ferro",
        "§0§l8. FARDOS (I a IV)\n§8(3 itens por linha)§0\n\n§2Planície:§0 3 Lãs /\n§0Couro+Feno / 3 Trigos\n§2Floresta:§0 3 Maçãs /\n§03 Troncos / 3 Flores\n§3Oceano:§0 3 Prismar. /\n§03 Bacalhaus / 3 Algas\n§6Deserto:§0 3 Vidros /\n§03 Cactos / 3 Arenitos",
        "§0§l9. FARDOS (V a VIII)\n§8(3 itens por linha)§0\n\n§7Montanha:§0 3 Esmer. /\n§03 Ferro Br. / 3 Carvão\n§8Pântano:§0 3 Vit.Régia/\n§03 Slimes / 3 Argilas\n§bTundra:§0 3 Bl.Neve /\n§03 Gelo Comp / 3 Couros\n§2Selva:§0 3 Bambus /\n§03 Cacaus / 3 Melancias",
        "§0§l10. FARDOS (IX a XII)\n§8(3 itens por linha)§0\n\n§cBadlands:§0 3 Terrac. /\n§03 Ouro Br. / 3 Areia V.\n§dCerejeira:§0 3 Pétalas /\n§03 Tronco Cer / 3 Mel\n§4Nether:§0 3 Quartzos /\n§03 Cr.Magma / 3 Almas\n§5The End:§0 3 Fr.Coro /\n§03 Pérolas / 3 Pedra Fim"
    ];

    let snbtPages = rawPages.map(p => "'" + JSON.stringify({ text: p }).replace(/\\/g, "\\\\") + "'").join(',');
    let nbt = `{title:"Guia do Aventureiro",author:"Coroa Real",generation:0,resolved:1b,pages:[${snbtPages}]}`;
    player.server.runCommandSilent(`give ${player.name.string} minecraft:written_book${nbt} 1`);
}

// 3. Recepção Automática no Primeiro Login + Comando /guia
PlayerEvents.loggedIn(event => {
    let p = event.player;
    if (!p) return;

    unlockServerExclusiveRecipes(p);

    if (!p.persistentData.getBoolean('rpg_onboarding_v1')) {
        p.persistentData.putBoolean('rpg_onboarding_v1', true);
        p.persistentData.putBoolean('rpg_guide_v2', true);

        giveAdventurerGuide(p);
        try {
            p.give(Item.of('ftbquests:book', 1));
        } catch (e) {}
        p.give(Item.of('lightmanscurrency:coin_copper', 10));
        p.give(Item.of('minecraft:bread', 5));

        p.server.runCommandSilent(`title ${p.name.string} title {"text":"§6§lMEMESCRAFTO RPG"}`);
        p.server.runCommandSilent(`title ${p.name.string} subtitle {"text":"§eComércio, Cidades Vivas & Conquista"}`);

        p.tell('§6§m----------------------------------------');
        p.tell('§e§l✦ BEM-VINDO AO MEMESCRAFTO RPG! ✦');
        p.tell('§fVocê recebeu o §6Guia do Aventureiro §fe o §aLivro de Missões§f!');
        p.tell('§7• Dúvidas a qualquer momento? Digite §a/guia §7ou §a/cla info§7.');
        p.tell('§6§m----------------------------------------');
    } else if (!p.persistentData.getBoolean('rpg_guide_v2')) {
        p.persistentData.putBoolean('rpg_guide_v2', true);
        giveAdventurerGuide(p);
    }
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('guia').executes(ctx => {
            let p = ctx.source.player;
            if (p) {
                giveAdventurerGuide(p);
                p.tell('§a[Guia] Você recebeu uma nova cópia do Guia do Aventureiro!');
            }
            return 1;
        })
    );
});

