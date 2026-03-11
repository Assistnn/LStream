# 画面一覧

このドキュメントは、Learning Audio Video Player App の全画面を既存のディレクトリ構造に従ってまとめたものです。

## 📁 ディレクトリ構造

```
screens/
├── splash/           # スプラッシュ画面
├── login/            # ログイン画面
└── main/            # メイン画面（タブナビゲーション）
    ├── home/        # ホーム（Today）タブ
    ├── library/     # ライブラリタブ
    ├── favorites/   # お気に入りタブ
    ├── playlist/    # プレイリストタブ
    ├── history/     # 履歴タブ
    └── setting/     # 設定タブ
```

---

## 🎯 画面詳細

### 1. スプラッシュ画面

**パス**: `screens/splash/index.tsx`

**説明**: アプリ起動時の初期画面

**既存**: ✅ 実装済み

---

### 2. ログイン画面

**パス**: `screens/login/index.tsx`

**説明**: ユーザー認証画面（アカウント選択・ログイン）

**既存**: ✅ 実装済み

**Figma対応画面**: `AccountScreen`

- サービスアカウント一覧
- アカウント切り替え
- アカウント追加
- ログアウト

---

## 📱 メインタブ画面群

### 3. ホーム（Today）タブ

**パス**: `screens/main/home/`

#### 3-1. ホームルート画面

**ファイル**: `index.tsx`

**説明**: Today画面。新着コンテンツ、おすすめコンテンツを表示

**Figma対応画面**: `TodayScreen`

**機能**:

- アカウント情報表示
- 新着コンテンツセクション
- 再生履歴セクション
- コンテンツ再生
- シリーズタップでエピソード一覧へ遷移

#### 3-2. 新着一覧画面

**ファイル**: `child.tsx` → `new-arrivals.tsx`（推奨リネーム）

**説明**: 新着コンテンツの全件表示画面

**Figma対応画面**: `NewArrivalsScreen`

**機能**:

- 新着コンテンツ一覧表示
- コンテンツ再生
- 戻る

---

### 4. ライブラリタブ

**パス**: `screens/main/library/`

#### 4-1. ライブラリルート画面

**ファイル**: `index.tsx`

**説明**: すべてのコンテンツを表示するライブラリ画面

**Figma対応画面**: `LibraryScreen`

**機能**:

- コンテンツ一覧表示
- お気に入り登録/解除
- シリーズタップでエピソード一覧へ遷移
- シリーズをキューに追加
- シリーズをプレイリストに追加

#### 4-2. エピソード一覧画面

**ファイル**: `child.tsx` → `episode-list.tsx`（推奨リネーム）

**説明**: シリーズのエピソード・チャプター一覧を表示

**Figma対応画面**: `EpisodeListScreen`

**機能**:

- エピソード一覧表示
- チャプター一覧表示（エピソードに含まれる場合）
- ソート機能（デフォルト/新着順/古い順）
- 全エピソード再生
- エピソード個別再生
- お気に入り登録/解除
- キューに追加
- プレイリストに追加
- 戻る

#### 4-3. コンテンツ詳細画面

**ファイル**: 新規作成 `content-detail.tsx`

**説明**: 単体コンテンツの詳細画面

**Figma対応画面**: `ContentDetailScreen`

**機能**:

- コンテンツ詳細表示
- 再生
- お気に入り登録/解除
- 戻る

---

### 5. お気に入りタブ

**パス**: `screens/main/favorites/`

#### 5-1. お気に入りルート画面

**ファイル**: `index.tsx`

**説明**: お気に入り登録されたコンテンツを表示

**Figma対応画面**: `FavoritesScreen`

**機能**:

- お気に入りシリーズ一覧
- お気に入りエピソード一覧
- お気に入りチャプター一覧
- タブ切り替え（シリーズ/エピソード/チャプター）
- お気に入り解除
- コンテンツ再生
- キューに追加
- プレイリストに追加

---

### 6. プレイリストタブ

**パス**: `screens/main/playlist/`

#### 6-1. プレイリストルート画面

**ファイル**: `index.tsx`

**説明**: プレイリスト一覧とキュー管理

**Figma対応画面**: `PlaylistScreen`

**機能**:

- プレイリスト一覧表示
- キューボタン（再生キュー画面へ遷移）
- プレイリスト作成
- プレイリスト編集
- プレイリスト削除
- プレイリストピン留め
- プレイリストタップで詳細画面へ遷移

#### 6-2. プレイリスト詳細画面

