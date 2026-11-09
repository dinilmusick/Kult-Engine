export async function mkdir(path: string) {
  throw new Error('fs/promises.mkdir is not supported in browser');
}
export async function mkdtemp() {
  throw new Error('fs/promises.mkdtemp is not supported in browser');
}
export async function rm() {
  throw new Error('fs/promises.rm is not supported in browser');
}
export async function readFile() {
  throw new Error('fs/promises.readFile is not supported in browser');
}
export async function writeFile() {
  throw new Error('fs/promises.writeFile is not supported in browser');
}
export default {
  mkdir,
  mkdtemp,
  rm,
  readFile,
  writeFile,
};
