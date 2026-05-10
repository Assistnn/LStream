import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Alert, NativeModules, Platform } from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'

import { getDeviceHeaders } from '../repositories/api/core/config'

const { VideoConverterModule } = NativeModules as {
  VideoConverterModule: {
    startServer: (path: string) => Promise<string>
    convertTsToMp4: (input: string, output: string) => Promise<string>
  }
}

type DownloadItem = {
  id: string
  seriesId: number
  mediaId: number
  title: string
  seriesTitle: string
  thumbnail: string
  duration: number
  mediaType: number
  sizeMB: number
  playCount: number
  isLocked: boolean
  filePath: string
  downloadedAt: string
  originalUrl: string
}

type DownloadProgress = {
  received: number
  total: number
  title: string
  seriesTitle: string
  thumbnail: string
}

type DownloadContextValue = {
  downloads: DownloadItem[]
  downloadProgress: Map<string, DownloadProgress>
  startDownload: (info: {
    seriesId: number
    mediaId: number
    title: string
    seriesTitle: string
    thumbnail: string
    duration: number
    mediaType: number
    url: string
  }) => void
  cancelDownload: (id: string) => void
  deleteDownloads: (ids: string[], force?: boolean) => void
  toggleLock: (id: string) => void
  getLocalPath: (url: string) => string | undefined
  incrementPlayCount: (id: string) => void
  isDownloaded: (mediaId: number) => boolean
  isDownloading: (mediaId: number) => boolean
}

const STORAGE_KEY = '@downloads/items'

const isHlsUrl = (url: string) => url.includes('.m3u8')

const resolveUrl = (base: string, relative: string) => {
  if (relative.startsWith('http')) return relative
  const baseDir = base.substring(0, base.lastIndexOf('/') + 1)
  return baseDir + relative
}

const parseM3u8 = (text: string, baseUrl: string) => {
  const lines = text.split('\n')
  const entries: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (line && !line.startsWith('#')) entries.push(resolveUrl(baseUrl, line))
  }
  return { lines, entries }
}

const downloadHls = async (
  url: string,
  outputDir: string,
  headers: Record<string, string>,
  onProgress: (received: number, total: number) => void,
  cancelRef: { cancelled: boolean },
): Promise<string> => {
  await ReactNativeBlobUtil.fs.mkdir(outputDir).catch(() => {})

  const masterRes = await ReactNativeBlobUtil.fetch('GET', url, headers)
  const masterText = String(masterRes.text())
  const master = parseM3u8(masterText, url)

  let mediaPlaylistUrl: string
  let mediaBaseUrl: string

  if (master.entries.length > 0 && master.entries[0].endsWith('.m3u8')) {
    mediaPlaylistUrl = master.entries[0]
    mediaBaseUrl = mediaPlaylistUrl
  } else {
    mediaPlaylistUrl = url
    mediaBaseUrl = url
  }

  const mediaRes = await ReactNativeBlobUtil.fetch('GET', mediaPlaylistUrl, headers)
  const mediaText = String(mediaRes.text())
  const media = parseM3u8(mediaText, mediaBaseUrl)

  const segmentUrls = media.entries.filter((e) => !e.endsWith('.m3u8'))
  if (segmentUrls.length === 0) throw new Error('HLSセグメントが見つかりません')

  console.log('[HLS]', segmentUrls.length, 'ts segments to download')

  for (let i = 0; i < segmentUrls.length; i++) {
    if (cancelRef.cancelled) throw new Error('canceled')
    const segPath = `${outputDir}/seg_${i}.ts`
    await ReactNativeBlobUtil.config({ path: segPath, overwrite: true }).fetch('GET', segmentUrls[i], headers)
    onProgress(i + 1, segmentUrls.length)
  }

  const localLines: string[] = []
  let segIdx = 0
  for (const raw of mediaText.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) {
      localLines.push(line)
    } else {
      localLines.push(`seg_${segIdx}.ts`)
      segIdx++
    }
  }

  const m3u8Path = `${outputDir}/index.m3u8`
  await ReactNativeBlobUtil.fs.createFile(m3u8Path, localLines.join('\n'), 'utf8')

  return m3u8Path
}

