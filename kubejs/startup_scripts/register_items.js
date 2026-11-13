// Register RPG Items: Duel Tokens, Biome Catalysts, Trade Cargo Packs, and Sovereignty Items
StartupEvents.registry('item', event => {
    // Moeda / Token de Duelo
    event.create('token_gladiador')
        .displayName('§6§lEmblema do Gladiador')
        .glow(true)
        .maxStackSize(64);

    // Itens de Soberania & Cerco Territorial
    event.create('marco_fundacao')
        .displayName('§6§l👑 Marco de Fundação da Vila')
        .glow(true)
        .maxStackSize(1);

    event.create('clarim_cerco')
        .displayName('§4§l📯 Clarim de Cerco Territorial')
        .glow(true)
        .maxStackSize(1);

    // 12 Catalisadores de Bioma e Dimensão
    const catalysts = [
        { id: 'catalisador_planicie', name: '§aCatalisador da Planície' },
        { id: 'catalisador_floresta', name: '§2Catalisador da Floresta' },
        { id: 'catalisador_deserto', name: '§eCatalisador do Deserto' },
        { id: 'catalisador_tundra', name: '§bCatalisador da Tundra' },
        { id: 'catalisador_selva', name: '§aCatalisador da Selva' },
        { id: 'catalisador_pantano', name: '§5Catalisador do Pântano' },
        { id: 'catalisador_badlands', name: '§6Catalisador das Terras Ermas' },
        { id: 'catalisador_oceano', name: '§9Catalisador do Oceano' },
        { id: 'catalisador_montanha', name: '§7Catalisador dos Picos Nevados' },
        { id: 'catalisador_cerejeira', name: '§dCatalisador das Cerejeiras' },
        { id: 'catalisador_nether', name: '§cCatalisador Abissal do Nether' },
        { id: 'catalisador_end', name: '§5Catalisador Astral do End' }
    ];

    catalysts.forEach(cat => {
        event.create(cat.id).displayName(cat.name).glow(true).maxStackSize(64);
    });

    // 12 Fardos Comerciais de Bioma e Dimensão (Cargo Packs)
    const packs = [
        { id: 'fardo_planicie', name: '§6[Fardo] §fCereal & Tecido da Planície' },
        { id: 'fardo_floresta', name: '§6[Fardo] §2Madeira Nobre da Floresta' },
        { id: 'fardo_deserto', name: '§6[Fardo] §eEspeciarias & Vidro do Deserto' },
        { id: 'fardo_tundra', name: '§6[Fardo] §bPeles & Gelo da Tundra' },
        { id: 'fardo_selva', name: '§6[Fardo] §aCacau & Bambu Tropical' },
        { id: 'fardo_pantano', name: '§6[Fardo] §5Ervas Raras & Lodo do Pântano' },
        { id: 'fardo_badlands', name: '§6[Fardo] §6Argila Queimada & Terracota' },
        { id: 'fardo_oceano', name: '§6[Fardo] §9Pérolas & Coral das Profundezas' },
        { id: 'fardo_montanha', name: '§6[Fardo] §7Minérios dos Picos Nevados' },
        { id: 'fardo_cerejeira', name: '§6[Fardo] §dFlor & Pétalas de Cerejeira' },
        { id: 'fardo_nether', name: '§6[Fardo] §cRelíquias & Magma do Nether' },
        { id: 'fardo_end', name: '§6[Fardo] §5Cristais & Coro Astral do End' }
    ];

    packs.forEach(p => {
        event.create(p.id).displayName(p.name).maxStackSize(1);
    });

    // 6 Contratos de Moradia de NPCs da Cidade (Estilo Terraria)
    const contracts = [
        { id: 'contrato_armazem',    name: '§e📜 Contrato: Armazém Geral' },
        { id: 'contrato_guilda',     name: '§b📜 Contrato: Inspetor da Guilda' },
        { id: 'contrato_banco',      name: '§6📜 Contrato: Banqueiro Local' },
        { id: 'contrato_padre',      name: '§d📜 Contrato: Padre Curandeiro' },
        { id: 'contrato_ferreiro',   name: '§c📜 Contrato: Mestre da Forja' },
        { id: 'contrato_intendente', name: '§4📜 Contrato: Intendente de Guerra' }
    ];

    contracts.forEach(c => {
        event.create(c.id).displayName(c.name).glow(true).maxStackSize(1);
    });
});
