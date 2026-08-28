import { type SchemaTypeDefinition } from "sanity";
import { authorType } from "./authorType";
import { categoryType } from "./categoryType";
import { blockContentType } from "./blockContentType";
import { postType } from "./postType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [postType, authorType, categoryType, blockContentType],
};
