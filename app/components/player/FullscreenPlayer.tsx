import Slider from '@react-native-community/slider'
import { ChevronDown, Pause, Play, RotateCcw, RotateCw } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Orientation from 'react-native-orientation-locker'

import { usePlayer } from '../../hooks/PlayerContext'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const FullscreenPlayer = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const {
    currentContent,
    playbackState,
    currentTime,
    duration,
    togglePlayPause,
    seek,
    skipForward,
    skipBackward,
    renderMediaDisplay,
  } = usePlayer()

  const [showControls, setShowControls] = useState(true)
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPlaying = playbackState === 'playing'

  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
    setShowControls(true)
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  const isLockedRef = useRef(false)

  useEffect(() => {
    if (visible && !isLockedRef.current) {
      isLockedRef.current = true
      Orientation.lockToLandscape()
      StatusBar.setHidden(true, 'fade')
    } else if (!visible && isLockedRef.current) {
      isLockedRef.current = false
      Orientation.unlockAllOrientations()
      StatusBar.setHidden(false, 'fade')
    }
    return () => {
      if (isLockedRef.current) {
        isLockedRef.current = false
        Orientation.unlockAllOrientations()
        StatusBar.setHidden(false, 'fade')
      }
    }
  }, [visible])

  useEffect(() => {
    resetHideControlsTimer()
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current)
      }
    }
  }, [resetHideControlsTimer])

  if (!currentContent || !visible) return null

  const screenWidth = Dimensions.get('window').width
  const screenHeight = Dimensions.get('window').height

  return (
    <Modal visible={visible} animationType='fade' onRequestClose={onClose} supportedOrientations={['landscape']}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (showControls) {
            setShowControls(false)
            if (hideControlsTimerRef.current) {
              clearTimeout(hideControlsTimerRef.current)
            }
          } else {
            resetHideControlsTimer()
          }
        }}
      >
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          {renderMediaDisplay({
            position: 'absolute',
            width: screenWidth,
            height: screenHeight,
          }, 'fullscreen')}

          {showControls && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingTop: Platform.OS === 'ios' ? 50 : 20,
                  paddingBottom: 20,
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  style={{ padding: 8 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronDown size={28} color='#FFFFFF' />
                </TouchableOpacity>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    marginHorizontal: 16,
                  }}
                  numberOfLines={1}
                >
                  {currentContent.chapter?.title || currentContent.episode.title}
                </Text>
                <View style={{ width: 28 }} />
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 60,
                }}
              >
                <TouchableOpacity
                  onPress={() => skipBackward(30)}
                  disabled={currentTime < 30}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <RotateCcw size={48} color={currentTime < 30 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={togglePlayPause}
                  style={{ padding: 20 }}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  {isPlaying ? (
                    <Pause size={56} color='#FFFFFF' fill='#FFFFFF' />
                  ) : (
                    <Play size={56} color='#FFFFFF' fill='#FFFFFF' />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => skipForward(30)}
                  disabled={currentTime >= duration - 30}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <RotateCw size={48} color={currentTime >= duration - 30 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
                </TouchableOpacity>
              </View>

              <View
                style={{
                  paddingHorizontal: 20,
                  paddingBottom: Platform.OS === 'ios' ? 40 : 20,
                }}
              >
                <View style={{ width: '100%' }}>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={currentTime}
                    onSlidingComplete={seek}
                    minimumTrackTintColor='#3B82F6'
                    maximumTrackTintColor='rgba(255,255,255,0.3)'
                    thumbTintColor='#FFFFFF'
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 }}>
                    <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>
                      {formatTime(currentTime)}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>{formatTime(duration)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
