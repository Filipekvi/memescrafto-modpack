// Interceptação de Forge Events para proteção de navios Small Ships em cidades (interactAt e montagem)
ForgeEvents.onEvent('net.minecraftforge.event.entity.player.PlayerInteractEvent$EntityInteractSpecific', event => {
    if (event.level && event.level.isClientSide()) return;
    if (global.shouldBlockShipInteraction && global.shouldBlockShipInteraction(event.entity, event.target)) {
        event.setCanceled(true);
    }
});

ForgeEvents.onEvent('net.minecraftforge.event.entity.EntityMountEvent', event => {
    if (!event.isMounting()) return;
    let level = event.level;
    if (level && level.isClientSide()) return;
    if (global.shouldBlockShipInteraction && global.shouldBlockShipInteraction(event.entityMounting, event.entityBeingMounted)) {
        event.setCanceled(true);
    }
});
