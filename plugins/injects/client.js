const template = /*html*/ `
<style>
:host {
  display:none;
  position: fixed;
  z-index: 99999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  margin: 0;
  background: rgba(0, 0, 0, 0.66);
  --monospace: 'SFMono-Regular', Consolas,
              'Liberation Mono', Menlo, Courier, monospace;
  --red: #ff5555;
  --yellow: #e2aa53;
  --purple: #cfa4ff;
  --cyan: #2dd9da;
  --dim: #c9c9c9;
  --gray: #626262;
}

.window {
  font-family: var(--monospace);
  line-height: 1.5;
  width: 800px;
  color: #d8d8d8;
  margin: 30px auto;
  padding: 25px 40px;
  position: relative;
  background: #181818;
  border-radius: 6px 6px 8px 8px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  overflow: hidden;
  border-top: 8px solid var(--red);
  direction: ltr;
  text-align: left;
}

pre {
  font-family: var(--monospace);
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 1em;
  overflow-x: scroll;
  scrollbar-width: none;
}

pre::-webkit-scrollbar {
  display: none;
}

.message {
  line-height: 1.3;
  font-weight: 600;
  white-space: pre-wrap;
}

.message-body {
  color: var(--red);
}

.plugin {
  color: var(--purple);
}

.lint:not(:last-child) .list {
  margin-bottom: 60px;
}

.list {
  border-spacing: 0;
  margin-bottom: 13px;
}

.list td {
  padding-bottom: 5px;
}

.file {
  color: var(--cyan);
  margin-bottom: 0;
  word-break: break-all;
}

.list tr:not(:first-child) .file {
  padding-top: 15px;
}

.row {
  margin-bottom: 15px;
}

.warning {
  color: var(--yellow);
}

.error {
  color: var(--red);
}

html-hint .message {
  white-space: pre-wrap;
  color: var(--red);
}

.line {
  padding-left: 15px;
  text-align: right;
}

.column {
  padding-right: 15px;
}

.rule {
  color: var(--gray);
  padding-left: 15px;
}

.evidence {
  display: inline;
  white-space: pre-wrap;
}

.tip {
  font-size: 13px;
  color: #999;
  border-top: 1px dotted #999;
  padding-top: 13px;
}

code {
  font-size: 13px;
  font-family: var(--monospace);
  color: var(--yellow);
}

.file-link {
  text-decoration: underline;
  cursor: pointer;
}

</style>
<div class="window">
  <div class="body">
    <div class="htmlhint lint"></div>
    <div class="stylelint lint"></div>
  </div>
  <div class="tip">
    Click outside or fix the code to dismiss.<br>
    You can also disable this overlay by setting
    <code>Linter({ errorOverlay: false })</code> in <code>vite.config.js.</code>
  </div>
</div>
`;

function createHeading(text) {
  return `<pre class="message"><span class="plugin">[${text}]</span></pre>`;
}

function createLink(url, text) {
  let link = document.createElement("a");
  link.textContent = text;
  link.className = "file-link";
  link.onclick = () => {
    fetch("/__open-in-editor?file=" + encodeURIComponent(url));
  };
  return link;
}

function createFile(link) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.setAttribute("colspan", "6");
  td.classList = "file";
  td.appendChild(link);
  tr.appendChild(td);
  return tr;
}

