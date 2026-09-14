/**
 * One-off extractor: BNW + Vox Populi → assets/data/{worldWonders,religions,corporations}.json
 *
 * Usage: node scripts/extract-vp-catalogs.mjs
 *
 * Env overrides:
 *   CIV5_ROOT  – Sid Meier's Civilization V install
 *   VP_ROOT    – Community-Patch-DLL repo root
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(APP_ROOT, 'assets', 'data');

const CIV5_ROOT =
  process.env.CIV5_ROOT ??
  String.raw`C:\Program Files (x86)\Steam\steamapps\common\Sid Meier's Civilization V`;
const VP_ROOT =
  process.env.VP_ROOT ?? path.resolve(APP_ROOT, '..', 'Community-Patch-DLL');

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function collectRows(xml, tableName) {
  const tableMatch = xml.match(
    new RegExp(`<${tableName}>([\\s\\S]*?)</${tableName}>`, 'i'),
  );
  if (!tableMatch) return [];
  const body = tableMatch[1];
  const rows = [];
  const rowRe = /<Row>([\s\S]*?)<\/Row>/gi;
  let match;
  while ((match = rowRe.exec(body)) !== null) {
    const fields = {};
    const fieldRe = /<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g;
    let fieldMatch;
    while ((fieldMatch = fieldRe.exec(match[1])) !== null) {
      fields[fieldMatch[1]] = fieldMatch[2].trim();
    }
    rows.push(fields);
  }
  return rows;
}

function loadTextMap(files) {
  const map = new Map();
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const content = read(filePath);
    // XML: <Row Tag="..."> <Text>...</Text>
    const xmlRe =
      /<Row\s+Tag="([^"]+)">[\s\S]*?<Text>([\s\S]*?)<\/Text>/gi;
    let match;
    while ((match = xmlRe.exec(content)) !== null) {
      map.set(match[1], decodeText(match[2]));
    }
    // SQL: UPDATE Language_en_US SET Text = '...' WHERE Tag = '...'
    const sqlUpdateRe =
      /UPDATE\s+Language_en_US\s+SET\s+Text\s*=\s*'((?:[^']|'')*)'\s*WHERE\s+Tag\s*=\s*'([^']+)'/gi;
    while ((match = sqlUpdateRe.exec(content)) !== null) {
      map.set(match[2], decodeText(match[1].replace(/''/g, "'")));
    }
    // SQL INSERT INTO Language_en_US (Tag, Text) VALUES ('...', '...')
    const sqlInsertRe =
      /\(\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;
    if (/INSERT\s+INTO\s+Language_en_US/i.test(content)) {
      while ((match = sqlInsertRe.exec(content)) !== null) {
        if (match[1].startsWith('TXT_KEY_')) {
          map.set(match[1], decodeText(match[2].replace(/''/g, "'")));
        }
      }
    }
  }
  return map;
}

function decodeText(raw) {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\[[^\]]+\]/g, '') // strip Civ5 [ICON_...] / [COLOR_...] markup leftovers if any
    .trim();
}

function resolveName(textKey, textMap, fallbackId) {
  if (textKey && textMap.has(textKey)) {
    return textMap.get(textKey);
  }
  // BUILDING_STONEHENGE → Stonehenge
  return fallbackId
    .replace(/^BUILDING_/, '')
    .replace(/^RELIGION_/, '')
    .replace(/^CORPORATION_/, '')
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function gatherBuildingClasses() {
  const vpOverride = path.join(CIV5_ROOT, 'Assets', 'DLC', 'VP_MODPACK', 'Override');
  const files = [
    path.join(vpOverride, 'CIV5BuildingClasses.xml'),
    path.join(vpOverride, 'CIV5BuildingClasses_Expansion.xml'),
    path.join(vpOverride, 'CIV5BuildingClasses_Expansion2.xml'),
    path.join(vpOverride, 'CIV5BuildingClasses_Inherited_Expansion2.xml'),
    path.join(vpOverride, 'CIV5BuildingClasses_NewWonders.xml'),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'DLC_06',
      'Gameplay',
      'XML',
      'CIV5BuildingClasses_NewWonders.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5BuildingClasses.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5BuildingClasses_Expansion.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5BuildingClasses.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5BuildingClasses_Expansion2.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5BuildingClasses_Inherited_Expansion2.xml',
    ),
    path.join(
      VP_ROOT,
      '(2) Vox Populi',
      'Database Changes',
      'City',
      'Buildings',
      'NewBuildings.xml',
    ),
  ];

  /** @type {Map<string, { type: string, defaultBuilding: string, description: string }>} */
  const byDefault = new Map();
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const xml = read(file);
    for (const row of collectRows(xml, 'BuildingClasses')) {
      const maxGlobal = Number(row.MaxGlobalInstances ?? '-1');
      if (maxGlobal <= 0) continue;
      const defaultBuilding = row.DefaultBuilding;
      if (!defaultBuilding) continue;
      byDefault.set(defaultBuilding, {
        type: row.Type,
        defaultBuilding,
        description: row.Description ?? '',
      });
    }
  }
  return byDefault;
}

