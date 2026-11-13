// Construtor Modular da Capital - Memescrafto RPG
// Constrói cada prédio individualmente onde o jogador estiver olhando
// Inclui fundação inteligente anti-flutuação e spawn automático de Easy NPCs configurados

function fillFoundation(server, minX, maxX, minZ, maxZ, floorY, blockType) {
    // Para cada coluna X, Z preenche para baixo caso o terreno seja em declive ou água
    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
            server.runCommandSilent(`execute positioned ${x} ${floorY} ${z} run setblock ~ ~-1 ~ ${blockType} keep`);
            // Preenche até 12 blocos para baixo onde for ar ou água
            for (let dy = 2; dy <= 12; dy++) {
                server.runCommandSilent(`execute positioned ${x} ${floorY - dy} ${z} if block ~ ~ ~ minecraft:air run setblock ~ ~ ~ ${blockType}`);
                server.runCommandSilent(`execute positioned ${x} ${floorY - dy} ${z} if block ~ ~ ~ minecraft:water run setblock ~ ~ ~ ${blockType}`);
            }
        }
    }
}

// 1. CATEDRAL DA LUZ
function buildCathedral(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Construindo a Catedral da Luz no seu local...');

    let w = 15; // largura X (de -7 a +7)
    let l = 25; // comprimento Z (de 0 a +24)
    let h = 14;

    // Fundação inteligente
    fillFoundation(server, px - 7, px + 7, pz, pz + 24, py, 'minecraft:stone_bricks');

    // Limpa a área interna
    server.runCommandSilent(`fill ${px - 6} ${py} ${pz + 1} ${px + 6} ${py + h + 8} ${pz + 23} minecraft:air`);

    // Piso: Ardósia polida com tapete central
    server.runCommandSilent(`fill ${px - 7} ${py} ${pz} ${px + 7} ${py} ${pz + 24} minecraft:polished_deepslate`);
    server.runCommandSilent(`fill ${px - 1} ${py + 1} ${pz + 2} ${px + 1} ${py + 1} ${pz + 20} minecraft:red_carpet`);

    // Paredes principais
    server.runCommandSilent(`fill ${px - 7} ${py + 1} ${pz} ${px - 7} ${py + 10} ${pz + 24} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px + 7} ${py + 1} ${pz} ${px + 7} ${py + 10} ${pz + 24} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px - 6} ${py + 1} ${pz + 24} ${px + 6} ${py + 10} ${pz + 24} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px - 6} ${py + 1} ${pz} ${px + 6} ${py + 10} ${pz} minecraft:stone_bricks`);

    // Pilares de sustentação de Deepslate Tiles
    for (let zOffset = 0; zOffset <= 24; zOffset += 6) {
        server.runCommandSilent(`fill ${px - 7} ${py + 1} ${pz + zOffset} ${px - 7} ${py + 11} ${pz + zOffset} minecraft:deepslate_tile_wall`);
        server.runCommandSilent(`fill ${px + 7} ${py + 1} ${pz + zOffset} ${px + 7} ${py + 11} ${pz + zOffset} minecraft:deepslate_tile_wall`);
    }

    // Vitrais góticos coloridos
    for (let zWin = 3; zWin <= 21; zWin += 6) {
        server.runCommandSilent(`fill ${px - 7} ${py + 3} ${pz + zWin} ${px - 7} ${py + 7} ${pz + zWin + 1} minecraft:yellow_stained_glass_pane`);
        server.runCommandSilent(`fill ${px + 7} ${py + 3} ${pz + zWin} ${px + 7} ${py + 7} ${pz + zWin + 1} minecraft:light_blue_stained_glass_pane`);
    }

    // Telhado em arco A-Frame com Deepslate Tiles
    for (let step = 0; step <= 7; step++) {
        let ty = py + 10 + step;
        let x1 = px - 7 + step;
        let x2 = px + 7 - step;
        server.runCommandSilent(`fill ${x1} ${ty} ${pz} ${x1} ${ty} ${pz + 24} minecraft:deepslate_tile_stairs[facing=east]`);
        server.runCommandSilent(`fill ${x2} ${ty} ${pz} ${x2} ${ty} ${pz + 24} minecraft:deepslate_tile_stairs[facing=west]`);
        if (x1 < x2) {
            server.runCommandSilent(`fill ${x1 + 1} ${ty} ${pz} ${x2 - 1} ${ty} ${pz} minecraft:chiseled_stone_bricks`);
            server.runCommandSilent(`fill ${x1 + 1} ${ty} ${pz + 24} ${x2 - 1} ${ty} ${pz + 24} minecraft:chiseled_stone_bricks`);
        }
    }
    server.runCommandSilent(`fill ${px} ${py + 18} ${pz} ${px} ${py + 18} ${pz + 24} minecraft:deepslate_tile_slab`);

    // Torre do Sino sobre o pórtico frontal
    server.runCommandSilent(`fill ${px - 3} ${py + 11} ${pz} ${px + 3} ${py + 23} ${pz + 4} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px - 2} ${py + 18} ${pz + 1} ${px + 2} ${py + 21} ${pz + 3} minecraft:air`);
    server.runCommandSilent(`setblock ${px} ${py + 20} ${pz + 2} minecraft:bell[attachment=ceiling]`);
    server.runCommandSilent(`fill ${px - 3} ${py + 24} ${pz} ${px + 3} ${py + 24} ${pz + 4} minecraft:deepslate_tile_stairs`);

    // Porta principal de Carvalho Escuro
    server.runCommandSilent(`fill ${px - 1} ${py + 1} ${pz} ${px + 1} ${py + 4} ${pz} minecraft:air`);
    server.runCommandSilent(`setblock ${px - 1} ${py + 1} ${pz} minecraft:dark_oak_door[half=lower,facing=south]`);
    server.runCommandSilent(`setblock ${px - 1} ${py + 2} ${pz} minecraft:dark_oak_door[half=upper,facing=south]`);
    server.runCommandSilent(`setblock ${px + 1} ${py + 1} ${pz} minecraft:dark_oak_door[half=lower,facing=south]`);
    server.runCommandSilent(`setblock ${px + 1} ${py + 2} ${pz} minecraft:dark_oak_door[half=upper,facing=south]`);

    // Bancos de Carvalho para os fiéis
    for (let zRow = 5; zRow <= 17; zRow += 3) {
        server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz + zRow} ${px - 2} ${py + 1} ${pz + zRow} minecraft:oak_stairs[facing=south]`);
        server.runCommandSilent(`fill ${px + 2} ${py + 1} ${pz + zRow} ${px + 5} ${py + 1} ${pz + zRow} minecraft:oak_stairs[facing=south]`);
    }

    // Altar Sagrado no fundo (pz + 21)
    server.runCommandSilent(`fill ${px - 3} ${py + 1} ${pz + 21} ${px + 3} ${py + 1} ${pz + 23} minecraft:chiseled_stone_bricks`);
    server.runCommandSilent(`setblock ${px} ${py + 2} ${pz + 22} minecraft:gold_block`);
    server.runCommandSilent(`setblock ${px - 1} ${py + 2} ${pz + 22} minecraft:crying_obsidian`);
    server.runCommandSilent(`setblock ${px + 1} ${py + 2} ${pz + 22} minecraft:crying_obsidian`);
    server.runCommandSilent(`setblock ${px} ${py + 3} ${pz + 22} minecraft:lantern[hanging=false]`);

    // Lustres de correntes e lanternas no teto
    for (let zL = 6; zL <= 18; zL += 6) {
        server.runCommandSilent(`setblock ${px} ${py + 13} ${pz + zL} minecraft:chain`);
        server.runCommandSilent(`setblock ${px} ${py + 12} ${pz + zL} minecraft:chain`);
        server.runCommandSilent(`setblock ${px} ${py + 11} ${pz + zL} minecraft:soul_lantern[hanging=true]`);
    }

    // Invocação automática do Padre Bento com Easy NPC nativo no altar
    let nbtPadre = (global.getNpcNbt && global.getNpcNbt('padre')) || `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"Padre Bento","color":"black","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:{Default:"main",DialogDataSet:[{Label:"main",Name:"Catedral da Luz",Texts:[{Text:"§4§l⛪ CATEDRAL DA LUZ\\\\n\\\\n§0Bem-vindo à Casa Sagrada, viajante.\\\\nQue as bênçãos dos Antigos purifiquem seu corpo e alma de todos os males do mundo."}],Buttons:[{Label:"b_heal",Name:"✨ Receber Bênção e Cura",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/bencao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}}`;
    server.runCommandSilent(`summon easy_npc:humanoid ${px + 0.5} ${py + 2} ${pz + 21.5} ${nbtPadre}`);

    player.tell('§a§l✔ Catedral da Luz construída com sucesso! Padre Bento já está no altar.');
    player.playSound('minecraft:block.bell.use', 1.0, 1.0);
}

