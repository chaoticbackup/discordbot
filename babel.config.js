module.exports = function (api) {
  api.cache(true);

  const presets = [
    ["@babel/preset-env", {
      useBuiltIns: "usage", // or "entry"
      corejs: 3,
      targets: {
        "esmodules": true,
        "node": process.versions.node
      }
    }],
    "@babel/preset-typescript"
  ];
  const plugins = [
    ["@babel/plugin-transform-runtime", { "regenerator": true, corejs: 3 }],
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    "@babel/plugin-transform-object-rest-spread",
    ["@babel/plugin-transform-class-properties", { "loose": false }],
    "@babel/plugin-transform-json-strings",
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-transform-nullish-coalescing-operator",
    "@babel/plugin-transform-optional-chaining",
    "@babel/plugin-transform-export-namespace-from",
    "@babel/plugin-proposal-export-default-from"
  ];

  
  return {
    sourceMaps: "inline",
    presets,
    plugins,
    ignore: [
      "node_modules"
    ],
    comments: false
  };
}
