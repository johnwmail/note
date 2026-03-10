import fs from 'node:fs';

const appVersion = process.env.APP_VERSION || 'vdev';
const repositoryUrl = process.env.REPOSITORY_URL || 'https://github.com/johnwmail/note';

const content = [
  `export const APP_VERSION = ${JSON.stringify(appVersion)};`,
  `export const REPOSITORY_URL = ${JSON.stringify(repositoryUrl)};`,
  '',
].join('\n');

fs.writeFileSync('src/version.ts', content);
