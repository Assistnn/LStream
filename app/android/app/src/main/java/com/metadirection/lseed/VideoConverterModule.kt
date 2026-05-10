package com.metadirection.lseed

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaMuxer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.nio.ByteBuffer

class VideoConverterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "VideoConverterModule"

    @ReactMethod
    fun convertTsToMp4(inputPath: String, outputPath: String, promise: Promise) {
        Thread {
            try {
                val extractor = MediaExtractor()
                extractor.setDataSource(inputPath)

                val muxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
                val trackIndexMap = mutableMapOf<Int, Int>()

                for (i in 0 until extractor.trackCount) {
                    val format = extractor.getTrackFormat(i)
                    val muxerTrackIndex = muxer.addTrack(format)
                    trackIndexMap[i] = muxerTrackIndex
                }

                muxer.start()

                val buffer = ByteBuffer.allocate(1024 * 1024)
                val bufferInfo = MediaCodec.BufferInfo()

                for (i in 0 until extractor.trackCount) {
                    extractor.selectTrack(i)
                }

                extractor.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC)

                while (true) {
                    val sampleSize = extractor.readSampleData(buffer, 0)
                    if (sampleSize < 0) break

                    val trackIndex = extractor.sampleTrackIndex
                    val muxerTrackIndex = trackIndexMap[trackIndex] ?: continue

                    bufferInfo.offset = 0
                    bufferInfo.size = sampleSize
                    bufferInfo.presentationTimeUs = extractor.sampleTime
                    bufferInfo.flags = extractor.sampleFlags

                    muxer.writeSampleData(muxerTrackIndex, buffer, bufferInfo)
                    extractor.advance()
                }

                muxer.stop()
                muxer.release()
                extractor.release()

                java.io.File(inputPath).delete()

                promise.resolve(outputPath)
            } catch (e: Exception) {
                promise.reject("E_EXPORT", e.message, e)
            }
        }.start()
    }
}
