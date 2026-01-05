declare function type$<T extends keyof $$>(): $$[T];

interface $$ {}

type Typeof<T extends keyof $$> = ReturnType<typeof type$<T>>;
type Keyof<T extends keyof $$> = keyof Typeof<T>;

export type { Typeof, Keyof };
