import fs from "fs";
import path from "path";
import { html as beautify_html } from "js-beautify";
var bs = require("browser-sync").create();

function Controller() {
  let config;

  async function rm(directory) {
    if (!fs.existsSync(directory)) return;
    fs.readdir(directory, (err, files) => {
      if (err) throw err;
      let promises = [];
      for (const file of files) {
        promises.push(new Promise((resolve, reject) => {
          fs.unlink(path.join(directory, file), err => {
            if (err) reject(err);
            resolve();
          });
        }));
      }
      Promise.all(promises).then(() => {
        fs.rmdir(directory, err => {
          if (err) throw err;
          config.logger.info(`${directory} folder removed`);
        });
      }).catch(err => {
        console.log(err)
      });
    });
  }

  return {
    name: "controller",
    apply: "build",

    configResolved(resolvedConfig) {
      config = resolvedConfig;
      if (config.mode === 'external') {
        bs.init({
          server: "./dist",
          open: 'external',
        });
      }
    },

    transformIndexHtml: {
      enforce: "post",
      transform(html, ctx) {
        let { base, root } = config;
        let { filename } = ctx;
        html = html.replace(
          new RegExp(
            `<script type="module" crossorigin src="${base}_scss/style.js"></script>`
          ),
          ``
        );
        html = html.replace(
          new RegExp(
            `<script type="module" crossorigin src="${base}_virtual/modulepreload-polyfill.js"></script>`
          ),
          ``
        );
        if (base.startsWith('./')) {
          let relativePath = path.relative(filename, root).slice(0, -2).replace(/\\/g, '/');
          html = html.replace(/\.\//g, relativePath);
        }
        html = beautify_html(html, {
          indent_size: 2,
          preserve_newlines: false,
          indent_inner_html: true,
        });
        return html;
      }
    },

    closeBundle() {
      console.log('');
      config.logger.info(`Removing folder...`);
      rm("dist/_virtual");
      rm("dist/_scss");
      bs.reload();
    },
  };
}

const _Controller = Controller;
export { _Controller as Controller };