function gatherBuildings() {
  const vpOverride = path.join(CIV5_ROOT, 'Assets', 'DLC', 'VP_MODPACK', 'Override');
  const files = [
    path.join(vpOverride, 'CIV5Buildings.xml'),
    path.join(vpOverride, 'CIV5Buildings_Expansion.xml'),
    path.join(vpOverride, 'CIV5Buildings_Expansion2.xml'),
    path.join(vpOverride, 'CIV5Buildings_Inherited_Expansion2.xml'),
    path.join(vpOverride, 'CIV5Buildings_NewWonders.xml'),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'DLC_06',
      'Gameplay',
      'XML',
      'CIV5Buildings_NewWonders.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5Buildings.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5Buildings_Expansion.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5Buildings.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5Buildings_Expansion2.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Buildings',
      'CIV5Buildings_Inherited_Expansion2.xml',
    ),
    path.join(
      VP_ROOT,
      '(2) Vox Populi',
      'Database Changes',
      'City',
      'Buildings',
      'NewBuildings.xml',
    ),
  ];

  /** @type {Map<string, Record<string, string>>} */
  const byType = new Map();
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const xml = read(file);
    for (const row of collectRows(xml, 'Buildings')) {
      if (!row.Type) continue;
      const existing = byType.get(row.Type) ?? {};
      byType.set(row.Type, { ...existing, ...row });
    }
  }
  return byType;
}

function extractWorldWonders(textMap) {
  const classes = gatherBuildingClasses();
  const buildings = gatherBuildings();
  const wonders = [];

  for (const [buildingId, classInfo] of classes) {
    const building = buildings.get(buildingId) ?? {};
    const isCorp =
      building.IsCorporation === 'true' ||
      building.IsCorporation === '1' ||
      /_HQ$/.test(buildingId);
    if (isCorp) continue;

    const descriptionKey = building.Description || classInfo.description;
    const entry = {
      id: buildingId,
      name: resolveName(descriptionKey, textMap, buildingId),
    };
    if (building.PrereqTech) entry.prereqTech = building.PrereqTech;
    if (building.UnlockedByLeague === 'true' || building.UnlockedByLeague === '1') {
      entry.unlockedByLeague = true;
    }
    if (building.CivilizationRequired) {
      entry.civilizationRequired = building.CivilizationRequired;
    }
    wonders.push(entry);
  }

  wonders.sort((a, b) => a.name.localeCompare(b.name));
  return wonders;
}