// 2. GUILDA MERCANTE & DOCKS (PORTO)
function buildGuildDocks(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Construindo a Guilda Mercante e Porto Comercial...');

    // Fundação de pedra
    fillFoundation(server, px - 6, px + 6, pz, pz + 16, py, 'minecraft:stone_bricks');

    // Limpa a área
    server.runCommandSilent(`fill ${px - 5} ${py} ${pz + 1} ${px + 5} ${py + 10} ${pz + 15} minecraft:air`);

    // Deck de madeira de abeto (Spruce) e troncos
    server.runCommandSilent(`fill ${px - 6} ${py} ${pz} ${px + 6} ${py} ${pz + 16} minecraft:spruce_planks`);

    // Armazém / Sede da Guilda (Fundo: pz+8 a pz+16)
    server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz + 8} ${px + 5} ${py + 6} ${pz + 16} minecraft:stripped_spruce_wood`);
    server.runCommandSilent(`fill ${px - 4} ${py + 1} ${pz + 9} ${px + 4} ${py + 5} ${pz + 15} minecraft:air`);

    // Telhado de telhas de madeira escura
    server.runCommandSilent(`fill ${px - 6} ${py + 7} ${pz + 7} ${px + 6} ${py + 7} ${pz + 17} minecraft:dark_oak_stairs[facing=south]`);
    server.runCommandSilent(`fill ${px - 5} ${py + 8} ${pz + 8} ${px + 5} ${py + 8} ${pz + 16} minecraft:dark_oak_slab`);

    // Balcão de atendimento e toldo listrado vermelho e branco
    server.runCommandSilent(`fill ${px - 2} ${py + 1} ${pz + 8} ${px + 2} ${py + 1} ${pz + 8} minecraft:spruce_stairs[facing=north]`);
    server.runCommandSilent(`fill ${px - 2} ${py + 4} ${pz + 7} ${px + 2} ${py + 4} ${pz + 7} minecraft:red_wool`);
    server.runCommandSilent(`fill ${px - 2} ${py + 4} ${pz + 6} ${px + 2} ${py + 4} ${pz + 6} minecraft:white_wool`);

    // Cais e Guindaste com Corrente
    server.runCommandSilent(`fill ${px + 4} ${py + 1} ${pz + 2} ${px + 4} ${py + 6} ${pz + 2} minecraft:dark_oak_fence`);
    server.runCommandSilent(`fill ${px + 4} ${py + 6} ${pz + 2} ${px + 4} ${py + 6} ${pz + 5} minecraft:dark_oak_fence`);
    server.runCommandSilent(`setblock ${px + 4} ${py + 5} ${pz + 5} minecraft:chain`);
    server.runCommandSilent(`setblock ${px + 4} ${py + 4} ${pz + 5} minecraft:chain`);
    server.runCommandSilent(`setblock ${px + 4} ${py + 3} ${pz + 5} minecraft:barrel[facing=up]`);

    // Cargas, barris e caixas no pátio do cais
    server.runCommandSilent(`setblock ${px - 3} ${py + 1} ${pz + 2} minecraft:barrel`);
    server.runCommandSilent(`setblock ${px - 3} ${py + 1} ${pz + 3} minecraft:barrel`);
    server.runCommandSilent(`setblock ${px - 3} ${py + 2} ${pz + 2} minecraft:chest[facing=east]`);
    server.runCommandSilent(`setblock ${px - 4} ${py + 1} ${pz + 3} minecraft:crafting_table`);

    // Postes de iluminação com lanternas
    server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz + 1} ${px - 5} ${py + 3} ${pz + 1} minecraft:spruce_fence`);
    server.runCommandSilent(`setblock ${px - 5} ${py + 4} ${pz + 1} minecraft:lantern[hanging=false]`);
    server.runCommandSilent(`fill ${px + 5} ${py + 1} ${pz + 1} ${px + 5} ${py + 3} ${pz + 1} minecraft:spruce_fence`);
    server.runCommandSilent(`setblock ${px + 5} ${py + 4} ${pz + 1} minecraft:lantern[hanging=false]`);

    // Invocação do Inspetor da Guilda Mercante
    let nbtGuilda = (global.getNpcNbt && global.getNpcNbt('guilda')) || `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"Inspetor da Guilda Mercante","color":"black","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:{Default:"main",DialogDataSet:[{Label:"main",Name:"Guilda Mercante",Texts:[{Text:"§1§l📦 GUILDA MERCANTE DA CAPITAL\\\\n\\\\n§0Saudações, mercador! O porto da capital precisa de suprimentos de todos os biomas.\\\\n\\\\n§0Traga seus fardos de carga de terras distantes para obter o maior lucro!"}],Buttons:[{Label:"b_deliver",Name:"📦 Entregar Fardo da Mão",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/entregar_fardo @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_quote",Name:"📈 Ver Cotação da Bolsa",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/cotacao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}}`;
    server.runCommandSilent(`summon easy_npc:humanoid ${px + 0.5} ${py + 1} ${pz + 9.5} ${nbtGuilda}`);

    player.tell('§a§l✔ Guilda Mercante e Docks construídos! Inspetor da Guilda posicionado no balcão.');
    player.playSound('minecraft:entity.experience_orb.pickup', 1.0, 1.0);
}

