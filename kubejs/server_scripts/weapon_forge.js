// Sistema da Forja Mística dos Campeões (Armas, Escudos & Armaduras)
// Consagra equipamentos em Tiers (I a V) usando Moedas de Ouro + Emblemas do Gladiador + Catalisadores Escalonados por Raridade
// Aplica bônus reais de combate no evento EntityEvents.hurt!

const CATALYST_POOLS = {
    common: [
        'kubejs:catalisador_planicie',
        'kubejs:catalisador_floresta',
        'kubejs:catalisador_oceano'
    ],
    regional: [
        'kubejs:catalisador_deserto',
        'kubejs:catalisador_montanha',
        'kubejs:catalisador_pantano'
    ],
    exotic: [
        'kubejs:catalisador_tundra',
        'kubejs:catalisador_selva',
        'kubejs:catalisador_badlands',
        'kubejs:catalisador_cerejeira'
    ],
    nether: ['kubejs:catalisador_nether'],
    end:    ['kubejs:catalisador_end']
};

const TIER_CONFIG = [
    {
        tier: 1,
        name: '§6Tier I: Forjado em Batalha',
        damage: 1.5, speed: 0.05, armorDef: 0.02,
        goldCost: 2, baseTokens: 5, baseCats: 2,
        successRate: 1.00,
        catSummary: '§a2x Catalisadores Comuns',
        catDetail: '§7(Planície, Floresta ou Oceano)'
    },
    {
        tier: 2,
        name: '§5Tier II: Veterano da Guilda',
        damage: 3.0, speed: 0.10, armorDef: 0.03,
        goldCost: 5, baseTokens: 10, baseCats: 4,
        successRate: 0.85,
        catSummary: '§e4x Catalisadores Regionais',
        catDetail: '§7(Deserto, Montanha ou Pântano)'
    },
    {
        tier: 3,
        name: '§bTier III: Campeão do Coliseu',
        damage: 4.5, speed: 0.15, armorDef: 0.04,
        goldCost: 10, baseTokens: 20, baseCats: 6,
        successRate: 0.65,
        catSummary: '§b6x Catalisadores Exóticos',
        catDetail: '§7(Tundra, Selva, Badlands ou Cerejeira)'
    },
    {
        tier: 4,
        name: '§cTier IV: Senhor da Guerra',
        damage: 6.5, speed: 0.20, armorDef: 0.05,
        goldCost: 18, baseTokens: 35, baseCats: 8,
        successRate: 0.45,
        catSummary: '§44x Nether §7+ §b4x Exóticos',
        catDetail: '§7(Exige 4 do Nether + 4 de Tundra/Selva/Badlands/Cerejeira)'
    },
    {
        tier: 5,
        name: '§4§lTier V: Mítico dos Reinos',
        damage: 9.0, speed: 0.25, armorDef: 0.06,
        goldCost: 30, baseTokens: 50, baseCats: 12,
        successRate: 0.25,
        catSummary: '§54x End §7+ §44x Nether §7+ §d4x Livre',
        catDetail: '§7(Segure o Catalisador desejado na mão secundária p/ escolher o Elemento!)'
    }
];

function countPoolInInventory(player, poolArray) {
    let total = 0;
    player.inventory.allItems.forEach(i => {
        if (i && i.id && poolArray.indexOf(i.id) !== -1) {
            total += i.count;
        }
    });
    return total;
}

function countAllCatalystsInInventory(player) {
    let total = 0;
    player.inventory.allItems.forEach(i => {
        if (i && i.id && i.id.startsWith('kubejs:catalisador_')) {
            total += i.count;
        }
    });
    return total;
}

function consumeFromPool(player, poolArray, amountNeeded) {
    let rem = amountNeeded;
    let lastConsumedId = null;
    player.inventory.allItems.forEach(i => {
        if (rem > 0 && i && i.id && poolArray.indexOf(i.id) !== -1) {
            let take = Math.min(i.count, rem);
            if (take > 0) {
                lastConsumedId = i.id;
                i.count -= take;
                rem -= take;
            }
        }
    });
    return lastConsumedId;
}

function countEnchantmentLevels(item) {
    if (!item || !item.enchantments) return 0;
    let total = 0;
    for (let ench in item.enchantments) {
        total += item.enchantments[ench];
    }
    return total;
}

