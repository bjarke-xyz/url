import { Hono } from "hono";
import { Bindings } from "./bindings";
import { UrlRepository } from "./models/url";
import { NewPage } from "./views/New";
import { IndexPage } from "./views/Index";
import { ViewPage } from "./views/View";
import { formatISO } from "date-fns";

export const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.html(IndexPage());
});

app.get("/new", (c) => {
  const error = c.req.query()["err"];
  return c.html(NewPage(error));
});

app.post("/new", async (c) => {
  const urlRepo = new UrlRepository(c.env.DB);
  const formData = await c.req.formData();
  const url = formData.get("url");
  if (!url) {
    return c.redirect(`/new?err=no url provided`);
  }
  try {
    new URL(url);
  } catch (error) {
    return c.redirect(`/new?err=invalid url`);
  }
  const keyInput = formData.get("key");
  if (keyInput) {
    const isUnique = await urlRepo.isKeyUnique(keyInput);
    if (!isUnique) {
      return c.redirect(`/new?err=key already exists`);
    }
  }
  const ip = c.req.header("CF-Connecting-IP");
  const key = keyInput ?? (await urlRepo.getUniqueKey());
  await urlRepo.setUrl({
    urlKey: key,
    url: url,
    createdAt: formatISO(new Date()),
    createdByIp: ip,
  });
  return c.redirect(`/view?key=${key}`);
});

app.get("/view", async (c) => {
  const urlRepo = new UrlRepository(c.env.DB);
  const key = c.req.query()["key"];
  let url: string | null = null;
  let urlFound: boolean | null = null;
  if (key) {
    url = (await urlRepo.getUrl(key))?.url ?? null;
    if (url) {
      urlFound = true;
    } else {
      urlFound = false;
    }
  }
  return c.html(ViewPage(key, url, urlFound));
});

app.get("/:key", async (c) => {
  const { key } = c.req.param();
  const urlRepo = new UrlRepository(c.env.DB);
  const url = (await urlRepo.getUrl(key))?.url;
  if (!url) {
    return c.redirect("/");
  }
  return c.redirect(url);
});
