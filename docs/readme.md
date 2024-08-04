# Phaser Webpack Template

- [Online Storybook Demo](https://kvisaz.github.io/phaser-webpack-template/storybook/index.html)
- [GitHub](https://github.com/Kvisaz/phaser-webpack-template)

Features
- Webpack
- Phaser 3.80
- fast build (Phaser.js as static asset + esbuild-loader)
- TypeScript
- Storybook for component- driven development
- Prettier
- Jest/TsJest support

Extremely fast update and reload for small project editing:
`webpack 5.93.0 compiled successfully in 59 ms`

## Why This Template?

In the ever-evolving world of web development, it's easy to get caught up in the latest trends. However, sometimes the tried-and-true tools, when optimized correctly, can outperform the newcomers. This template is a testament to that philosophy.

We've engineered this Webpack configuration to leverage the power of `esbuild-loader`, resulting in compilation speeds that will make you question everything you thought you knew about build times. The secret sauce? We treat Phaser as a static asset, simply copying it over instead of bundling it. This approach, combined with the cutting-edge `esbuild-loader`, yields a development experience so smooth, you'll forget you're working with a bundler at all.

## Features

- **Optimized for Speed**: Utilizes `esbuild-loader` for TypeScript compilation, ensuring rapid builds and updates.
- **Phaser as Static Asset**: Phaser library is treated as a static asset, significantly reducing build times.
- **TypeScript Ready**: Full TypeScript support out of the box.
- **Prettier Integration**: Keep your code clean and consistent with built-in Prettier configuration.
- **Jest for Testing**: Comes pre-configured with Jest for all your testing needs.
- **Webpack Flexibility**: Harness the full power of Webpack's extensive ecosystem and customization options.

## Vite Alternative

If you're curious about how this stacks up against Vite, or if you're just in the mood for some variety, check out our Vite-based Phaser template:

[Phaser Vite Template](https://github.com/Kvisaz/phaser-vite-template)

## The Webpack Advantage

While tools like Vite have gained popularity for their out-of-the-box speed, don't be too quick to dismiss Webpack. With the right configuration (like the one in this template), Webpack can match or even exceed the performance of newer build tools. Plus, you get the added benefit of Webpack's vast ecosystem and unparalleled customization options.

Remember, in game development, as in life, it's not about having the newest tools—it's about using the right tools in the right way.

Happy coding, and may your frame rates be high and your load times low!
