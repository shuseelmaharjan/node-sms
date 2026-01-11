import { z } from "zod";

export type CrudMode = "create" | "edit";

export type CrudApi<S extends z.ZodObject<any, any>, Entity> = {
  getById: (id: string) => Promise<Entity>;
  create: (values: z.infer<S>) => Promise<Entity>;
  update: (id: string, values: z.infer<S>) => Promise<Entity>;
  remove: (id: string) => Promise<void>;
  toDefaults: (entity: Entity) => z.infer<S>;
};

export type CrudCache = {
  listKey?: unknown[];
  detailKeyPrefix?: unknown[];
};
