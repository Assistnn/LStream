# lstream

## Documents

- [仕様書](docs/LSEED_App_Distribution_Spec.pdf)
- https://www.figma.com/make/y0L7QxixBqJr49LFWCI3z3/Learning-Audio-Video-Player-App
- https://www.mindmapper.com/guest/map/0b9da06f-ddfd-4990-9313-07a1d9ee0575

## Requirements

- [Homebrew](https://brew.sh/ja/)
- [Docker](https://www.docker.com/ja-jp/)
- [Node.js](https://nodejs.org/ja)
- [pnpm](https://pnpm.io/ja/)
- [wtachman](https://formulae.brew.sh/formula/watchman)
- [CocoaPods](https://guides.cocoapods.org/)
- Xcode 26.2~
- Android Studio 2025.3.1
- JDK 17: `brew install openjdk@17`

## 環境構築

```bash
make setup
```

`make dev-ios` / `make dev-android`でエディターとシミュレーター諸々起動
エラーが出る場合、`cd app && npx react-native doctor`で環境に問題がないか確認
