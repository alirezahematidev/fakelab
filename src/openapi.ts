import { Node, Symbol as MorphSymbol, Type, TypeChecker } from "ts-morph";

type JSONSchema =
  | { $ref: string }
  | {
      type?: "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";
      format?: string;
      enum?: Array<string | number | boolean | null>;
      const?: unknown;
      oneOf?: JSONSchema[];
      allOf?: JSONSchema[];
      anyOf?: JSONSchema[];
      items?: JSONSchema | JSONSchema[];
      properties?: Record<string, JSONSchema>;
      required?: string[];
      additionalProperties?: boolean | JSONSchema;
      description?: string;
      nullable?: boolean; // OpenAPI 3.0 style compatibility (optional)
      title?: string;
    };

type GeneratorContext = {
  checker: TypeChecker;
  /**
   * A Node used as “context” when printing types / resolving symbol-at-location.
   * Use a SourceFile or the declaration node you’re processing.
   */
  printNode: Node;
  /**
   * Collected reusable schemas for OpenAPI components.schemas
   */
  components: { schemas: Record<string, JSONSchema> };

  /**
   * If true, prefer $ref for named symbols (interfaces/type aliases/classes).
   */
  preferRefs?: boolean;

  /**
   * Depth guard
   */
  maxDepth?: number;
};

// ---- helpers ----

function isNullish(t: Type) {
  return t.isNull() || t.isUndefined();
}

function isOptionalSymbol(sym: MorphSymbol): boolean {
  // ts-morph Symbol has isOptional in some contexts, but this is robust.
  return sym.getDeclarations().some((d) => (d as { hasQuestionToken?: () => boolean }).hasQuestionToken?.() === true);
}

function getNamedSymbol(type: Type) {
  return type.getAliasSymbol() ?? type.getSymbol();
}

function safeSchemaName(name: string) {
  // for components key; you can enhance (namespace, file name, etc.)
  return name.replace(/[^\w$]/g, "_");
}

function refFor(name: string): JSONSchema {
  return { $ref: `#/components/schemas/${name}` };
}

/**
 * Try to detect common “special” types like Date.
 */
function isDateType(type: Type): boolean {
  const sym = getNamedSymbol(type);
  return sym?.getName() === "Date";
}

/**
 * If a type is Promise<T>, return T
 */
function unwrapPromise(type: Type): Type | null {
  const sym = getNamedSymbol(type);
  if (!sym || sym.getName() !== "Promise") return null;

  const args = type.getTypeArguments();
  return args[0] ?? null;
}

/**
 * For OpenAPI: `integer` if it's a number literal or looks like an int type.
 * TS doesn't have distinct int, so keep `number` by default.
 */
function numberSchema(): JSONSchema {
  return { type: "number" };
}

// ---- main ----

