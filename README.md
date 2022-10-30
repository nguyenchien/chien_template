# agl_vite_template

- [agl_vite_template](#agl_vite_template)
  - [Setup](#setup)
  - [Starting the development server](#starting-the-development-server)
  - [Start the Browsersync service with external URL](#start-the-browsersync-service-with-external-url)
  - [Template](#template)
    - [Support blocks for EJS](#support-blocks-for-ejs)
    - [Data Flow](#data-flow)
  - [Static Asset Handling](#static-asset-handling)
    - [The `_public` Directory](#the-_public-directory)
  - [Building for Production](#building-for-production)
    - [Public Base Path](#public-base-path)
  - [Deploying](#deploying)
    - [Building The App](#building-the-app)
    - [Testing The App Locally](#testing-the-app-locally)
  - [`.env` Files](#env-files)

## Setup

Install pnpm

```sh
npm i -g pnpm
```

Install node_modules

```sh
pnpm i
```

---

## Starting the development server

After install node_modules, you can start the development server by running the following command.

```sh
pnpm dev
```

By default, the server starts on port 3000. You can view the app by visiting: http://localhost:3000.

---

## Start the Browsersync service with external URL

```sh
pnpm external
```

---

## Template

Using EJS. [EJS Docs](https://ejs.co/#docs)

### Support blocks for EJS
```html
// _layouts/layout.ejs

<%- include('_partials/header'); -%>
<main>
  {{ content }}
</main>
<%- include('_partials/footer'); -%>
```
```html
// index.html

<%- include('_layouts/layout'); -%>

<!-- @content -->
My page
<!-- @@content -->
```

### Data Flow

Data is stored in `src/_data/data.json`. You can change the data file at `vite.config.js`

```js
import { defineConfig } from "vite";
import { Layout } from "./plugins/layout";

module.exports = defineConfig(() => {
  return {
    plugins: [
      Layout({
        dataFile: 'src/_data/data.json',
        ejs: {
          views: ["src"],
        },
      }),
    ],
  }
});
```

* **Global values**
  * `BASE_URL`: {string} the base url the app is being served from.
  * `MODE`: {string} the mode the app is running in.
  * `PROV`: {boolean} whether the app is running in production.
  * `DEV`: {boolean} whether the app is running in development (always the opposite of `PROD`).

* **linklists objects**: The `linklists` object returns the set of the menus and links in your app. You can access a `menu` by calling its key on the linklists object. The `link` object has the following attributes:
  * `link.title`: Return the title of the link.
  * `link.url`: Return the url of the link.
  * `link.active`: Returns `true` if the link object is active, or `false` if the link object is inactive. The `link.active` property is useful for menu designs that highlight when top-level navigation categories are being viewed. An example of this would be a menu that highlights the "News" blog link when an article from that blog is being read.
  * `link.current`: Returns `true` if the page content associated with the link is considered a match to the current page. Returns `false` if the content isn't considered a match. `link.current` ignores URL parameters

```js
<% if (typeof linklists != 'undefined') { %>
  <% linklists.main && linklists.main.forEach(link => { %>
    <li>
      <a 
        <% if (link.current || link.active) { %>class="is-active"<% } %> 
        href="<%= link.url %>"
      >
        <%= link.title %>
      </a>
    </li>
  <% }) %>
<% } %>
```

---

## Static Asset Handling

### The `_public` Directory

Assets in this directory will be served at root path `/` during dev, and copied to the root of the dist directory as-is.

Note that:

* You should always reference `public` assets using root absolute path - for example, `_public/icon.png` should be referenced in source code as `/icon.png`.
* Assets in public cannot be imported from JavaScript.

---

## Building for Production

### Public Base Path

If you are deploying your project under a nested public path (Ex: `/~aglstaff/yourname/task`), simply specify in `VITE_BASE_URL` in `env.production` and all asset paths will be rewritten accordingly.

JS-imported asset URLs, CSS `url()` references, and asset references in your `.html` files are all automatically adjusted to respect this option during build.

---

## Deploying

### Building The App

You may run `pnpm build` command to build the app.
```sh
pnpm build
```
By default, the build output will be placed at `dist`. You may deploy this dist folder to any of your preferred platforms.

### Testing The App Locally

Once you've built the app, you may test it locally by running `pnpm preview` command.

```sh
pnpm build
pnpm preview
```

This command will boot up local static web server that serves the files from `dist` at `http://localhost:4173`. It's an easy way to check if the production build looks OK in your local environment.

---

## `.env` Files

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

>**Env Loading Priorities**
>
>An env file for a specific mode (e.g. `.env.production`) will take higher priority than a generic one (e.g. `.env`).
>
>In addition, environment variables that already exist when Vite is executed have the highest priority and will not be overwritten by `.env` files.
>
>`.env` files are loaded at the start of Vite. Restart the server after making changes.

>**Note**
>
>Only variables prefixed with VITE_ are exposed to your App.

Example:
```
VITE_BASE_URL=/
```

----------------------------------------------------

***Custom Note 01***

After run command to build, remember modify path for style file.

>Before modify:
```
<link rel="stylesheet" href="/assets/css/style.css">
```

>End modify:
```
<link rel="stylesheet" href="./assets/css/style.css">
```