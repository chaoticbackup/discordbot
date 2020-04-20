module.exports = function (api) {
  api.cache(true);

  const presets = [
    ["@babel/preset-env", {
      useBuiltIns: "usage", // or "entry"
      corejs: 3,
      targets: {
        "node": process.versions.node
      }
    }],
    '@babel/preset-typescript'
  ];
  const plugins = [
    ["@babel/plugin-transform-runtime", { "regenerator": true, corejs: 3 }],
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    "@babel/proposal-object-rest-spread",
    ["@babel/plugin-proposal-class-properties", { "loose": false }],
    "@babel/plugin-proposal-json-strings",
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-proposal-export-default-from"
  ];

  
  return {
    presets,
    plugins,
    ignore: [
      "node_modules"
    ],
    "comments": false
  };
}
