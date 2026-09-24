import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {join, resolve} from 'node:path';

const root = resolve('docs/config/v1');
const allowedModes = new Set(['vaultOnly', 'vaultAndModel']);
const allowedActions = new Set([
  'chat', 'openVault', 'addPdf', 'addText', 'addImage', 'addAudio', 'addAudio2',
]);

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} contains duplicates`);
}

function checkModes(available, selected, label, global = false) {
  assert.ok(Array.isArray(available) && available.length > 0, `${label}: availableAnswerModes must be nonempty`);
  unique(available, `${label}: availableAnswerModes`);
  assert.ok(available.every(value => global ? value === 'modelOnly' : allowedModes.has(value)), `${label}: unsupported answer mode`);
  assert.ok(Array.isArray(selected) && selected.length === 1, `${label}: selectedAnswerModes must contain exactly one mode`);
  assert.ok(available.includes(selected[0]), `${label}: selected mode is not available`);
}

function checkActions(actions, label) {
  assert.ok(Array.isArray(actions), `${label}: actions must be an array`);
  unique(actions, label);
  assert.ok(actions.every(action => allowedActions.has(action)), `${label}: unsupported action`);
}

const config = await json(join(root, 'app-config.json'));
assert.equal(config.schemaVersion, 1);
assert.ok(Number.isSafeInteger(config.configVersion) && config.configVersion > 0);
assert.ok(['draft', 'published'].includes(config.status));
for (const paletteName of ['colors', 'darkColors']) {
  const palette = config.theme?.[paletteName];
  for (const key of ['background', 'surface', 'text', 'secondaryText', 'accent']) {
    assert.match(palette?.[key] ?? '', /^#[a-fA-F0-9]{6}$/, `${paletteName}.${key} must be a six-digit color`);
  }
}

const globalChat = config.home?.globalChat;
assert.equal(globalChat?.action, 'openGlobalChat');
assert.equal(typeof globalChat?.enabled, 'boolean');
assert.equal(typeof globalChat?.title, 'string');
assert.ok(globalChat.title.length > 0);
assert.equal(typeof globalChat?.systemPrompt, 'string');
checkModes(globalChat.availableAnswerModes, globalChat.selectedAnswerModes, 'globalChat', true);
const utilityActions = config.home?.utilityActions;
assert.ok(Array.isArray(utilityActions));
unique(utilityActions.map(action => action.id), 'Home utility action IDs');
for (const action of utilityActions) {
  assert.ok(['changeImageBackground', 'settings', 'openAiCompatibleTests'].includes(action.id));
  assert.equal(typeof action.title, 'string');
  assert.ok(action.title.length > 0);
  assert.equal(typeof action.enabled, 'boolean');
  assert.ok(Number.isSafeInteger(action.order) && action.order >= 0);
}

const categories = config.home?.categories;
assert.ok(Array.isArray(categories) && categories.length > 0);
unique(categories.map(category => category.id), 'category IDs');
unique(categories.map(category => category.order), 'category order');
const categoryById = new Map(categories.map(category => [category.id, category]));
unique([globalChat.order, ...utilityActions.map(action => action.order), ...categories.map(category => category.order)], 'Home order');
for (const category of categories) {
  assert.match(category.id, /^[a-z][a-z0-9-]*$/);
  assert.equal(typeof category.enabled, 'boolean');
  assert.ok(Number.isSafeInteger(category.order) && category.order >= 0);
  assert.equal(typeof category.systemPrompt, 'string');
  assert.ok(category.systemPrompt.length > 0 && category.systemPrompt.length <= 4000);
  checkModes(category.availableAnswerModes, category.selectedAnswerModes, `category ${category.id}`);
  checkActions(category.spaceActions, `category ${category.id} spaceActions`);
  checkActions(category.vaultAddActions, `category ${category.id} vaultAddActions`);
}

const spaces = config.readyMadeSpaces;
assert.ok(Array.isArray(spaces));
unique(spaces.map(space => space.id), 'Space IDs');
const referencedManifests = new Set();
for (const space of spaces) {
  assert.match(space.id, /^[a-z][a-z0-9-]*$/);
  assert.ok(categoryById.has(space.categoryId), `${space.id}: unknown category`);
  assert.ok(['comingSoon', 'available'].includes(space.availability), `${space.id}: invalid availability`);
  assert.equal(space.manifestPath, `vaults/${space.id}.json`, `${space.id}: manifest path mismatch`);
  checkActions(space.spaceActions, `${space.id} spaceActions`);
  checkActions(space.vaultAddActions, `${space.id} vaultAddActions`);
  assert.equal('availableAnswerModesOverride' in space, 'selectedAnswerModesOverride' in space, `${space.id}: both mode overrides are required together`);
  if ('availableAnswerModesOverride' in space) {
    checkModes(space.availableAnswerModesOverride, space.selectedAnswerModesOverride, space.id);
  }
  if ('systemPromptOverride' in space) {
    assert.ok(typeof space.systemPromptOverride === 'string' && space.systemPromptOverride.length > 0 && space.systemPromptOverride.length <= 4000);
  }
  const path = join(root, space.manifestPath);
  referencedManifests.add(`${space.id}.json`);
  const manifest = await json(path);
  assert.equal(manifest.schemaVersion, 1, `${space.id}: schemaVersion mismatch`);
  assert.equal(manifest.vaultId, space.id, `${space.id}: vaultId mismatch`);
  assert.ok(Number.isSafeInteger(manifest.manifestVersion) && manifest.manifestVersion > 0);
  assert.ok(['draft', 'published'].includes(manifest.status));
  assert.ok(Array.isArray(manifest.files));
  if (space.availability === 'available') {
    assert.equal(manifest.status, 'published', `${space.id}: available Space needs a published manifest`);
    assert.ok(manifest.files.length > 0, `${space.id}: available Space has no files`);
  }
  for (const file of manifest.files) {
    assert.match(file.id, /^[a-zA-Z0-9_-]+$/);
    assert.ok(['pdf', 'text', 'image', 'audio'].includes(file.type));
    assert.ok(Number.isSafeInteger(file.sizeBytes) && file.sizeBytes > 0);
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(typeof file.url === 'string' && file.url.startsWith('https://'));
  }
  unique(manifest.files.map(file => file.id), `${space.id}: file IDs`);
}

const manifestFiles = (await readdir(join(root, 'vaults'))).filter(name => name.endsWith('.json'));
for (const name of manifestFiles) {
  assert.ok(referencedManifests.has(name), `Unreferenced manifest: ${name}`);
}
console.log(`Validated config v1: ${categories.length} categories, ${spaces.length} ready-made Spaces, ${manifestFiles.length} manifests.`);