function createMessage(severity, line, col, message, rule) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <tr>
      <td class="severity ${severity === "warning" ? "warning" : "error"}">${
    severity === "warning" ? "⚠" : "✖"
  }</td>
      <td class="line">${line}</td>
      <td>:</td>
      <td class="column">${col}</td>
      <td class="text">${message}</td>
      <td class="rule">${rule}</td>
    </tr>
  `;
  return row;
}

class LintErrorOverlay extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = template;
    this.root.querySelector(".window").addEventListener("click", (e) => {
      e.stopPropagation();
    });
    this.addEventListener("click", () => {
      this.close();
    });
  }
  close() {
    var _a;
    (_a = this.parentNode) === null || _a === void 0
      ? void 0
      : _a.removeChild(this);
  }
}

class HTMLHint extends HTMLElement {
  constructor(data) {
    super();
    if (!data) return;
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
    function repeatStr(n, str) {
      return new Array(n + 1).join(str || " ");
    }

    const errored = data.some((item) => item.warnings.length > 0);
    if (errored) {
      this.innerHTML = createHeading("htmlhint");
      const list = document.createElement("div");
      list.classList = "list";
      data.forEach((err) => {
        if (!err.warnings.length) return;
        const link = createLink(err.filePath, err.relativeFilePath);
        const file = document.createElement("pre");
        file.className = "file";
        file.appendChild(link);
        list.appendChild(file);

        err.warnings.forEach((hint) => {
          const leftWindow = 35;
          const rightWindow = leftWindow + 20;
          let evidence = hint.evidence;
          const line = hint.line;
          const col = hint.col;
          const evidenceCount = evidence.length;
          let leftCol = col > leftWindow + 1 ? col - leftWindow : 1;
          let rightCol = Math.min(evidenceCount, col + rightWindow);
          if (col < leftWindow + 1) {
            rightCol += leftWindow - col + 1;
          }
          evidence = evidence
            .replace(/\t/g, " ")
            .substring(leftCol - 1, rightCol);
          if (leftCol > 1) {
            evidence = `...${evidence}`;
            leftCol -= 3;
          }
          if (rightCol < evidenceCount) {
            evidence += "...";
          }
          let pointCol = col - leftCol;
          const match = evidence
            .substring(0, pointCol)
            .match(/[^\u0000-\u00ff]/g);
          if (match !== null) {
            pointCol += match.length;
          }

          let row = document.createElement("div");
          row.classList = "row";

          row.innerHTML = `
            <div class="evidence">L${line} |${escapeHtml(evidence)}</div>
            <div class="message">${repeatStr(
              String(line).length + pointCol + 3
            )}^ ${hint.message} <span class="rule">(${
            hint.rule.id
          })</span></div>
          `;
          list.appendChild(row);
        });
      });
      this.appendChild(list);
    }
  }
}

class Stylelint extends HTMLElement {
  constructor(data) {
    super();
    if (!data) return;
    let errored = data.some((item) => item.warnings.length > 0);
    if (errored) {
      this.innerHTML = createHeading("stylelint");
      const list = document.createElement("table");
      list.classList = "list";
      data.forEach((err) => {
        if (!err.warnings.length) return;
        const link = createLink(err.source, err.relativeFilePath);
        const file = createFile(link);
        list.appendChild(file);

        err.warnings.forEach((warning) => {
          const messageRow = createMessage(
            warning.severity,
            warning.line,
            warning.column,
            warning.text,
            warning.rule
          );
          list.appendChild(messageRow);
        });
      });

      this.appendChild(list);
    }
  }
}

class ESLint extends HTMLElement {
  constructor(data) {
    super();
    if (!data) return;
    let errored = data.some((item) => item.messages.length > 0);
    if (errored) {
      this.innerHTML = createHeading("eslint");
      const list = document.createElement("table");
      list.classList = "list";
      data.forEach((err) => {
        if (!err.messages.length) return;
        const link = createLink(err.filePath, err.relativeFilePath);
        const file = createFile(link);
        list.appendChild(file);

        err.messages.forEach((message) => {
          const messageRow = createMessage(
            message.severity === 1 ? "warning" : "error",
            message.line,
            message.column,
            message.message,
            message.ruleId
          );
          list.appendChild(messageRow);
        });
      });

      this.appendChild(list);
    }
  }
}

const overlayId = "lint-error-overlay";

const arrayElements = [
  {
    name: overlayId,
    class: LintErrorOverlay,
  },
  {
    name: "html-hint",
    class: HTMLHint,
  },
  {
    name: "style-lint",
    class: Stylelint,
  },
  {
    name: "es-lint",
    class: ESLint,
  },
];

if (customElements) {
  arrayElements.forEach((element) => {
    if (customElements.get(element.name)) return;
    customElements.define(element.name, element.class);
  });
}

function createErrorOverlay(data) {
  let overlay = document.querySelector(overlayId);
  if (!overlay) {
    overlay = document.body.appendChild(new LintErrorOverlay());
  }

  let body = overlay.shadowRoot.querySelector(".body");
  body.innerHTML = "";

  for (const [key, value] of Object.entries(data)) {
    if (value.length) {
      switch (key) {
        case "htmlhint":
          body.appendChild(new HTMLHint(value));
          break;
        case "stylelint":
          body.appendChild(new Stylelint(value));
          break;
        case "eslint":
          body.appendChild(new ESLint(value));
          break;

        default:
          break;
      }
    }
  }

}
function clearErrorOverlay() {
  document.querySelectorAll(overlayId).forEach((n) => n.close());
}

if (import.meta.hot) {
  let hasError = false;
  import.meta.hot.on("vite:error", () => {
    hasError = true;
    clearErrorOverlay();
  });
  import.meta.hot.on("vite:beforeUpdate", () => {
    hasError = false;
  });
  import.meta.hot.send("client:ready");
  import.meta.hot.on("lint:results", (data) => {
    let errored = Object.values(data).some((results) =>
      results.some(
        (result) => result.warnings?.length || result.messages?.length
      )
    );
    if (errored && !hasError) {
      createErrorOverlay(data);
    } else {
      clearErrorOverlay();
    }
  });
}