function isWeapon(item) {
    if (!item || !item.id) return false;
    let id = item.id;
    return id.endsWith('_sword') || id.endsWith('_axe') || id.includes('spartanweaponry:') || id.includes('spartanshields:');
}

function isArmor(item) {
    if (!item || !item.id) return false;
    let id = item.id;
    return id.endsWith('_helmet') || id.endsWith('_chestplate') || id.endsWith('_leggings') || id.endsWith('_boots') || id.includes('immersive_armors:');
}

function showForgeInfo(player) {
    if (!player) return 0;
    let item = player.mainHandItem;
    let weaponFlag = isWeapon(item);
    let armorFlag = isArmor(item);

    if (!weaponFlag && !armorFlag) {
        player.tell('§c[Forja Mística] Segure uma arma, escudo ou peça de armadura na mão principal para consultar!');
        return 0;
    }

    let currentTier = (item.nbt && item.nbt.contains('ForgeTier')) ? item.nbt.getInt('ForgeTier') : 0;
    if (currentTier >= 5) {
        player.tell('§6[Forja Mística] Este equipamento já atingiu o Tier V Máximo (Mítico dos Reinos)!');
        return 1;
    }

    let nextCfg = TIER_CONFIG[currentTier];
    let enchLevels = countEnchantmentLevels(item);
    let enchTax = enchLevels * 2;
    let totalTokens = nextCfg.baseTokens + enchTax;

    player.tell('§6§m----------------------------------------');
    player.tell('§6§l✦ §e§lFORJA MÍSTICA DE EQUIPAMENTOS §6§l✦');
    player.tell(`§7Item: §b${item.displayName.string} §8(${weaponFlag ? 'Arma/Escudo' : 'Armadura'})`);
    player.tell(`§7Atual: §f${currentTier === 0 ? 'Comum (Tier 0)' : TIER_CONFIG[currentTier - 1].name}`);
    player.tell(`§7Próximo: ${nextCfg.name}`);
    if (weaponFlag) {
        player.tell(`§7Bônus: §a+${nextCfg.damage} Dano Real §8| §a+${Math.round(nextCfg.speed * 100)}% Impacto`);
    } else {
        player.tell(`§7Bônus: §a-${Math.round(nextCfg.armorDef * 100)}% Dano Recebido §8| §dVitalidade`);
    }
    player.tell('§6§m----------------------------------------');
    player.tell(`§7Taxa Real: §6${nextCfg.goldCost} Moedas de Ouro`);
    player.tell(`§7Emblemas: §6${totalTokens} Emblemas do Gladiador` + (enchTax > 0 ? ` §8(inclui +${enchTax} de encant.)` : ''));
    player.tell(`§7Catalisadores: ${nextCfg.catSummary}`);
    player.tell(` ${nextCfg.catDetail}`);
    let pct = Math.round(nextCfg.successRate * 100);
    let pctColor = pct >= 80 ? '§a' : (pct >= 50 ? '§e' : '§c');
    player.tell(`§7Chance de Sucesso: ${pctColor}${pct}% §8(Falha consome itens, mas NUNCA quebra a arma!)`);
    player.tell('§6§m----------------------------------------');
    return 1;
}

