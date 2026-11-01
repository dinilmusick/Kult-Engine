export function join(...parts: string[]): string {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/');
}
export function resolve(...parts: string[]): string {
  return join(...parts);
}
export function dirname(p: string): string {
  return p.substring(0, p.lastIndexOf('/')) || '.';
}
export function basename(p: string, ext?: string): string {
  let b = p.substring(p.lastIndexOf('/') + 1);
  if (ext && b.endsWith(ext)) b = b.slice(0, -ext.length);
  return b;
}
export function extname(p: string): string {
  const i = p.lastIndexOf('.');
  return i >= 0 ? p.slice(i) : '';
}
export default { join, resolve, dirname, basename, extname };
