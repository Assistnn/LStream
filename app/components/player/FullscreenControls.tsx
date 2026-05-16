import Slider from '@react-native-community/slider'
import { ChevronDown, Pause, Play, RotateCcw, RotateCw } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, StatusBar, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import Orientation from 'react-native-orientation-locker'

import { usePlayer } from '../../hooks/PlayerContext'

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const FullscreenControls = () => {
  const {
    currentContent,
    state: { playbackState, currentTime, duration },
    controls: { pause, resume, skipForward, skipBackward, startSliding, stopSliding, updateSlidingTime },
    settings: { isFullscreen, setIsFullscreen },
  } = usePlayer()

  const [showControls, setShowControls] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressUntilRef = useRef(0)

  const isPlaying = playbackState === 'playing'

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false)
  }, [setIsFullscreen])

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
    setShowControls(true)
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    if (isFullscreen) {
      Orientation.lockToLandscape()
      StatusBar.setHidden(true, 'fade')
    } else {
      Orientation.lockToPortrait()
      StatusBar.setHidden(false, 'fade')
    }
    return () => {
      if (isFullscreen) {
        Orientation.lockToPortrait()
        StatusBar.setHidden(false, 'fade')
      }
    }
  }, [isFullscreen])

  useEffect(() => {
    if (!currentContent) return
    const listener = (orientation: string) => {
      const isLandscape = orientation === 'LANDSCAPE-LEFT' || orientation === 'LANDSCAPE-RIGHT'
      const isPortrait = orientation === 'PORTRAIT'
      if (!isFullscreen && isLandscape) {
        suppressUntilRef.current = Date.now() + 1000
        setIsFullscreen(true)
        Orientation.unlockAllOrientations()
      } else if (isFullscreen && isPortrait) {
        suppressUntilRef.current = Date.now() + 1000
        setIsFullscreen(false)
        Orientation.unlockAllOrientations()
      }
    }
    Orientation.addDeviceOrientationListener(listener)
    return () => Orientation.removeDeviceOrientationListener(listener)
  }, [currentContent, isFullscreen, setIsFullscreen])

  useEffect(() => {
    if (isFullscreen) resetHideTimer()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [isFullscreen, resetHideTimer])

  if (!isFullscreen || !currentContent) return null

  const title = currentContent.unit?.title || currentContent.episode.title

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (showControls) {
            setShowControls(false)
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          } else {
            resetHideTimer()
          }
        }}
      >
        <View style={{ flex: 1 }}>
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
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <TouchableOpacity
                  onPress={exitFullscreen}
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
                  {title}
                </Text>
                <View style={{ width: 28 }} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 60 }}>
                <TouchableOpacity
                  onPress={() => skipBackward(30)}
                  disabled={currentTime < 30}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <RotateCcw size={48} color={currentTime < 30 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => (isPlaying ? pause() : resume())}
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

              <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
                <View style={{ width: '100%' }}>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={duration || 1}
                    value={currentTime}
                    onSlidingStart={startSliding}
                    onValueChange={updateSlidingTime}
                    onSlidingComplete={stopSliding}
                    minimumTrackTintColor='#3B82F6'
                    maximumTrackTintColor='rgba(255,255,255,0.3)'
                    thumbTintColor='#FFFFFF'
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 }}>
                    <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>{formatTime(currentTime)}</Text>
                    <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '500' }}>{formatTime(duration)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}
