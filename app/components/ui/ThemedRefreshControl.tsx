import { RefreshControl } from 'react-native'

import { useTheme } from '../../hooks/ThemeContext'

export const useThemedRefreshControl = (refreshing: boolean, onRefresh: () => void) => {
  const { colors } = useTheme()
  return <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryLight} />
}
