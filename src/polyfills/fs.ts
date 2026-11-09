export function existsSync(path: string): boolean { return false; }
export function mkdirSync(path: string) { throw new Error('fs.mkdirSync not supported'); }
export function writeFileSync(path: string, data: any) { throw new Error('fs.writeFileSync not supported'); }
export function readFileSync(path: string) { throw new Error('fs.readFileSync not supported'); }
export default { existsSync, mkdirSync, writeFileSync, readFileSync };
