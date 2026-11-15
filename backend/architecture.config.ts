import { defineArchitecture } from "architecture-rules";

export default defineArchitecture({
  projects: { tsconfigs: ["tsconfig.worker.json", "tsconfig.node.json", "tsconfig.web.json"], references: "explicit" },

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
    webDomain: {
      description: "Web app decisions with no I/O: time windows, timelines, stats, ordering and formatting.",
      files: ["web/src/domain/**/*.ts"],
      dependencies: { internal: ["webDomain", "protocol", "domain", "errors"], external: ["d3-scale", "d3-time", "d3-time-format"] },
    },
    webApi: {
      description: "The web app's side of the HTTP API: requests, response validation and the stored sign-in.",
      files: ["web/src/api/**/*.ts"],
      dependencies: { internal: ["webApi", "webDomain", "protocol", "domain", "errors"], external: ["zod"] },
    },
    webHooks: {
      description: "React state and effects: routing, polling and loading data for pages.",
      files: ["web/src/hooks/**/*.ts"],
      naming: { case: "camelCase", prefix: "use" },
      dependencies: { internal: ["webHooks", "webApi", "webDomain", "protocol", "domain", "errors"], external: ["react"] },
    },
    webUi: {
      description: "Presentational components: rendering from props, no data loading.",
      files: ["web/src/ui/**/*.tsx", "web/src/ui/**/*.ts"],
      naming: { case: ["PascalCase", "camelCase"], suffixes: [".constants"] },
      dependencies: {
        internal: ["webUi", "webDomain", "protocol", "domain"],
        external: ["react", "react/jsx-runtime", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover", "@radix-ui/react-tooltip", "lucide-react"],
      },
    },
    webPages: {
      description: "Pages and the app shell: wire hooks to components.",
      files: ["web/src/pages/**/*.tsx"],
      naming: { case: "PascalCase" },
      dependencies: { internal: ["webPages", "webUi", "webHooks", "webApi", "webDomain", "protocol", "domain", "errors"], external: ["react", "react/jsx-runtime"] },
    },
    webEntry: {
      description: "Mounts the web app.",
      files: ["web/src/main.tsx"],
      dependencies: { internal: ["webPages"], external: ["react", "react/jsx-runtime", "react-dom/client"], assets: ["web/src/styles.css"] },
    },
    webTooling: {
      description: "Web bundler configuration.",
      files: ["web/vite.config.ts"],
      naming: { case: "camelCase", suffixes: [".config"] },
      dependencies: { external: ["vite", "@vitejs/plugin-react", "@tailwindcss/vite", "node:url"] },
    },
    tooling: {
      description: "Test runner configuration.",
      files: ["vitest.config.ts"],
      naming: { case: "camelCase", suffixes: [".config"] },
      dependencies: { external: ["vitest/config"] },
    },
  },
});
