import { env } from "./env";

/** OpenAPI document served by Swagger UI. Add paths here as routes are added. */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Express Starter",
    version: "1.0.0",
  },
  servers: [{ url: `http://localhost:${env.PORT}` }],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Reports that the process is running. Does not query the database.",
        responses: {
          "200": {
            description: "Process is running",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
