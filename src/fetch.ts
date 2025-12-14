async function createFetch() {
  const meta = (await import("./.fake/__meta.json")).default;

  async function fakefetch<T extends import("./.fake/__typing").TName>(name: T, init?: RequestInit) {
    const response = await fetch(`http://localhost:${meta.port}/${meta.prefix}/${name}`, init);

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();

    return result as import("./.fake/__typing").Fakelab[T];
  }

  return fakefetch;
}

export { createFetch };
