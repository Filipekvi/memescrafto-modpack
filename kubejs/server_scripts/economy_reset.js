// =========================================================================
// RESET ECONOMICO E LIMPEZA DE EXPLOIT (economy_reset.js)
// =========================================================================
// - Corrige o excedente do exploit de bau de masmorra (Dia 1):
//   1. No login (1x por jogador que ja entrou antes), limpa moedas do
//      inventario, Ender Chest e Carteiras (inclusive slot Curios) e entrega
//      5 Moedas de Ouro de recomeco.
//   2. Na 1a abertura ou quebra de baus/barris/shulkers antigos sem LootTable,
//      limpa moedas escondidas dentro do container e marca econ_v2_checked=1.
// =========================================================================

let CuriosApiClass = null;
try {
    CuriosApiClass = Java.loadClass('top.theillusivec4.curios.api.CuriosApi');
} catch (e) {}

function isEconCoinId(itemId) {
    let s = String(itemId || '');
    return s.startsWith('lightmanscurrency:coin_') ||
           s.startsWith('lightmanscurrency:coinpile_') ||
           s.startsWith('lightmanscurrency:coinblock_');
}

function isWalletId(itemId) {
    return String(itemId || '').startsWith('lightmanscurrency:wallet_');
}

function isTargetContainerBlock(blockId) {
    let s = String(blockId || '');
    return s === 'minecraft:chest' ||
           s === 'minecraft:trapped_chest' ||
           s === 'minecraft:barrel' ||
           s.endsWith('shulker_box');
}

function stripWalletCoins(stack) {
    if (!stack || stack.isEmpty()) return false;
    if (!isWalletId(stack.id)) return false;
    try {
        if (stack.nbt && stack.nbt.contains('Items')) {
            stack.nbt.remove('Items');
            return true;
        }
    } catch (e) {}
    return false;
}

function purgePlayerCoins(player) {
    let removed = 0;

    // 1. Inventario principal + armadura + offhand
    try {
        let inv = player.inventory;
        for (let i = 0; i < inv.containerSize; i++) {
            let st = inv.getItem(i);
            if (!st || st.isEmpty()) continue;
            if (isEconCoinId(st.id)) {
                removed += st.count;
                inv.setItem(i, Item.empty);
            } else if (stripWalletCoins(st)) {
                removed++;
            }
        }
    } catch (e) {
        console.error('[EconomyReset] Erro ao limpar inventario: ' + e);
    }

    // 2. Ender Chest
    try {
        let ender = player.enderChestInventory;
        if (ender) {
            for (let i = 0; i < ender.containerSize; i++) {
                let st = ender.getItem(i);
                if (!st || st.isEmpty()) continue;
                if (isEconCoinId(st.id)) {
                    removed += st.count;
                    ender.setItem(i, Item.empty);
                } else if (stripWalletCoins(st)) {
                    removed++;
                }
            }
        }
    } catch (e) {
        console.error('[EconomyReset] Erro ao limpar Ender Chest: ' + e);
    }

    // 3. Curios (slot de Carteira do Lightman's Currency)
    if (CuriosApiClass) {
        try {
            CuriosApiClass.getCuriosInventory(player).ifPresent(handler => {
                let curiosMap = handler.getCurios();
                let keys = curiosMap.keySet().toArray();
                for (let k = 0; k < keys.length; k++) {
                    let stacksHandler = curiosMap.get(keys[k]);
                    if (!stacksHandler) continue;
                    let stacks = stacksHandler.getStacks();
                    for (let i = 0; i < stacks.getSlots(); i++) {
                        let st = stacks.getStackInSlot(i);
                        if (!st || st.isEmpty()) continue;
                        if (isEconCoinId(st.id)) {
                            removed += st.count;
                            stacks.setStackInSlot(i, Item.empty);
                        } else if (stripWalletCoins(st)) {
                            removed++;
                        }
                    }
                }
            });
        } catch (e) {
            console.error('[EconomyReset] Erro ao limpar Curios: ' + e);
        }
    }

    return removed;
}

function purgeContainerCoins(block) {
    if (!block) return 0;
    let id = block.id;
    if (!isTargetContainerBlock(id)) return 0;

    let beData = block.entityData;
    if (!beData) return 0;
    if (beData.contains('LootTable')) return 0;

    let fd = beData.getCompound('ForgeData');
    if (fd && fd.getBoolean('econ_v2_checked')) return 0;

    let removed = 0;
    try {
        let inv = block.inventory;
        if (inv) {
            let slots = inv.slots !== undefined ? inv.slots : inv.containerSize;
            for (let i = 0; i < slots; i++) {
                let st = inv.getStackInSlot ? inv.getStackInSlot(i) : inv.getItem(i);
                if (!st || st.isEmpty()) continue;
                if (isEconCoinId(st.id)) {
                    removed += st.count;
                    if (inv.setStackInSlot) {
                        inv.setStackInSlot(i, Item.empty);
                    } else {
                        st.count = 0;
                    }
                } else if (stripWalletCoins(st)) {
                    removed++;
                }
            }
        }
    } catch (e) {
        console.error('[EconomyReset] Erro ao limpar container: ' + e);
    }

    try {
        block.mergeEntityData({ ForgeData: { econ_v2_checked: 1 } });
    } catch (e) {}

    return removed;
}

PlayerEvents.loggedIn(event => {
    let p = event.player;
    if (!p) return;

    if (p.persistentData.getBoolean('econ_wipe_v1')) return;
    p.persistentData.putBoolean('econ_wipe_v1', true);

    // Jogadores que ja tinham entrado antes do reset recebem limpeza + 5 Ouros de recomeco
    if (p.persistentData.getBoolean('rpg_onboarding_v1')) {
        purgePlayerCoins(p);
        p.give(Item.of('lightmanscurrency:coin_gold', 5));
        if (global.econMint) global.econMint('econ_reset_compensation', 50, p);

        p.tell('§6§m==================================================');
        p.tell('§e§l⚖ AJUSTE ECONOMICO DO SERVIDOR');
        p.tell('§fCorrigimos um bug de duplicacao em baus de masmorra.');
        p.tell('§fPara manter a economia justa, as moedas antigas foram resetadas e voce recebeu §65 Moedas de Ouro §fde recomeco!');
        p.tell('§6§m==================================================');
    }
});

BlockEvents.placed(event => {
    let b = event.block;
    if (!b || !isTargetContainerBlock(b.id)) return;
    try {
        b.mergeEntityData({ ForgeData: { econ_v2_checked: 1 } });
    } catch (e) {}
});

BlockEvents.rightClicked(event => {
    let b = event.block;
    if (!b || !isTargetContainerBlock(b.id)) return;
    purgeContainerCoins(b);
});

BlockEvents.broken(event => {
    let b = event.block;
    if (!b || !isTargetContainerBlock(b.id)) return;
    purgeContainerCoins(b);
});