const getDownloadDir = () =>
  Platform.OS === 'ios'
    ? ReactNativeBlobUtil.fs.dirs.DocumentDir + '/downloads'
    : ReactNativeBlobUtil.fs.dirs.DocumentDir + '/downloads'

const makeId = (seriesId: number, mediaId: number) => `${seriesId}_${mediaId}`

const DownloadContext = createContext<DownloadContextValue | undefined>(undefined)

export const useDownload = () => {
  const context = useContext(DownloadContext)
  if (!context) throw new Error('useDownload must be used within DownloadProvider')
  return context
}

export const DownloadProvider = ({ children }: { children: ReactNode }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map())
  const tasksRef = useRef<Map<string, { cancel: () => void }>>(new Map())
  const loadedRef = useRef(false)
  const serverBaseUrlRef = useRef<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setDownloads(JSON.parse(raw) as DownloadItem[])
      loadedRef.current = true
    })
    const dir = getDownloadDir()
    ReactNativeBlobUtil.fs.mkdir(dir).catch(() => {})
    if (Platform.OS === 'ios') {
      VideoConverterModule.startServer(dir)
        .then((url) => {
          serverBaseUrlRef.current = url
          console.log('[LocalServer] Started at', url)
        })
        .catch((e) => console.error('[LocalServer] Failed to start', e))
    }
  }, [])

  useEffect(() => {
    if (!loadedRef.current) return
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(downloads))
  }, [downloads])

  const startDownload = useCallback(
    (info: {
      seriesId: number
      mediaId: number
      title: string
      seriesTitle: string
      thumbnail: string
      duration: number
      mediaType: number
      url: string
    }) => {
      const id = makeId(info.seriesId, info.mediaId)
      if (downloads.some((d) => d.id === id) || tasksRef.current.has(id)) return

      const isHls = isHlsUrl(info.url)
      const ext = isHls ? '' : info.mediaType === 1 ? 'mp4' : 'mp3'
      const filePath = isHls ? `${getDownloadDir()}/${id}` : `${getDownloadDir()}/${id}.${ext}`

      setDownloadProgress((prev) =>
        new Map(prev).set(id, {
          received: 0,
          total: 0,
          title: info.title,
          seriesTitle: info.seriesTitle,
          thumbnail: info.thumbnail,
        }),
      )

      const cancelRef = { cancelled: false }
      tasksRef.current.set(id, {
        cancel: () => {
          cancelRef.cancelled = true
        },
      })

      const updateProgress = (received: number, total: number) => {
        setDownloadProgress((prev) => {
          const existing = prev.get(id)
          return new Map(prev).set(id, {
            received,
            total,
            title: existing?.title ?? info.title,
            seriesTitle: existing?.seriesTitle ?? info.seriesTitle,
            thumbnail: existing?.thumbnail ?? info.thumbnail,
          })
        })
      }

      const onSuccess = (path: string, sizeMB: number) => {
        setDownloads((prev) => [
          ...prev,
          {
            id,
            seriesId: info.seriesId,
            mediaId: info.mediaId,
            title: info.title,
            seriesTitle: info.seriesTitle,
            thumbnail: info.thumbnail,
            duration: info.duration,
            mediaType: info.mediaType,
            sizeMB,
            playCount: 0,
            isLocked: false,
            filePath: path,
            downloadedAt: new Date().toISOString(),
            originalUrl: info.url,
          },
        ])
        setDownloadProgress((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
        tasksRef.current.delete(id)
      }

      const onError = (err: unknown) => {
        const msg = (err as Error).message ?? ''
        console.error('[Download Error]', info.title, info.url, msg)
        if (msg !== 'canceled') {
          Alert.alert('ダウンロードエラー', `${info.title}のダウンロードに失敗しました\n${msg}`)
        }
        setDownloadProgress((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
        tasksRef.current.delete(id)
        ReactNativeBlobUtil.fs.unlink(filePath).catch(() => {})
      }

      const doDownload = async () => {
        const token = await AsyncStorage.getItem('auth_token')
        const deviceHeaders = getDeviceHeaders()
        const headers: Record<string, string> = { ...deviceHeaders }
        if (token) headers['x-app-token'] = token

        try {
          let savedPath = filePath
          if (isHls) {
            savedPath = await downloadHls(info.url, filePath, headers, updateProgress, cancelRef)
            const files = await ReactNativeBlobUtil.fs.ls(filePath)
            let totalBytes = 0
            for (const f of files) {
              const s = await ReactNativeBlobUtil.fs.stat(`${filePath}/${f}`)
              totalBytes += Number(s.size)
            }
            const sizeMB = totalBytes / (1024 * 1024)
            onSuccess(savedPath, sizeMB)
          } else {
            const task = ReactNativeBlobUtil.config({
              path: filePath,
              IOSBackgroundTask: true,
              overwrite: true,
              followRedirect: true,
            }).fetch('GET', info.url, headers)

            tasksRef.current.set(id, { cancel: () => task.cancel() })
            task.progress({ interval: 250 }, (received, total) => updateProgress(Number(received), Number(total)))

            const res = await task
            if (res.respInfo?.status && res.respInfo.status >= 400) {
              throw new Error(`HTTP ${res.respInfo.status}`)
            }
            const fileStat = await ReactNativeBlobUtil.fs.stat(filePath)
            if (fileStat.size < 1024) {
              await ReactNativeBlobUtil.fs.unlink(filePath).catch(() => {})
              throw new Error('ファイルが不正です')
            }
            onSuccess(filePath, fileStat.size / (1024 * 1024))
          }
        } catch (err) {
          onError(err)
        }
      }

      void doDownload()
    },
    [downloads],
  )

  const cancelDownload = useCallback((id: string) => {
    const task = tasksRef.current.get(id)
    if (task) {
      task.cancel()
      tasksRef.current.delete(id)
    }
  }, [])

  const deleteDownloads = useCallback((ids: string[], force = false) => {
    setDownloads((prev) => {
      const toDelete = prev.filter((d) => ids.includes(d.id) && (force || !d.isLocked))
      toDelete.forEach((d) => {
        const dir = d.filePath.substring(0, d.filePath.lastIndexOf('/'))
        const isInSubDir = dir !== getDownloadDir()
        ReactNativeBlobUtil.fs.unlink(isInSubDir ? dir : d.filePath).catch(() => {})
      })
      const deleteIds = new Set(toDelete.map((d) => d.id))
      return prev.filter((d) => !deleteIds.has(d.id))
    })
  }, [])

  const toggleLock = useCallback((id: string) => {
    setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, isLocked: !d.isLocked } : d)))
  }, [])

  const getLocalPath = useCallback(
    (url: string) => {
      const item = downloads.find((d) => d.originalUrl === url)
      if (!item) return undefined
      if (item.filePath.endsWith('.m3u8') && serverBaseUrlRef.current) {
        const downloadDir = getDownloadDir()
        const relativePath = item.filePath.replace(downloadDir, '').replace(/^\//, '')
        return `${serverBaseUrlRef.current}/${relativePath}`
      }
      return item.filePath
    },
    [downloads],
  )

  const incrementPlayCount = useCallback((id: string) => {
    setDownloads((prev) => prev.map((d) => (d.id === id ? { ...d, playCount: d.playCount + 1 } : d)))
  }, [])

  const isDownloaded = useCallback((mediaId: number) => downloads.some((d) => d.mediaId === mediaId), [downloads])

  const isDownloading = useCallback(
    (mediaId: number) => {
      for (const [key] of downloadProgress) {
        if (key.endsWith(`_${mediaId}`)) return true
      }
      return false
    },
    [downloadProgress],
  )

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        downloadProgress,
        startDownload,
        cancelDownload,
        deleteDownloads,
        toggleLock,
        getLocalPath,
        incrementPlayCount,
        isDownloaded,
        isDownloading,
      }}
    >
      {children}
    </DownloadContext.Provider>
  )
}
