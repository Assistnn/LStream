import { ChevronDown, Clock, ImageIcon, Shuffle, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '../../../../hooks/ThemeContext'
import type { AlarmSettings, DayKey, Playlist } from '../../../../repositories/playlist'
import { DAY_LABELS, DAY_ORDER } from '../utils'

type SubmitPayload = {
  name: string
  description: string
  coverImage?: string
  alarm?: AlarmSettings
}

const DESCRIPTION_MAX = 40

export const CreatePlaylistModal = ({
  visible,
  onClose,
  onSubmit,
  editing,
}: {
  visible: boolean
  onClose: () => void
  onSubmit: (payload: SubmitPayload) => void
  editing?: Playlist | null
}) => {
  const { colors, spacing, borderRadius, styles, typography } = useTheme()
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined)
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [hour, setHour] = useState('07')
  const [minute, setMinute] = useState('00')
  const [days, setDays] = useState<DayKey[]>([])
  const [random, setRandom] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (editing) {
      setName(editing.name)
      setDescription(editing.description)
      setCoverImage(editing.coverImage)
      if (editing.alarm) {
        setAlarmEnabled(editing.alarm.enabled)
        const [h, m] = editing.alarm.time.split(':')
        setHour(h ?? '07')
        setMinute(m ?? '00')
        setDays(editing.alarm.days)
        setRandom(editing.alarm.random)
      } else {
        setAlarmEnabled(false)
        setHour('07')
        setMinute('00')
        setDays([])
        setRandom(false)
      }
    } else {
      setName('')
      setDescription('')
      setCoverImage(undefined)
      setAlarmEnabled(false)
      setHour('07')
      setMinute('00')
      setDays([])
      setRandom(false)
    }
  }, [visible, editing])

  const [selectOpen, setSelectOpen] = useState<'hour' | 'minute' | null>(null)

  const canSubmit = name.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      coverImage,
      alarm: alarmEnabled ? { enabled: true, time: `${hour}:${minute}`, days, random } : undefined,
    })
  }

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius['2xl'],
              borderTopRightRadius: borderRadius['2xl'],
              maxHeight: '90%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={styles.textXl}>{editing ? 'プレイリスト編集' : '新規プレイリスト'}</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: spacing.xs }}>
                <X size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
              keyboardShouldPersistTaps='handled'
            >
              {/* Name */}
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.textBold}>プレイリスト名 *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder='例：朝の習慣'
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.input, styles.inputText]}
                />
              </View>

              {/* Description */}
              <View style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.textBold}>説明（任意）</Text>
                  <Text style={styles.bodyTiny}>
                    {description.length}/{DESCRIPTION_MAX}
                  </Text>
                </View>
                <TextInput
                  value={description}
                  onChangeText={(v) => setDescription(v.slice(0, DESCRIPTION_MAX))}
                  placeholder='プレイリストの説明'
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={[styles.input, styles.inputText, { minHeight: 60, textAlignVertical: 'top' }]}
                />
              </View>

              {/* Cover Image */}
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.textBold}>カバー画像（任意）</Text>
                <TouchableOpacity
                  onPress={() => {
                    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
                      if (res.assets?.[0]?.uri) setCoverImage(res.assets[0].uri)
                    })
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    paddingVertical: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                    backgroundColor: colors.card,
                  }}
                >
                  <ImageIcon size={20} color={colors.textSecondary} />
                  <Text style={styles.bodySmall}>{coverImage ? '画像を変更' : '写真フォルダから選択'}</Text>
                </TouchableOpacity>
                {coverImage && (
                  <View style={{ borderRadius: borderRadius.lg, overflow: 'hidden' }}>
                    <Image source={{ uri: coverImage }} style={{ width: '100%', height: 160 }} resizeMode='cover' />
                    <TouchableOpacity
                      onPress={() => setCoverImage(undefined)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: borderRadius.full,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={16} color='#FFFFFF' />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Alarm */}
              <View style={{ gap: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Clock size={18} color={colors.text} />
                    <Text style={styles.textBold}>アラーム設定</Text>
                  </View>
                  <Switch
                    value={alarmEnabled}
                    onValueChange={setAlarmEnabled}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                  />
                </View>

                {alarmEnabled && (
                  <View style={{ gap: spacing.lg }}>
                    {/* Time */}
                    <View style={{ gap: spacing.sm }}>
                      <Text style={styles.bodySmall}>開始時間</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <TouchableOpacity
                          onPress={() => setSelectOpen('hour')}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.md,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: borderRadius.lg,
                          }}
                        >
                          <Text style={styles.bodyText}>{hour}時</Text>
                          <ChevronDown size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={styles.textXl}>:</Text>
                        <TouchableOpacity
                          onPress={() => setSelectOpen('minute')}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.md,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: borderRadius.lg,
                          }}
                        >
                          <Text style={styles.bodyText}>{minute}分</Text>
                          <ChevronDown size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Days */}
                    <View style={{ gap: spacing.sm }}>
                      <Text style={styles.bodySmall}>曜日</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {DAY_ORDER.map((d) => {
                          const selected = days.includes(d)
                          return (
                            <TouchableOpacity
                              key={d}
                              onPress={() =>
                                setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
                              }
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: borderRadius.full,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: selected ? colors.foreground : colors.muted,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: typography.fontSize.base,
                                  fontWeight: typography.fontWeight.semibold,
                                  color: selected ? colors.background : colors.text,
                                }}
                              >
                                {DAY_LABELS[d]}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    </View>

                    {/* Random */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Shuffle size={18} color={colors.text} />
                        <Text style={styles.textBold}>ランダム再生</Text>
                      </View>
                      <Switch
                        value={random}
                        onValueChange={setRandom}
                        trackColor={{ false: colors.muted, true: colors.primary }}
                      />
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.lg + insets.bottom,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.full,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={styles.textBold}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!canSubmit}
                onPress={submit}
                style={{
                  flex: 1,
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.full,
                  alignItems: 'center',
                  backgroundColor: canSubmit ? colors.foreground : colors.muted,
                }}
              >
                <Text style={[styles.textBold, { color: canSubmit ? colors.background : colors.textTertiary }]}>
                  {editing ? '更新' : '作成'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Select Modal */}
      <Modal visible={selectOpen !== null} transparent animationType='fade' onRequestClose={() => setSelectOpen(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSelectOpen(null)} />
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: borderRadius['2xl'],
              borderTopRightRadius: borderRadius['2xl'],
              maxHeight: '50%',
              paddingBottom: insets.bottom,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={styles.textBold}>{selectOpen === 'hour' ? '時' : '分'}を選択</Text>
              <TouchableOpacity onPress={() => setSelectOpen(null)} style={{ padding: spacing.xs }}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                selectOpen === 'hour'
                  ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
                  : Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const selected = selectOpen === 'hour' ? item === hour : item === minute
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (selectOpen === 'hour') setHour(item)
                      else setMinute(item)
                      setSelectOpen(null)
                    }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      backgroundColor: selected ? colors.primary + '20' : 'transparent',
                    }}
                  >
                    <Text
                      style={[
                        styles.bodyText,
                        selected && { color: colors.primary, fontWeight: typography.fontWeight.bold },
                      ]}
                    >
                      {item}
                      {selectOpen === 'hour' ? '時' : '分'}
                    </Text>
                  </TouchableOpacity>
                )
              }}
              initialScrollIndex={
                selectOpen === 'hour' ? Math.max(0, parseInt(hour, 10) - 2) : Math.max(0, parseInt(minute, 10) - 2)
              }
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  )
}
