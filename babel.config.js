module.exports = function (api) {
  api.cache(true);

  const presets = [
    "@babel/preset-env",
    '@babel/preset-typescript'
  ];
  const plugins = [
    // stage 3
    ["@babel/plugin-transform-runtime", {"regenerator": true}],
    ["@babel/plugin-proposal-decorators", {"legacy": true}],
    "@babel/plugin-syntax-dynamic-import",
    "@babel/plugin-syntax-import-meta",
    "@babel/proposal-object-rest-spread",
    ["@babel/plugin-proposal-class-properties", {"loose": false}],
    "@babel/plugin-proposal-json-strings",
    "@babel/plugin-transform-arrow-functions"
  ];


  return {
    presets,
    plugins,
    "comments": false
  };
}
