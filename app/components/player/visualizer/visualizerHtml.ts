import type { Visualizer } from '../../../repositories/api/IApiRepository'
import { AUDIO_VISUALIZER_SOURCE } from './audioVisualizerSource'

// react-native-video の実出力に対し、RN→WebView コマンド伝搬の分だけ WebView 側が遅れて
// analyser が音を掴む。ユーザー体感で 0.3 秒程度先行させると同期する。
const RN_TO_WEBVIEW_LATENCY_SECONDS = 0.5

export const buildVisualizerHtml = (config: Visualizer, title: string, audioUrl: string): string => {
  const payload = { ...config, title }
  const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c')
  const audioSrc = audioUrl.replace(/"/g, '&quot;')

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: transparent; overflow: hidden; }
    canvas { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <canvas id="viz"></canvas>
  <script>
    ${AUDIO_VISUALIZER_SOURCE}

    (function () {
      // iOS の AVAudioSession が HTMLMediaElement 経由の再生を数秒後に停止させる問題を回避
      // するため <audio> タグを使わず AudioBufferSourceNode で音声データのみ扱う。
      // destination に接続しないため実音声は WebView からは出力されず、react-native-video
      // 側の音声とも競合しない。
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      var ctx = new AudioCtx();
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;

      var audioBuffer = null;
      var currentSource = null;
      var isPlaying = false;
      var startCtxTime = 0;
      var startOffset = 0;
      var rate = 1.0;
      var LATENCY = ${RN_TO_WEBVIEW_LATENCY_SECONDS};

      var stopSource = function () {
        if (currentSource) {
          try { currentSource.onended = null; currentSource.stop(); } catch (e) {}
          try { currentSource.disconnect(); } catch (e) {}
          currentSource = null;
        }
      };

      var startSource = function (offset) {
        if (!audioBuffer) return;
        stopSource();
        var src = ctx.createBufferSource();
        src.buffer = audioBuffer;
        src.playbackRate.value = rate;
        src.connect(analyser);
        var safeOffset = Math.max(0, Math.min(offset, audioBuffer.duration - 0.001));
        src.onended = function () {
          if (currentSource === src) {
            currentSource = null;
            isPlaying = false;
            startOffset = audioBuffer.duration;
          }
        };
        src.start(0, safeOffset);
        currentSource = src;
        startCtxTime = ctx.currentTime;
        startOffset = safeOffset;
      };

      var media = {
        get currentTime() {
          if (!audioBuffer) return 0;
          if (isPlaying) {
            return Math.min(audioBuffer.duration, startOffset + (ctx.currentTime - startCtxTime) * rate);
          }
          return startOffset;
        },
        get duration() { return audioBuffer ? audioBuffer.duration : 0; },
        get paused() { return !isPlaying; },
        get ended() { return audioBuffer ? this.currentTime >= audioBuffer.duration : false; },
        currentSrc: '',
        src: '',
        addEventListener: function () {},
        removeEventListener: function () {},
      };

      window.LseedAudioVisualizer.prototype._isSameOrigin = function () { return true; };
      window.LseedAudioVisualizer.prototype._ensureAnalyser = function () {
        if (this._analyser) return;
        this._audioCtx = ctx;
        this._analyser = analyser;
        this._freq = new Uint8Array(analyser.frequencyBinCount);
        this._time = new Uint8Array(analyser.fftSize);
      };

      var canvas = document.getElementById('viz');
      var config = ${payloadJson};
      var viz = new window.LseedAudioVisualizer(canvas, media, config);
      viz.start();

      var pendingPlay = false;
      var pendingSeek = null;
      fetch("${audioSrc}").then(function (r) {
        if (!r.ok) throw new Error('fetch status ' + r.status);
        return r.arrayBuffer();
      }).then(function (buf) {
        return ctx.decodeAudioData(buf);
      }).then(function (decoded) {
        audioBuffer = decoded;
        if (pendingSeek !== null) startOffset = pendingSeek;
        if (pendingPlay) {
          isPlaying = true;
          startSource(startOffset + LATENCY);
        }
      }).catch(function () {});

      var resumeCtx = function () {
        if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      };

      var apply = function (data) {
        if (!data) return;
        if (data.type === 'play') {
          resumeCtx();
          if (!audioBuffer) { pendingPlay = true; return; }
          if (!isPlaying) {
            isPlaying = true;
            startSource(startOffset + LATENCY);
          }
        } else if (data.type === 'pause') {
          if (isPlaying && audioBuffer) {
            startOffset = media.currentTime;
            stopSource();
            isPlaying = false;
          }
        } else if (data.type === 'seek') {
          if (typeof data.currentTime !== 'number' || !isFinite(data.currentTime)) return;
          if (!audioBuffer) { pendingSeek = data.currentTime; return; }
          startOffset = Math.max(0, data.currentTime);
          if (isPlaying) startSource(startOffset + LATENCY);
        } else if (data.type === 'rate') {
          if (typeof data.rate === 'number' && data.rate > 0) {
            var cur = media.currentTime;
            rate = data.rate;
            if (isPlaying) startSource(cur);
          }
        } else if (data.type === 'config') {
          viz.update(data.config || {});
        }
      };

      var handle = function (raw) {
        try {
          apply(typeof raw === 'string' ? JSON.parse(raw) : raw);
        } catch (e) {}
      };
      document.addEventListener('message', function (e) { handle(e.data); });
      window.addEventListener('message', function (e) { handle(e.data); });
    })();
  </script>
</body>
</html>`
}
