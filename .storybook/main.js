// .storybook/main.js
const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  core: {
    builder: '@storybook/builder-webpack5'
  },
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'phaser': path.resolve(__dirname, '../node_modules/phaser/dist/phaser.js')
    };

    config.module.rules.push({
      test: /\.tsx?$/,
      use: [
        {
          loader: 'esbuild-loader',
          options: {
            loader: 'tsx',
            target: 'es2015',
          },
        },
      ],
    });

    return config;
  },
};
