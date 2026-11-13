// Catedral da Luz: Padre Bento (Cura, Exorcismo e Bênçãos)

let priestCooldowns = {};

function healPlayer(player, server) {
    if (!player) return false;
    let now = Date.now();
    let lastHeal = priestCooldowns[player.uuid.toString()] || 0;
    let elapsed = Math.round((now - lastHeal) / 1000);

    if (elapsed < 60) {
        player.tell(`§6[Padre Bento] §fAguarde mais §e${60 - elapsed}s §fpara receber outra oração de cura.`);
        return false;
    }

    // Remove efeitos negativos
    const negativeEffects = [
        'minecraft:poison',
        'minecraft:wither',
        'minecraft:slowness',
        'minecraft:weakness',
        'minecraft:hunger',
        'minecraft:blindness',
        'minecraft:darkness',
        'minecraft:nausea'
    ];

    negativeEffects.forEach(eff => {
        player.removeEffect(eff);
    });

    // Aplica cura e regeneração
    player.potionEffects.add('minecraft:instant_health', 1, 1, false, false);
    player.potionEffects.add('minecraft:regeneration', 400, 1, false, true); // 20 segundos
    player.potionEffects.add('minecraft:saturation', 200, 0, false, false);  // 10 segundos

    // Atualiza cooldown
    priestCooldowns[player.uuid.toString()] = now;

    // Efeitos audiovisuais
    player.playSound('minecraft:block.bell.use', 1.0, 0.8);
    player.playSound('minecraft:block.enchantment_table.use', 1.0, 1.2);

    player.tell('§e§l==================================================');
    player.tell('§6§l⛪ CATEDRAL DA LUZ - PADRE BENTO:');
    player.tell('§f"Que as bênçãos sagradas restaurem seu corpo e purifiquem sua alma."');
    player.tell('§a+ Suas feridas foram totalmente cicatrizadas.');
    player.tell('§a+ Todos os venenos e maldições foram expurgados.');
    player.tell('§e§l==================================================');

    return true;
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    function handleBencao(ctx) {
        let player = null;
        try {
            let targetName = Arguments.STRING.getResult(ctx, 'target');
            player = ctx.source.server.getPlayer(targetName);
        } catch(e) {}
        if (!player) player = ctx.source.player;
        if (!player) return 0;
        if (global.isPlayerNearNpc && !global.isPlayerNearNpc(player, ['Padre', 'Bento'], 12)) {
            player.tell('§c[Catedral] Você precisa estar diante do Padre na igreja para receber bênçãos!');
            return 0;
        }
        healPlayer(player, ctx.source.server);
        return 1;
    }

    event.register(
        Commands.literal('bencao')
            .executes(ctx => handleBencao(ctx))
            .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => handleBencao(ctx)))
    );

    event.register(
        Commands.literal('curar_padre')
            .executes(ctx => handleBencao(ctx))
            .then(Commands.argument('target', Arguments.STRING.create(event)).executes(ctx => handleBencao(ctx)))
    );
});
