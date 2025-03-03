import { html } from "hono/html";
import type { FC } from "hono/jsx";

export const Layout: FC<{ title: string; children: unknown[] }> = (props) => {
  const baseTitle = "Url";
  const title = props.title ? `${props.title} | ${baseTitle}` : baseTitle;
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://unpkg.com/htmx.org@1.9.3"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.9"></script>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css"
        />
        <title>${title}</title>
      </head>
      <body>
        ${props.children}
      </body>
    </html>
  `;
};

export const ErrorMessage: FC = (props) => (
  <div style="color: red">{props.children}</div>
);

export const HomeButton = () => {
  return (
    <div>
      <a href="/">Home</a>
    </div>
  );
};

export const Empty = <></>;
