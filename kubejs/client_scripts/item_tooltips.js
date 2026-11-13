// Legendas e Descrições Detalhadas de RPG para Itens do KubeJS

ItemEvents.tooltip(event => {
    // 1. Emblema do Gladiador
    event.add('kubejs:token_gladiador', [
        Text.gold('★ Concedido aos campeões das arenas e coliseus.'),
        Text.yellow('Utilizado pelo Mestre Armeiro na Forja Mística para consagrar armas e armaduras.'),
        Text.darkGray('Origem: Batalhas Honrosas do Coliseu')
    ]);

    // 2. Itens de Soberania & Cerco Territorial
    event.add('kubejs:marco_fundacao', [
        Text.gold('👑 Símbolo de Fundação Territorial'),
        Text.gray('Use com o botão direito próximo ao Sino de uma vila viva (5+ Aldeões)'),
        Text.gray('para invocar o Emissário da Soberania e reivindicar o governo.'),
        Text.red('⚠ Bloqueado próximo a masmorras ou spawners!')
    ]);

    event.add('kubejs:clarim_cerco', [
        Text.red('📯 Instrumento de Declaração de Cerco Territorial'),
        Text.gray('Toque nos arredores de uma vila rival (com defensores online)'),
        Text.gray('para iniciar um Cerco de 20 minutos pela posse da cidade!'),
        Text.yellow('Domine a Zona de Controle de 12 blocos ao redor do Emissário para vencer.')
    ]);

    // 3. Catalisadores de Bioma e Dimensão
    const catalysts = {
        'catalisador_planicie': { bioma: 'Planícies', desc: 'Essência da flora campestre e ventos abertos.' },
        'catalisador_floresta': { bioma: 'Florestas', desc: 'Coração lenhoso de árvores ancestrais.' },
        'catalisador_deserto': { bioma: 'Desertos', desc: 'Calor concentrado das areias escaldantes.' },
        'catalisador_tundra': { bioma: 'Tundras', desc: 'Geada perene das terras polares.' },
        'catalisador_selva': { bioma: 'Selvas Tropicais', desc: 'Seiva densa da vegetação tropical e bambuzais.' },
        'catalisador_pantano': { bioma: 'Pântanos', desc: 'Lodo místico e essência das águas turvas.' },
        'catalisador_badlands': { bioma: 'Terras Ermas', desc: 'Terracota rubra e minérios vulcânicos.' },
        'catalisador_oceano': { bioma: 'Oceanos', desc: 'Pressão das profundezas abissais e corais.' },
        'catalisador_montanha': { bioma: 'Picos Nevados', desc: 'Pureza dos cumes rochosos e quartzo alpino.' },
        'catalisador_cerejeira': { bioma: 'Bosques de Cerejeira', desc: 'Pétalas sagradas e orvalho rosado.' },
        'catalisador_nether': { bioma: 'Dimensão do Nether', desc: 'Brasa vulcânica e enxofre abissal.' },
        'catalisador_end': { bioma: 'Dimensão do End', desc: 'Poeira estelar do vazio primordial.' }
    };

    for (let id in catalysts) {
        let cat = catalysts[id];
        event.add('kubejs:' + id, [
            Text.darkAqua('🔮 Catalisador Elemental'),
            Text.gray(cat.desc),
            Text.yellow('Origem Nativa: ' + cat.bioma),
            Text.darkGray('Material da Forja Mística (Armas & Armaduras Tier I ao V)')
        ]);
    }

    // 4. Fardos Comerciais
    const fardos = {
        'fardo_planicie': 'Cereal nobre, fardos de feno e tecidos agrícolas.',
        'fardo_floresta': 'Madeira nobre, resinas e frutos silvestres.',
        'fardo_deserto': 'Vidro soprado, temperos secos e cerâmica.',
        'fardo_tundra': 'Peles espessas, gelo preservado e tecidos nórdicos.',
        'fardo_selva': 'Cacau raro, bambu trabalhado e frutas exóticas.',
        'fardo_pantano': 'Ervas medicinais raras, turfa e lodo alquímico.',
        'fardo_badlands': 'Argila queimada, cerâmica policromática e ouro bruto.',
        'fardo_oceano': 'Pérolas, conchas das profundezas e sal marinho.',
        'fardo_montanha': 'Minérios nobres de alta pureza e gemas brutas.',
        'fardo_cerejeira': 'Pétalas perfumadas, madeira rosada e mel silvestre.',
        'fardo_nether': 'Quartzo infernal, lágrima de ghast e creme de magma.',
        'fardo_end': 'Frutas do coro cristalizadas e pedra do fim polida.'
    };

    for (let id in fardos) {
        event.add('kubejs:' + id, [
            Text.gold('📦 Fardo Comercial Pesado'),
            Text.gray(fardos[id]),
            Text.red('⚠ Carga Pesada: Aplica lentidão física a pé.'),
            Text.green('✔ Transporte em carroças, navios ou montarias.'),
            Text.yellow('Entregue a um Inspetor da Guilda Mercante para lucrar moedas.')
        ]);
    }
    // 4. Contratos de Moradia de NPCs da Cidade
    const contracts = {
        'contrato_armazem': { role: 'Armazém Geral', desc: 'Vendedor local de suprimentos básicos (tochas, comida, ferramentas).' },
        'contrato_guilda':  { role: 'Inspetor da Guilda Mercante', desc: 'Permite entregar cargas comerciais locais sem ir à Capital.' },
        'contrato_banco':   { role: 'Banqueiro da Coroa', desc: 'Oferece câmbio de barras de ouro mineradas por moedas da cidade.' },
        'contrato_padre':   { role: 'Padre Curandeiro', desc: 'Concede bênção sagrada e cura completa a viajantes e cidadãos.' },
        'contrato_ferreiro':   { role: 'Mestre da Forja', desc: 'Instala uma filial da Forja Mística (Tiers I a V) na sua cidade.' },
        'contrato_intendente': { role: 'Intendente de Guerra', desc: 'Recruta tropas mercenárias de cerco (defesa e ataque) e vende Clarins de Cerco.' }
    };

    for (let id in contracts) {
        let c = contracts[id];
        event.add('kubejs:' + id, [
            Text.gold('📜 Contrato de Moradia Municipal'),
            Text.yellow('Profissional: ' + c.role),
            Text.gray(c.desc),
            Text.aqua('Clique com o Botão Direito no chão da sua vila para posicioná-lo!')
        ]);
    }
});
