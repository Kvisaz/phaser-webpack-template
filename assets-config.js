const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const DEFAULT_CONFIG = {
  assetsFolder: "./public/assets",
  assetsFolderInConfig: "./assets",
  targetFile: "./src/autoAssetsConfig.ts",
  soundAssetsExtensions: [".mp3"],
  atlasAssetsExtensions: [".json"],
  atlasTextureExtension: ".png",
  imageAssetsExtensions: [".webp", ".png", ".jpg"],
  fontAssetsExtensions: [".ttf", ".woff", ".woff2"]
};

function toPosixPath(p) {
  return p.split(path.sep).join("/");
}

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function replaceExtension(filePath, newExt) {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}${newExt}`);
}

function normalizeExtensions(list, label) {
  return Array.from(
    new Set(
      ensureArray(list).map((ext) => {
        if (typeof ext !== "string") {
          throw new Error(`Invalid ${label}: expected string extension, got ${typeof ext}`);
        }
        const trimmed = ext.trim();
        if (trimmed.length === 0) {
          throw new Error(`Invalid ${label}: extension cannot be empty`);
        }
        const normalized = trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
        return normalized.toLowerCase();
      })
    )
  );
}

function normalizeExtension(value, label) {
  const normalizedList = normalizeExtensions([value], label);
  if (normalizedList.length === 0) {
    throw new Error(`Invalid ${label}: extension cannot be empty`);
  }
  return normalizedList[0];
}

function normalizeSegment(segment) {
  if (!segment) return segment;
  const isAllUpper = /^[A-Z0-9]+$/.test(segment);
  return isAllUpper ? segment.toLowerCase() : segment;
}

function toCamelCase(input) {
  if (!input) return "asset";
  const parts = input.split(/[^A-Za-z0-9]+/).filter(Boolean).map(normalizeSegment);
  if (parts.length === 0) {
    const fallback = input.replace(/[^A-Za-z0-9]/g, "");
    return fallback ? toCamelCase(fallback) : "asset";
  }

  let camel = "";
  for (let i = 0; i < parts.length; i += 1) {
    const segment = parts[i];
    if (!segment) continue;
    if (i === 0) {
      camel += segment.charAt(0).toLowerCase() + segment.slice(1);
    } else {
      const lower = segment.toLowerCase();
      camel += lower.charAt(0).toUpperCase() + lower.slice(1);
    }
  }

  camel = camel.replace(/[^A-Za-z0-9_$]/g, "");
  if (camel.length === 0) {
    camel = "asset";
  } else if (!/^[A-Za-z_$]/.test(camel.charAt(0))) {
    camel = `asset${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
  }

  return camel;
}

function loadConfig(cwd) {
  const configPath = path.resolve(cwd, "assets.config.js");
  if (!fs.existsSync(configPath)) {
    return { config: { ...DEFAULT_CONFIG }, source: null };
  }

  delete require.cache[configPath];
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const rawConfig = require(configPath);
  const userConfig = rawConfig && rawConfig.default ? rawConfig.default : rawConfig;

  if (!userConfig || typeof userConfig !== "object") {
    throw new Error(`Expected assets.config.js to export an object, got ${typeof userConfig}`);
  }

  const merged = { ...DEFAULT_CONFIG, ...userConfig };
  return {
    config: {
      ...merged,
      soundAssetsExtensions: normalizeExtensions(merged.soundAssetsExtensions, "soundAssetsExtensions"),
      atlasAssetsExtensions: normalizeExtensions(merged.atlasAssetsExtensions, "atlasAssetsExtensions"),
      atlasTextureExtension: normalizeExtension(
        merged.atlasTextureExtension ?? DEFAULT_CONFIG.atlasTextureExtension,
        "atlasTextureExtension"
      ),
      imageAssetsExtensions: normalizeExtensions(merged.imageAssetsExtensions, "imageAssetsExtensions"),
      fontAssetsExtensions: normalizeExtensions(merged.fontAssetsExtensions, "fontAssetsExtensions")
    },
    source: configPath
  };
}

function joinConfigPath(base, relativePath) {
  const cleanBase = toPosixPath(base).replace(/\/+$/, "");
  const cleanRel = toPosixPath(relativePath);

  if (!cleanBase || cleanBase === ".") {
    return cleanRel.startsWith("./") || cleanRel.startsWith("../") ? cleanRel : `./${cleanRel}`;
  }

  return `${cleanBase}/${cleanRel}`.replace(/\/\/+/g, "/");
}