export function typeToJsonSchema(
  type: Type,
  ctx: GeneratorContext,
  state?: {
    depth: number;
    inProgress: Set<string>; // recursion guard per component name
    seenAnon: Set<number>; // recursion guard for anonymous types (compiler ids)
  }
): JSONSchema {
  const depth = state?.depth ?? 0;
  const maxDepth = ctx.maxDepth ?? 30;
  const inProgress = state?.inProgress ?? new Set<string>();
  const seenAnon = state?.seenAnon ?? new Set<number>();

  if (depth > maxDepth) {
    // guard: avoid exploding on very complex conditional/mapped types
    return {};
  }

  // Unwrap Promise<T> for API payload shapes
  const promised = unwrapPromise(type);
  if (promised) {
    return typeToJsonSchema(promised, ctx, { depth: depth + 1, inProgress, seenAnon });
  }

  // Nullish + unions handled later; but direct null/undefined:
  if (type.isNull()) return { type: "null" };
  if (type.isUndefined()) return {}; // OpenAPI has no undefined; treat as "missing"

  // Primitives
  if (type.isString()) return { type: "string" };
  if (type.isNumber()) return numberSchema();
  if (type.isBoolean()) return { type: "boolean" };
  if (type.isBigInt()) return { type: "integer", format: "int64" };
  if (type.isAny() || type.isUnknown()) return {}; // “anything”
  if (type.isNever()) return {}; // not representable nicely in JSON Schema/OpenAPI

  // Date -> string format date-time (common API convention)
  if (isDateType(type)) return { type: "string", format: "date-time" };

  // Literals
  if (type.isStringLiteral()) return { type: "string", const: type.getLiteralValue() };
  if (type.isNumberLiteral()) return { type: "number", const: type.getLiteralValue() };
  if ((type as { isBooleanLiteral?: () => boolean }).isBooleanLiteral?.()) {
    // ts-morph boolean literal typing differs per version; keep safe:
    const text = type.getText();
    if (text === "true" || text === "false") return { type: "boolean", const: text === "true" };
  }

  // Enums (best-effort):
  // Many enums show up as union of literals; so union handling below covers most.
  // But if it prints as `EnumName`, we'd rather ref it; we’ll handle named refs next.

  // Prefer refs for named types (interfaces/type aliases/classes) to avoid duplication
  const sym = getNamedSymbol(type);
  if (ctx.preferRefs !== false && sym) {
    const name = safeSchemaName(sym.getName());

    // Only ref if it looks like a “declared” type (has declarations)
    const decls = sym.getDeclarations();
    if (decls.length > 0) {
      // Avoid infinite recursion for self-references
      if (inProgress.has(name)) return refFor(name);

      // If already generated, return ref
      if (ctx.components.schemas[name]) return refFor(name);

      // Generate and store
      inProgress.add(name);

      // Use the declared type when possible for accuracy
      // alias symbol often points to a type alias; for interface/class, this is fine too.
      const schema = typeToJsonSchema_NoRef(type, ctx, {
        depth: depth + 1,
        inProgress,
        seenAnon,
      });

      ctx.components.schemas[name] = {
        title: name,
        ...schema,
      };

      inProgress.delete(name);
      return refFor(name);
    }
  }

  // Arrays
  if (type.isArray()) {
    const el = type.getArrayElementTypeOrThrow();
    return { type: "array", items: typeToJsonSchema(el, ctx, { depth: depth + 1, inProgress, seenAnon }) };
  }

  // Tuples
  if (type.isTuple()) {
    const els = type.getTupleElements().map((t) => typeToJsonSchema(t, ctx, { depth: depth + 1, inProgress, seenAnon }));
    // OpenAPI 3.0 supports JSON Schema subset; tuple can be approximated with `items: [...]`
    return { type: "array", items: els };
  }

  // Union types (including enums as literal unions, and nullish unions)
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();

    // Handle nullish union like: T | null | undefined
    const nonNullish = unionTypes.filter((t) => !isNullish(t));
    const hasNull = unionTypes.some((t) => t.isNull());
    const hasUndef = unionTypes.some((t) => t.isUndefined());

    // If union is exactly nullish + one type, produce nullable schema (OpenAPI 3.0 style)
    if (nonNullish.length === 1 && (hasNull || hasUndef)) {
      const inner = typeToJsonSchema(nonNullish[0]!, ctx, { depth: depth + 1, inProgress, seenAnon });
      // Prefer JSON Schema "type: [..]" is OpenAPI 3.1; in OAS 3.0 many tools expect `nullable`
      return hasNull ? { ...inner, nullable: true } : inner; // undefined = optional property, not "nullable"
    }

    // Literal unions -> enum when safe
    const enumVals: Array<string | number | boolean | null> = [];
    let allLiterals = true;

    for (const t of unionTypes) {
      if (t.isStringLiteral() || t.isNumberLiteral()) {
        enumVals.push(t.getLiteralValue()?.toString() || "");
      } else if (t.isNull()) {
        enumVals.push(null);
      } else if ((t as { isBooleanLiteral?: () => boolean }).isBooleanLiteral?.()) {
        const tx = t.getText();
        if (tx === "true" || tx === "false") enumVals.push(tx === "true");
        else allLiterals = false;
      } else {
        allLiterals = false;
      }
    }

    if (allLiterals && enumVals.length > 0) {
      // infer type from first non-null entry
      const first = enumVals.find((v) => v !== null);
      const inferredType = typeof first === "string" ? "string" : typeof first === "number" ? "number" : typeof first === "boolean" ? "boolean" : undefined;

      return { ...(inferredType ? { type: inferredType } : {}), enum: enumVals };
    }

    // General union => oneOf
    return {
      oneOf: unionTypes.map((t) => typeToJsonSchema(t, ctx, { depth: depth + 1, inProgress, seenAnon })),
    };
  }

  // Intersections => allOf
  if (type.isIntersection()) {
    return {
      allOf: type.getIntersectionTypes().map((t) => typeToJsonSchema(t, ctx, { depth: depth + 1, inProgress, seenAnon })),
    };
  }

  // Object / properties / index signatures / records
  const props = type.getProperties();
  const hasProps = props.length > 0;

  // recursion guard for anonymous object types
  const anonId = (type as { compilerType: { id?: number } }).compilerType?.id as number | undefined;
  if (anonId != null) {
    if (seenAnon.has(anonId)) return { type: "object" };
    seenAnon.add(anonId);
  }

  // Index signatures (Record<string, T>)
  const stringIndex = type.getStringIndexType();
  const numberIndex = type.getNumberIndexType();

  if (hasProps || stringIndex || numberIndex) {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const prop of props) {
      const name = prop.getName();

      // Get property type at a stable location:
      const decl = prop.getValueDeclaration() ?? prop.getDeclarations()[0];
      const propType = decl ? ctx.checker.getTypeOfSymbolAtLocation(prop, decl) : ctx.checker.getTypeOfSymbolAtLocation(prop, ctx.printNode);

      const schema = typeToJsonSchema(propType, ctx, { depth: depth + 1, inProgress, seenAnon });
      properties[name] = schema;

      // required: not optional, and not union-with-undefined
      const optional = isOptionalSymbol(prop) || (propType.isUnion() && propType.getUnionTypes().some((t) => t.isUndefined()));

      if (!optional) required.push(name);
    }

    let additionalProperties: JSONSchema | boolean = false;

    // Prefer string index if present, otherwise number index
    if (stringIndex) {
      additionalProperties = typeToJsonSchema(stringIndex, ctx, { depth: depth + 1, inProgress, seenAnon });
    } else if (numberIndex) {
      additionalProperties = typeToJsonSchema(numberIndex, ctx, { depth: depth + 1, inProgress, seenAnon });
    }

    return {
      type: "object",
      ...(Object.keys(properties).length ? { properties } : {}),
      ...(required.length ? { required } : {}),
      ...(additionalProperties !== false ? { additionalProperties } : {}),
    };
  }

  return {};
}

// Same as above, but skips “prefer refs” logic (used when generating a named schema body)
function typeToJsonSchema_NoRef(type: Type, ctx: GeneratorContext, state: { depth: number; inProgress: Set<string>; seenAnon: Set<number> }): JSONSchema {
  // Temporarily force inline generation
  return typeToJsonSchema(type, { ...ctx, preferRefs: false }, state);
}
