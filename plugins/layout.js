const ejs = require('ejs');
const fs = require('fs')

const externalRE = /^(https?:)?\/\//;
const isExternalUrl = (url) => externalRE.test(url);

function Layout(options = {}) {
  let config;
  let default_options = {
    dataFile: 'data.json',
    ejs: {
      views: ["src"],
    },
  };
  options = Object.assign(default_options, options);

  function checkLinks(links, ctx) {
    let isParentActive = false 
    let result = links.map((link) => {
      const base = config.base;
      const compactPath = (base + ctx.path.replace(/index.html/, '')).replace('//', '/');
      const compactUrl = (base + link.url.replace(/index.html/, '')).replace('//', '/');
      link.current = false;
      link.active = false;
      if (!isExternalUrl(link.url) && !link.url.startsWith('#')) {
        let newLink = link.url.startsWith('/') ? link.url.substr(1) : link.url;
        link.url = base + newLink;
      }
      if (link.url == compactPath || link.url == ctx.path) {
        link.current = true;
        isParentActive = true;
      }
      if (link.url != base && (compactPath.startsWith(link.url) || compactPath.startsWith(compactUrl))) {
        link.active = true;
      }
      if (link.links) {
        var result = checkLinks(link.links, ctx);
        link.links = result.result
        if (result.isParentActive) {
          link.active = true;
        }
      }
      return link;
    });
    return {
      result,
      isParentActive
    }
  }

  return {
    name: "layout",

    // Get Resolved config
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    transformIndexHtml: {
      enforce: "pre",
      transform(html, ctx) {
        try {
          let data = {}
          if (options.dataFile) {
            const dataRaw = fs.readFileSync(options.dataFile, 'utf8')
            if (dataRaw) data = JSON.parse(dataRaw);
          }
        
          if (data.linklists) {
            for (const key in data.linklists) {
              if (Object.hasOwnProperty.call(data.linklists, key)) {
                data.linklists[key] = checkLinks(data.linklists[key], ctx).result
              }
            }
          }
          data = { ...data, ...config.env};

          html = ejs.render(
            html,
            data,
            options.ejs
          );

          let re = new RegExp(
            `<!-- @(.*) -->((.|\n|\r)*?)<!-- @@(.*) -->`, 'g'
          );
          let temp = [];
          while ((match = re.exec(html)) != null) {
            let content = "";
            let start = "";
            let end = "";
            if (match && match.length == 5) {
              start = match[1];
              content = match[2];
              end = match[4];
            }
            if (start === end) {
              temp.push({
                location: start,
                content
              })
            }
          }
          html = html.replace(re, '');
          temp.forEach((item) => {
            html = html.replace(
              new RegExp(`{{\\s*${item.location}\\s*}}`, 'g'),
              item.content
            );
          })
          html = html.replace(
            /{{\s*\S+\s*}}/g,
            ''
          );
        } catch (e) {
          return e.message;
        }
        return html;
      },
    },
  };
}

exports.Layout = Layout;
