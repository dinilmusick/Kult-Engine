export function tmpdir(): string {
  return '/tmp';
}
export function homedir(): string {
  return '/';
}
export function platform(): string {
  return 'browser';
}
export default {
  tmpdir,
  homedir,
  platform,
};