// 3. FORJA MÍSTICA DOS CAMPEÕES
function buildForge(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Construindo a Forja Mística...');

    fillFoundation(server, px - 6, px + 6, pz, pz + 12, py, 'minecraft:deepslate_bricks');

    // Limpa a área
    server.runCommandSilent(`fill ${px - 5} ${py} ${pz + 1} ${px + 5} ${py + 10} ${pz + 11} minecraft:air`);

    // Piso de Tijolos de Ardósia e Basalto
    server.runCommandSilent(`fill ${px - 6} ${py} ${pz} ${px + 6} ${py} ${pz + 12} minecraft:deepslate_tiles`);

    // Paredes de Pedra e Tijolos de Pedra Talhados
    server.runCommandSilent(`fill ${px - 6} ${py + 1} ${pz} ${px - 6} ${py + 5} ${pz + 12} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px + 6} ${py + 1} ${pz} ${px + 6} ${py + 5} ${pz + 12} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz + 12} ${px + 5} ${py + 5} ${pz + 12} minecraft:stone_bricks`);

    // Telhado rústico de ardósia
    server.runCommandSilent(`fill ${px - 6} ${py + 6} ${pz} ${px + 6} ${py + 6} ${pz + 12} minecraft:deepslate_brick_slab`);

    // Chaminé com fumaça real de fogueira
    server.runCommandSilent(`fill ${px + 4} ${py + 1} ${pz + 10} ${px + 5} ${py + 9} ${pz + 11} minecraft:bricks`);
    server.runCommandSilent(`setblock ${px + 4} ${py + 7} ${pz + 10} minecraft:campfire[lit=true]`);
    server.runCommandSilent(`setblock ${px + 4} ${py + 8} ${pz + 10} minecraft:air`);

    // Calha de Lava protegida por barras de ferro
    server.runCommandSilent(`setblock ${px + 3} ${py + 1} ${pz + 10} minecraft:lava`);
    server.runCommandSilent(`setblock ${px + 3} ${py + 2} ${pz + 10} minecraft:iron_bars`);

    // Fornalhas Potentes (Blast Furnaces), Bigornas e Moendas
    server.runCommandSilent(`setblock ${px + 2} ${py + 1} ${pz + 10} minecraft:blast_furnace[facing=south,lit=true]`);
    server.runCommandSilent(`setblock ${px + 1} ${py + 1} ${pz + 10} minecraft:blast_furnace[facing=south,lit=true]`);
    server.runCommandSilent(`setblock ${px} ${py + 1} ${pz + 7} minecraft:anvil[facing=east]`);
    server.runCommandSilent(`setblock ${px - 2} ${py + 1} ${pz + 10} minecraft:smithing_table`);
    server.runCommandSilent(`setblock ${px - 3} ${py + 1} ${pz + 10} minecraft:grindstone[facing=south]`);
    server.runCommandSilent(`setblock ${px - 4} ${py + 1} ${pz + 10} minecraft:cauldron`);

    // Barras de Ferro nas janelas
    server.runCommandSilent(`fill ${px - 6} ${py + 2} ${pz + 4} ${px - 6} ${py + 3} ${pz + 7} minecraft:iron_bars`);
    server.runCommandSilent(`fill ${px + 6} ${py + 2} ${pz + 4} ${px + 6} ${py + 3} ${pz + 7} minecraft:iron_bars`);

    // Invocação do Mestre Armeiro da Forja
    let nbtFerreiro = (global.getNpcNbt && global.getNpcNbt('ferreiro')) || `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"Mestre Armeiro da Forja","color":"black","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:{Default:"main",DialogDataSet:[{Label:"main",Name:"Forja Mística",Texts:[{Text:"§0§l🔨 FORJA MÍSTICA DOS CAMPEÕES\\\\n\\\\n§0Posso consagrar suas lâminas em até Tier V Lendário usando Emblemas do Gladiador e Catalisadores de Bioma.\\\\n\\\\n§0Mostre-me sua arma na mão principal!"}],Buttons:[{Label:"b_info",Name:"🔍 Consultar Custo da Arma",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/forja info @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_forge",Name:"🔨 Aprimorar Arma na Mão",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/forja aprimorar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}}`;
    server.runCommandSilent(`summon easy_npc:humanoid ${px + 0.5} ${py + 1} ${pz + 6.5} ${nbtFerreiro}`);

    player.tell('§a§l✔ Forja Mística construída! Mestre Armeiro pronto para aprimorar armas.');
    player.playSound('minecraft:block.anvil.use', 1.0, 1.0);
}

