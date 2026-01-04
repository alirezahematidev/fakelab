// Auto-generated headless data type declarations

declare function generate<T extends keyof Headless$>(name: T): Headless$[T];
declare function generate<T extends keyof Headless$>(name: T, options: GenerateOptions): Headless$[T][];

type GenerateOptions = { count: number };

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Headless$ {}

export { generate };
