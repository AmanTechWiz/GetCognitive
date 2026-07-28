import { rmSync } from 'node:fs';
import path from 'node:path';

for (const target of ['.next/dev', '.next/cache']) {
  rmSync(path.resolve(target), { recursive: true, force: true });
}