// 4. COLISEU / ARENA DOS CAMPEÕES
function buildColiseum(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Construindo o Coliseu dos Campeões...');

    let r = 12; // raio 12 blocos (25x25)
    fillFoundation(server, px - r, px + r, pz - r, pz + r, py, 'minecraft:stone_bricks');

    // Limpa a área
    server.runCommandSilent(`fill ${px - r + 1} ${py} ${pz - r + 1} ${px + r - 1} ${py + 8} ${pz + r - 1} minecraft:air`);

    // Piso de Combate da Arena: Terra batida e Areia
    server.runCommandSilent(`fill ${px - r} ${py} ${pz - r} ${px + r} ${py} ${pz + r} minecraft:coarse_dirt`);
    server.runCommandSilent(`fill ${px - 7} ${py} ${pz - 7} ${px + 7} ${py} ${pz + 7} minecraft:sand`);

    // Mureta de contenção com Tijolos de Pedra e Barras de Ferro
    server.runCommandSilent(`fill ${px - r} ${py + 1} ${pz - r} ${px + r} ${py + 2} ${pz - r} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px - r} ${py + 1} ${pz + r} ${px + r} ${py + 2} ${pz + r} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px - r} ${py + 1} ${pz - r} ${px - r} ${py + 2} ${pz + r} minecraft:stone_bricks`);
    server.runCommandSilent(`fill ${px + r} ${py + 1} ${pz - r} ${px + r} ${py + 2} ${pz + r} minecraft:stone_bricks`);

    // Grade de segurança no topo da mureta
    server.runCommandSilent(`fill ${px - r} ${py + 3} ${pz - r} ${px + r} ${py + 3} ${pz - r} minecraft:iron_bars`);
    server.runCommandSilent(`fill ${px - r} ${py + 3} ${pz + r} ${px + r} ${py + 3} ${pz + r} minecraft:iron_bars`);
    server.runCommandSilent(`fill ${px - r} ${py + 3} ${pz - r} ${px - r} ${py + 3} ${pz + r} minecraft:iron_bars`);
    server.runCommandSilent(`fill ${px + r} ${py + 3} ${pz - r} ${px + r} ${py + 3} ${pz + r} minecraft:iron_bars`);

    // Postos de spawn de Duelo
    server.runCommandSilent(`setblock ${px - 6} ${py + 1} ${pz} minecraft:red_banner`);
    server.runCommandSilent(`setblock ${px + 6} ${py + 1} ${pz} minecraft:blue_banner`);

    // Portão de Entrada da Arena
    server.runCommandSilent(`fill ${px - 2} ${py + 1} ${pz - r} ${px + 2} ${py + 4} ${pz - r} minecraft:air`);
    server.runCommandSilent(`setblock ${px - 2} ${py + 1} ${pz - r} minecraft:stone_brick_wall`);
    server.runCommandSilent(`setblock ${px + 2} ${py + 1} ${pz - r} minecraft:stone_brick_wall`);
    server.runCommandSilent(`setblock ${px} ${py + 4} ${pz - r} minecraft:lantern`);

    // Tochas nos quatro cantos
    server.runCommandSilent(`setblock ${px - r + 1} ${py + 3} ${pz - r + 1} minecraft:soul_campfire`);
    server.runCommandSilent(`setblock ${px + r - 1} ${py + 3} ${pz - r + 1} minecraft:soul_campfire`);
    server.runCommandSilent(`setblock ${px - r + 1} ${py + 3} ${pz + r - 1} minecraft:soul_campfire`);
    server.runCommandSilent(`setblock ${px + r - 1} ${py + 3} ${pz + r - 1} minecraft:soul_campfire`);

    // Invocação do Mestre da Arena na entrada do coliseu
    let nbtArena = (global.getNpcNbt && global.getNpcNbt('arena')) || `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"Mestre da Arena","color":"black","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:{Default:"main",DialogDataSet:[{Label:"main",Name:"Coliseu",Texts:[{Text:"§4§l⚔️ COLISEU DOS CAMPEÕES\\\\n\\\\n§0Aqui apenas os guerreiros mais bravos entram no combate! Duelos honrosos de 1v1 sem perda de inventário.\\\\n\\\\n§0O vencedor conquista Moedas e Emblemas do Gladiador para aprimorar suas armas!"}],Buttons:[{Label:"b_rules",Name:"📜 Regras do Coliseu",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/duelo regras @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}}`;
    server.runCommandSilent(`summon easy_npc:humanoid ${px + 0.5} ${py + 1} ${pz - r - 1.5} ${nbtArena}`);

    // Sincroniza automaticamente as coordenadas dinâmicas da Arena para o sistema de Duelos
    if (global.updateArenaCoords) {
        global.updateArenaCoords(
            { x: px + 0.5, y: py + 1, z: pz - r - 1.5 },
            { x: px - 6.5, y: py + 1, z: pz + 0.5 },
            { x: px + 6.5, y: py + 1, z: pz + 0.5 }
        );
    }

    player.tell('§a§l✔ Coliseu dos Campeões construído! Posições de duelo sincronizadas automaticamente.');
    player.playSound('minecraft:entity.ender_dragon.growl', 0.8, 1.2);
}

