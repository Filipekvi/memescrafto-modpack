// Gerenciamento e Spawning dos Easy NPCs da Capital com Diálogos Nativos em Alto Contraste (§0 Preto)

function getNpcDialogData(type) {
    if (type === 'padre') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Catedral da Luz",Texts:[{Text:"§4§lCatedral da Luz\\\\n§0Que a paz dos Antigos repouse sobre ti, viajante.\\\\n§0Aproxima-te do altar se o cansaço ou as feridas pesarem em tua jornada."}],Buttons:[{Label:"b_heal",Name:"Receber Bênção",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/bencao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc padre @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'arauto') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Quadro de Avisos da Coroa",Texts:[{Text:"§6§lQuadro de Avisos da Coroa\\\\n§0Ouçam todos! A Coroa recompensa os bravos que trazem suprimentos e limpam as estradas do reino.\\\\n§0Escolhe um contrato do dia e prova teu valor!"}],Buttons:[{Label:"b_see",Name:"Ver Contratos",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos ver @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_c1",Name:"Contrato 1",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos entregar 1 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_c2",Name:"Contrato 2",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos entregar 2 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_c3",Name:"Contrato 3",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos entregar 3 @initiator"},{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'guilda') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Guilda Mercante",Texts:[{Text:"§1§lGuilda Mercante\\\\n§0Saudações, mercador! Nossas caravanas aguardam fardos raros dos confins do mapa.\\\\n§0Quanto mais distante a origem da tua carga, maior será a bolsa de moedas!"}],Buttons:[{Label:"b_deliver",Name:"Entregar Fardo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/entregar_fardo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_quote",Name:"Ver Cotação",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/cotacao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc guilda @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'ferreiro') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Forja Mística",Texts:[{Text:"§0§lForja Mística dos Campeões\\\\n§0O aço comum dobra diante das trevas, mas o fogo antigo consagra tua lâmina até o Tier V.\\\\n§0Empunha teu equipamento na mão principal e veremos do que é feito!"}],Buttons:[{Label:"b_info",Name:"Consultar Custo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/forja info @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_forge",Name:"Consagrar Item",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/forja aprimorar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc ferreiro @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'arena') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Coliseu",Texts:[{Text:"§4§lColiseu dos Campeões\\\\n§0Aqui não há desculpas, apenas lâmina contra lâmina em duelos honrosos de 1v1!\\\\n§0Desafia um rival, aposta teu ouro e conquista Emblemas do Gladiador."}],Buttons:[{Label:"b_rules",Name:"Regras do Duelo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/duelo regras @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rank",Name:"Ver Rankings",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/ranking arena @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'banco') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Banco Real",Texts:[{Text:"§0§lBanco Real da Capital\\\\n§0Ouro bruto pesa no alforje e atrai olhos cobiçosos, cidadão.\\\\n§0Aqui trocamos tuas barras por moedas cunhadas da Coroa conforme a cotação do dia."}],Buttons:[{Label:"b_rate",Name:"Cotação do Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/banco cotacao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_swap",Name:"Trocar Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/banco trocar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc banco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'armazem') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Armazém Geral",Texts:[{Text:"§6§lArmazém Geral\\\\n§0Entra, viajante! Temos tochas para as cavernas, selas para tua montaria e pão quente na prateleira.\\\\n§0Todo comércio aqui fortalece os cofres desta cidade."}],Buttons:[{Label:"b_cat_tools",Name:"Ferramentas",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"ferramentas"}]},{Label:"b_cat_food",Name:"Alimentos",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"alimentos"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc armazem @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]},{Label:"ferramentas",Name:"Ferramentas",Texts:[{Text:"§0§lSuprimentos de Viagem\\\\n§0Escolhe com calma o que precisas antes de pegar a estrada:"}],Buttons:[{Label:"b_buy_torch",Name:"16x Tochas (4 Cu)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem tocha @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_saddle",Name:"1x Sela (5 Fe)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem sela @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_lead",Name:"1x Laço (2 Fe)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem laco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_arrow",Name:"16x Flechas (4 Fe)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem flecha @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_bucket",Name:"1x Balde (2 Fe)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem balde @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_back_tools",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"alimentos",Name:"Alimentos",Texts:[{Text:"§0§lDespensa e Campo\\\\n§0Mantimentos frescos para aguentar longas marchas:"}],Buttons:[{Label:"b_buy_bread",Name:"8x Pães (5 Cu)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem pao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_apple",Name:"4x Maçãs (4 Cu)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem maca @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_hay",Name:"16x Feno (3 Fe)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem feno @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_bottle",Name:"3x Frascos (2 Cu)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem frasco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_back_food",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]}]}';
    }

    if (type === 'fazendeiro') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Feirante Agrícola",Texts:[{Text:"§2§lFeirante Agrícola\\\\n§0Bom dia, lavrador! A terra hoje está pedindo sementes novas.\\\\n§0Escolhe tuas mudas na barraca ou traz caixas de colheita que eu pago na hora!"}],Buttons:[{Label:"b_seeds",Name:"Comprar Sementes",Type:"DEFAULT",Actions:[{Type:"OPEN_TRADING_SCREEN"}]},{Label:"b_sell",Name:"Vender Caixas",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/fazendeiro vender @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_table",Name:"Tabela e Cota",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/fazendeiro tabela @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc fazendeiro @initiator"},{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'intendente') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Intendente de Guerra",Texts:[{Text:"§4§lIntendência Militar\\\\n§0Sentido, comandante! Minhas companhias de mercenários aguardam o toque do Clarim.\\\\n§0Prepara tua defesa ou marcha sobre terras rivais!"}],Buttons:[{Label:"b_def",Name:"Defesa da Vila",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"defesa"}]},{Label:"b_atk",Name:"Tropas de Ataque",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"ataque"}]},{Label:"b_stat",Name:"Status das Tropas",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente status @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc intendente @initiator"},{Type:"CLOSE_DIALOG"}]}]},{Label:"defesa",Name:"Guarnição de Reserva",Texts:[{Text:"§0§lGuarnição de Reserva\\\\n§0Soldados prontos para surgir na Praça Central caso tua cidade sofra um cerco:"}],Buttons:[{Label:"b_d1",Name:"4x Guardas (15g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar defesa_leve @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_d2",Name:"6x Elite (25g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar defesa_pesada @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_d3",Name:"10x Real (40g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar defesa_real @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_d_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"ataque",Name:"Batalhão de Assalto",Texts:[{Text:"§0§lBatalhão de Assalto\\\\n§0Mercenários de vanguarda que marcham contigo ao soprar o Clarim de Cerco:"}],Buttons:[{Label:"b_a1",Name:"4x Invasores (20g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar ataque_leve @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_a2",Name:"6x Vanguarda (32g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar ataque_pesado @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_a3",Name:"Clarim (30 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente comprar_clarim @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_a_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]}]}';
    }

    if (type === 'totem') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Totem do Reino",Texts:[{Text:"§0§lSoberania Territorial\\\\n§0Diante deste marco repousa a autoridade da Coroa sobre estas terras.\\\\n§0Administra o tesouro municipal, atrai cidadãos ilustres e protege as fronteiras da tua cidade."}],Buttons:[{Label:"b_treasury",Name:"Tesouro Municipal",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"tesouro"}]},{Label:"b_recruit",Name:"Atrair Cidadãos",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"contratacao"}]},{Label:"b_panel",Name:"Proteções Locais",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"protecoes"}]},{Label:"b_gov",Name:"Gestão do Reino",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"governo"}]}]},{Label:"tesouro",Name:"Tesouro Municipal",Texts:[{Text:"§0§lTesouro Municipal\\\\n§0Gerencia as reservas financeiras da tua cidade perante a Coroa:"}],Buttons:[{Label:"b_t_dep",Name:"Depositar Ouro",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"deposito"}]},{Label:"b_t_saq",Name:"Sacar Ouro",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"saque"}]},{Label:"b_t_upg",Name:"Evoluir Cidade",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem evoluir @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_t_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"governo",Name:"Gestão do Reino",Texts:[{Text:"§0§lGestão da Soberania\\\\n§0Consulta os rankings oficiais do reino ou reivindica o governo desta vila:"}],Buttons:[{Label:"b_g_claim",Name:"Reivindicar Vila",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem reivindicar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_g_rank",Name:"Rankings do Reino",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/ranking cidades @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_g_info",Name:"Estatuto da Vila",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem info @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_g_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"contratacao",Name:"Atrair Profissionais",Texts:[{Text:"§0§lContratar Profissionais (1/2)\\\\n§0Atrai novos especialistas para residirem na tua cidade:"}],Buttons:[{Label:"b_rec_armazem",Name:"Armazém (5g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar armazem @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_faz",Name:"Feirante (8g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar fazendeiro @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_guilda",Name:"Guilda (50g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar guilda @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_more",Name:"Mais ->",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"contratacao2"}]}]},{Label:"contratacao2",Name:"Especialistas Avançados",Texts:[{Text:"§0§lContratar Profissionais (2/2)\\\\n§0Especialistas militares, religiosos e mestres artesãos:"}],Buttons:[{Label:"b_rec_banco",Name:"Banco (15g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar banco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_int",Name:"Intendente (15g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar intendente @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_padre",Name:"Padre (12g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar padre @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_ferreiro",Name:"Forja (50g)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar ferreiro @initiator"},{Type:"CLOSE_DIALOG"}]}]},{Label:"deposito",Name:"Depósito no Tesouro",Texts:[{Text:"§0§lDepósito no Tesouro\\\\n§0Transfere moedas de ouro do teu inventário para o cofre da cidade:"}],Buttons:[{Label:"b_dep_1",Name:"Depositar 1 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem depositar 1 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_dep_5",Name:"Depositar 5 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem depositar 5 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_dep_all",Name:"Depositar Tudo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem depositar tudo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_dep_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"saque",Name:"Saque do Tesouro",Texts:[{Text:"§0§lSaque do Tesouro\\\\n§0Retira moedas de ouro do cofre municipal:"}],Buttons:[{Label:"b_saq_1",Name:"Sacar 1 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar 1 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_saq_5",Name:"Sacar 5 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar 5 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_saq_all",Name:"Sacar Tudo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar tudo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_saq_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"protecoes",Name:"Painel de Proteções",Texts:[{Text:"§0§lProteção Territorial\\\\n§0Alterna as permissões para forasteiros dentro dos limites da vila:"}],Buttons:[{Label:"b_tog_break",Name:"Modo Quebrar",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem toggle quebrar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_tog_place",Name:"Modo Colocar",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem toggle colocar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_tog_pvp",Name:"Modo PVP",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem toggle pvp @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]}]}';
    }

    return null;
}
global.getNpcDialogData = getNpcDialogData;

function isPlayerNearNpc(player, keywords, maxDist) {
    if (!player) return false;
    let isOp = player.op || (player.hasPermissions && player.hasPermissions(2));
    if (isOp && player.isCreative()) return true;
    let r = maxDist || 12;
    let box = player.boundingBox.inflate(r);
    let entities = player.level.getEntitiesWithin(box);
    for (let i = 0; i < entities.length; i++) {
        let e = entities[i];
        if (String(e.type).startsWith('easy_npc:')) {
            if (!keywords || keywords.length === 0) return true;
            let name = e.customName ? e.customName.string.toLowerCase() : (e.name ? e.name.string.toLowerCase() : '');
            for (let k = 0; k < keywords.length; k++) {
                if (name.includes(keywords[k].toLowerCase())) return true;
            }
        }
    }
    return false;
}
global.isPlayerNearNpc = isPlayerNearNpc;

function getNpcNbt(type) {
    let dialog = getNpcDialogData(type);
    if (!dialog) return null;

    let names = {
        padre: 'Padre Bento',
        guilda: 'Inspetor da Guilda Mercante',
        ferreiro: 'Mestre Armeiro da Forja',
        arena: 'Mestre da Arena',
        banco: 'Banqueiro da Coroa',
        armazem: 'Armazém Geral da Vila',
        fazendeiro: 'Feirante Agrícola',
        totem: 'Emissário da Soberania',
        intendente: 'Intendente de Guerra',
        arauto: 'Arauto dos Avisos Reais'
    };

    let name = names[type] || 'NPC';

    let skinData = '';
    let equipment = '';
    let tradingData = '';

    if (type === 'totem') {
        skinData = ',SkinData:{Type:"PLAYER_SKIN",Content:"",UUID:[I;1125640721,-981514163,-1786627482,732956170],Timestamp:1794327357573L,URL:"",Name:""}';
        equipment = ',HandItems:[{id:"spartanweaponry:aluminum_halberd",Count:1b,tag:{Damage:0}},{id:"spartanshields:bronze_basic_shield",Count:1b,tag:{Damage:0}}],ArmorItems:[{id:"minecraft:golden_boots",Count:1b,tag:{Damage:0}},{id:"minecraft:chainmail_leggings",Count:1b,tag:{Damage:0}},{id:"minecraft:chainmail_chestplate",Count:1b,tag:{Damage:0}},{id:"minecraft:golden_helmet",Count:1b,tag:{Damage:0}}]';
    } else if (type === 'arauto') {
        skinData = ',SkinData:{Type:"SECURE_REMOTE_URL",URL:"https://www.minecraftskins.com/uploads/skins/2026/02/05/bailiff-23845125.png?v977",Name:"bousfer"}';
        equipment = ',HandItems:[{id:"minecraft:writable_book",Count:1b},{id:"minecraft:feather",Count:1b}],ArmorItems:[{id:"minecraft:leather_boots",Count:1b,tag:{Damage:0,display:{color:16753920}}},{id:"minecraft:leather_leggings",Count:1b,tag:{Damage:0,display:{color:16753920}}},{id:"minecraft:leather_chestplate",Count:1b,tag:{Damage:0,display:{color:16753920}}},{id:"minecraft:leather_helmet",Count:1b,tag:{Damage:0,display:{color:16753920}}}]';
    } else if (type === 'intendente') {
        skinData = ',SkinData:{Type:"SECURE_REMOTE_URL",URL:"https://www.minecraftskins.com/uploads/skins/2026/11/12/medieval-elf--blue-eyes-24452483.png?v977",Name:"MHF_Knight"}';
        equipment = ',HandItems:[{},{id:"spartanshields:iron_tower_shield",Count:1b,tag:{Damage:0}}],ArmorItems:[{id:"minecraft:iron_boots",Count:1b,tag:{Damage:0}},{id:"minecraft:iron_leggings",Count:1b,tag:{Damage:0}},{id:"minecraft:iron_chestplate",Count:1b,tag:{Damage:0}},{id:"minecraft:chainmail_helmet",Count:1b,tag:{Damage:0}}]';
    } else if (type === 'padre') {
        skinData = ',SkinData:{Type:"PLAYER_SKIN",Name:"HQmm1"}';
        equipment = ',HandItems:[{id:"minecraft:enchanted_book",Count:1b},{}],ArmorItems:[{id:"minecraft:leather_boots",Count:1b,tag:{display:{color:16777215}}},{id:"minecraft:leather_leggings",Count:1b,tag:{display:{color:16777215}}},{id:"minecraft:leather_chestplate",Count:1b,tag:{display:{color:16777215}}},{}]';
    } else if (type === 'ferreiro') {
        skinData = ',SkinData:{Type:"PLAYER_SKIN",Name:"dajocooll1"}';
        equipment = ',HandItems:[{id:"spartanweaponry:warhammer_iron",Count:1b},{}],ArmorItems:[{id:"minecraft:iron_boots",Count:1b},{id:"minecraft:leather_leggings",Count:1b},{id:"minecraft:leather_chestplate",Count:1b},{id:"minecraft:iron_helmet",Count:1b}]';
    } else if (type === 'guilda') {
        skinData = ',SkinData:{Type:"PLAYER_SKIN",Name:"bousfer"}';
        equipment = ',HandItems:[{id:"minecraft:spyglass",Count:1b},{id:"minecraft:compass",Count:1b}],ArmorItems:[{id:"minecraft:leather_boots",Count:1b},{id:"minecraft:leather_leggings",Count:1b},{id:"minecraft:leather_chestplate",Count:1b},{id:"minecraft:leather_helmet",Count:1b}]';
    } else if (type === 'arena') {
        skinData = ',SkinData:{Type:"DEFAULT"}';
        equipment = ',HandItems:[{id:"spartanweaponry:sword_iron",Count:1b},{id:"minecraft:shield",Count:1b}],ArmorItems:[{id:"minecraft:iron_boots",Count:1b},{id:"minecraft:iron_leggings",Count:1b},{id:"minecraft:iron_chestplate",Count:1b},{id:"minecraft:iron_helmet",Count:1b}]';
    } else if (type === 'banco') {
        skinData = ',SkinData:{Type:"DEFAULT"}';
        equipment = ',HandItems:[{id:"minecraft:gold_ingot",Count:1b},{}],ArmorItems:[{id:"minecraft:golden_boots",Count:1b},{id:"minecraft:golden_leggings",Count:1b},{id:"minecraft:golden_chestplate",Count:1b},{id:"minecraft:golden_helmet",Count:1b}]';
    } else if (type === 'armazem') {
        skinData = ',SkinData:{Type:"DEFAULT"}';
        equipment = ',HandItems:[{id:"minecraft:bundle",Count:1b},{id:"minecraft:bread",Count:1b}],ArmorItems:[{id:"minecraft:leather_boots",Count:1b},{id:"minecraft:leather_leggings",Count:1b},{id:"minecraft:leather_chestplate",Count:1b},{}]';
    } else if (type === 'fazendeiro') {
        skinData = ',SkinData:{Type:"DEFAULT"}';
        equipment = ',HandItems:[{id:"minecraft:iron_hoe",Count:1b,tag:{Damage:0}},{id:"minecraft:wheat",Count:1b}],ArmorItems:[{id:"minecraft:leather_boots",Count:1b,tag:{display:{color:6192150}}},{id:"minecraft:leather_leggings",Count:1b,tag:{display:{color:8606770}}},{id:"minecraft:leather_chestplate",Count:1b,tag:{display:{color:6192150}}},{id:"minecraft:leather_helmet",Count:1b,tag:{display:{color:16701501}}}]';
        tradingData = ',TradingData:{TradingDataSet:{Type:"BASIC",RewardedXP:0,MaxUses:32,ResetsEveryMin:60,LastReset:0L}},Offers:{Recipes:{Recipes:[{buy:{id:"lightmanscurrency:coin_copper",Count:2b},sell:{id:"farmersdelight:cabbage_seeds",Count:4b},maxUses:32,uses:0,xp:0,rewardExp:0b,priceMultiplier:0.0f},{buy:{id:"lightmanscurrency:coin_copper",Count:2b},sell:{id:"farmersdelight:tomato_seeds",Count:4b},maxUses:32,uses:0,xp:0,rewardExp:0b,priceMultiplier:0.0f},{buy:{id:"lightmanscurrency:coin_copper",Count:3b},sell:{id:"farmersdelight:onion",Count:4b},maxUses:32,uses:0,xp:0,rewardExp:0b,priceMultiplier:0.0f},{buy:{id:"lightmanscurrency:coin_copper",Count:3b},sell:{id:"farmersdelight:rice",Count:4b},maxUses:32,uses:0,xp:0,rewardExp:0b,priceMultiplier:0.0f}]},Inventory:{}}';
    }

    return `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"${name}","color":"#FFFF00","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:${dialog}${tradingData}${equipment}${skinData}}`;
}
global.getNpcNbt = getNpcNbt;

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function spawnNpc(type, player, server) {
        if (!player) return 0;
        let x = player.x.toFixed(2);
        let y = player.y.toFixed(2);
        let z = player.z.toFixed(2);

        if (type === 'wand') {
            player.give(Item.of('easy_npc:easy_npc_wand', 1));
            player.tell('§e[Easy NPC] Você recebeu a Varinha de Configuração de NPC (Easy NPC Wand)!');
            player.tell('§7Clique com o botão direito em qualquer Easy NPC para editar sua skin, nome, diálogos e botões.');
            return 1;
        }

        let nbt = getNpcNbt(type);
        if (nbt) {
            try {
                let entities = player.level.getEntities();
                entities.forEach(ent => {
                    if (ent && ent.type === 'easy_npc:humanoid') {
                        let dx = ent.x - player.x;
                        let dy = ent.y - player.y;
                        let dz = ent.z - player.z;
                        if (dx * dx + dy * dy + dz * dz <= 36) {
                            let n = ent.name ? ent.name.string : '';
                            if ((type === 'totem' && (n.includes('Soberania') || n.includes('Emissário'))) ||
                                (type === 'intendente' && n.includes('Intendente')) ||
                                (type === 'arauto' && (n.includes('Arauto') || n.includes('Avisos'))) ||
                                (type === 'padre' && n.includes('Padre')) ||
                                (type === 'guilda' && n.includes('Guilda')) ||
                                (type === 'ferreiro' && (n.includes('Forja') || n.includes('Armeiro'))) ||
                                (type === 'arena' && (n.includes('Arena') || n.includes('Coliseu'))) ||
                                (type === 'banco' && (n.includes('Banco') || n.includes('Banqueiro'))) ||
                                (type === 'armazem' && n.includes('Armazém')) ||
                                (type === 'fazendeiro' && (n.includes('Feirante') || n.includes('Fazendeiro')))) {
                                ent.discard();
                            }
                        }
                    }
                });
            } catch(e) {}

            let res = server.runCommand(`summon easy_npc:humanoid ${x} ${y} ${z} ${nbt}`);
            console.info(`[NPC] summon ${type} result: ${res}`);
            player.tell(`§a[NPC] ${type.toUpperCase()} invocado com sucesso (visual oficial e diálogos ativos)!`);
            player.playSound('minecraft:block.bell.use', 1.0, 1.0);
            return 1;
        }

        player.tell('§cUso: /spawn_npc <padre | guilda | ferreiro | arena | banco | armazem | fazendeiro | intendente | arauto | totem | wand>');
        return 0;
    }

    function getNpcTypeByName(name) {
        if (!name) return null;
        if (name.includes('Armeiro') || name.includes('Forja')) return 'ferreiro';
        if (name.includes('Intendente')) return 'intendente';
        if (name.includes('Arauto') || name.includes('Avisos')) return 'arauto';
        if (name.includes('Padre') || name.includes('Bento')) return 'padre';
        if (name.includes('Guilda') || name.includes('Inspetor')) return 'guilda';
        if (name.includes('Arena') || name.includes('Coliseu')) return 'arena';
        if (name.includes('Banco') || name.includes('Banqueiro')) return 'banco';
        if (name.includes('Armazém') || name.includes('Armazem')) return 'armazem';
        if (name.includes('Feirante') || name.includes('Fazendeiro')) return 'fazendeiro';
        if (name.includes('Totem') || name.includes('Soberania') || name.includes('Emissário')) return 'totem';
        return null;
    }

    function syncNpcDialog(ent, server) {
        if (!ent || !server || ent.type !== 'easy_npc:humanoid') return false;
        let name = ent.name ? ent.name.string : '';
        let type = getNpcTypeByName(name);
        if (!type) return false;
        let dialogData = getNpcDialogData(type);
        if (!dialogData) return false;
        try {
            server.runCommandSilent(`data modify entity ${ent.uuid.toString()} DialogData set value ${dialogData}`);
            return true;
        } catch(e) {
            console.error('[NPC Update Error] ' + e);
            return false;
        }
    }
    global.syncNpcDialog = syncNpcDialog;

    function atualizarNpcs(player, server) {
        let count = 0;
        let entities = [];
        try {
            if (player && player.level) {
                entities = player.level.getEntities();
            } else if (server.overworld()) {
                entities = server.overworld().getEntities();
            }
        } catch(e) {
            console.error('[NPCs] Erro ao buscar entidades: ' + e);
        }

        entities.forEach(ent => {
            if (ent && ent.type === 'easy_npc:humanoid') {
                if (player) {
                    let dx = ent.x - player.x;
                    let dz = ent.z - player.z;
                    if (dx * dx + dz * dz > 150 * 150) return;
                }
                if (syncNpcDialog(ent, server)) {
                    let name = ent.name ? ent.name.string : '';
                    console.log(`[NPC Update] ${name} (${ent.uuid.toString()}) atualizado com sucesso!`);
                    count++;
                }
            }
        });

        let msg = `§a[NPC] ${count} NPCs tiveram seus textos atualizados sem alterar suas skins ou dados!`;
        if (player) {
            player.tell(msg);
            player.playSound('minecraft:block.note_block.chime', 1.0, 1.2);
        } else {
            console.log(msg);
        }
        return count;
    }

    event.register(
        Commands.literal('atualizar_npcs')
            .requires(src => (src.player ? (src.player.op || src.player.isCreative()) : true))
            .executes(ctx => atualizarNpcs(ctx.source.player, ctx.source.server))
    );

    event.register(
        Commands.literal('onde_estou')
            .executes(ctx => {
                let p = ctx.source.player;
                if (!p) return 0;
                let b = p.block;
                let below = p.level.getBlock(p.x, p.y - 1, p.z);
                p.tell(`§e[Info] Coordenadas: §bX: ${Math.round(p.x)} Y: ${Math.round(p.y)} Z: ${Math.round(p.z)}`);
                p.tell(`§e[Info] Bloco abaixo de você: §a${below.id}`);
                p.tell(`§e[Info] Bioma: §a${p.level.getBiome(p.blockPosition()).unwrapKey().get().location().toString()}`);
                return 1;
            })
    );

    event.register(
        Commands.literal('spawn_npc')
            .requires(src => (src.player ? (src.player.op || src.player.isCreative()) : true))
            .then(Commands.literal('padre').executes(ctx => spawnNpc('padre', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('guilda').executes(ctx => spawnNpc('guilda', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('ferreiro').executes(ctx => spawnNpc('ferreiro', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('arena').executes(ctx => spawnNpc('arena', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('banco').executes(ctx => spawnNpc('banco', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('armazem').executes(ctx => spawnNpc('armazem', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('fazendeiro').executes(ctx => spawnNpc('fazendeiro', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('intendente').executes(ctx => spawnNpc('intendente', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('arauto').executes(ctx => spawnNpc('arauto', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('totem').executes(ctx => spawnNpc('totem', ctx.source.player, ctx.source.server)))
            .then(Commands.literal('wand').executes(ctx => spawnNpc('wand', ctx.source.player, ctx.source.server)))
            .executes(ctx => spawnNpc('help', ctx.source.player, ctx.source.server))
    );
});

EntityEvents.spawned('easy_npc:humanoid', event => {
    if (event.server && global.syncNpcDialog) {
        global.syncNpcDialog(event.entity, event.server);
    }
});
