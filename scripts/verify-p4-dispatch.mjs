import { readFileSync } from 'node:fs';
import { verifyInterview } from './verify-p4-interview.mjs';
const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const root = process.cwd();
const read = (name) => JSON.parse(readFileSync(`${root}/docs/reporter-growth/v2/${name}`, 'utf8'));
const errors = verifyInterview(root, read('P4_EXECUTION_STATE.json'), read('lanes.v2.json'), { role: args.get('--role'), kind: args.get('--kind') });
if (errors.length) {
  console.error(`P4 dispatch blocked (${errors.length} conditions):\n${errors.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}
console.log(`P4 ${args.get('--kind')} dispatch gate passed for ${args.get('--role')}.`);
