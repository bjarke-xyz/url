import { Empty, ErrorMessage, HomeButton, Layout } from "./Layout";

export const NewPage = (error?: string) => (
  <Layout title="New">
    <HomeButton></HomeButton>
    <h1>New url</h1>
    {error ? <ErrorMessage>{error}</ErrorMessage> : Empty}
    <form method="post">
      <input name="key" placeholder="Key (optional)"></input>
      <input name="url" placeholder="https://example.org"></input>
      <button type="submit">Create</button>
    </form>
  </Layout>
);
