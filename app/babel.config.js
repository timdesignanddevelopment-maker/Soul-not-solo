module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
        },
      ],
      // must stay last (Reanimated 4 moved the worklets plugin out)
      "react-native-worklets/plugin",
    ],
  };
};