function forgeEquipment(player, server) {
    if (!player) return 0;
    let item = player.mainHandItem;
    let weaponFlag = isWeapon(item);
    let armorFlag = isArmor(item);

    if (!weaponFlag && !armorFlag) {
        player.tell('§c[Forja Mística] Segure uma arma, escudo ou armadura válida na mão principal!');
        return 0;
    }

    let currentTier = (item.nbt && item.nbt.contains('ForgeTier')) ? item.nbt.getInt('ForgeTier') : 0;
    if (currentTier >= 5) {
        player.tell('§6[Forja Mística] Este equipamento já está no Tier Máximo!');
        return 1;
    }

    let nextCfg = TIER_CONFIG[currentTier];
    let targetTier = nextCfg.tier;
    let enchLevels = countEnchantmentLevels(item);
    let totalTokens = nextCfg.baseTokens + (enchLevels * 2);
    let requiredGold = nextCfg.goldCost;

    // 1. Checa Moedas de Ouro
    let goldCount = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold') goldCount += i.count;
    });
    if (goldCount < requiredGold) {
        player.tell(`§c[Forja Mística] Taxa da Forja: você precisa de §6${requiredGold} Moedas de Ouro §c(Você tem: ${goldCount}).`);
        return 0;
    }

    // 2. Checa Emblemas do Gladiador
    let tokenCount = 0;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'kubejs:token_gladiador') tokenCount += i.count;
    });
    if (tokenCount < totalTokens) {
        player.tell(`§c[Forja Mística] Você precisa de §6${totalTokens} Emblemas do Gladiador §c(Você tem: ${tokenCount}).`);
        return 0;
    }

    // 3. Checa Catalisadores Escalonados por Tier (I a V)
    let chosenCatId = 'kubejs:catalisador_planicie';
    let offHand = player.offHandItem;
    if (offHand && offHand.id && offHand.id.startsWith('kubejs:catalisador_')) {
        chosenCatId = offHand.id;
    }

    if (targetTier === 1) {
        let have = countPoolInInventory(player, CATALYST_POOLS.common);
        if (have < 2) {
            player.tell(`§c[Forja Mística] O Tier I exige §a2x Catalisadores Comuns §7(Planície, Floresta ou Oceano)§c! Você tem: ${have}.`);
            return 0;
        }
    } else if (targetTier === 2) {
        let have = countPoolInInventory(player, CATALYST_POOLS.regional);
        if (have < 4) {
            player.tell(`§c[Forja Mística] O Tier II exige §e4x Catalisadores Regionais §7(Deserto, Montanha ou Pântano)§c! Você tem: ${have}.`);
            return 0;
        }
    } else if (targetTier === 3) {
        let have = countPoolInInventory(player, CATALYST_POOLS.exotic);
        if (have < 6) {
            player.tell(`§c[Forja Mística] O Tier III exige §b6x Catalisadores Exóticos §7(Tundra, Selva, Badlands ou Cerejeira)§c! Você tem: ${have}.`);
            return 0;
        }
    } else if (targetTier === 4) {
        let haveNether = countPoolInInventory(player, CATALYST_POOLS.nether);
        let haveExotic = countPoolInInventory(player, CATALYST_POOLS.exotic);
        if (haveNether < 4 || haveExotic < 4) {
            player.tell(`§c[Forja Mística] O Tier IV exige §44x Catalisadores do Nether §ce §b4x Exóticos §7(Tundra/Selva/Badlands/Cerejeira)§c! Você tem: ${haveNether} Nether e ${haveExotic} Exóticos.`);
            return 0;
        }
    } else if (targetTier === 5) {
        let haveEnd = countPoolInInventory(player, CATALYST_POOLS.end);
        let haveNether = countPoolInInventory(player, CATALYST_POOLS.nether);
        let haveTotal = countAllCatalystsInInventory(player);
        if (haveEnd < 4 || haveNether < 4 || haveTotal < 12) {
            player.tell(`§c[Forja Mística] O Tier V exige §54x Catalisadores do End§c, §44x do Nether §ce §d+4x Catalisadores à sua escolha §7(Total 12)§c! Você tem: ${haveEnd} End, ${haveNether} Nether e ${haveTotal} no total.`);
            return 0;
        }
    }

    // Consome Moedas de Ouro
    let remGold = requiredGold;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'lightmanscurrency:coin_gold' && remGold > 0) {
            let take = Math.min(i.count, remGold);
            i.count -= take;
            remGold -= take;
        }
    });

    // Consome Emblemas
    let remTokens = totalTokens;
    player.inventory.allItems.forEach(i => {
        if (i.id === 'kubejs:token_gladiador' && remTokens > 0) {
            let take = Math.min(i.count, remTokens);
            i.count -= take;
            remTokens -= take;
        }
    });

    // Consome Catalisadores conforme o Tier
    let lastCatId = null;
    if (targetTier === 1) {
        lastCatId = consumeFromPool(player, CATALYST_POOLS.common, 2);
    } else if (targetTier === 2) {
        lastCatId = consumeFromPool(player, CATALYST_POOLS.regional, 4);
    } else if (targetTier === 3) {
        lastCatId = consumeFromPool(player, CATALYST_POOLS.exotic, 6);
    } else if (targetTier === 4) {
        consumeFromPool(player, CATALYST_POOLS.nether, 4);
        lastCatId = consumeFromPool(player, CATALYST_POOLS.exotic, 4) || 'kubejs:catalisador_nether';
    } else if (targetTier === 5) {
        consumeFromPool(player, CATALYST_POOLS.end, 4);
        consumeFromPool(player, CATALYST_POOLS.nether, 4);
        let remFree = 4;
        player.inventory.allItems.forEach(i => {
            if (remFree > 0 && i && i.id && i.id.startsWith('kubejs:catalisador_')) {
                let take = Math.min(i.count, remFree);
                if (take > 0) {
                    lastCatId = i.id;
                    i.count -= take;
                    remFree -= take;
                }
            }
        });
    }

    // Rolagem da Chance de Sucesso da Forja Mística
    let roll = Math.random();
    let success = (roll <= nextCfg.successRate);

    if (!success) {
        player.playSound('minecraft:block.anvil.destroy', 1.0, 0.8);
        player.playSound('minecraft:block.fire.extinguish', 1.0, 1.0);
        player.tell('§c§m----------------------------------------');
        player.tell('§c§l💥 FALHA NA CONSAGRAÇÃO MÍSTICA!');
        player.tell('§fAs energias elementais entraram em colapso!');
        player.tell('§7Os tributos foram consumidos pelo calor da forja, mas seu equipamento permaneceu intacto.');
        player.tell('§c§m----------------------------------------');
        return 0;
    }

    let finalCatId = (offHand && offHand.id && offHand.id.startsWith('kubejs:catalisador_')) ? chosenCatId : (lastCatId || chosenCatId);
    let elemKey = String(finalCatId).replace('kubejs:catalisador_', '');

    // Aplica o Tier e Elemental Tag no equipamento
    let newTier = currentTier + 1;
    item.nbt = item.nbt || {};
    item.nbt.putInt('ForgeTier', newTier);
    item.nbt.putString('ForgeElement', elemKey);

    let displayTag = item.nbt.getCompound('display');
    let tagList = Utils.newList();
    tagList.add(Utils.newString(`{"text":"${nextCfg.name}","italic":false}`));
    if (weaponFlag) {
        tagList.add(Utils.newString(`{"text":"§a+${nextCfg.damage} Dano de Ataque Real","italic":false}`));
        tagList.add(Utils.newString(`{"text":"§a+${Math.round(nextCfg.speed * 100)}% Poder de Impacto","italic":false}`));
        if (newTier === 5) {
            tagList.add(Utils.newString(`{"text":"§d✦ Infusão Elemental: ${elemKey.toUpperCase()}","italic":false}`));
        }
    } else {
        tagList.add(Utils.newString(`{"text":"§9🛡️ -${Math.round(nextCfg.armorDef * 100)}% Dano Recebido","italic":false}`));
        if (newTier >= 3) {
            tagList.add(Utils.newString(`{"text":"§d❤ Bênção de Vitalidade (Tier ${newTier})","italic":false}`));
        }
    }
    displayTag.put('Lore', tagList);
    item.nbt.put('display', displayTag);

    player.playSound('minecraft:block.anvil.use', 1.0, 1.0);
    player.playSound('minecraft:item.totem.use', 0.8, 1.2);

    player.tell('§a§m----------------------------------------');
    player.tell('§6§l✦ §e§lCONSAGRAÇÃO CONCLUÍDA! §6§l✦');
    player.tell(`§7Equipamento elevado para: ${nextCfg.name}§f!`);
    if (newTier === 5 && weaponFlag) {
        player.tell(`§7Infusão Mística Ativa: §d${elemKey.toUpperCase()}`);
    }
    player.tell('§a§m----------------------------------------');

    if (server && newTier >= 3) {
        server.tell(`§6[Forja dos Mestres] §e${player.name.string} §fforjou um equipamento consagrado de ${nextCfg.name}§f!`);
    }
    return 1;
}

