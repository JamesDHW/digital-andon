import type { ReactElement } from "react";

import { SIGNAL_COLOUR } from "./ui.constants.js";

type LogoProps = {
  readonly height: number;
};

/** Clear, Disrupted and Blocked as the Mac app draws your own light: three squircles. */
export const Logo = ({ height }: LogoProps): ReactElement => (
  <svg className="hdr-red shrink-0" height={height} viewBox="0 0 62 18" role="img" aria-label="Digital Andon">
    <rect x="0" y="0" width="18" height="18" rx="5.5" style={{ fill: SIGNAL_COLOUR.green }} />
    <rect x="22" y="0" width="18" height="18" rx="5.5" style={{ fill: SIGNAL_COLOUR.amber }} />
    <rect x="44" y="0" width="18" height="18" rx="5.5" style={{ fill: SIGNAL_COLOUR.red }} />
  </svg>
);
