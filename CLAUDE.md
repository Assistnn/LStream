# Web Development Base Project - Claude Code Memory

## 📖 プロジェクト概要

このプロジェクトはweb-development-baseをベースとした開発プロジェクトです。

**詳細な前提情報、アーキテクチャ、技術スタック、開発ワークフローなどについては、[`.cursor/rules/README.md`](.cursor/rules/README.md) を参照してください。**

## ⚠️ 重要な注意点

- **`.cursor/rules/` ディレクトリ**: プロジェクトの前提情報、アーキテクチャ、技術スタックなどの詳細は `.cursor/rules/README.md` および各ドキュメントを参照してください
- **デフォルト作業ブランチ**: デフォルトの作業ブランチは`develop`である
- **Claude Code Action使用時**: 開発開始時は必ず`make ai-pull`を実行
- **型安全性**: 必ずリンティング（`make ai-lint`）を通してからコミット
- **`any`型の使用**: 禁止（どうしても必要な場合は理由を説明して同意を得ること）

## 📚 ドキュメント参照

- **前提情報・詳細ドキュメント**: [`.cursor/rules/README.md`](.cursor/rules/README.md)

---

## 🔧 実装・設計の注意点

### コード修正時のルール

- **変更範囲の限定**: 要件で指定された部分のみを修正する。他の部分への不要な変更や改善は行わない
- **無意味な定義の禁止**: 以下の無意味な定義を行わない
  - 無意味な型定義（一度しか使わない型を別途定義する）
    - ❌ NG: `type IssueListContentProps = { issues: Issue[] }`
    - ✅ OK: インラインで型を記述する `({ issues }: { issues: Issue[] })`
  - 無意味な定数定義（一度しか使わない値を定数として切り出す）
  - 無意味な変数定義
  - 無意味なメソッド切り出し（一度しか呼ばれない処理を別メソッドとして切り出す）
- **再利用しないものは切り出さない**: 再利用しないものをわざわざ切り出したり定義する意味がない

### コーディングスタイル

- **関数宣言**: Frameworkで決まっているもの（Next.jsの`page`や`layout`など）以外では、`function`キーワードを使用せず、アロー関数を使用する
  - ❌ NG: `export async function uploadDocument(formData: FormData) { ... }`
  - ✅ OK: `export const uploadDocument = async (formData: FormData) => { ... }`
- **コメント**: ただやっていることの説明をするだけのコメントはコードに残さない
- **一度しか使わない関数はインライン化**: 一度しか呼ばれない関数は別途定義せず、使用箇所にインラインで記述する
  - ❌ NG: `const getTimerLabel = () => { if (timer === null) return 'し'; ... }` を定義して一箇所でしか使わない
  - ✅ OK: `{timer === null ? 'し' : timer < 60 ? `${timer}分` : `${timer / 60}時間`}` と直接記述する

### ユーティリティスクリプト作成時のルール

- **スクリプト言語の選択**:
  - 型生成やその他の開発ユーティリティのようなタスクのスクリプトは、シェルスクリプト（bash）を使用する
  - シェルスクリプトでは難しい場合、Web系プロジェクトではTypeScriptにする
- **ハードコーディング禁止**: パスや命名を含む、ありとあらゆるケースで絶対にハードコーディングを使用しない

### アーキテクチャパターン

#### BFF usecase層の役割

- **データ集約**: BFFのusecase層は、複数のマイクロサービスからのデータを集約・マージする役割を持つ
- **例**: `dd-project`の`ProjectMember`には`userId`のみがあり、Userモデルは`auth`サービスのデータベースにある場合、BFFのusecaseで`auth`サービスからユーザー情報を取得してマージする
- **クロスサービスデータ結合**: 各マイクロサービス（`dd-project`、`dd-issue`、`auth`など）は自身のデータベースのみを参照し、クロスサービスのデータ結合はBFF層で行う

#### tRPCルーター更新時のコード生成

- **自動生成ファイルの使用**: フロントエンドのフォームコンポーネントは `frontend/packages/[package-name]/src/app/.generated/formitems.tsx` に自動生成されたものを使用する。手動でフォームコンポーネントを作成しない
- **コード生成手順**: BFFに新しいエンドポイントを追加した後、以下の手順でコード生成を実行する:
  1. BFFをビルドする
  2. `pnpm generate`を実行する
  3. これにより、server actionsやform itemsなどの型安全なコードが自動生成される
- **生成ファイルの編集禁止**: `.generated/` ディレクトリ内のファイルは手動で編集せず、生成スクリプトを使用する

---

## 🤖 CI/CD関連（ClaudeCodeActionで管理）

### CI失敗時の対応

- **作業停止**: CI失敗時はその場で作業をストップし、以降の対応方法はユーザーに尋ねる

### コミット前のチェック

- **リンティング実行**: コミットする前に`make ai-lint`を実行し、エラーがあればそれを修正してからコミットする
- **フォーマットエラー**: formatエラーについては`make ai-lint-fix`で修正が可能なので必要に応じて活用する

### CIステータス確認

- **確認方法**: `gh pr status`を使用してCIステータスを確認する
- **成功判定**: 「✓ Checks passing」と表示されればCI通過
- **失敗時の対応**: CI失敗時は具体的なエラーメッセージを特定してから報告する

---

_プロジェクト固有の実装・設計の注意点を追加する場合は、このファイルに記載してください。_

## 🎵 プロジェクト固有の設計パターン

### React Native プレイヤーコンポーネントの設計

