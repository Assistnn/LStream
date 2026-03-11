import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native'

import { useTheme } from '../../../../hooks/ThemeContext'

export type SearchBarProps = TextInputProps & {
  onSearch?: (text: string) => void
}

export const SearchBar = ({ onSearch, ...props }: SearchBarProps) => {
  const { styles, colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View style={[styles.input, localStyles.container, isFocused && styles.inputFocused]}>
      <View style={localStyles.iconContainer}>
        <Search color={colors.textTertiary} size={20} />
      </View>
      <TextInput
        style={[localStyles.textInput, { color: colors.inputForeground }]}
        placeholder='検索...'
        placeholderTextColor={colors.textTertiary}
        onChangeText={onSearch}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  )
}

const localStyles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  textInput: {
    fontSize: 14,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
  },
})
