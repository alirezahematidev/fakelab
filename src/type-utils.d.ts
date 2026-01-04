/* eslint-disable @typescript-eslint/no-unused-vars */

declare function type$<T extends keyof Fake$>(): Fake$[T];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Fake$ {}

type Typeof<T extends keyof Fake$> = ReturnType<typeof type$<T>>;
type Keyof<T extends keyof Fake$> = keyof Typeof<T>;

export type { Typeof, Keyof };
