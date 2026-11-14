import { argv, exit } from "node:process";
import { parseArgs } from "node:util";

import { putFollows, signInAs } from "./devClient.ts";
import { DEFAULT_SERVER, SEED_LEAD, SEED_TEAMMATES, SUCCESS_STATUS } from "./scripts.constants.ts";

/** Creates a lead (the first member, so an admin) who follows four teammates, and prints the lead's token for the app. */
const main = async (): Promise<void> => {
  const { values } = parseArgs({ args: argv.slice(2), options: { server: { type: "string", default: DEFAULT_SERVER } } });
  const lead = await signInAs(values.server, SEED_LEAD);
  const teammates = await Promise.all(SEED_TEAMMATES.map((teammate) => signInAs(values.server, teammate)));
  const status = await putFollows(lead, teammates.map((teammate) => teammate.memberId));
  const isFollowListSaved = status === SUCCESS_STATUS;
  if (!isFollowListSaved) return reportFailure(`Signed everyone in, but saving ${SEED_LEAD}'s follow list failed (HTTP ${status}).`);

  console.info(`Seeded ${SEED_LEAD} + ${SEED_TEAMMATES.join(", ")} on ${values.server}; ${SEED_LEAD} follows all of them.`);
  console.info("");
  console.info("Run the app as the lead by setting these in the Xcode scheme's environment variables:");
  console.info(`  ANDON_API_URL=${values.server}`);
  console.info(`  ANDON_DEV_TOKEN=${lead.deviceToken}`);
  console.info("");
  console.info('Then drive teammates from here, e.g.  pnpm fake-member Priya red "Prod deploy blocked"');
};

const reportFailure = (message: string): void => {
  console.error(message);
  exit(1);
};

await main();
