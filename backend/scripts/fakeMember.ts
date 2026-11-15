import { argv, exit } from "node:process";
import { parseArgs, styleText } from "node:util";

import { findMemberId, openSocket, signInAs, type DevSession } from "./devClient.ts";
import { DEFAULT_SERVER, FAKE_MEMBER_USAGE, NORMAL_CLOSURE_CODE, SETTLE_DELAY_MS } from "./scripts.constants.ts";

type FakeCommand =
  | { readonly kind: "send"; readonly message: Readonly<Record<string, unknown>> }
  | { readonly kind: "sendToMember"; readonly type: "follow" | "unfollow"; readonly memberName: string }
  | { readonly kind: "watch" }
  | { readonly kind: "invalid" };

const main = async (): Promise<void> => {
  const { values, positionals } = parseArgs({ args: argv.slice(2), allowPositionals: true, options: { server: { type: "string", default: DEFAULT_SERVER } } });
  const [name, commandName, ...rest] = positionals;
  const command = parseCommand(commandName ?? "", rest.join(" "));
  const isUsable = name !== undefined && command.kind !== "invalid";
  if (!isUsable) return printUsageAndExit();

  const session = await signInAs(values.server, name);
  const message = await resolveMessage(session, command);
  return runSocket(session, name, message);
};

const parseCommand = (commandName: string, argument: string): FakeCommand => {
  const status = argument.length > 0 ? argument : undefined;
  switch (commandName) {
    case "green":
    case "amber":
    case "red":
    case "off":
      return { kind: "send", message: { type: "pull", colour: commandName, status } };
    case "status":
      return { kind: "send", message: { type: "status", status: argument } };
    case "follow":
    case "unfollow":
      return { kind: "sendToMember", type: commandName, memberName: argument };
    case "watch":
      return { kind: "watch" };
    default:
      return { kind: "invalid" };
  }
};

const resolveMessage = async (session: DevSession, command: FakeCommand): Promise<Readonly<Record<string, unknown>> | null> => {
  switch (command.kind) {
    case "send":
      return command.message;
    case "sendToMember":
      return { type: command.type, memberId: await findMemberId(session, command.memberName) };
    case "watch":
    case "invalid":
      return null;
    default:
      return command satisfies never;
  }
};

const runSocket = (session: DevSession, name: string, message: Readonly<Record<string, unknown>> | null): void => {
  const socket = openSocket(session);
  socket.addEventListener("message", (event) => console.info(styleText("dim", `[${name}] ←`), String(event.data)));
  const reportConnectionFailure = (): void => console.error(`[${name}] could not connect to ${session.server}. Is \`pnpm dev\` running with DEV_MODE=true?`);
  socket.addEventListener("error", reportConnectionFailure);
  socket.addEventListener("open", () => {
    socket.removeEventListener("error", reportConnectionFailure);
    if (message === null) return;
    console.info(styleText("bold", `[${name}] →`), JSON.stringify(message));
    socket.send(JSON.stringify(message));
    setTimeout(() => socket.close(NORMAL_CLOSURE_CODE), SETTLE_DELAY_MS);
  });
};

const printUsageAndExit = (): void => {
  console.info(FAKE_MEMBER_USAGE);
  exit(1);
};

await main();