async function walkFiles(dir) {
  const stack = [dir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    // eslint-disable-next-line no-await-in-loop
    const entries = await fsp.readdir(current, { withFileTypes: true }).catch((err) => {
      if (err.code === "ENOENT") return [];
      throw err;
    });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function isIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function formatValue(value, indentLevel) {
  const indent = "  ".repeat(indentLevel);

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const inner = value
      .map((item) => `${"  ".repeat(indentLevel + 1)}${formatValue(item, indentLevel + 1)}`)
      .join(",\n");
    return `[\n${inner}\n${indent}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";

    const inner = entries
      .map(([key, val]) => {
        const printableKey = isIdentifier(key) ? key : JSON.stringify(key);
        return `${"  ".repeat(indentLevel + 1)}${printableKey}: ${formatValue(val, indentLevel + 1)}`;
      })
      .join(",\n");

    return `{\n${inner}\n${indent}}`;
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

function formatObject(value) {
  return formatValue(value, 0);
}

async function parseAtlas(filePath, relPath) {
  const raw = await fsp.readFile(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse atlas JSON (${relPath}): ${err.message}`);
  }

  if (!data || !Array.isArray(data.textures)) {
    return [];
  }

  const frames = [];
  for (const texture of data.textures) {
    if (!texture || !Array.isArray(texture.frames)) continue;
    for (const frame of texture.frames) {
      if (!frame || typeof frame.filename !== "string") continue;
      const filename = frame.filename;
      const basename = filename.split("/").pop() || filename;
      const rawKey = basename.replace(/\.[^.]+$/, "") || basename;
      const key = toCamelCase(rawKey);
      const width = frame.frame && typeof frame.frame.w === "number" ? frame.frame.w : undefined;
      const height = frame.frame && typeof frame.frame.h === "number" ? frame.frame.h : undefined;

      frames.push({
        key,
        frameName: filename,
        width,
        height
      });
    }
  }

  return frames;
}

function createAssetEntry(value, source, priority) {
  return {
    primary: { value: { ...value }, source },
    priority,
    fallbackUrls: []
  };
}

function addFallbackUrl(entry, url, atStart = false) {
  if (!url) return;
  if (entry.fallbackUrls.includes(url)) return;
  if (atStart) {
    entry.fallbackUrls.unshift(url);
  } else {
    entry.fallbackUrls.push(url);
  }
}

function registerAsset(map, key, value, originDescription, assetType, options = {}) {
  const { priority = 0, replaceStrategy = "error" } = options;
  const existing = map.get(key);

  if (!existing) {
    map.set(key, createAssetEntry(value, originDescription, priority));
    return;
  }

  if (replaceStrategy === "keepHigherPriority") {
    if (priority < existing.priority) {
      addFallbackUrl(existing, existing.primary.value.url, true);
      existing.primary = { value: { ...value }, source: originDescription };
      existing.priority = priority;
      map.set(key, existing);
      return;
    }

    if (priority >= existing.priority) {
      addFallbackUrl(existing, value.url);
      map.set(key, existing);
      return;
    }
  }

  const prevOrigin = existing.primary.source;
  throw new Error(
    `Duplicate ${assetType} asset key "${key}":\n  - ${prevOrigin}\n  - ${originDescription}`
  );
}

