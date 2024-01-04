import { HomeButton, Layout } from "./Layout";

export const ViewPage = (
  key: string | null,
  url: string | null,
  urlFound: boolean | null
) => {
  return (
    <Layout title={key ?? "View"}>
      <HomeButton></HomeButton>
      <h1>View</h1>
      <form>
        <input name="key" placeholder="IsOXNgE" value={key ?? ""}></input>
        <button type="submit">View</button>
      </form>

      {urlFound && url ? <a href={url}>{url}</a> : <></>}
      {urlFound === false ? <p>Url not found</p> : <></>}
    </Layout>
  );
};