// -------------------------------------------------------------------------
// APLICAÇÃO REAL DE BÔNUS DE COMBATE (ARMAS & ARMADURAS FORJADAS)
// -------------------------------------------------------------------------
EntityEvents.hurt(event => {
    try {
        let victim = event.entity;
        let source = event.source;
        let attacker = source ? source.actual : null;

        if (!victim || !victim.isAlive()) return;

        // Evita re-entrância de dano bônus gerado pelo próprio script
        if (attacker && attacker.persistentData && attacker.persistentData.getBoolean('skip_forge_proc')) {
            return;
        }

        let dmg = 1.0;
        try {
            dmg = (typeof event.getDamage === 'function') ? event.getDamage() : (event.damage || 1.0);
        } catch (ed) {
            dmg = 1.0;
        }

        // 1. Bônus de Ataque da Arma Forjada do Atacante
        if (attacker && attacker.isPlayer()) {
            let mainWeapon = attacker.mainHandItem;
            if (mainWeapon && mainWeapon.nbt && mainWeapon.nbt.contains('ForgeTier') && isWeapon(mainWeapon)) {
                let tier = mainWeapon.nbt.getInt('ForgeTier');
                if (tier >= 1 && tier <= 5) {
                    let bonusDmg = TIER_CONFIG[tier - 1].damage;

                    // Aplica o dano bônus 1 tick após o golpe para não interromper Better Combat
                    if (bonusDmg > 0 && victim.server) {
                        victim.server.scheduleInTicks(1, () => {
                            if (victim && victim.isAlive() && attacker && attacker.isAlive()) {
                                try {
                                    attacker.persistentData.putBoolean('skip_forge_proc', true);
                                    victim.hurt(attacker.damageSources().playerAttack(attacker), bonusDmg);
                                } catch (eh) {
                                    victim.health = Math.max(0.1, victim.health - bonusDmg);
                                } finally {
                                    attacker.persistentData.remove('skip_forge_proc');
                                }
                            }
                        });
                    }

                    // Efeito Elemental de Tier V
                    if (tier === 5 && mainWeapon.nbt.contains('ForgeElement')) {
                        let elem = mainWeapon.nbt.getString('ForgeElement');
                        if (elem === 'deserto' || elem === 'nether') {
                            victim.setSecondsOnFire(5);
                        } else if (elem === 'tundra' && victim.potionEffects) {
                            victim.potionEffects.add('minecraft:slowness', 60, 1, false, true);
                        } else if ((elem === 'pantano' || elem === 'selva') && victim.potionEffects) {
                            victim.potionEffects.add('minecraft:poison', 60, 0, false, true);
                        } else if (elem === 'end' && victim.potionEffects) {
                            victim.potionEffects.add('minecraft:levitation', 25, 0, false, true);
                        } else if ((elem === 'badlands' || elem === 'montanha') && victim.potionEffects) {
                            victim.potionEffects.add('minecraft:weakness', 60, 0, false, true);
                        } else if ((elem === 'cerejeira' || elem === 'floresta' || elem === 'planicie' || elem === 'oceano') && attacker.potionEffects) {
                            attacker.potionEffects.add('minecraft:regeneration', 50, 0, false, true);
                        }
                    }
                }
            }
        }

        // 2. Redução de Dano das Peças de Armadura Forjadas da Vítima
        if (victim && victim.isPlayer()) {
            let totalReduction = 0;
            let armorItems = [victim.headArmorItem, victim.chestArmorItem, victim.legsArmorItem, victim.feetArmorItem];
            armorItems.forEach(piece => {
                if (piece && piece.nbt && piece.nbt.contains('ForgeTier')) {
                    let t = piece.nbt.getInt('ForgeTier');
                    if (t >= 1 && t <= 5) {
                        totalReduction += TIER_CONFIG[t - 1].armorDef;
                    }
                }
            });

            if (totalReduction > 0 && victim.server) {
                if (totalReduction > 0.30) totalReduction = 0.30; // Teto de 30% de mitigação extra
                let healedBack = dmg * totalReduction;
                victim.server.scheduleInTicks(1, () => {
                    if (victim && victim.isAlive()) {
                        victim.health = Math.min(victim.maxHealth, victim.health + healedBack);
                    }
                });
            }
        }
    } catch (err) {
        console.error("Erro em weapon_forge EntityEvents.hurt:", err);
    }
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function getPlayerFromContext(ctx) {
        let player = null;
        try {
            let targetName = Arguments.STRING.getResult(ctx, 'target');
            player = ctx.source.server.getPlayer(targetName);
        } catch (e) {}
        if (!player) player = ctx.source.player;
        if (player && global.isPlayerNearNpc && !global.isPlayerNearNpc(player, ['Armeiro', 'Forja'], 12)) {
            player.tell('§c[Forja Mística] Você precisa estar diante do Mestre Armeiro na Forja para fazer isso!');
            return null;
        }
        return player;
    }

    event.register(
        Commands.literal('forja')
            .then(Commands.literal('info')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return showForgeInfo(p);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return showForgeInfo(p);
                }))
            )
            .then(Commands.literal('aprimorar')
                .executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return forgeEquipment(p, ctx.source.server);
                })
                .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => {
                    let p = getPlayerFromContext(ctx);
                    return forgeEquipment(p, ctx.source.server);
                }))
            )
    );
});
