function prefixWithSlash(path: string) {
  if (path.startsWith("/")) return path;

  return `/${path}`;
}

export { prefixWithSlash };
