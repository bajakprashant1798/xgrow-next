import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./src/sanity/schemaTypes";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

export default defineConfig({
  basePath: "/studio",
  name: "xgrow_studio",
  title: "XGRO Studio",
  projectId: projectId || "placeholder",
  dataset: dataset || "production",
  schema,
  plugins: [structureTool()],
});
