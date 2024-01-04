import { HomeButton, Layout } from "./Layout";

export const ViewPage = (
  key: string | null,
  url: string | null,
  urlFound: boolean | null,
  baseUrl: string
) => {
  let shortenedUrl = "";
  if (key) {
    shortenedUrl = `${baseUrl}/${key}`;
  }

  return (
    <Layout title={key ?? "View"}>
      <HomeButton></HomeButton>
      <h1>View</h1>
      <form>
        <input name="key" placeholder="IsOXNgE" value={key ?? ""}></input>
        <button type="submit">View</button>
      </form>

      {urlFound && url ? (
        <p>
          <a href={shortenedUrl}>{shortenedUrl}</a>
          <span> → </span>
          <a href={url}>{url}</a>
        </p>
      ) : (
        <></>
      )}
      {urlFound === false ? <p>Url not found</p> : <></>}
    </Layout>
  );
};
