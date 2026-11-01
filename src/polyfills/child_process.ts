export function spawn() {
  throw new Error('child_process.spawn is not supported in the browser');
}
export function exec() {
  throw new Error('child_process.exec is not supported in the browser');
}
export function execSync() {
  throw new Error('child_process.execSync is not supported in the browser');
}
export default {
  spawn,
  exec,
  execSync,
};
