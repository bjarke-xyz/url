import { HomeButton, Layout } from "./Layout";

export const ViewPage = (
  key: string | null,
  url: string | null,
  urlFound: boolean | null,
  baseUrl: string,
  visits: number | null,
  lastVisitedAt: string | null
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
          <br />
          <br />
        </p>
      ) : (
        <></>
      )}
      {urlFound === false ? <p>Url not found</p> : <></>}

      {visits && visits > 0 && lastVisitedAt ? (
        <>
          <p>Redirected {visits} times</p>
          <p>Last redirected at {lastVisitedAt}</p>
        </>
      ) : (
        <></>
      )}
    </Layout>
  );
};
