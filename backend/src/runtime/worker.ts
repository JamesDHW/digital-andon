import { readDeploymentConfiguration, type AndonEnvironment } from "./andonEnvironment.js";
import {
  AVATAR_CACHE_CONTROL,
  AVATAR_PATH_PATTERN,
  FOUND_REDIRECT_STATUS,
  NOT_FOUND_STATUS,
  TEAM_OBJECT_NAME,
  TEAM_PATH_PREFIXES,
} from "./runtime.constants.js";

export { TeamObject } from "./teamObject.js";

const routeWorkerRequest = async (request: Request, environment: AndonEnvironment): Promise<Response> => {
  const url = new URL(request.url);
  switch (url.pathname) {
    case "/health":
      return new Response("ok");
    case "/download":
      return redirectToDownload(environment);
    default:
      return routeResourceRequest(request, url, environment);
  }
};

const routeResourceRequest = async (request: Request, url: URL, environment: AndonEnvironment): Promise<Response> => {
  const avatarKey = AVATAR_PATH_PATTERN.exec(url.pathname)?.[1];
  if (avatarKey !== undefined) return serveAvatar(environment, avatarKey);

  const isTeamPath = TEAM_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  if (!isTeamPath) return new Response("Not found", { status: NOT_FOUND_STATUS });

  return environment.TEAM.get(environment.TEAM.idFromName(TEAM_OBJECT_NAME)).fetch(request);
};

const redirectToDownload = (environment: AndonEnvironment): Response => {
  const downloadUrl = readDeploymentConfiguration(environment).downloadUrl;
  if (downloadUrl === null) return new Response("Downloads aren't configured yet.", { status: NOT_FOUND_STATUS });
  return Response.redirect(downloadUrl, FOUND_REDIRECT_STATUS);
};

const serveAvatar = async (environment: AndonEnvironment, avatarKey: string): Promise<Response> => {
  const avatar = await environment.AVATARS.get(avatarKey);
  if (avatar === null) return new Response("Not found", { status: NOT_FOUND_STATUS });

  return new Response(avatar.body, {
    headers: { "content-type": avatar.httpMetadata?.contentType ?? "application/octet-stream", "cache-control": AVATAR_CACHE_CONTROL },
  });
};

// oxlint-disable-next-line import/no-default-export -- Cloudflare Workers load the module's default export as the fetch handler.
export default {
  fetch: routeWorkerRequest,
} satisfies ExportedHandler<AndonEnvironment>;
