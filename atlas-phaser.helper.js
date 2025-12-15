/* eslint-disable */
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;

function toSafeIdentifier(name) {
    // "card-ui" -> "cardUi", "123" -> "_123"
    const camel = name
        .replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c) => (c ? c.toUpperCase() : ""))
        .replace(/[^a-zA-Z0-9]/g, "");
    return (/^[0-9]/.test(camel) ? "_" : "") + (camel || "atlas");
}

function normalizeFrames(json) {
    // Новый формат от free-tex-packer ("Phaser3"): { textures: [ { image, frames: [...] } ] }
    if (Array.isArray(json?.textures) && json.textures.length > 0) {
        const tex = json.textures[0];
        const frames = (tex.frames || []).map((f) => ({
            filename: f.filename,
            x: f.frame.x,
            y: f.frame.y,
            w: f.frame.w,
            h: f.frame.h,
        }));
        return { image: tex.image, frames };
    }

    // Фолбэк: frames как массив на корне
    if (Array.isArray(json.frames)) {
        return {
            image: undefined,
            frames: json.frames.map((f) => ({
                filename: f.filename,
                x: f.frame.x,
                y: f.frame.y,
                w: f.frame.w,
                h: f.frame.h,
            })),
        };
    }

    // Фолбэк: frames как объект-словарь на корне
    if (json.frames && typeof json.frames === "object") {
        return {
            image: undefined,
            frames: Object.entries(json.frames).map(([filename, f]) => ({
                filename,
                x: f.frame.x,
                y: f.frame.y,
                w: f.frame.w,
                h: f.frame.h,
            })),
        };
    }

    return { image: undefined, frames: [] };
}

function buildTs({ varName, publicBasePath, pngFilename, jsonFilename, frames }) {
    // максимально короткий и читабельный вывод
    const lines = [];
    lines.push("/* AUTO-GENERATED. DO NOT EDIT. */");
    // lines.push("/* eslint-disable */");
    lines.push("");
    lines.push(`const jsonFilename = ${JSON.stringify(jsonFilename)}`);
    lines.push(`const pngFilename = ${JSON.stringify(pngFilename)}`);
    lines.push("");
    lines.push(`export const ${varName} = {`);
    lines.push(`  textureName: '${publicBasePath}/' + pngFilename,`);
    lines.push(`  jsonName: '${publicBasePath}/' + jsonFilename,`);
    lines.push("  frames: {");
    for (const f of frames) {
        lines.push(
            `    ${JSON.stringify(f.filename)}: { x: ${f.x}, y: ${f.y}, w: ${f.w}, h: ${f.h} },`
        );
    }
    lines.push("  },");
    lines.push("} as const");
    lines.push("");
    return lines.join("\n");
}

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        await fsp.mkdir(dir, { recursive: true });
    }
}

/**
 * Генерирует helper TS рядом/в указанной папке.
 * @param {Object} cfg
 * @param {string} cfg.atlasName        - имя атласа (без расширения)
 * @param {string} cfg.outputDir        - где лежат atlasName.png/json
 * @param {string} cfg.publicBasePath   - публичный base path для клиента, напр. "./assets/atlases"
 * @param {string} cfg.helperOutputDir  - куда писать TS, напр. "src/assets/atlases-helpers"
 */
async function generatePhaserHelper(cfg) {
    const { atlasName, outputDir, publicBasePath, helperOutputDir } = cfg;

    const jsonPath = path.join(outputDir, `${atlasName}.json`);
    const pngPath = path.join(outputDir, `${atlasName}.png`);

    if (!fs.existsSync(jsonPath) || !fs.existsSync(pngPath)) {
        console.log(`   ⚠️ helper: пропуск "${atlasName}" — отсутствует json или png`);
        return;
    }

    const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const { frames, image } = normalizeFrames(json);

    if (frames.length === 0) {
        console.log(`   ⚠️ helper: пропуск "${atlasName}" — нет frames в JSON`);
        return;
    }

    const varName = toSafeIdentifier(atlasName);
    const ts = buildTs({
        varName,
        publicBasePath,
        pngFilename: image || path.basename(pngPath),
        jsonFilename: path.basename(jsonPath),
        frames,
    });

    await ensureDir(helperOutputDir);
    const outPath = path.join(helperOutputDir, `${atlasName}.ts`);
    fs.writeFileSync(outPath, ts, "utf8");
    console.log(`   ✨ helper: ${outPath}`);
}

async function writeAtlasesIndex({ helperOutputDir }) {
    await ensureDir(helperOutputDir);
    const entries = await fsp.readdir(helperOutputDir);
    const bases = entries
        .filter((n) => n.endsWith(".ts") && n !== "index.ts")
        .map((n) => path.basename(n, ".ts"))
        .sort();

    const imports = bases
        .map((b) => `import { ${toSafeIdentifier(b)} } from './${b}'`)
        .join("\n");
    const names = bases.map((b) => toSafeIdentifier(b)).join(", ");

    const content =
        "/* AUTO-GENERATED. DO NOT EDIT. */\n" +
        imports +
        `\n\nexport const atlases = { ${names} } as const\n`;

    const out = path.join(helperOutputDir, "index.ts");
    fs.writeFileSync(out, content, "utf8");
    console.log(`   ✨ helper index: ${out}`);
}

module.exports = { generatePhaserHelper, writeAtlasesIndex };
