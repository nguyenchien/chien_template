import * as path from 'path';
import colors from "picocolors";
import htmlhint, { defaultFormat } from './utils/htmlhint';
import stylelint from 'stylelint';
import stylelintFormatter from 'stylelint-formatter-pretty';
import { ESLint } from 'eslint';
import eslintFormatter from 'eslint-formatter-pretty';
import { prepareStylelintResults, prepareESLintResults } from './utils/prepareResults';

function Linter(options = {}) {
  let default_options = {
    errorOverlay: true,
  };
  options = Object.assign(default_options, options);

  let ws;
  let lint = {}
  let storage = {};

  function initLint(id, op = {}, fn) {
    if (!id || typeof fn !== 'function') return;
    options[id] = Object.assign(op, options[id]);
    lint[id] = (option = options[id], inStorage = false) => {
      if (!options[id]) return;
      fn.bind({id, inStorage})(option);
    };
  }

  function mergeStorage(oldValue, newValue) {
    if (!oldValue) return newValue;
    if (!newValue) return oldValue;
    return oldValue.map(file => {
      let newFile = newValue.find(f => f.relativeFilePath === file.relativeFilePath);
      if (!newFile) return file;
      return newFile;
    });
  }

  function sendToClient() {
    if (!options.errorOverlay) return;
    ws.send('lint:results', storage);
  } 

  function setStorage(id, value) {
    storage[id] = mergeStorage(storage[id], value);
    sendToClient();
  }

  function logStorage(id) {
    for (const [key, results] of Object.entries(id ? {[id]: storage[id]} : storage)) {
      switch (key) {
        case "htmlhint":
          if (results.some(result => result.warnings.length)) {
            console.log(`\n  ${colors.magenta('[HTMLHint]')}\n`);
            console.log(defaultFormat(results));
          }
          break;
        case "stylelint":
          if (results.some(result => result.warnings.length)) {
            console.log(`\n  ${colors.magenta('[stylelint]')}`);
            console.log(stylelintFormatter(results));
          }
          break;
        case "eslint":
          if (results.some(result => result.messages.length)) {
            console.log(`\n  ${colors.magenta('[ESLint]')}`);
            console.log(eslintFormatter(results));
          }
          break;

        default:
          break;
      }
    }
  }

  const default_htmlhint = {
    files: ['src/**/*.{html,ejs}'],
  }
  initLint('htmlhint', default_htmlhint, function(op) {
    htmlhint(op)
      .then(({ results }) => {
        setStorage(this.id, results);
        logStorage(this.inStorage ? undefined : this.id);
      })
      .catch(error => {
        console.log(error)
      });
  });

  const default_stylelint = {
    files: ['src/**/*.{vue,css,scss,sass,less,styl,svelte}'],
    cache: true,
    cacheLocation: path.join('node_modules', '.vite', 'stylelint'),
  }
  initLint('stylelint', default_stylelint, function(op) {
    op.cache = this.inStorage ? op.cache : undefined;
    stylelint
      .lint(op)
      .then(({ results }) => {
        setStorage(this.id, prepareStylelintResults(results));
        logStorage(this.inStorage ? undefined : this.id);
      })
      .catch(error => {
        console.log(error)
      });
  });

  const default_eslint = {
    files: ['src/_public/assets/js/**/*.js'],
    options: {
      cache: true,
      cacheLocation: path.join('node_modules', '.vite', 'eslint'),
    }
  }
  initLint('eslint', default_eslint, function(op) {
    new ESLint(op.options)
      .lintFiles(op.files)
      .then((results) => {
        setStorage(this.id, prepareESLintResults(results));
        logStorage(this.inStorage ? undefined : this.id);
        if (op.option && op.options.fix) {
          ESLint.outputFixes(results);
        }
      })
      .catch(error => {
        console.log(error)
      });
  });

  function handleLintAll() {
    storage = {};
    Object.values(lint).forEach(lintFn => lintFn())
  }

  function handleLintInStorage(file) {
    loop1: 
    for (const [id, results] of Object.entries(storage)) {
      loop2:
      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (result.filePath === file || result.source === file) {
          lint[id]({...options[id], ...{files: [file]}}, true);
          break loop1;
        }
      }
    }
  }

  return {
    name: "lint",
    apply: 'serve',

    config: () => ({
      resolve: {
        alias: [
          {
            find: /^[\/]?@injects\/client/,
            replacement: path.resolve(__dirname, "./injects/client.js")
          }
        ]
      },
    }),

    configureServer(server) {
      ws = server.ws;
      server.watcher.on("ready", handleLintAll);
      server.watcher.on("add", handleLintAll);
      server.watcher.on("unlink", handleLintAll);
      server.watcher.on("change", handleLintInStorage);
      ws.on('client:ready', sendToClient);
    },

    transformIndexHtml: {
      enforce: "pre",
      transform() {
        if (!options.errorOverlay) return null;
        return [
          {
            tag: 'script',
            attrs: {
              type: 'module',
              src: '/@injects/client'
            },
            injectTo: 'head-prepend'
          }
        ];
      }
    }
  };
}

exports.Linter = Linter;