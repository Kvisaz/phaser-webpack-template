/* eslint-disable */
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const texturePacker = require("free-tex-packer-core");
const { generatePhaserHelper, writeAtlasesIndex} = require("./atlas-phaser.helper");

// === КОНФИГ ==================================================================
const IMAGE_EXTS = [".png"];

/**
 * atlasName -> path
 * you can add several pathes for several atlases
 * **/
const ATLAS_INPUTS = {
  main: path.resolve(__dirname, "src_assets/atlas/main"),
  // secondary: path.resolve(__dirname, "src_assets/atlas/secondary"),
  // my_genius_atlas: path.resolve(__dirname, "src_assets/atlas/my/unique/path/to/sources"),
};
const OUTPUT_DIR = path.resolve(__dirname, "public/assets/atlases");

const BASE_OPTIONS = {
  fixedSize: false,
  padding: 2,
  allowRotation: false,
  detectIdentical: false,
  allowTrim: false,
  exporter: "Phaser3",
  packer: "MaxRectsPacker",
};

/**
 * Per-atlas options.
 * `scale` physically resizes frames in the generated atlas png/json; any visual
 * compensation for a specific effect should live in its scene config.
 *
 * Available scaleMethod values in free-tex-packer-core:
 * BILINEAR, NEAREST_NEIGHBOR, BICUBIC, HERMITE, BEZIER.
 */
const ATLAS_OPTIONS = {
  // secondary: {
  //   scale: 0.5,
  //   scaleMethod: "HERMITE",
  // },
};

// опционально — включить генерацию helper'ов
const GENERATE_PHASER_HELPER = false;
const HELPER_OUTPUT_DIR = path.resolve(__dirname, "src/assets/atlases/generated");
const PUBLIC_BASE_PATH = "./assets/atlases";
// ============================================================================

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true });
  }
}

function isImage(file) {
  return IMAGE_EXTS.includes(path.extname(file).toLowerCase());
}

async function walkImages(dir, baseDir) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...(await walkImages(full, baseDir)));
    } else if (e.isFile() && isImage(e.name)) {
      const rel = path.relative(baseDir, full).split(path.sep).join("/");
      results.push({ path: rel, contents: fs.readFileSync(full) });
    }
  }
  return results;
}

function packAsync(images, options) {
  return new Promise((resolve, reject) => {
    texturePacker(images, options, (files, error) => {
      if (error) return reject(error);
      resolve(files || []);
    });
  });
}

async function packAtlas(atlasName, dir) {
  try {
    const stat = await fsp.stat(dir).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      console.log(`⚠️  Пропуск "${atlasName}": каталога не существует — ${dir}`);
      return false;
    }

    const images = await walkImages(dir, dir);
    if (images.length === 0) {
      console.log(`⚠️  Пропуск "${atlasName}": нет изображений в ${dir}`);
      return false;
    }

    console.log(`🔧 Пакуем "${atlasName}" из "${dir}" (${images.length} шт.)...`);
    const files = await packAsync(images, {
      ...BASE_OPTIONS,
      ...(ATLAS_OPTIONS[atlasName] || {}),
      textureName: atlasName,
    });

    await ensureDir(OUTPUT_DIR);
    for (const f of files) {
      const outPath = path.join(OUTPUT_DIR, f.name);
      fs.writeFileSync(outPath, f.buffer);
      console.log(`   ✅ ${outPath}`);
    }
    console.log(`🎉 Готово: атлас "${atlasName}" упакован.\n`);

    if (GENERATE_PHASER_HELPER) {
      await ensureDir(HELPER_OUTPUT_DIR);
      await generatePhaserHelper({
        atlasName,
        outputDir: OUTPUT_DIR,
        publicBasePath: PUBLIC_BASE_PATH,
        helperOutputDir: HELPER_OUTPUT_DIR,
      });
      console.log(`🎉 Готово: хелпер для атласа "${atlasName}" \n`);
    }

    return true;
  } catch (err) {
    console.error(`❌ Ошибка при упаковке "${atlasName}":`, err);
    return false;
  }
}

(async () => {
  await ensureDir(OUTPUT_DIR);

  let ok = 0;
  for (const [atlasName, dir] of Object.entries(ATLAS_INPUTS)) {
    const success = await packAtlas(atlasName, dir);
    if (success) ok++;
  }

  if (GENERATE_PHASER_HELPER) {
    await writeAtlasesIndex({ helperOutputDir: HELPER_OUTPUT_DIR });
  }

  if (ok === 0) {
    console.log("❌ Нет данных для упаковки (проверьте пути и наличие PNG).");
  } else {
    console.log(`✅ Упаковано атласов: ${ok}`);
  }
})();
