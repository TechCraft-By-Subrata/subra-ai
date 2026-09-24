import {createHash} from 'node:crypto';
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {join, relative, resolve, sep} from 'node:path';

const vaultId = 'javascript-essentials-rn';
const sourceCommit = '0ce6d38790f2f87945fa9221362e11a94918d61f';
const contentRoot = resolve('docs/content/v1', vaultId);
const manifestPath = resolve('docs/config/v1/vaults', `${vaultId}.json`);
const publicBaseUrl = `https://techcraft-by-subrata.github.io/subra-ai/content/v1/${vaultId}`;
const sourceBaseUrl = 'https://github.com/TechCraft-By-Subrata/java-script-essentials-for-react-native-developers/blob';

async function markdownFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  }));
  return nested.flat();
}

const paths = (await markdownFiles(contentRoot)).sort((a, b) => {
  const lesson = path => Number(path.match(/chapter-(\d+)\.md$/)?.[1] ?? -1);
  return lesson(a) - lesson(b) || a.localeCompare(b);
});

const files = await Promise.all(paths.map(async path => {
  const bytes = await readFile(path);
  const publicPath = relative(contentRoot, path).split(sep).join('/');
  const lessonNumber = Number(publicPath.match(/chapter-(\d+)\.md$/)?.[1] ?? 0) || null;
  const moduleNumber = Number(publicPath.match(/^module(\d+)\//)?.[1] ?? 0) || null;
  const heading = bytes.toString('utf8').match(/^#\s+(.+)$/m)?.[1]?.trim();
  const sourcePath = publicPath === 'course-overview.md' ? 'README.md' : publicPath;
  const id = lessonNumber ? `lesson-${lessonNumber}` : 'course-overview';
  return {
    id,
    type: 'text',
    displayName: heading ?? id,
    module: moduleNumber,
    lessonNumber,
    sourcePath,
    sourceUrl: `${sourceBaseUrl}/${sourceCommit}/${sourcePath}`,
    sizeBytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    url: `${publicBaseUrl}/${publicPath}`,
  };
}));

const manifest = {
  schemaVersion: 1,
  vaultId,
  manifestVersion: 1,
  status: 'published',
  title: 'JavaScript Essentials for React Native',
  description: 'A four-module JavaScript course grounded in practical React Native patterns.',
  releaseNotes: 'Initial release with the course overview and all 21 lecture files currently published in the source repository.',
  sourceRepository: 'https://github.com/TechCraft-By-Subrata/java-script-essentials-for-react-native-developers',
  sourceCommit,
  files,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifestPath} with ${files.length} files.`);