// 5. BANCO REAL DA CAPITAL (Casa da Moeda & Terminais)
function buildBank(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Construindo o Banco Real em estilo medieval enxaimel...');

    // Fundação de Pedra e Ardósia
    fillFoundation(server, px - 5, px + 5, pz, pz + 12, py, 'minecraft:stone_bricks');

    // Limpa a área
    server.runCommandSilent(`fill ${px - 4} ${py} ${pz + 1} ${px + 4} ${py + 9} ${pz + 11} minecraft:air`);

    // Piso de Tábuas de Abeto e Tapete Central
    server.runCommandSilent(`fill ${px - 5} ${py} ${pz} ${px + 5} ${py} ${pz + 12} minecraft:spruce_planks`);
    server.runCommandSilent(`fill ${px} ${py + 1} ${pz + 1} ${px} ${py + 1} ${pz + 5} minecraft:red_carpet`);

    // Paredes: Estrutura de Troncos de Carvalho Escuro e Madeira de Abeto Descascada
    server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz} ${px - 5} ${py + 5} ${pz + 12} minecraft:stripped_spruce_wood`);
    server.runCommandSilent(`fill ${px + 5} ${py + 1} ${pz} ${px + 5} ${py + 5} ${pz + 12} minecraft:stripped_spruce_wood`);
    server.runCommandSilent(`fill ${px - 4} ${py + 1} ${pz + 12} ${px + 4} ${py + 5} ${pz + 12} minecraft:stripped_spruce_wood`);
    server.runCommandSilent(`fill ${px - 4} ${py + 1} ${pz} ${px + 4} ${py + 5} ${pz} minecraft:stripped_spruce_wood`);

    // Pilares nos quatro cantos
    server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz} ${px - 5} ${py + 6} ${pz} minecraft:dark_oak_log`);
    server.runCommandSilent(`fill ${px + 5} ${py + 1} ${pz} ${px + 5} ${py + 6} ${pz} minecraft:dark_oak_log`);
    server.runCommandSilent(`fill ${px - 5} ${py + 1} ${pz + 12} ${px - 5} ${py + 6} ${pz + 12} minecraft:dark_oak_log`);
    server.runCommandSilent(`fill ${px + 5} ${py + 1} ${pz + 12} ${px + 5} ${py + 6} ${pz + 12} minecraft:dark_oak_log`);

    // Janelas de Vidro com Venezianas
    server.runCommandSilent(`setblock ${px - 5} ${py + 2} ${pz + 3} minecraft:glass_pane`);
    server.runCommandSilent(`setblock ${px - 5} ${py + 3} ${pz + 3} minecraft:glass_pane`);
    server.runCommandSilent(`setblock ${px + 5} ${py + 2} ${pz + 3} minecraft:glass_pane`);
    server.runCommandSilent(`setblock ${px + 5} ${py + 3} ${pz + 3} minecraft:glass_pane`);

    // Porta de Carvalho Escuro
    server.runCommandSilent(`setblock ${px} ${py + 1} ${pz} minecraft:dark_oak_door[half=lower,facing=south]`);
    server.runCommandSilent(`setblock ${px} ${py + 2} ${pz} minecraft:dark_oak_door[half=upper,facing=south]`);

    // Telhado Gótico em A-Frame com Escadas de Carvalho Escuro
    for (let step = 0; step <= 5; step++) {
        let ty = py + 5 + step;
        let x1 = px - 5 + step;
        let x2 = px + 5 - step;
        server.runCommandSilent(`fill ${x1} ${ty} ${pz - 1} ${x1} ${ty} ${pz + 13} minecraft:dark_oak_stairs[facing=east]`);
        server.runCommandSilent(`fill ${x2} ${ty} ${pz - 1} ${x2} ${ty} ${pz + 13} minecraft:dark_oak_stairs[facing=west]`);
        if (x1 < x2) {
            server.runCommandSilent(`fill ${x1 + 1} ${ty} ${pz} ${x2 - 1} ${ty} ${pz} minecraft:stripped_spruce_wood`);
            server.runCommandSilent(`fill ${x1 + 1} ${ty} ${pz + 12} ${x2 - 1} ${ty} ${pz + 12} minecraft:stripped_spruce_wood`);
        }
    }
    server.runCommandSilent(`fill ${px} ${py + 11} ${pz - 1} ${px} ${py + 11} ${pz + 13} minecraft:dark_oak_slab`);

    // Balcão de Madeira Nobre e Grade de Ferro
    server.runCommandSilent(`fill ${px - 3} ${py + 1} ${pz + 6} ${px + 3} ${py + 1} ${pz + 6} minecraft:dark_oak_stairs[facing=south]`);
    server.runCommandSilent(`fill ${px - 3} ${py + 2} ${pz + 6} ${px + 3} ${py + 3} ${pz + 6} minecraft:iron_bars`);
    server.runCommandSilent(`setblock ${px} ${py + 2} ${pz + 6} minecraft:air`); // Fresta de atendimento

    // Terminais do Lightman's Currency embutidos na parede de madeira
    server.runCommandSilent(`setblock ${px - 4} ${py + 1} ${pz + 3} lightmanscurrency:bank_terminal[facing=east]`);
    server.runCommandSilent(`setblock ${px + 4} ${py + 1} ${pz + 3} lightmanscurrency:atm[facing=west]`);

    // Cofre Reforçado nos fundos (pz + 9 a pz + 11)
    server.runCommandSilent(`fill ${px - 2} ${py + 1} ${pz + 9} ${px + 2} ${py + 3} ${pz + 11} minecraft:deepslate_bricks`);
    server.runCommandSilent(`fill ${px - 1} ${py + 1} ${pz + 10} ${px + 1} ${py + 2} ${pz + 10} minecraft:air`);
    server.runCommandSilent(`setblock ${px} ${py + 1} ${pz + 9} minecraft:iron_door[half=lower,facing=north]`);
    server.runCommandSilent(`setblock ${px} ${py + 2} ${pz + 9} minecraft:iron_door[half=upper,facing=north]`);
    server.runCommandSilent(`setblock ${px - 1} ${py + 1} ${pz + 10} minecraft:gold_block`);
    server.runCommandSilent(`setblock ${px + 1} ${py + 1} ${pz + 10} minecraft:chest`);

    // Iluminação por Lanternas
    server.runCommandSilent(`setblock ${px} ${py + 4} ${pz + 3} minecraft:lantern[hanging=false]`);
    server.runCommandSilent(`setblock ${px} ${py + 4} ${pz + 8} minecraft:lantern[hanging=false]`);

    // Invocação do Banqueiro da Coroa com Diálogo Imersivo sem Jargões Técnicos
    let nbtBanco = (global.getNpcNbt && global.getNpcNbt('banco')) || `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"Banqueiro da Coroa","color":"black","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:{Default:"main",DialogDataSet:[{Label:"main",Name:"Banco Real",Texts:[{Text:"§0§l🏦 BANCO REAL DA CAPITAL\\\\n\\\\n§0Saudações, cidadão. O Banco Real troca seu ouro bruto por moedas de circulação e disponibiliza terminais para a guarda de suas economias."}],Buttons:[{Label:"b_rate",Name:"🪙 Cotação do Ouro",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/banco cotacao @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_swap",Name:"⚖️ Trocar Ouro da Mão",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/banco trocar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}}`;
    server.runCommandSilent(`summon easy_npc:humanoid ${px + 0.5} ${py + 1} ${pz + 7.5} ${nbtBanco}`);

    player.tell('§a§l✔ Banco Real construído com sucesso! Estilo medieval integrado à vila.');
    player.playSound('minecraft:block.bell.use', 1.0, 1.0);
}

