/* eslint-disable @typescript-eslint/no-unused-vars */

// Auto-generated headless data type declarations

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Headless$ {}

type GenerateOptions = { count: number };

declare function generate<T extends keyof Headless$>(name: T): Headless$[T];
declare function generate<T extends keyof Headless$>(name: T, options: GenerateOptions): Headless$[T][];

declare function type$<T extends keyof Headless$>(): Headless$[T];

type Typeof<T extends keyof Headless$> = ReturnType<typeof type$<T>>;
type Keyof<T extends keyof Headless$> = keyof Typeof<T>;

export type { Typeof, Keyof };
export { generate };
