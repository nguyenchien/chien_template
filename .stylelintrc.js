module.exports = {
  extends: "stylelint-config-sass-guidelines",
  plugins: ["stylelint-scss"],
  rules: {
    indentation: 4,
    "order/properties-alphabetical-order": null,
    "order/order": null,
    "block-no-empty": null,
    "no-empty-source": null,
    "no-descending-specificity": null,
    "max-nesting-depth": 6,
    "selector-max-compound-selectors": 3,
    "selector-max-id": 2,
    "string-quotes": "double",
  },
  ignoreFiles: ["node_modules/**/*", "dist/**/*", "src/_public/**/*"],
};
