# Memescrafto RPG — Modpack (Forge 1.20.1 - 47.3.0)

## Para o Administrador (publicar e atualizar)

1. Crie um repositório público no GitHub (ex.: `memescrafto-modpack`).
2. Edite `installer/atualizar_modpack.bat` se mudar o repositório (`Filipekvi/memescrafto-modpack`).
3. Faça o primeiro push de `z:\memescrafto-forge\modpack\`:
   ```bash
   git add .
   git commit -m "Initial modpack OBT"
   git remote add origin https://github.com/Filipekvi/memescrafto-modpack.git
   git push -u origin main
   ```
4. **Sempre que atualizar `client/kubejs/`, `client/config/` ou `client/mods/`**, rode:
   ```powershell
   powershell -ExecutionPolicy Bypass -File z:\memescrafto-forge\modpack\refresh_pack.ps1
   git -C z:\memescrafto-forge\modpack add .
   git -C z:\memescrafto-forge\modpack commit -m "Update modpack"
   git -C z:\memescrafto-forge\modpack push
   ```

## Para os Jogadores

### Opção A — Prism Launcher (auto-update automático ao clicar em Jogar)
1. Crie/importe uma instância **Minecraft 1.20.1 + Forge 47.3.0**.
2. Coloque `packwiz-installer-bootstrap.jar` dentro da pasta `.minecraft` da instância.
3. Em **Settings → Custom Commands → Pre-launch command**, cole:
   ```text
   "$INST_JAVA" -jar packwiz-installer-bootstrap.jar -s client https://raw.githubusercontent.com/Filipekvi/memescrafto-modpack/main/pack.toml
   ```

### Opção B — Launcher Oficial / CurseForge
1. Instale **Minecraft 1.20.1 + Forge 47.3.0**.
2. Coloque `packwiz-installer-bootstrap.jar` e `atualizar_modpack.bat` dentro da pasta `.minecraft` do perfil.
3. Dê dois cliques em `atualizar_modpack.bat` antes de abrir o jogo sempre que houver atualização.

