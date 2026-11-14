export type FakeClock = {
  readonly now: () => number;
  readonly advance: (milliseconds: number) => void;
};

export const createFakeClock = (startsAt: number): FakeClock => {
  const clock = { current: startsAt };
  return {
    now: () => clock.current,
    advance: (milliseconds) => {
      clock.current += milliseconds;
    },
  };
};
