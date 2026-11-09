export function createRequire(path: string) {
  return (id: string) => {
    throw new Error(`Require not supported in browser: ${id}`);
  };
}
export default { createRequire };