function extractReligions(textMap) {
  const religionsXml = path.join(
    CIV5_ROOT,
    'Assets',
    'DLC',
    'Expansion2',
    'Gameplay',
    'XML',
    'Religions',
    'Civ5Religions.xml',
  );
  const rows = collectRows(read(religionsXml), 'Religions');
  return rows
    .filter((row) => row.Type && row.Type !== 'RELIGION_PANTHEON')
    .map((row) => ({
      id: row.Type,
      name: resolveName(row.Description, textMap, row.Type),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function extractCorporations(textMap) {
  const corpsXml = path.join(
    VP_ROOT,
    '(2) Vox Populi',
    'Database Changes',
    'Corporations',
    'NewCorporations.xml',
  );
  const rows = collectRows(read(corpsXml), 'Corporations');
  return rows
    .filter((row) => row.Type)
    .map((row) => {
      const entry = {
        id: row.Type,
        name: resolveName(row.Description, textMap, row.Type),
      };
      if (row.HeadquartersBuildingClass) {
        entry.headquartersBuildingClass = row.HeadquartersBuildingClass;
      }
      return entry;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function writeDataset(fileName, description, key, items) {
  const payload = {
    schemaVersion: 1,
    mod: 'Vox Populi',
    description,
    [key]: items,
  };
  const outPath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outPath} (${items.length} items)`);
}

function main() {
  const vpOverride = path.join(CIV5_ROOT, 'Assets', 'DLC', 'VP_MODPACK', 'Override');
  const textFiles = [
    path.join(vpOverride, 'CIV5GameTextInfos_Buildings.xml'),
    path.join(vpOverride, 'CIV5GameTextInfos_Buildings_Expansion.xml'),
    path.join(vpOverride, 'CIV5GameTextInfos_Buildings_Expansion2.xml'),
    path.join(vpOverride, 'CIV5GameTextInfos_Buildings_Inherited_Expansion2.xml'),
    path.join(vpOverride, 'CIV5GameTextInfos_Buildings_NewWonders.xml'),
    path.join(
      CIV5_ROOT,
      'Assets',
      'Gameplay',
      'XML',
      'NewText',
      'EN_US',
      'CIV5GameTextInfos_Buildings.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion',
      'Gameplay',
      'XML',
      'Text',
      'en_US',
      'CIV5GameTextInfos_Buildings_Expansion.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Text',
      'en_US',
      'CIV5GameTextInfos_Buildings_Expansion2.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Text',
      'en_US',
      'CIV5GameTextInfos_Buildings_Inherited_Expansion2.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Text',
      'en_US',
      'CIV5GameTextInfos_Religion_Expansion2.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion2',
      'Gameplay',
      'XML',
      'Text',
      'en_US',
      'CIV5GameTextInfos_Religion_Inherited_Expansion2.xml',
    ),
    path.join(
      CIV5_ROOT,
      'Assets',
      'DLC',
      'Expansion',
      'Gameplay',
      'XML',
      'Text',
      'en_US',
      'CIV5GameTextInfos_Religion_Expansion.xml',
    ),
    path.join(
      VP_ROOT,
      '(2) Vox Populi',
      'Database Changes',
      'Text',
      'en_US',
      'City',
      'NewBuildingText.xml',
    ),
    path.join(
      VP_ROOT,
      '(2) Vox Populi',
      'Database Changes',
      'Text',
      'en_US',
      'Corporations',
      'NewCorporationText.xml',
    ),
  ];

  console.log(`CIV5_ROOT=${CIV5_ROOT}`);
  console.log(`VP_ROOT=${VP_ROOT}`);

  const textMap = loadTextMap(textFiles);
  console.log(`Loaded ${textMap.size} text keys`);

  const wonders = extractWorldWonders(textMap);
  const religions = extractReligions(textMap);
  const corporations = extractCorporations(textMap);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  writeDataset(
    'worldWonders.json',
    'World wonders (MaxGlobalInstances=1) from BNW + Vox Populi. Corporation HQs excluded.',
    'worldWonders',
    wonders,
  );
  writeDataset(
    'religions.json',
    'Foundable religions from BNW (pantheon sentinel excluded).',
    'religions',
    religions,
  );
  writeDataset(
    'corporations.json',
    'Vox Populi corporations.',
    'corporations',
    corporations,
  );

  if (wonders.length < 40 || religions.length !== 13 || corporations.length !== 8) {
    console.warn('Unexpected counts:', {
      wonders: wonders.length,
      religions: religions.length,
      corporations: corporations.length,
    });
    process.exitCode = 1;
  }
}

main();
