import { rmSync } from 'node:fs';
import path from 'node:path';

// Wipe the entire .next directory so Turbopack can't serve stale cached modules
rmSync(path.resolve('.next'), { recursive: true, force: true });