// Limpa a área do banco feio anterior
function undoBank(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Demolindo a estrutura e limpando o terreno...');
    server.runCommandSilent(`fill ${px - 10} ${py + 1} ${pz - 5} ${px + 10} ${py + 15} ${pz + 20} minecraft:air`);
    server.runCommandSilent(`fill ${px - 10} ${py} ${pz - 5} ${px + 10} ${py} ${pz + 20} minecraft:grass_block`);
    server.runCommandSilent(`kill @e[type=easy_npc:humanoid,distance=..15]`);
    player.tell('§a§l✔ Terreno limpo! Você pode reconstruir com /construir banco ou usar uma casa existente.');
}

// 6. TOTEM DE SOBERANIA DA VILA (Obelisco de Domínio Territorial)
function buildTotem(player, server) {
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);

    player.tell('§e[Arquiteto] Erguendo o Totem de Soberania da Vila...');

    // Base de Pedra Talhada
    server.runCommandSilent(`fill ${px - 1} ${py} ${pz - 1} ${px + 1} ${py} ${pz + 1} minecraft:polished_blackstone`);
    server.runCommandSilent(`setblock ${px} ${py + 1} ${pz} minecraft:lodestone`);
    server.runCommandSilent(`setblock ${px} ${py + 2} ${pz} minecraft:crying_obsidian`);
    server.runCommandSilent(`setblock ${px} ${py + 3} ${pz} minecraft:gold_block`);
    server.runCommandSilent(`setblock ${px} ${py + 4} ${pz} minecraft:lantern[hanging=false]`);

    // Estandartes nos quatro cantos da base
    server.runCommandSilent(`setblock ${px + 1} ${py + 1} ${pz} minecraft:red_banner`);
    server.runCommandSilent(`setblock ${px - 1} ${py + 1} ${pz} minecraft:red_banner`);
    server.runCommandSilent(`setblock ${px} ${py + 1} ${pz + 1} minecraft:red_banner`);
    server.runCommandSilent(`setblock ${px} ${py + 1} ${pz - 1} minecraft:red_banner`);

    // Invocação do Emissário da Soberania ao lado do totem
    let nbtTotem = (global.getNpcNbt && global.getNpcNbt('totem')) || `{Invulnerable:1b,PersistenceRequired:1b,CustomName:'{"text":"Emissário da Soberania","color":"black","bold":true}',CustomNameVisible:1b,ActionData:{ActionEventSet:{ON_INTERACTION:[{Type:"OPEN_DEFAULT_DIALOG"}]}},DialogData:{Default:"main",DialogDataSet:[{Label:"main",Name:"Totem do Reino",Texts:[{Text:"§0§l👑 SOBERANIA DA VILA\\\\n\\\\n§0Este monumento sela o governo territorial desta vila perante o Reino.\\\\n\\\\n§0Limite: Cada facção pode governar apenas 1 vila, recolhendo 8% de imposto sobre as mercadorias locais."}],Buttons:[{Label:"b_claim",Name:"👑 Reivindicar Governo",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem reivindicar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_tax",Name:"💰 Sacar Impostos",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem coletar @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_info",Name:"📜 Ver Estatuto",Type:"DEFAULT",Actions:[{Type:"COMMAND",PermLevel:2,Cmd:"/totem info @initiator"},{Type:"CLOSE_DIALOG"}]},{Label:"b_exit",Name:"Despedir-se",Type:"DEFAULT",Actions:[{Type:"CLOSE_DIALOG"}]}]}]}}`;
    server.runCommandSilent(`summon easy_npc:humanoid ${px + 1.5} ${py + 1} ${pz + 0.5} ${nbtTotem}`);

    player.tell('§a§l✔ Totem de Soberania erguido! Use o diálogo com o Emissário ou /totem reivindicar para governar.');
    player.playSound('minecraft:block.bell.use', 1.0, 1.2);
}

