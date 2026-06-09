import swaggerJsdoc from "swagger-jsdoc";

/**
 * OpenAPI spec generated from JSDoc `@openapi` blocks in the route files.
 * Served via swagger-ui-express at `/api/docs` (see index.js).
 */
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "NutriTrack API",
      version: "1.0.0",
      description:
        "NutriTrack REST API. New features live under `/api/v1`; legacy `/api/*` routes are aliased for backward compatibility.",
    },
    servers: [
      { url: "/api/v1", description: "Versioned API (v1)" },
      { url: "/api", description: "Legacy (unversioned) alias" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string", example: "Request validation failed" },
                details: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object", nullable: true },
          },
        },
      },
    },
  },
  // Pick up @openapi JSDoc from route files + index (relative to project root at runtime).
  apis: [
    "./NutriTrack-Backend/index.js",
    "./NutriTrack-Backend/routes/*.js",
    "./index.js",
    "./routes/*.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
