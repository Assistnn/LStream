import { Search } from 'lucide-react-native'
import { useState } from 'react'
import { TextInput, type TextInputProps, View } from 'react-native'

import { useTheme } from '../../../../hooks/ThemeContext'

export type SearchBarProps = TextInputProps & {
  onSearch?: (text: string) => void
}

export const SearchBar = ({ onSearch, ...props }: SearchBarProps) => {
  const { styles, colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  return (
    <View
      style={[
        styles.input,
        isFocused && styles.inputFocused,
        {
          position: 'relative',
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: [{ translateY: -10 }],
          zIndex: 1,
        }}
      >
        <Search color={colors.textTertiary} size={20} />
      </View>
      <TextInput
        style={[
          styles.inputText,
          {
            paddingLeft: 40,
            paddingRight: 16,
            paddingVertical: 12,
          },
        ]}
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
