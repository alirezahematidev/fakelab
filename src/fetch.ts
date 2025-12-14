import meta from "./.fake/__meta.json";
import type { Fakelab, TName } from "./.fake/__typing";

async function fakefetch<T extends TName>(name: T, init?: RequestInit) {
  const response = await fetch(`http://localhost:${meta.port}/${meta.prefix}/${name}`, init);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result = await response.json();

  return result as Fakelab[T];
}

export { fakefetch };
