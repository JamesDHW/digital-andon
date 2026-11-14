export const DEFAULT_SERVER = "http://localhost:8787";
export const SETTLE_DELAY_MS = 750;
export const NORMAL_CLOSURE_CODE = 1000;
export const FORBIDDEN_STATUS = 403;
export const SUCCESS_STATUS = 200;
export const DEV_EMAIL_DOMAIN = "example.com";
export const SEED_LEAD = "James";
export const SEED_TEAMMATES = ["Priya", "Tom", "Aisha", "Marco"] as const;
export const FAKE_MEMBER_USAGE = `Usage: pnpm fake-member <name> <command> [argument] [--server <url>]

Commands:
  green                 resolve
  amber [topic]         pull amber, optionally with a topic
  red [topic]           pull red, optionally with a topic
  off                   stop working: disappear from everyone's menu bar
  topic <text>          change the topic of the current light
  follow <name>         follow someone
  unfollow <name>       stop following someone
  watch                 print every message until Ctrl-C`;
