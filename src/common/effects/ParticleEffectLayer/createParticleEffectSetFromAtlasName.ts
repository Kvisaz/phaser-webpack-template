import {IParticleEffectAtlasConfig, IParticleEffectSetConfig} from "./types";

interface ICreateParticleEffectSetFromAtlasNameProps {
    scene: Phaser.Scene;
    atlasName: string;
    atlases: ReadonlyArray<IParticleEffectAtlasConfig>;
}

/** Создает particleSet из уже загруженного Phaser atlas по имени atlas-пакета. */
export function createParticleEffectSetFromAtlasName(
    props: ICreateParticleEffectSetFromAtlasNameProps,
): IParticleEffectSetConfig {
    const atlas = findAtlasByName(props.atlasName, props.atlases);

    if (!props.scene.textures.exists(atlas.pngUrl)) {
        throw new Error(`Particle atlas "${props.atlasName}" is not preloaded: ${atlas.pngUrl}`);
    }

    const frameNames = props.scene.textures.get(atlas.pngUrl).getFrameNames(false);

    if (frameNames.length === 0) {
        throw new Error(`Particle atlas "${props.atlasName}" has no frames: ${atlas.pngUrl}`);
    }

    return {
        assets: frameNames.map((frameName) => ({
            url: atlas.pngUrl,
            frameName,
        })),
    };
}

/** Ищет atlas по camelCase name, kebab-case имени файла или прямому пути png/json. */
function findAtlasByName(
    atlasName: string,
    atlases: ReadonlyArray<IParticleEffectAtlasConfig>,
): IParticleEffectAtlasConfig {
    const normalizedAtlasName = normalizeAtlasName(atlasName);
    const atlas = atlases.find((item) => {
        return normalizeAtlasName(item.name) === normalizedAtlasName
            || normalizeAtlasName(getAtlasBaseName(item.pngUrl)) === normalizedAtlasName
            || normalizeAtlasName(getAtlasBaseName(item.jsonUrl)) === normalizedAtlasName
            || normalizeAtlasName(item.pngUrl) === normalizedAtlasName
            || normalizeAtlasName(item.jsonUrl) === normalizedAtlasName;
    });

    if (atlas == null) {
        throw new Error(`Particle atlas "${atlasName}" is not found in atlas config list`);
    }

    return atlas;
}

/** Нормализует имя atlas, чтобы поддержать particles-cat-cheshires и particlesCatCheshires. */
function normalizeAtlasName(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Возвращает имя файла atlas без папки и расширения. */
function getAtlasBaseName(url: string): string {
    const fileName = url.split("/").pop() ?? url;
    return fileName.replace(/\.(png|json)$/i, "");
}