**ファイル**: `child.tsx` → `playlist-detail.tsx`（推奨リネーム）

**説明**: プレイリストの詳細と再生管理

**Figma対応画面**: `PlaylistDetailScreen`

**機能**:

- プレイリスト内容表示
- 全曲再生
- シャッフル再生
- リピート再生
- アイテム個別再生
- アイテム削除
- アイテム並び替え
- プレイリスト編集
- 戻る

#### 6-3. 再生キュー画面

**ファイル**: 新規作成 `queue.tsx`

**説明**: 次に再生されるアイテムのキュー管理

**Figma対応画面**: `QueueScreen`

**機能**:

- キュー内容表示
- キューから削除
- キュー内並び替え
- キューアイテム再生
- 戻る

---

### 7. 履歴タブ

**パス**: `screens/main/history/`

#### 7-1. 履歴ルート画面

**ファイル**: `index.tsx`

**説明**: 再生履歴を表示

**Figma対応画面**: `HistoryScreen`

**機能**:

- 再生履歴一覧表示
- 履歴から再生
- ダウンロード管理セクション
- ダウンロード削除
- ダウンロードロック/アンロック

---

### 8. 設定タブ

**パス**: `screens/main/setting/`

#### 8-1. 設定ルート画面

**ファイル**: `index.tsx`

**説明**: アプリ設定画面

**Figma対応画面**: `SettingsScreen`

**機能**:

- テーマ設定（ライト/ダーク）
- ダウンロード管理画面へ遷移
- その他設定項目

#### 8-2. ダウンロード管理画面

**ファイル**: `child.tsx` → `download.tsx`（推奨リネーム）

**説明**: ダウンロード済みコンテンツの管理

**Figma対応画面**: `DownloadScreen`

**機能**:

- ダウンロード済みアイテム一覧
- 選択削除
- 全削除
- ロック/アンロック
- 再生
- ストレージ使用量表示
- 戻る

---

## 🎬 共通モーダル・ダイアログ

これらはコンポーネントとして実装され、各画面から呼び出されます。

### 9. ミニプレイヤー

**コンポーネント**: `components/MiniPlayer.tsx`

**説明**: 画面下部に固定表示されるミニプレイヤー

**Figma対応**: `MiniPlayer`

**機能**:

- 現在再生中のコンテンツ情報表示
- 再生/一時停止
- タップでフルプレイヤーへ展開
- お気に入りボタン
- 閉じるボタン

### 10. フルプレイヤー

**コンポーネント**: `components/EpisodePlayer.tsx`

**説明**: 全画面プレイヤー

**Figma対応**: `EpisodePlayer`

**機能**:

- 動画/音声再生
- 再生コントロール（再生/一時停止、シーク）
- 前/次エピソード
- 前/次チャプター
- エピソード一覧表示
- チャプター一覧表示
- 再生速度変更
- お気に入り登録/解除
- プレイリスト情報表示（プレイリストから再生時）
- 閉じる

### 11. プレイリスト作成/編集ダイアログ

**コンポーネント**: `components/CreatePlaylistDialog.tsx`

**説明**: プレイリストを作成・編集するダイアログ

**Figma対応**: `CreatePlaylistDialog`

**機能**:

- プレイリスト名入力
- 説明入力
- カバー画像設定
- アラーム設定
- 保存/キャンセル

### 12. プレイリストに追加ダイアログ

**コンポーネント**: `components/AddToPlaylistDialog.tsx`

**説明**: コンテンツをプレイリストに追加するダイアログ

**Figma対応**: `AddToPlaylistDialog`

**機能**:

- プレイリスト一覧表示
- プレイリスト選択
- 新規プレイリスト作成へ遷移

---

## 📋 画面遷移フロー

```
Splash
  ↓
Login (AccountScreen)
  ↓
Main (Tab Navigator)
  ├── Home (Today)
  │   ├── → New Arrivals Screen
  │   ├── → Episode List Screen
  │   └── → Full Player
  │
  ├── Library
  │   ├── → Episode List Screen
  │   ├── → Content Detail Screen
  │   └── → Full Player
  │
  ├── Favorites
  │   ├── → Episode List Screen
  │   └── → Full Player
  │
  ├── Playlist
  │   ├── → Playlist Detail Screen
  │   ├── → Queue Screen
  │   └── → Full Player
  │
  ├── History
  │   ├── → Download Screen
  │   └── → Full Player
  │
  └── Settings
      └── → Download Screen

Common:
  ├── Mini Player (常時表示、タップで Full Player へ)
  ├── Create Playlist Dialog
  └── Add to Playlist Dialog
```

