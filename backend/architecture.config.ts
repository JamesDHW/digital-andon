import { defineArchitecture } from "architecture-rules";

export default defineArchitecture({
  projects: { tsconfigs: ["tsconfig.worker.json", "tsconfig.node.json"], references: "explicit" },

  naming: { case: "camelCase", suffixes: [".constants", ".test", ".state"] },

  layers: {
    errors: {
      description: "Error adapter: the AndonError hierarchy and the only code that catches.",
      files: ["src/errors/**/*.ts"],
      dependencies: { internal: ["errors"] },
      rules: {
        "no-raw-exceptions": {
          severity: "off",
          reason: "tryCatch is the error adapter that converts thrown values into AndonError values.",
        },
      },
    },
    domain: {
      description: "Pure andon decisions: lights, statuses, members and events. No I/O.",
      files: ["src/domain/**/*.ts"],
      dependencies: { internal: ["domain", "errors"] },
    },
    protocol: {
      description: "The wire contract shared with the macOS app: socket messages and their validation.",
      files: ["src/protocol/**/*.ts"],
      dependencies: { internal: ["protocol", "domain", "errors"], external: ["zod"] },
    },
    application: {
      description: "Use cases over injected ports: socket commands, follows, auth, profile and admin.",
      files: ["src/application/**/*.ts"],
      dependencies: { internal: ["application", "protocol", "domain", "errors"] },
    },
    adapters: {
      description: "Platform-neutral implementations of application ports: SQLite stores, Web Crypto, email.",
      files: ["src/adapters/**/*.ts"],
      dependencies: { internal: ["adapters", "application", "protocol", "domain", "errors"], external: ["zod"] },
    },
    http: {
      description: "HTTP endpoints served by the team Durable Object: request parsing, routing and responses.",
      files: ["src/http/**/*.ts"],
      dependencies: { internal: ["http", "application", "protocol", "domain", "errors"], external: ["zod"] },
    },
    runtime: {
      description: "Cloudflare entry points and the composition root: Worker, Durable Object, sockets, R2.",
      files: ["src/runtime/**/*.ts"],
      dependencies: {
        internal: ["runtime", "http", "adapters", "application", "protocol", "domain", "errors"],
        external: ["zod", "cloudflare:workers"],
      },
    },
    tests: {
      description: "Executable tests against an in-memory SQLite database and fake effects.",
      files: ["test/**/*.test.ts"],
      naming: { case: "camelCase", requiredSuffix: ".test" },
      dependencies: {
        internal: ["testSupport", "adapters", "application", "http", "protocol", "domain", "errors"],
        external: ["vitest", "zod"],
      },
    },
    testSupport: {
      description: "Fixtures and fakes shared by tests.",
      files: ["test/support/**/*.ts"],
      dependencies: {
        internal: ["testSupport", "adapters", "application", "protocol", "domain", "errors"],
        external: ["node:sqlite", "vitest"],
      },
    },
    scripts: {
      description: "Developer command-line tools that talk to a running backend.",
      files: ["scripts/**/*.ts"],
      naming: { case: "camelCase", suffixes: [".constants"] },
      dependencies: { internal: ["scripts"], external: ["node:process", "node:util"] },
    },
    tooling: {
      description: "Test runner configuration.",
      files: ["vitest.config.ts"],
      naming: { case: "camelCase", suffixes: [".config"] },
      dependencies: { external: ["vitest/config"] },
    },
  },
});