- **UIとロジックの分離**: プレイヤー関連のコンポーネント（MiniPlayer、EpisodePlayer、FullscreenPlayer）は純粋なUI表示のみを担当する。実際の再生ロジックは**すべてPlayerContextに集約**する
- **バックグラウンド再生の実装**:
  - `react-native-video`の`Video`コンポーネントは**PlayerContextのProvider内**に非表示で配置する
  - 非表示にする方法: `<View style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}>`
  - 必須設定: `playInBackground={true}`, `playWhenInactive={true}`, `ignoreSilentSwitch='ignore'`
- **PlayerContextの責務**:
  - `videoRef`の管理
  - 再生状態の管理（idle、loading、playing、paused、ended、error）
  - 再生制御メソッドの提供（play、pause、seek、skipForward、skipBackward等）
  - 再生イベントハンドラの実装（handleProgress、handleLoad、handleEnd）
  - これらのメソッド内で`videoRef.current?.seek()`等を呼び出す
- **UIコンポーネントの責務**:
  - `usePlayer()`で状態と制御メソッドを取得
  - 現在の再生状態を表示するだけ
  - ユーザー操作を受け取り、PlayerContextのメソッドを呼び出すだけ
  - **絶対に`videoRef`や`Video`コンポーネントを持たない**
- **トグルボタンの実装**: トグル機能を実装する際、アイコン自体は変更せず、状態だけを切り替える（例: 常に`List`アイコンのままでリストの表示/非表示をトグル）

### React Native固有のスタイリングルール

- **`StyleSheet.create`の使用禁止**: `StyleSheet.create`を使わず、インラインスタイルで記述する
  - ❌ NG: `const styles = StyleSheet.create({ container: { flex: 1 } })`
  - ✅ OK: `<View style={{ flex: 1 }}>` と直接記述する
- **コンポーネントの位置決定**: コンポーネントは自身の位置を決定せず、親コンポーネント側で配置を制御する
  - ❌ NG: コンポーネント内で`position: 'absolute'`, `bottom`, `left`などを指定
  - ✅ OK: 親コンポーネントで`View`にラップして位置指定
- **ThemeContextのスタイルを使用**: `Text`コンポーネントでは、インラインで`fontSize`や`fontWeight`を指定せず、ThemeContextで事前定義されたスタイルを使用する
  - ❌ NG: `<Text style={{ fontSize: 14, fontWeight: '600' }}>テキスト</Text>`
  - ✅ OK: `<Text style={styles.bodySmall}>テキスト</Text>`
  - 利用可能なスタイル: `styles.textXl`, `styles.titleLarge`, `styles.titleMedium`, `styles.bodyText`, `styles.bodySmall`, `styles.bodyTiny` など
  - **ただし、ThemeContextに勝手にスタイルを追加しない**: 既存のスタイルをベースに、必要なプロパティだけを配列でマージする
- **追加のスタイルが必要な場合**: 配列でマージする
  - ✅ OK: `<Text style={[styles.bodySmall, { textAlign: 'center' }]}>テキスト</Text>`
  - ✅ OK: `<Text style={[styles.bodyTiny, { fontSize: 9, letterSpacing: 0.5 }]}>ラベル</Text>`
- **余白の指定**: 子要素に`margin`を指定せず、親要素の`gap`を使用する
  - ❌ NG: `<Text style={{ marginTop: 8 }}>テキスト</Text>`
  - ✅ OK: `<View style={{ gap: 8 }}><Text>テキスト1</Text><Text>テキスト2</Text></View>`
  - **`marginTop`、`marginBottom`、`paddingTop`、`paddingBottom`は使用禁止**: 必ず親要素の`gap`で調整する
- **指定されていない部分は変更しない**: ユーザーから明示的に指示された部分のみを修正し、他の部分のレイアウトやスタイルは変更しない
  - 例: シークバーの余白調整を依頼された場合、エピソード情報の余白は変更しない
- **Textのネスト**: 避ける。複数のテキストスタイルが必要な場合は、別々のTextコンポーネントとして記述する
  - ❌ NG: `<Text style={styles.bodyText}><Text style={styles.bodySmall}>Ep.1</Text>タイトル</Text>`
  - ✅ OK: `<Text style={styles.bodySmall}>Ep.1</Text><Text style={styles.bodyText}>タイトル</Text>`

### コンポーネント設計

- **共通コンポーネント化**: 同じUIパターンが複数箇所で使われている場合、共通コンポーネントとして切り出す
  - 例: お気に入りボタン → `FavoriteButton`コンポーネント
  - propsの型定義は1回しか使わない場合、インラインで定義する

### Figmaデザインの実装

- **Figmaに書いてあることは実装する**: Figmaのコードに記載されているプロパティ（例: `textTransform: 'uppercase'`）は、効果がなさそうでも実装する
- **後で不要と判断されたら削除**: 実装後に不要と判断された場合は、その時点で削除すればよい
- **デザインに忠実に**: 色、グラデーション、レイアウトなどはFigmaデザイン通りに実装する
- **Figmaのコードを正確に参照する**: 
  - 余白（margin/padding）、高さ（height）、配置（justifyContent）などはFigmaのコード通りに実装する
  - 例: Figmaで`h-[100px] flex flex-col justify-center`なら、React Nativeでも`height: 100, justifyContent: 'center'`を使う
- **textStyleは近しいもので良い**: Figmaの文字サイズと完全一致させる必要はなく、ThemeContextで定義された近しいスタイルを使う
  - 例: Figmaで`text-base`（16px）なら`styles.bodyText`（14px）でも許容される
- **Figmaと異なる部分は明示的に指示される**: ユーザーから「ここは違って良い」と明示的に言われない限り、Figma通りに実装する
  - 例: 「次のエピソードとセカンダリコントロールの間のmarginが空いていい」と指示された場合のみ、その部分を変更する
