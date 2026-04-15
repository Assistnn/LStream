import { Clock, Shuffle, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
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

import type { AlarmSettings, DayKey, Playlist } from '../../../../hooks/PlaylistContext'
import { useTheme } from '../../../../hooks/ThemeContext'
import { DAY_LABELS, DAY_ORDER, GRADIENT_PRESETS } from '../utils'
import { PlaylistCover } from './PlaylistCover'

type SubmitPayload = {
  name: string
  description: string
  gradient: string
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
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].key)
  const [alarmEnabled, setAlarmEnabled] = useState(false)
  const [hour, setHour] = useState('07')
  const [minute, setMinute] = useState('00')
  const [days, setDays] = useState<DayKey[]>(['mon', 'wed', 'fri'])
  const [random, setRandom] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (editing) {
      setName(editing.name)
      setDescription(editing.description)
      setGradient(editing.gradient ?? GRADIENT_PRESETS[0].key)
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
        setDays(['mon', 'wed', 'fri'])
        setRandom(false)
      }
    } else {
      setName('')
      setDescription('')
      setGradient(GRADIENT_PRESETS[0].key)
      setAlarmEnabled(false)
      setHour('07')
      setMinute('00')
      setDays(['mon', 'wed', 'fri'])
      setRandom(false)
    }
  }, [visible, editing])

  const normalizeTimePart = (v: string, max: number) => {
    const n = parseInt(v.replace(/[^0-9]/g, ''), 10)
    if (isNaN(n)) return '00'
    return Math.max(0, Math.min(max, n)).toString().padStart(2, '0')
  }

  const canSubmit = name.trim().length > 0

  const submit = () => {
    if (!canSubmit) return
    const h = normalizeTimePart(hour, 23)
    const m = normalizeTimePart(minute, 59)
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      gradient,
      alarm: alarmEnabled ? { enabled: true, time: `${h}:${m}`, days, random } : undefined,
    })
  }

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
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
              {/* Preview */}
              <View style={{ alignItems: 'center' }}>
                <PlaylistCover gradient={gradient} size={96} borderRadius={borderRadius.xl} />
              </View>

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

              {/* Gradient picker */}
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.textBold}>カバー（グラデーション）</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {GRADIENT_PRESETS.map((g) => (
                    <TouchableOpacity
                      key={g.key}
                      onPress={() => setGradient(g.key)}
                      style={{
                        borderRadius: borderRadius.xl,
                        padding: gradient === g.key ? 3 : 0,
                        borderWidth: gradient === g.key ? 2 : 0,
                        borderColor: colors.primary,
                      }}
                    >
                      <PlaylistCover gradient={g.key} size={44} borderRadius={borderRadius.lg} />
                    </TouchableOpacity>
                  ))}
                </View>
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
                        <TextInput
                          value={hour}
                          onChangeText={(v) => setHour(v.slice(0, 2))}
                          onBlur={() => setHour(normalizeTimePart(hour, 23))}
                          keyboardType='number-pad'
                          maxLength={2}
                          style={[styles.input, styles.inputText, { width: 64, textAlign: 'center' }]}
                        />
                        <Text style={styles.textXl}>:</Text>
                        <TextInput
                          value={minute}
                          onChangeText={(v) => setMinute(v.slice(0, 2))}
                          onBlur={() => setMinute(normalizeTimePart(minute, 59))}
                          keyboardType='number-pad'
                          maxLength={2}
                          style={[styles.input, styles.inputText, { width: 64, textAlign: 'center' }]}
                        />
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
                padding: spacing.lg,
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
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}
