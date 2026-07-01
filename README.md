# Rocket.Chat.App-Giphy

giphy.com integration for Rocket.Chat (Powered by RocketBooster!)

![Giphy Logo](https://raw.githubusercontent.com/wreiske/Rocket.Chat.App-Giphy/master/images/Giphy-256.png)

![GIPHY Rocket.Chat Integration Preview](https://i.imgur.com/v5dYBMo.gif)

## Language and Rating Support

This app supports changing the search language as well as the rating of images returned.

https://developers.giphy.com/docs/optional-settings#language-support

![Settings](https://i.imgur.com/0TXw6Md.png)
![Spanish Preview](https://i.imgur.com/dWBI3n6.gif)

## Development

Install dependencies and package the app locally:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

The packaged app is written to `dist/giphy_0.0.8.zip`.

### Notes

- The app now supports both slash command preview selection and direct `/giphy <query>` execution.
- The build uses the Rocket.Chat Apps CLI and a local postinstall compatibility shim for `@rocket.chat/ui-kit` until the upstream packaging toolchain resolves that dependency correctly.

## Changes in this fork

Compared to the original repository, this fork currently includes:

- a modernized TypeScript and Rocket.Chat Apps toolchain
- ESLint-based linting instead of deprecated TSLint
- local build, lint, and typecheck scripts
- compatibility updates for newer Rocket.Chat Apps engine versions
- direct `/giphy <query>` execution in addition to preview-based selection
- `/giphy more <query>` for a fresh result page with the same keyword
- `/giphy shuffle <query>` and `/giphy random <query>` for random result sets
- configurable preview result limits in the app settings
- German translations and a German search fallback when GIPHY returns no direct `de` matches
- successful local packaging with the current Rocket.Chat Apps CLI

## 🤝 Contributing

Contributions, issues and feature requests are welcome.<br />
Feel free to check [issues page](https://github.com/wreiske/Rocket.Chat.App-Giphy/issues) if you want to contribute.

The initial Rocket.Chat GIPHY app was coded and updated by

<https://github.com/graywolf336>

<https://github.com/frdmn>

![GIPHY](https://raw.githubusercontent.com/wreiske/Rocket.Chat.App-Giphy/master/images/PoweredBy_640_Horizontal_Light-Backgrounds_With_Logo.gif)

## ❤ Show your support

Please ⭐️ this repository if this project helped you!

Paypal: [paypal.me/wreiske](https://paypal.me/wreiske)

## Related Apps

<https://github.com/wreiske/Rocket.Chat.App-Tenor>

<https://github.com/wreiske/Rocket.Chat.App-Imgur>