---

## 🚀 実装優先順位

### フェーズ1: 既存画面の拡張

1. ✅ `screens/main/home/index.tsx` - TodayScreen 実装
2. ✅ `screens/main/library/index.tsx` - LibraryScreen 実装
3. ✅ `screens/main/favorites/index.tsx` - FavoritesScreen 実装
4. ✅ `screens/main/playlist/index.tsx` - PlaylistScreen 実装
5. ✅ `screens/main/history/index.tsx` - HistoryScreen 実装
6. ✅ `screens/main/setting/index.tsx` - SettingsScreen 実装

### フェーズ2: Child画面の追加

7. `screens/main/library/episode-list.tsx` - EpisodeListScreen
8. `screens/main/library/content-detail.tsx` - ContentDetailScreen
9. `screens/main/playlist/playlist-detail.tsx` - PlaylistDetailScreen
10. `screens/main/playlist/queue.tsx` - QueueScreen
11. `screens/main/home/new-arrivals.tsx` - NewArrivalsScreen
12. `screens/main/setting/download.tsx` - DownloadScreen

### フェーズ3: 共通コンポーネント

13. `components/MiniPlayer.tsx`
14. `components/EpisodePlayer.tsx`
15. `components/CreatePlaylistDialog.tsx`
16. `components/AddToPlaylistDialog.tsx`

### フェーズ4: ログイン画面の拡張

17. `screens/login/index.tsx` - AccountScreen 統合

---

## 📝 ファイル命名規則

- **Root画面**: `index.tsx`
- **Child画面**: 画面の役割を明確にする名前（例: `episode-list.tsx`, `playlist-detail.tsx`）
- **コンポーネント**: PascalCase（例: `MiniPlayer.tsx`, `CreatePlaylistDialog.tsx`）
- **既存の `child.tsx`**: 段階的に意味のある名前にリネームすることを推奨

---

## 🎨 Figma Make との対応表

| Figma Make コンポーネント | React Native 画面パス                       |
| ------------------------- | ------------------------------------------- |
| `TodayScreen`             | `screens/main/home/index.tsx`               |
| `NewArrivalsScreen`       | `screens/main/home/new-arrivals.tsx`        |
| `LibraryScreen`           | `screens/main/library/index.tsx`            |
| `EpisodeListScreen`       | `screens/main/library/episode-list.tsx`     |
| `ContentDetailScreen`     | `screens/main/library/content-detail.tsx`   |
| `FavoritesScreen`         | `screens/main/favorites/index.tsx`          |
| `PlaylistScreen`          | `screens/main/playlist/index.tsx`           |
| `PlaylistDetailScreen`    | `screens/main/playlist/playlist-detail.tsx` |
| `QueueScreen`             | `screens/main/playlist/queue.tsx`           |
| `HistoryScreen`           | `screens/main/history/index.tsx`            |
| `DownloadScreen`          | `screens/main/setting/download.tsx`         |
| `SettingsScreen`          | `screens/main/setting/index.tsx`            |
| `AccountScreen`           | `screens/login/index.tsx`                   |
| `MiniPlayer`              | `components/MiniPlayer.tsx`                 |
| `EpisodePlayer`           | `components/EpisodePlayer.tsx`              |
| `CreatePlaylistDialog`    | `components/CreatePlaylistDialog.tsx`       |
| `AddToPlaylistDialog`     | `components/AddToPlaylistDialog.tsx`        |

---

## 🔧 技術スタック

- **ナビゲーション**: React Navigation (Bottom Tab + Stack Navigator)
- **状態管理**: React Hooks (useState, useContext)
- **テーマ**: ThemeContext (既存)
- **認証**: AuthContext (既存)
- **UI**: React Native コンポーネント + カスタムコンポーネント

---

## 📦 必要な追加パッケージ

既存のReact Navigationに加えて、以下が必要になる可能性があります：

- 動画/音声再生: `react-native-video` または `expo-av`
- スワイプ/ドラッグ操作: `react-native-gesture-handler`
- アニメーション: `react-native-reanimated`
- ファイル管理: `react-native-fs`

---

## 🎯 次のステップ

1. このドキュメントをベースに各画面の詳細設計を行う
2. データモデル（型定義）を作成する
3. 既存の各 `index.tsx` を Figma Make の画面に置き換える実装を開始する
4. 共通コンポーネントを作成する
5. 画面間のナビゲーションを実装する
