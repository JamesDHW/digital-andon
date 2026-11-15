import { assert } from "vitest";

import type { AuthDependencies } from "../../src/application/auth/authDependencies.js";
import { createSqlCredentialStore } from "../../src/adapters/sql/sqlCredentialStore.js";
import { createSqlEventStore } from "../../src/adapters/sql/sqlEventStore.js";
import { createSqlFollowStore } from "../../src/adapters/sql/sqlFollowStore.js";
import { createSqlLightStore } from "../../src/adapters/sql/sqlLightStore.js";
import { createSqlMemberStore } from "../../src/adapters/sql/sqlMemberStore.js";
import { createSqlPresenceCheckStore } from "../../src/adapters/sql/sqlPresenceCheckStore.js";
import { createSqlSettingsStore } from "../../src/adapters/sql/sqlSettingsStore.js";
import { migrateSchema } from "../../src/adapters/sql/migrateSchema.js";
import type { Member, MemberRole } from "../../src/domain/member.js";
import { isMemberId, type MemberId } from "../../src/domain/memberId.js";
import { AndonError } from "../../src/errors/andonError.js";
import { createFakeClock, type FakeClock } from "./fakeClock.state.js";
import { createFakeGoogle, type FakeGoogle } from "./fakeGoogle.state.js";
import { createFakeSecrets } from "./fakeSecrets.state.js";
import { createMemorySql } from "./memorySql.js";
import { createRecordingMailer, type RecordingMailer } from "./recordingMailer.state.js";
import { TEST_ORIGIN, TEST_START_TIME } from "./testTeam.constants.js";

export type TestTeam = {
  readonly dependencies: AuthDependencies;
  readonly clock: FakeClock;
  readonly mailer: RecordingMailer;
  readonly google: FakeGoogle;
};

export const createTestTeam = (options: { readonly allowedDomains?: readonly string[]; readonly bootstrapAdminEmail?: string } = {}): TestTeam => {
  const sql = createMemorySql();
  migrateSchema(sql);
  const clock = createFakeClock(TEST_START_TIME);
  const mailer = createRecordingMailer();
  const google = createFakeGoogle();
  const dependencies: AuthDependencies = {
    members: createSqlMemberStore(sql),
    lights: createSqlLightStore(sql),
    follows: createSqlFollowStore(sql),
    events: createSqlEventStore(sql),
    presenceChecks: createSqlPresenceCheckStore(sql),
    credentials: createSqlCredentialStore(sql),
    settings: createSqlSettingsStore(sql, { teamName: "Test team", allowedDomains: options.allowedDomains ?? [] }),
    secrets: createFakeSecrets(),
    mailer,
    now: clock.now,
    onlineMembers: () => [],
    publicOrigin: TEST_ORIGIN,
    bootstrapAdminEmail: options.bootstrapAdminEmail ?? null,
    google,
  };
  return { dependencies, clock, mailer, google };
};

export const memberIdOf = (rawMemberId: string): MemberId => {
  if (isMemberId(rawMemberId)) return rawMemberId;
  return assert.fail(`${rawMemberId} is not a valid member id.`);
};

export const addMember = (team: TestTeam, rawMemberId: string, role: MemberRole = "member"): Member => {
  const member: Member = {
    id: memberIdOf(rawMemberId),
    name: rawMemberId,
    email: `${rawMemberId}@example.com`,
    avatarUrl: null,
    role,
    joinedAt: team.clock.now(),
  };
  team.dependencies.members.save(member);
  return member;
};

/** Narrows a success-or-error result in a test, failing loudly on the error. */
export const expectSuccess = <Value>(result: Value | AndonError): Value => {
  if (result instanceof AndonError) return assert.fail(`Expected success but got ${result.code}: ${result.message}`);
  return result;
};
