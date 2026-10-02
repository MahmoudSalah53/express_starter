import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");
const nameArg = process.argv[2];

if (!nameArg) {
  console.error("Usage: npm run make -- <name>");
  console.error("Example: npm run make -- product");
  process.exit(1);
}

if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(nameArg)) {
  console.error("Name must start with a letter and use only letters, numbers, - or _.");
  process.exit(1);
}

const words = nameArg
  .replace(/[_-]+/g, " ")
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .trim()
  .split(/\s+/)
  .map((word) => word.toLowerCase());

const pascal = words.map(capitalize).join("");
const camel = words[0] + words.slice(1).map(capitalize).join("");
const kebab = words.join("-");
const pluralPascal = words
  .map((word, index) => (index === words.length - 1 ? pluralize(word) : word))
  .map(capitalize)
  .join("");
const pluralKebab = [...words.slice(0, -1), pluralize(words[words.length - 1])].join("-");

const files: { filePath: string; contents: string }[] = [
  {
    filePath: path.join(root, "src/controllers", `${kebab}.controller.ts`),
    contents: `import { RequestHandler } from "express";
import { ${camel}Service } from "../services/${kebab}.service";
import { Create${pascal}Input } from "../validators/${kebab}.validator";

export const list${pluralPascal}: RequestHandler = async (_req, res) => {
  const items = await ${camel}Service.list();
  res.json({ status: "success", data: items });
};

export const get${pascal}: RequestHandler = async (req, res) => {
  const item = await ${camel}Service.getById(req.params.id);
  res.json({ status: "success", data: item });
};

export const create${pascal}: RequestHandler = async (req, res) => {
  const item = await ${camel}Service.create(req.body as Create${pascal}Input);
  res.status(201).json({ status: "success", data: item });
};
`,
  },
  {
    filePath: path.join(root, "src/services", `${kebab}.service.ts`),
    contents: `import { AppError } from "../utils/AppError";
import { Create${pascal}Input } from "../validators/${kebab}.validator";

export const ${camel}Service = {
  list(): Promise<unknown[]> {
    throw new AppError("Not implemented", 501);
  },

  getById(_id: string): Promise<unknown> {
    throw new AppError("Not implemented", 501);
  },

  create(_input: Create${pascal}Input): Promise<unknown> {
    throw new AppError("Not implemented", 501);
  },
};
`,
  },
  {
    filePath: path.join(root, "src/validators", `${kebab}.validator.ts`),
    contents: `import { z } from "zod";

export const create${pascal}Schema = z.object({
  // Add fields here.
});

export const ${camel}IdParamSchema = z.object({
  id: z.string().cuid(),
});

export type Create${pascal}Input = z.infer<typeof create${pascal}Schema>;
`,
  },
  {
    filePath: path.join(root, "src/routes", `${kebab}.routes.ts`),
    contents: `import { Router } from "express";
import { create${pascal}, get${pascal}, list${pluralPascal} } from "../controllers/${kebab}.controller";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { create${pascal}Schema, ${camel}IdParamSchema } from "../validators/${kebab}.validator";

export const ${camel}Router = Router();

${camel}Router.get("/", asyncHandler(list${pluralPascal}));
${camel}Router.get("/:id", validate({ params: ${camel}IdParamSchema }), asyncHandler(get${pascal}));
${camel}Router.post("/", validate({ body: create${pascal}Schema }), asyncHandler(create${pascal}));
`,
  },
];

let created = 0;

for (const file of files) {
  if (fs.existsSync(file.filePath)) {
    console.log(`Skipped ${path.relative(root, file.filePath)} (already exists)`);
    continue;
  }

  fs.mkdirSync(path.dirname(file.filePath), { recursive: true });
  fs.writeFileSync(file.filePath, file.contents);
  console.log(`Created ${path.relative(root, file.filePath)}`);
  created += 1;
}

const registered = registerRoute();

if (created === 0 && !registered) {
  console.log("Nothing new to add.");
}

function registerRoute(): boolean {
  const indexPath = path.join(root, "src/routes/index.ts");
  let source = fs.readFileSync(indexPath, "utf8");
  const importLine = `import { ${camel}Router } from "./${kebab}.routes";`;
  const useLine = `apiRouter.use("/${pluralKebab}", ${camel}Router);`;
  let changed = false;

  if (!source.includes(importLine)) {
    const imports = [...source.matchAll(/^import .+$/gm)];
    const last = imports[imports.length - 1];

    if (last?.index === undefined) {
      throw new Error("Could not find imports in src/routes/index.ts");
    }

    const insertAt = last.index + last[0].length;
    source = `${source.slice(0, insertAt)}\n${importLine}${source.slice(insertAt)}`;
    changed = true;
  }

  if (!source.includes(useLine)) {
    source = `${source.trimEnd()}\n${useLine}\n`;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(indexPath, source);
    console.log(`Registered /api/${pluralKebab} in src/routes/index.ts`);
  }

  return changed;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function pluralize(word: string): string {
  if (/(s|x|z|ch|sh)$/i.test(word)) {
    return `${word}es`;
  }

  if (/[^aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }

  return `${word}s`;
}