async function main() {
  const cwd = process.cwd();
  const { config } = loadConfig(cwd);

  const assetsRoot = path.resolve(cwd, config.assetsFolder);
  const assetsRootExists = await fsp
    .stat(assetsRoot)
    .then((stats) => stats.isDirectory())
    .catch(() => false);

  if (!assetsRootExists) {
    console.warn(
      `[assets-config] Assets folder not found: ${config.assetsFolder} (resolved to ${assetsRoot})`
    );
  }

  const files = assetsRootExists ? await walkFiles(assetsRoot) : [];

  const soundExts = new Set(config.soundAssetsExtensions.map((ext) => ext.toLowerCase()));
  const atlasExts = new Set(config.atlasAssetsExtensions.map((ext) => ext.toLowerCase()));
  const imageExts = new Set(config.imageAssetsExtensions.map((ext) => ext.toLowerCase()));
  const fontExts = new Set(config.fontAssetsExtensions.map((ext) => ext.toLowerCase()));
  const atlasTextureExt = config.atlasTextureExtension.toLowerCase();

  const soundExtPriority = new Map();
  config.soundAssetsExtensions.forEach((ext, index) => {
    soundExtPriority.set(ext.toLowerCase(), index);
  });

  const fontExtPriority = new Map();
  config.fontAssetsExtensions.forEach((ext, index) => {
    fontExtPriority.set(ext.toLowerCase(), index);
  });

  const imageExtPriority = new Map();
  config.imageAssetsExtensions.forEach((ext, index) => {
    imageExtPriority.set(ext.toLowerCase(), index);
  });

  const entries = files.map((absFile) => {
    const relFromAssets = path.relative(assetsRoot, absFile);
    const extOriginal = path.extname(relFromAssets);
    const ext = extOriginal.toLowerCase();
    const baseRel =
      extOriginal.length > 0 ? relFromAssets.slice(0, -extOriginal.length) : relFromAssets;
    const originRel = toPosixPath(path.relative(cwd, absFile));
    const url = joinConfigPath(config.assetsFolderInConfig, relFromAssets);
    const baseName =
      extOriginal.length > 0
        ? path.basename(relFromAssets, extOriginal)
        : path.basename(relFromAssets);
    const camelName = toCamelCase(baseName);
    return {
      absFile,
      relFromAssets,
      baseRel,
      ext,
      originRel,
      url,
      baseName,
      camelName
    };
  });

  const entryByBaseAndExt = new Map();
  for (const entry of entries) {
    entryByBaseAndExt.set(`${entry.baseRel}::${entry.ext}`, entry);
  }

  const atlasEntries = entries.filter((entry) => atlasExts.has(entry.ext));
  const atlasTextureRelSet = new Set();
  const atlasInfos = atlasEntries.map((jsonEntry) => {
    const baseRel = jsonEntry.baseRel;
    const pngKey = `${baseRel}::${atlasTextureExt}`;
    const pngEntry = entryByBaseAndExt.get(pngKey) || null;

    if (pngEntry) {
      atlasTextureRelSet.add(pngEntry.relFromAssets);
    }

    const pngRelFromAssets = pngEntry
      ? pngEntry.relFromAssets
      : replaceExtension(jsonEntry.relFromAssets, config.atlasTextureExtension);
    const pngAbsPath = pngEntry ? pngEntry.absFile : path.resolve(assetsRoot, pngRelFromAssets);
    const pngUrl = joinConfigPath(config.assetsFolderInConfig, pngRelFromAssets);
    const atlasName = toCamelCase(path.basename(baseRel));

    return {
      name: atlasName,
      baseRel,
      jsonAbsPath: jsonEntry.absFile,
      jsonRelFromAssets: jsonEntry.relFromAssets,
      jsonUrl: jsonEntry.url,
      jsonOriginRel: jsonEntry.originRel,
      pngAbsPath,
      pngRelFromAssets,
      pngUrl
    };
  });

  const soundsMap = new Map();
  const fontsMap = new Map();
  const imagesMap = new Map();

  for (const entry of entries) {
    const { ext, relFromAssets, originRel, url, camelName } = entry;

    if (soundExts.has(ext)) {
      registerAsset(soundsMap, camelName, { url, name: camelName }, originRel, "sound", {
        priority: soundExtPriority.get(ext) ?? soundExtPriority.size,
        replaceStrategy: "keepHigherPriority"
      });
      continue;
    }

    if (fontExts.has(ext)) {
      registerAsset(
        fontsMap,
        camelName,
        { url, name: camelName, fontFamily: camelName },
        originRel,
        "font",
        {
          priority: fontExtPriority.get(ext) ?? fontExtPriority.size,
          replaceStrategy: "keepHigherPriority"
        }
      );
      continue;
    }

    if (atlasExts.has(ext)) {
      continue;
    }

    if (ext === atlasTextureExt && atlasTextureRelSet.has(relFromAssets)) {
      continue;
    }

    if (imageExts.has(ext)) {
      registerAsset(imagesMap, camelName, { url, name: camelName }, originRel, "image", {
        priority: (imageExtPriority.get(ext) ?? imageExtPriority.size) + 10,
        replaceStrategy: "keepHigherPriority"
      });
    }
  }

  for (const atlas of atlasInfos) {
    // eslint-disable-next-line no-await-in-loop
    const frames = await parseAtlas(atlas.jsonAbsPath, atlas.jsonOriginRel);
    for (const frame of frames) {
      const frameOrigin = `${atlas.jsonOriginRel} -> ${frame.frameName}`;
      registerAsset(
        imagesMap,
        frame.key,
        {
          url: atlas.pngUrl,
          name: frame.key,
          frameName: frame.frameName,
          ...(frame.width !== undefined ? { width: frame.width } : {}),
          ...(frame.height !== undefined ? { height: frame.height } : {})
        },
        frameOrigin,
        "image",
        {
          priority: 0,
          replaceStrategy: "keepHigherPriority"
        }
      );
    }
  }

  const sortedSoundKeys = Array.from(soundsMap.keys()).sort((a, b) => a.localeCompare(b));
  const sortedFontKeys = Array.from(fontsMap.keys()).sort((a, b) => a.localeCompare(b));
  const sortedImageKeys = Array.from(imagesMap.keys()).sort((a, b) => a.localeCompare(b));

  const soundsObj = {};
  for (const key of sortedSoundKeys) {
    const entry = soundsMap.get(key);
    const result = { ...entry.primary.value };
    if (entry.fallbackUrls.length > 0) {
      result.fallbackUrls = [...entry.fallbackUrls];
    }
    soundsObj[key] = result;
  }

  const fontsObj = {};
  for (const key of sortedFontKeys) {
    const entry = fontsMap.get(key);
    const result = { ...entry.primary.value };
    if (entry.fallbackUrls.length > 0) {
      result.fallbackUrls = [...entry.fallbackUrls];
    }
    fontsObj[key] = result;
  }

  const imagesObj = {};
  for (const key of sortedImageKeys) {
    const entry = imagesMap.get(key);
    const result = { ...entry.primary.value };
    if (entry.fallbackUrls.length > 0) {
      result.fallbackUrls = [...entry.fallbackUrls];
    }
    imagesObj[key] = result;
  }

  const preloadAtlasesMap = new Map();
  for (const atlas of atlasInfos) {
    if (!preloadAtlasesMap.has(atlas.name)) {
      preloadAtlasesMap.set(atlas.name, {
        name: atlas.name,
        jsonUrl: atlas.jsonUrl,
        pngUrl: atlas.pngUrl
      });
    }
  }

  const preloadAtlases = Array.from(preloadAtlasesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const atlasPngUrlSet = new Set(preloadAtlases.map((atlas) => atlas.pngUrl));

  const preloadSounds = sortedSoundKeys.map((key) => ({
    name: key,
    url: soundsObj[key].url
  }));

  const preloadFonts = sortedFontKeys.map((key) => {
    const font = fontsObj[key];
    return {
      name: key,
      url: font.url,
      fontFamily: font.fontFamily ?? key
    };
  });

  const preloadImages = sortedImageKeys
    .filter(
      (key) =>
        imagesObj[key].frameName === undefined && !atlasPngUrlSet.has(imagesObj[key].url)
    )
    .map((key) => ({
      name: key,
      url: imagesObj[key].url
    }));

  const outputObject = {
    sounds: soundsObj,
    fonts: fontsObj,
    images: imagesObj,
    preload: {
      sounds: preloadSounds,
      fonts: preloadFonts,
      images: preloadImages,
      atlases: preloadAtlases
    }
  };

  const tsContent = `// ⚠️ This file is auto-generated by assets-config.js. Do not edit manually.\nexport const autoAssetsConfig = ${formatObject(
    outputObject
  )} as const;\n`;

  const targetPath = path.resolve(cwd, config.targetFile);
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.writeFile(targetPath, tsContent, "utf8");

  const soundsCount = sortedSoundKeys.length;
  const fontsCount = sortedFontKeys.length;
  const imagesCount = sortedImageKeys.length;
  console.log(
    `[assets-config] Generated autoAssetsConfig with ${soundsCount} sound(s), ${fontsCount} font(s) and ${imagesCount} image(s) -> ${toPosixPath(
      path.relative(cwd, targetPath)
    )}`
  );
}

main().catch((err) => {
  console.error("[assets-config] ❌ Failed to generate assets config:");
  console.error(err instanceof Error ? err.stack || err.message : err);
  process.exitCode = 1;
});
