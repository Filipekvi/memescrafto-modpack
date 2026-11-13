// Gerenciamento e Spawning dos Easy NPCs da Capital com Diálogos Nativos em Alto Contraste (§0 Preto)

function getNpcDialogData(type) {
    if (type === 'padre') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Catedral da Luz",Texts:[{Text:"§4§lCATEDRAL DA LUZ"},{Text:"§0Bem-vindo à Casa Sagrada, viajante."},{Text:"§0Que as bênçãos dos Antigos purifiquem seu corpo e alma de todos os males do mundo."}],Buttons:[{Label:"b_heal",Name:"Receber Bênção",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/bencao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc padre @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'arauto') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Quadro de Avisos da Coroa",Texts:[{Text:"§6§l📜 QUADRO DE AVISOS REAIS"},{Text:"§0Contratos imperiais diários para mercadores, caçadores e cozinheiros do reino."},{Text:"§0Cumpra as tarefas do dia para receber moedas e tokens de prestígio!"}],Buttons:[{Label:"b_see",Name:"Ver Contratos",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos ver @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_c1",Name:"Entregar Contrato 1",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos entregar 1 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_c2",Name:"Entregar Contrato 2",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos entregar 2 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_c3",Name:"Entregar Contrato 3",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/contratos entregar 3 @initiator"},{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'guilda') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Guilda Mercante",Texts:[{Text:"§1§lGUILDA MERCANTE"},{Text:"§0Saudações, mercador! Nossos entrepostos precisam de suprimentos de todos os biomas."},{Text:"§0Traga seus fardos de carga de terras distantes para obter o maior lucro!"}],Buttons:[{Label:"b_deliver",Name:"Entregar Fardo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/entregar_fardo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_quote",Name:"Cotação da Bolsa",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/cotacao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc guilda @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'ferreiro') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Forja Mística",Texts:[{Text:"§0§lFORJA MÍSTICA DOS CAMPEÕES"},{Text:"§0Posso consagrar suas Armas, Escudos e Armaduras em até Tier V Mítico usando Moedas de Ouro, Emblemas do Gladiador e Catalisadores."},{Text:"§0Segure seu equipamento na mão principal!"}],Buttons:[{Label:"b_info",Name:"Consultar Custo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/forja info @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_forge",Name:"Consagrar Item",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/forja aprimorar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc ferreiro @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'arena') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Coliseu",Texts:[{Text:"§4§lCOLISEU DOS CAMPEÕES"},{Text:"§0Aqui apenas os guerreiros mais bravos entram no combate! Duelos honrosos de 1v1 sem perda de inventário."},{Text:"§0O vencedor conquista Moedas e Emblemas do Gladiador para aprimorar suas armas!"}],Buttons:[{Label:"b_rules",Name:"Regras do Duelo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/duelo regras @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rank",Name:"Ver Rankings",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/ranking arena @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'banco') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Banco Real",Texts:[{Text:"§0§lBANCO REAL DA CAPITAL"},{Text:"§0Saudações, cidadão. O Banco Real troca seu ouro bruto por moedas de circulação e disponibiliza terminais para a guarda de suas economias."}],Buttons:[{Label:"b_rate",Name:"Cotação do Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/banco cotacao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_swap",Name:"Trocar Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/banco trocar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc banco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}';
    }

    if (type === 'armazem') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Armazém Geral",Texts:[{Text:"§6§lARMAZÉM GERAL DA VILA"},{Text:"§0Saudações, viajante! Temos mantimentos, ferramentas e utilidades essenciais para a sua jornada."},{Text:"§88% do valor de todas as compras é retido para o Tesouro Municipal!"}],Buttons:[{Label:"b_cat_tools",Name:"Ferramentas",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"ferramentas"}]},{Label:"b_cat_food",Name:"Alimentos",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"alimentos"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc armazem @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]},{Label:"ferramentas",Name:"Ferramentas",Texts:[{Text:"§0§lSUPRIMENTOS DE VIAGEM"},{Text:"§0Escolha o item utilitário que deseja comprar:"}],Buttons:[{Label:"b_buy_torch",Name:"16x Tochas (4 Cobre)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem tocha @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_saddle",Name:"1x Sela (5 Ferro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem sela @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_lead",Name:"1x Laço (2 Ferro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem laco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_arrow",Name:"16x Flechas (4 Ferro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem flecha @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_bucket",Name:"1x Balde (2 Ferro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem balde @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_back_tools",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"alimentos",Name:"Alimentos",Texts:[{Text:"§0§lALIMENTOS E CAMPO"},{Text:"§0Escolha os mantimentos que deseja adquirir:"}],Buttons:[{Label:"b_buy_bread",Name:"8x Pães (5 Cobre)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem pao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_apple",Name:"4x Maçãs (4 Cobre)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem maca @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_hay",Name:"16x Feno (3 Ferro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem feno @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_buy_bottle",Name:"3x Frascos (2 Cobre)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/comprar_armazem frasco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_back_food",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]}]}';
    }

    if (type === 'intendente') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Intendente de Guerra",Texts:[{Text:"§4§l⚔ INTENDÊNCIA MILITAR & MERCENÁRIOS"},{Text:"§0Saudações, comandante! Sou o Intendente encarregado das forças especiais de cerco."},{Text:"§0Diferente dos guardas comuns de patrulha, minhas tropas mercenárias entram em combate exclusivamente durante Cercos Territoriais para defender sua praça ou marchar no ataque!"}],Buttons:[{Label:"b_def",Name:"Guarnição Defensiva",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"defesa"}]},{Label:"b_atk",Name:"Batalhão de Assalto",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"ataque"}]},{Label:"b_stat",Name:"Status das Tropas",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente status @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_move",Name:"Mudar Ponto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem recolher_npc intendente @initiator"},{Type:"CLOSE_DIALOG"}]}]},{Label:"defesa",Name:"Guarnição de Reserva",Texts:[{Text:"§0§l🛡️ GUARNIÇÃO DE RESERVA (DEFESA)"},{Text:"§0Tropas em prontidão no quartel. Se sua vila sofrer um Cerco Territorial, elas surgem imediatamente na Praça Central para expulsar os invasores do anel de 12m!"},{Text:"§8O contrato dura até o próximo cerco ser concluído."}],Buttons:[{Label:"b_d1",Name:"4x Infantaria (15 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar defesa_leve @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_d2",Name:"6x Elite Pesada (25 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar defesa_pesada @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_d3",Name:"10x Guarda Real (40 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar defesa_real @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_d_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"ataque",Name:"Batalhão de Assalto",Texts:[{Text:"§0§l⚔️ BATALHÃO DE ASSALTO (ATAQUE)"},{Text:"§0Contrate mercenários de vanguarda. No instante em que você soprar o Clarim de Cerco contra uma vila inimiga, eles surgirão ao seu lado para tomar a praça!"},{Text:"§8Você também pode adquirir um Clarim de Cerco aqui."}],Buttons:[{Label:"b_a1",Name:"4x Invasores (20 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar ataque_leve @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_a2",Name:"6x Vanguarda (32 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente contratar ataque_pesado @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_a3",Name:"Clarim de Cerco (30 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/intendente comprar_clarim @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_a_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]}]}';
    }

    if (type === 'totem') {
        return '{Type:"STANDARD",Default:"main",DialogDataSet:[{Label:"main",Name:"Totem do Reino",Texts:[{Text:"§0§l👑 SOBERANIA TERRITORIAL"},{Text:"§0Monumento de Soberania Territorial perante a Coroa Real."},{Text:"§0Governe o território, contrate novos cidadãos profissionais, financie o tesouro e controle as proteções locais da cidade."},{Text:"§8Limite: 1 Vila por Clã | 8% de imposto retido ao Tesouro Municipal."}],Buttons:[{Label:"b_treasury",Name:"Tesouro Municipal",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"tesouro"}]},{Label:"b_recruit",Name:"Atrair Cidadãos",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"contratacao"}]},{Label:"b_panel",Name:"Proteções Locais",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"protecoes"}]},{Label:"b_gov",Name:"Gestão do Reino",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"governo"}]}]},{Label:"tesouro",Name:"Tesouro Municipal",Texts:[{Text:"§0§lTESOURO MUNICIPAL DA VILA"},{Text:"§0Gerencie os recursos financeiros da sua cidade perante a Coroa:"}],Buttons:[{Label:"b_t_dep",Name:"Menu de Depósito",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"deposito"}]},{Label:"b_t_saq",Name:"Menu de Saque",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"saque"}]},{Label:"b_t_upg",Name:"Evoluir Cidade",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem evoluir @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_t_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"governo",Name:"Gestão do Reino",Texts:[{Text:"§0§lGESTÃO DA SOBERANIA"},{Text:"§0Consulte os rankings oficiais do reino ou reivindique o governo desta vila perante a Coroa:"}],Buttons:[{Label:"b_g_claim",Name:"Reivindicar Vila",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem reivindicar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_g_rank",Name:"Rankings do Reino",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/ranking cidades @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_g_info",Name:"Estatuto da Cidade",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem info @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_g_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"contratacao",Name:"Atrair Profissionais",Texts:[{Text:"§0§lCONTRATAR PROFISSIONAIS (PÁG. 1/2)"},{Text:"§0Atraia novos especialistas para residirem na sua cidade estilo Terraria!"},{Text:"§0Você receberá um Contrato de Moradia para posicioná-los onde quiser:"}],Buttons:[{Label:"b_rec_armazem",Name:"Armazém (8 Ald | 5 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar armazem @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_guilda",Name:"Guilda (12 Ald | 10 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar guilda @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_banco",Name:"Banco (18 Ald | 15 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar banco @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_more",Name:"Mais Especialistas ->",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"contratacao2"}]}]},{Label:"contratacao2",Name:"Especialistas Avançados",Texts:[{Text:"§0§lCONTRATAR PROFISSIONAIS (PÁG. 2/2)"},{Text:"§0Especialistas militares, religiosos e mestres artesãos para sua metrópole:"}],Buttons:[{Label:"b_rec_int",Name:"Intendente (14 Ald | 15 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar intendente @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_padre",Name:"Padre (20 Ald | 12 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar padre @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_ferreiro",Name:"Forja (25 Ald | 25 Ouro)",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem contratar ferreiro @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_rec_back2",Name:"<- Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"deposito",Name:"Depósito no Tesouro",Texts:[{Text:"§0§lDEPÓSITO NO TESOURO DA VILA"},{Text:"§0Escolha a quantidade de moedas de ouro que deseja transferir para os cofres da cidade:"}],Buttons:[{Label:"b_dep_1",Name:"Depositar 1 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem depositar 1 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_dep_5",Name:"Depositar 5 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem depositar 5 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_dep_all",Name:"Depositar Tudo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem depositar tudo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_dep_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"saque",Name:"Saque do Tesouro",Texts:[{Text:"§0§lSAQUE DO TESOURO DA VILA"},{Text:"§0Escolha a quantidade de moedas que deseja retirar do cofre da vila:"}],Buttons:[{Label:"b_saq_1",Name:"Sacar 1 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar 1 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_saq_5",Name:"Sacar 5 Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar 5 @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_saq_all",Name:"Sacar Saldo Total",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar tudo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_saq_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]},{Label:"protecoes",Name:"Painel de Proteções",Texts:[{Text:"§0§lPAINEL DE PROTEÇÃO TERRITORIAL"},{Text:"§0Clique nas opções abaixo para alternar as restrições para visitantes forasteiros:"}],Buttons:[{Label:"b_tog_break",Name:"Alternar Quebra",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem toggle quebrar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_tog_place",Name:"Alternar Colocação",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem toggle colocar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_tog_pvp",Name:"Alternar PVP",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem toggle pvp @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_back",Name:"Voltar",Type:"DEFAULT",Actions:[{Type:"OPEN_NAMED_DIALOG",Cmd:"main"}]}]}]}';
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
        totem: 'Emissário da Soberania',
        intendente: 'Intendente de Guerra',
        arauto: 'Arauto dos Avisos Reais'
    };

    let name = names[type] || 'NPC';

    let skinData = '';
    let equipment = '';

    if (type === 'totem') {
        skinData = ',SkinData:{Type:"PLAYER_SKIN",Name:"LQrd_Akayaa"}';
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
    }

    return `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"${name}","color":"#FFFF00","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:${dialog}${equipment}${skinData}}`;
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
                                (type === 'armazem' && n.includes('Armazém'))) {
                                ent.discard();
                            }
                        }
                    }
                });
            } catch(e) {}

            server.runCommandSilent(`summon easy_npc:humanoid ${x} ${y} ${z} ${nbt}`);
            player.tell(`§a[NPC] ${type.toUpperCase()} invocado com sucesso (visual oficial e diálogos ativos)!`);
            player.playSound('minecraft:block.bell.use', 1.0, 1.0);
            return 1;
        }

        player.tell('§cUso: /spawn_npc <padre | guilda | ferreiro | arena | banco | armazem | intendente | arauto | totem | wand>');
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
