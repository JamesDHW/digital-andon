/** Pages of one CSV export, each starting with the same header line: the header once, then every page's rows. */
export const joinCsvPages = (pages: readonly string[]): string => {
  const [first, ...rest] = pages;
  if (first === undefined) return "";
  return [first, ...rest.map(withoutHeader).filter((rows) => rows.length > 0)].join("\n");
};

/** The header is a fixed line of column names, so the first line break ends it. */
const withoutHeader = (page: string): string => {
  const headerEnd = page.indexOf("\n");
  if (headerEnd === -1) return "";
  return page.slice(headerEnd + 1);
};
