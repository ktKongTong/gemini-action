import { z } from "zod";

const baseSchema = z.object({
  description: z.string().optional(),
  nullable: z.boolean().optional(),
});

const simpleStringSchema = baseSchema.extend({
  type: z.literal("string"),
  format: z.literal("date-time").optional(),
});
const enumStringSchema = baseSchema.extend({
  type: z.literal("string"),
  format: z.literal("enum").optional(),
  enum: z.string().array(),
});

const numberSchema = baseSchema.extend({
  type: z.literal("number"),
  format: z.enum(["float", "double"]).optional(),
});

const integerSchema = baseSchema.extend({
  type: z.literal("integer"),
  format: z.enum(["int32", "int64"]).optional(),
});

const booleanSchema = baseSchema.extend({
  type: z.literal("boolean"),
});

export const schema: z.ZodSchema<any> = z.lazy(() => {
  const objectSchema = baseSchema.extend({
    type: z.literal("object"),
    properties: z.record(schema),
    required: z.string().array().optional(),
  });
  const arraySchema = baseSchema.extend({
    type: z.literal("array"),
    items: schema,
    minItems: z.coerce.number().optional(),
    maxItems: z.coerce.number().optional(),
  });
  return z.union([
    simpleStringSchema,
    enumStringSchema,
    numberSchema,
    integerSchema,
    booleanSchema,
    arraySchema,
    objectSchema,
  ]);
});