// Registro dos Comandos
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('desfazer_banco')
            .requires(src => (src.player ? (src.player.op || (src.player.hasPermissions && src.player.hasPermissions(2))) : true))
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) undoBank(p, ctx.source.server);
                return 1;
            })
    );

    event.register(
        Commands.literal('construir')
            .requires(src => (src.player ? (src.player.op || (src.player.hasPermissions && src.player.hasPermissions(2))) : true))
            .then(Commands.literal('catedral').executes(ctx => {
                let p = ctx.source.player;
                if (p) buildCathedral(p, ctx.source.server);
                return 1;
            }))
            .then(Commands.literal('guilda').executes(ctx => {
                let p = ctx.source.player;
                if (p) buildGuildDocks(p, ctx.source.server);
                return 1;
            }))
            .then(Commands.literal('forja').executes(ctx => {
                let p = ctx.source.player;
                if (p) buildForge(p, ctx.source.server);
                return 1;
            }))
            .then(Commands.literal('arena').executes(ctx => {
                let p = ctx.source.player;
                if (p) buildColiseum(p, ctx.source.server);
                return 1;
            }))
            .then(Commands.literal('banco').executes(ctx => {
                let p = ctx.source.player;
                if (p) buildBank(p, ctx.source.server);
                return 1;
            }))
            .then(Commands.literal('desfazer_banco').executes(ctx => {
                let p = ctx.source.player;
                if (p) undoBank(p, ctx.source.server);
                return 1;
            }))
            .then(Commands.literal('totem').executes(ctx => {
                let p = ctx.source.player;
                if (p) buildTotem(p, ctx.source.server);
                return 1;
            }))
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) {
                    p.tell('§eUso: /construir <catedral | guilda | forja | arena | banco | totem>');
                }
                return 0;
            })
    );
});

