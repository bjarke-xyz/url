import { formatISO } from "date-fns";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { UrlRepository } from "./models/url";
import { getBaseUrl, getLibsqlConnInfo } from "./util";
import { IndexPage } from "./views/Index";
import { NewPage } from "./views/New";
import { ViewPage } from "./views/View";

export const app = new Hono();
app.use(logger());

app.get("/", (c) => {
  return c.html(IndexPage());
});

app.get("/new", (c) => {
  const error = c.req.query()["err"];
  return c.html(NewPage(error));
});

app.post("/new", async (c) => {
  const urlRepo = new UrlRepository(getLibsqlConnInfo());
  const formData = await c.req.formData();
  const url = formData.get("url")?.toString();
  if (!url) {
    return c.redirect(`/new?err=no url provided`);
  }
  try {
    new URL(url);
  } catch (error) {
    return c.redirect(`/new?err=invalid url`);
  }
  const keyInput = formData.get("key")?.toString();
  if (keyInput) {
    const isUnique = await urlRepo.isKeyUnique(keyInput);
    if (!isUnique) {
      return c.redirect(`/new?err=key already exists`);
    }
  }
  const ip = c.req.header("X-Real-IP") ?? c.req.header("CF-Connecting-IP");
  const key = keyInput || (await urlRepo.getUniqueKey());
  await urlRepo.setUrl({
    urlKey: key,
    url: url,
    createdAt: formatISO(new Date()),
    createdByIp: ip,
    visits: 0,
  });
  return c.redirect(`/view?key=${key}`);
});

app.get("/view", async (c) => {
  const urlRepo = new UrlRepository(getLibsqlConnInfo());
  const key = c.req.query()["key"];
  let url: string | null = null;
  let urlFound: boolean | null = null;
  let visits: number | null = null;
  let lastVisitedAt: string | null = null;
  if (key) {
    const urlObj = await urlRepo.getUrl(key);
    visits = urlObj?.visits ?? null;
    lastVisitedAt = urlObj?.lastVisitedAt ?? null;
    url = urlObj?.url ?? null;
    if (url) {
      urlFound = true;
    } else {
      urlFound = false;
    }
  }
  return c.html(
    ViewPage(
      key,
      url,
      urlFound,
      getBaseUrl(c.req.header("host") ?? ""),
      visits,
      lastVisitedAt
    )
  );
});

app.get("/:key", async (c) => {
  const { key } = c.req.param();
  const urlRepo = new UrlRepository(getLibsqlConnInfo());
  const url = (await urlRepo.getUrl(key))?.url;
  if (!url) {
    return c.redirect("/");
  }
  await urlRepo.incrementVisits(key);
  return c.redirect(url);
});
