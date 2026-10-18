import { useSafeAreaInsets } from 'react-native-safe-area-context'

// 画面下に重ねて表示するタブバーが占める高さ。スクロール内容の末尾がバーに隠れないよう下余白に使う。
// ミニプレイヤーと縮小動画の位置計算 (screens/main/index.tsx) もこの高さを前提にしている。
// バー本体 52 + 上の余白 4 に、画面下端との隙間を足した値。ホームインジケータのある端末ではその領域に少し食い込ませる。
export const useTabBarInset = () => 56 + Math.max(useSafeAreaInsets().bottom - 8, 8)
