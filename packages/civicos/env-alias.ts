import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirname = path.dirname(fileURLToPath(import.meta.url));

export const browserTestAliases = {
	'$env/dynamic/public': path.resolve(currentDirname, 'src/lib/testing/env-dynamic-public.mock.ts')
};
