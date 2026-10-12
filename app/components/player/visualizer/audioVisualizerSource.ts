// AUTO-GENERATED — do not edit by hand.
// Source: lseed/resources/js/audio-visualizer.js
// Sync: pnpm --dir app sync-visualizer  (or scripts/sync-audio-visualizer.sh)

export const AUDIO_VISUALIZER_SOURCE = `
/**
 * オーディオビジュアライザー エンジン
 *
 * 音声メディア要素（<audio> / <video>）の再生に合わせて Canvas 上にグラフィックを描画する。
 * 編集プレビュー（メディアスタジオ）と公開再生ページの両方で共通利用する。
 *
 * 使い方:
 *   const viz = new LseedAudioVisualizer(canvasEl, mediaEl, config);
 *   viz.start();
 *   viz.update(newConfig);   // 設定変更を反映
 *   viz.destroy();           // 破棄
 *
 * config: {
 *   type, colorScheme, bgColor, bgColorOpacity, bgPhotoUrl, bgPhotoOpacity,
 *   centerPhotoUrl, centerPhotoShape, title, showTitle, showTime,
 *   schemes: { key: { label, colors: [] } },   // カラーテーマ定義（PHP から供給）
 *   bgColors: { key: hex|null },                // 背景色パレット（PHP から供給）
 * }
 *
 * 音声のクロスオリジン制約:
 *   createMediaElementSource は非 CORS のクロスオリジン音源を無音化するため、
 *   同一オリジンの場合のみ AnalyserNode を接続する。クロスオリジン時は
 *   時間ベースの合成波形へフォールバックし、音声には一切干渉しない。
 */
class LseedAudioVisualizer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLMediaElement}  media
     * @param {object}            config
     */
    constructor(canvas, media, config = {}) {
        this.canvas = canvas;
        this.media = media;
        this.ctx = canvas.getContext('2d');
        this.config = Object.assign({}, config);

        this._raf = null;
        this._running = false;
        this._analyser = null;
        this._freq = null;
        this._time = null;
        this._particles = [];
        this._bgImg = null;
        this._bgImgUrl = null;
        this._centerImg = null;
        this._centerImgUrl = null;
        this._dpr = Math.max(1, window.devicePixelRatio || 1);
        this._bars = 64;

        this._onResize = this._resize.bind(this);
        this._onPlay = () => this._resumeContext();

        this._loadBgImage();
        this._loadCenterImage();
        this._resize();
    }

    /**
     * 描画ループを開始する。
     */
    start() {
        if (this._running) return;
        this._running = true;
        this._ensureAnalyser();
        window.addEventListener('resize', this._onResize);
        this.media && this.media.addEventListener('play', this._onPlay);
        this._loop();
    }

    /**
     * 描画ループを停止する（アナライザ接続は保持）。
     */
    stop() {
        this._running = false;
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
        window.removeEventListener('resize', this._onResize);
        this.media && this.media.removeEventListener('play', this._onPlay);
    }

    /**
     * 設定を更新する。背景画像 URL が変わった場合のみ再読込する。
     * @param {object} config
     */
    update(config = {}) {
        const prevUrl = this.config.bgPhotoUrl;
        const prevCenterUrl = this.config.centerPhotoUrl;
        const prevType = this.config.type;
        const prevColorScheme = this.config.colorScheme;
        this.config = Object.assign({}, this.config, config);
        if (this.config.bgPhotoUrl !== prevUrl) {
            this._loadBgImage();
        }
        if (this.config.centerPhotoUrl !== prevCenterUrl) {
            this._loadCenterImage();
        }
        // 種類・テーマ変更後に、旧テーマの粒子が残らないよう描画状態をリセットする。
        if (this.config.type !== prevType || this.config.colorScheme !== prevColorScheme) {
            this._particles = [];
        }
    }

    /**
     * 破棄する。
     */
    destroy() {
        this.stop();
        this._particles = [];
        this._bgImg = null;
    }

    // ---------------------------------------------------------------------
    // 内部: AudioContext / Analyser
    // ---------------------------------------------------------------------

    /**
     * 同一オリジン音源の場合のみ AnalyserNode を接続する。
     * MediaElementSource は要素ごとに 1 度しか生成できないため、要素へキャッシュする。
     */
    _ensureAnalyser() {
        if (this._analyser || !this.media) return;
        // synthetic 指定時はアナライザーを一切接続しない（音声を必ず素通しし、合成波形で描画）。
        // 公開ページはストレージ配信でクロスオリジン化しやすく、MediaElementSource が
        // 無音データ化・音声ミュートを起こすため、確実に動く合成波形を使う。
        if (this.config && this.config.synthetic) return;
        if (!this._isSameOrigin()) return; // クロスオリジンは合成波形へ

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        try {
            let ctx = this.media.__lseedAudioCtx;
            let source = this.media.__lseedMediaSource;
            if (!ctx) {
                ctx = new AudioCtx();
                this.media.__lseedAudioCtx = ctx;
            }
            if (!source) {
                source = ctx.createMediaElementSource(this.media);
                source.connect(ctx.destination);
                this.media.__lseedMediaSource = source;
            }
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.8;
            source.connect(analyser);

            this._audioCtx = ctx;
            this._analyser = analyser;
            this._freq = new Uint8Array(analyser.frequencyBinCount);
            this._time = new Uint8Array(analyser.fftSize);
        } catch (e) {
            // 失敗しても音声再生は継続。合成波形へフォールバック。
            this._analyser = null;
        }
    }

    _resumeContext() {
        if (this._audioCtx && this._audioCtx.state === 'suspended') {
            this._audioCtx.resume().catch(() => {});
        }
    }

    _isSameOrigin() {
        try {
            const src = this.media.currentSrc || this.media.src || '';
            if (!src) return true;
            if (src.startsWith('blob:') || src.startsWith('data:')) return true;
            return new URL(src, window.location.href).origin === window.location.origin;
        } catch (e) {
            return false;
        }
    }

    // ---------------------------------------------------------------------
    // 内部: 描画ループ
    // ---------------------------------------------------------------------

    _loop() {
        if (!this._running) return;
        // Canvas が DOM から切り離されたら（タブ切替等）自動停止してリークを防ぐ
        if (this.canvas && this.canvas.isConnected === false) {
            this.stop();
            return;
        }
        this._raf = requestAnimationFrame(() => this._loop());
        this._syncSize();
        this._draw();
    }

    /**
     * 表示要素サイズが変わっていたら Canvas 解像度を再計算する
     * （x-show による表示/非表示の切替やレイアウト変更に追従）。
     */
    _syncSize() {
        const rect = this.canvas.getBoundingClientRect();
        const cw = Math.max(1, Math.floor(rect.width));
        const ch = Math.max(1, Math.floor(rect.height));
        if (cw * this._dpr !== this._w || ch * this._dpr !== this._h) {
            this._resize();
        }
    }

    /**
     * 周波数マグニチュード（0〜1）の配列を返す。
     * @returns {number[]}
     */
    _getMagnitudes() {
        const n = this._bars;
        const out = new Array(n);
        const playing = this._demoActive || (this.media && !this.media.paused && !this.media.ended);

        if (this._analyser) {
            this._analyser.getByteFrequencyData(this._freq);
            const bins = this._freq.length;
            // 低〜中域を重視して対数的に間引く
            for (let i = 0; i < n; i++) {
                const start = Math.floor(Math.pow(i / n, 1.6) * bins);
                const end = Math.max(start + 1, Math.floor(Math.pow((i + 1) / n, 1.6) * bins));
                let sum = 0;
                for (let j = start; j < end; j++) sum += this._freq[j];
                out[i] = (sum / (end - start)) / 255;
            }
            return out;
        }

        // 合成波形（クロスオリジン時 or Analyser 非対応時）
        const t = this._animationTime();
        const amp = playing ? 1 : 0.05;
        for (let i = 0; i < n; i++) {
            const base = Math.sin(t * 2.1 + i * 0.35) * 0.5 + 0.5;
            const fast = Math.sin(t * 6.0 + i * 0.8) * 0.5 + 0.5;
            const env = Math.pow(1 - i / n, 0.8); // 低域を大きく
            out[i] = Math.max(0.02, (base * 0.6 + fast * 0.4) * env * amp);
        }
        return out;
    }

    _getTimeDomain() {
        const n = this._bars * 2;
        const out = new Array(n);
        const playing = this._demoActive || (this.media && !this.media.paused && !this.media.ended);
        if (this._analyser) {
            this._analyser.getByteTimeDomainData(this._time);
            const len = this._time.length;
            for (let i = 0; i < n; i++) {
                const idx = Math.floor((i / n) * len);
                out[i] = (this._time[idx] - 128) / 128;
            }
            return out;
        }
        const t = this._animationTime();
        const amp = playing ? 0.7 : 0.06;
        for (let i = 0; i < n; i++) {
            out[i] = (Math.sin(t * 5 + i * 0.5) * 0.6 + Math.sin(t * 11 + i * 0.9) * 0.4) * amp;
        }
        return out;
    }

    _draw() {
        const { ctx } = this;
        const W = this._w;
        const H = this._h;
        ctx.clearRect(0, 0, W, H);

        // デモ/プレビュー時は下地色を敷く（本番プレイヤーは透過のまま映像/黒地を活かす）
        if (this._baseFill) {
            ctx.fillStyle = this._baseFill;
            ctx.fillRect(0, 0, W, H);
        }

        this._drawBackground(ctx, W, H);

        const colors = this._colors();
        const mags = this._getMagnitudes();

        this._drawType(ctx, W, H, mags, colors);

        // 新しいプレミアムデザインは各レイアウト内でタイトル・時間を配置する。
        // 共通オーバーレイを重ねると文字が二重になるため、従来タイプだけここで描画する。
        if (!this._usesIntegratedMetadata()) {
            this._drawOverlays(ctx, W, H, colors);
        }
    }

    /**
     * 実再生・静的プレビュー・ホバーデモで共有する描画ディスパッチ。
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} W
     * @param {number} H
     * @param {number[]} mags
     * @param {string[]} colors
     * @param {{preview?: boolean}} options
     */
    _drawType(ctx, W, H, mags, colors, options = {}) {
        const preview = !!options.preview;
        switch (this.config.type) {
            case 'mirror':             this._drawMirror(ctx, W, H, mags, colors); break;
            case 'wave':               preview ? this._drawPreviewWave(ctx, W, H, colors) : this._drawWave(ctx, W, H, colors); break;
            case 'radial':             this._drawRadial(ctx, W, H, mags, colors); break;
            case 'circle':             this._drawCircle(ctx, W, H, mags, colors); break;
            case 'particles':          preview ? this._drawPreviewParticles(ctx, W, H, mags, colors) : this._drawParticles(ctx, W, H, mags, colors); break;
            case 'bars-2':             this._drawBars2(ctx, W, H, mags, colors); break;
            case 'mirror-2':           this._drawMirror2(ctx, W, H, mags, colors); break;
            case 'wave-2':             this._drawWave2(ctx, W, H, colors); break;
            case 'radial-2':           this._drawRadial2(ctx, W, H, mags, colors); break;
            case 'circle-2':           this._drawCircle2(ctx, W, H, mags, colors); break;
            case 'particles-2':        this._drawParticles2(ctx, W, H, mags, colors); break;
            case 'horizon':            this._drawHorizon(ctx, W, H, mags, colors); break;
            case 'photo-ring':         this._drawPhotoRing(ctx, W, H, mags, colors); break;
            case 'photo-card':         this._drawPhotoCard(ctx, W, H, mags, colors); break;
            case 'ring-time':          this._drawRingTime(ctx, W, H, mags, colors); break;
            case 'kaleido':            this._drawKaleido(ctx, W, H, mags, colors); break;
            case 'lines':              this._drawLines(ctx, W, H, mags, colors); break;
            case 'neon-triangle':      this._drawNeonTriangle(ctx, W, H, mags, colors); break;
            case 'prism-tunnel':       this._drawPrismTunnel(ctx, W, H, mags, colors); break;
            case 'vinyl-deck':         this._drawVinylDeck(ctx, W, H, mags, colors); break;
            case 'spectrum-frame':     this._drawSpectrumFrame(ctx, W, H, mags, colors); break;
            case 'aurora-ribbon':      this._drawAuroraRibbon(ctx, W, H, mags, colors); break;
            case 'equalizer-city':     this._drawEqualizerCity(ctx, W, H, mags, colors); break;
            case 'portrait-stage':     this._drawPortraitStage(ctx, W, H, mags, colors); break;
            case 'glass-player':       this._drawGlassPlayer(ctx, W, H, mags, colors); break;
            case 'starburst':          this._drawStarburst(ctx, W, H, mags, colors); break;
            case 'pulse-grid':         this._drawPulseGrid(ctx, W, H, mags, colors); break;
            case 'orbit-typography':   this._drawOrbitTypography(ctx, W, H, mags, colors); break;
            case 'waveform-studio':    this._drawWaveformStudio(ctx, W, H, mags, colors); break;
            case 'bars':
            default:                   this._drawBars(ctx, W, H, mags, colors); break;
        }
    }

    /** 新デザイン群はそれぞれ専用位置へメタデータを描画する。 */
    _usesIntegratedMetadata(type = this.config.type) {
        return [
            'neon-triangle', 'prism-tunnel', 'vinyl-deck', 'spectrum-frame',
            'aurora-ribbon', 'equalizer-city', 'portrait-stage', 'glass-player',
            'starburst', 'pulse-grid', 'orbit-typography', 'waveform-studio',
        ].includes(type);
    }

    // ---------------------------------------------------------------------
    // 背景
    // ---------------------------------------------------------------------

    _drawBackground(ctx, W, H) {
        // 背景画像（CSS opacity 相当）
        if (this._bgImg && this._bgImg.complete && this._bgImg.naturalWidth > 0) {
            const op = this._opacity('bgPhotoOpacity', 100);
            ctx.save();
            ctx.globalAlpha = op;
            this._drawCover(ctx, this._bgImg, W, H);
            ctx.restore();
        }
        // 背景色オーバーレイ（bgColor は 'none' または HEX 直値。濃さは rgba アルファで表現）
        const bg = this.config.bgColor;
        if (bg && bg !== 'none' && this._hexToRgb(bg)) {
            ctx.save();
            ctx.fillStyle = this._rgba(bg, this._opacity('bgColorOpacity', 60));
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
        }
    }

    _drawCover(ctx, img, W, H) {
        const ir = img.naturalWidth / img.naturalHeight;
        const cr = W / H;
        let dw = W, dh = H, dx = 0, dy = 0;
        if (ir > cr) {
            dh = H; dw = H * ir; dx = (W - dw) / 2;
        } else {
            dw = W; dh = W / ir; dy = (H - dh) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    // ---------------------------------------------------------------------
    // 各描画タイプ
    // ---------------------------------------------------------------------

    _drawBars(ctx, W, H, mags, colors) {
        const n = mags.length;
        const gap = Math.max(1, W / n * 0.28);
        const bw = (W / n) - gap;
        const grad = this._vGradient(ctx, H, colors);
        ctx.fillStyle = grad;
        for (let i = 0; i < n; i++) {
            const h = Math.max(2, mags[i] * H * 0.92);
            const x = i * (W / n) + gap / 2;
            this._roundRectPath(ctx, x, H - h, bw, h, Math.min(bw / 2, 4));
        }
        ctx.fill();
    }

    _drawMirror(ctx, W, H, mags, colors) {
        const n = mags.length;
        const gap = Math.max(1, W / n * 0.28);
        const bw = (W / n) - gap;
        const mid = H / 2;
        ctx.fillStyle = this._vGradient(ctx, H, colors);
        for (let i = 0; i < n; i++) {
            const h = Math.max(1, mags[i] * (H / 2) * 0.9);
            const x = i * (W / n) + gap / 2;
            this._roundRectPath(ctx, x, mid - h, bw, h * 2, Math.min(bw / 2, 4));
        }
        ctx.fill();
    }

    _drawWave(ctx, W, H, colors) {
        const data = this._getTimeDomain();
        const n = data.length;
        const mid = H / 2;
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.lineWidth = Math.max(2, H * 0.012);
        ctx.strokeStyle = grad;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = colors[colors.length - 1];
        ctx.shadowBlur = H * 0.03;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * W;
            const y = mid + data[i] * (H * 0.42);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    _drawRadial(ctx, W, H, mags, colors) {
        const n = mags.length;
        const cx = W / 2;
        const cy = H / 2;
        const r0 = Math.min(W, H) * 0.16;
        const maxLen = Math.min(W, H) * 0.32;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2, (2 * Math.PI * r0) / n * 0.6);
        for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const len = r0 + Math.max(2, mags[i] * maxLen);
            const cos = Math.cos(ang);
            const sin = Math.sin(ang);
            ctx.beginPath();
            ctx.moveTo(cx + cos * r0, cy + sin * r0);
            ctx.lineTo(cx + cos * len, cy + sin * len);
            ctx.stroke();
        }
    }

    _drawCircle(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        const level = mags.reduce((a, b) => a + b, 0) / mags.length;
        const base = Math.min(W, H) * 0.18;
        const amp = Math.min(W, H) * 0.14;

        // 中央グロー
        const glowR = base + level * amp * 2;
        const rg = ctx.createRadialGradient(cx, cy, glowR * 0.2, cx, cy, glowR);
        rg.addColorStop(0, this._rgba(colors[0], 0.85));
        rg.addColorStop(1, this._rgba(colors[colors.length - 1], 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 音に反応するブロブ輪郭
        const n = mags.length;
        const grad = ctx.createLinearGradient(cx - base, cy - base, cx + base, cy + base);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.008);
        ctx.beginPath();
        const total = n;
        for (let i = 0; i <= total; i++) {
            const idx = i % n;
            const ang = (i / total) * Math.PI * 2 - Math.PI / 2;
            const r = base + mags[idx] * amp;
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    _drawParticles(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        const bass = (mags[0] + mags[1] + mags[2] + mags[3]) / 4;
        const playing = this._demoActive || (this.media && !this.media.paused && !this.media.ended);

        // 放出
        const emit = playing ? Math.round(bass * 6) : 0;
        for (let i = 0; i < emit && this._particles.length < 260; i++) {
            const ang = Math.random() * Math.PI * 2;
            const speed = (1 + bass * 3) * (0.6 + Math.random());
            this._particles.push({
                x: cx, y: cy,
                vx: Math.cos(ang) * speed,
                vy: Math.sin(ang) * speed,
                life: 1,
                size: 1 + Math.random() * 2.5 + bass * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        // 更新＆描画
        const next = [];
        for (const p of this._particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.985;
            p.vy *= 0.985;
            p.life -= 0.016;
            if (p.life <= 0) continue;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (this._dpr), 0, Math.PI * 2);
            ctx.fill();
            next.push(p);
        }
        ctx.globalAlpha = 1;
        this._particles = next;

        // 中央コア
        const coreR = Math.min(W, H) * (0.03 + bass * 0.05);
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
        rg.addColorStop(0, this._rgba(colors[0], 0.9));
        rg.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * セグメントが積み上がるネオンイコライザー。
     * 従来の bars より本数を絞り、音量を発光ブロックの段数で表現する。
     */
    _drawBars2(ctx, W, H, mags, colors) {
        const count = Math.min(24, mags.length);
        const stride = W / count;
        const barW = stride * 0.66;
        const segmentH = Math.max(2, H * 0.035);
        const segmentGap = Math.max(1, H * 0.012);
        const baseline = H * 0.92;
        const usableH = H * 0.8;
        const maxSegments = Math.max(1, Math.floor(usableH / (segmentH + segmentGap)));

        ctx.save();
        ctx.shadowBlur = Math.max(3, H * 0.025);
        for (let i = 0; i < count; i++) {
            const sourceIndex = Math.min(mags.length - 1, Math.floor((i / count) * mags.length));
            const level = Math.max(0.04, mags[sourceIndex]);
            const segments = Math.max(1, Math.round(level * maxSegments));
            const x = i * stride + (stride - barW) / 2;

            for (let s = 0; s < segments; s++) {
                const color = colors[(i + s) % colors.length];
                const y = baseline - (s + 1) * (segmentH + segmentGap);
                ctx.fillStyle = this._rgba(color, 0.72 + (s / Math.max(1, segments - 1)) * 0.28);
                ctx.shadowColor = color;
                ctx.beginPath();
                this._roundRectPath(ctx, x, y, barW, segmentH, segmentH / 2);
                ctx.fill();
            }
        }
        ctx.restore();

        const horizon = ctx.createLinearGradient(0, 0, W, 0);
        horizon.addColorStop(0, this._rgba(colors[0], 0));
        horizon.addColorStop(0.5, this._rgba(colors[colors.length - 1], 0.5));
        horizon.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = horizon;
        ctx.fillRect(0, baseline + segmentGap, W, Math.max(1, H * 0.006));
    }

    /**
     * 中央の縦軸から左右へ伸びる水平ミラーバー。
     */
    _drawMirror2(ctx, W, H, mags, colors) {
        const rows = Math.min(28, mags.length);
        const rowStride = H / rows;
        const rowH = Math.max(2, rowStride * 0.58);
        const center = W / 2;
        const centerGap = Math.max(3, W * 0.008);
        const maxLength = W * 0.44;
        const gradient = ctx.createLinearGradient(0, 0, W, 0);
        colors.forEach((color, index) => {
            gradient.addColorStop(colors.length === 1 ? 0 : index / (colors.length - 1), color);
        });

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.shadowColor = colors[Math.floor(colors.length / 2)];
        ctx.shadowBlur = Math.max(2, H * 0.018);
        for (let i = 0; i < rows; i++) {
            const sourceIndex = Math.min(mags.length - 1, Math.floor((i / rows) * mags.length));
            const length = Math.max(2, mags[sourceIndex] * maxLength);
            const y = i * rowStride + (rowStride - rowH) / 2;

            ctx.beginPath();
            this._roundRectPath(ctx, center - centerGap - length, y, length, rowH, rowH / 2);
            this._roundRectPath(ctx, center + centerGap, y, length, rowH, rowH / 2);
            ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = this._rgba(colors[0], 0.72);
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = Math.max(4, H * 0.04);
        ctx.fillRect(center - Math.max(1, W * 0.002), H * 0.08, Math.max(2, W * 0.004), H * 0.84);
        ctx.restore();
    }

    /**
     * 3層の半透明リボンが重なって流れる波形。
     */
    _drawWave2(ctx, W, H, colors) {
        const data = this._getTimeDomain();
        const phase = this._animationTime();
        const mid = H / 2;
        const gradient = ctx.createLinearGradient(0, 0, W, 0);
        colors.forEach((color, index) => {
            gradient.addColorStop(colors.length === 1 ? 0 : index / (colors.length - 1), color);
        });

        ctx.save();
        for (let layer = 2; layer >= 0; layer--) {
            const amplitude = H * (0.15 + layer * 0.055);
            const thickness = H * (0.012 + layer * 0.01);
            const opacity = 0.42 + (2 - layer) * 0.18;
            ctx.globalAlpha = opacity;
            ctx.fillStyle = gradient;
            ctx.beginPath();

            for (let i = 0; i < data.length; i++) {
                const x = (i / (data.length - 1)) * W;
                const drift = Math.sin(phase * (0.65 + layer * 0.12) + i * 0.075 + layer) * H * 0.025;
                const half = Math.abs(data[i]) * amplitude + thickness;
                const y = mid + drift - half;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            for (let i = data.length - 1; i >= 0; i--) {
                const x = (i / (data.length - 1)) * W;
                const drift = Math.sin(phase * (0.65 + layer * 0.12) + i * 0.075 + layer) * H * 0.025;
                const half = Math.abs(data[i]) * amplitude + thickness;
                ctx.lineTo(x, mid + drift + half);
            }
            ctx.closePath();
            ctx.shadowColor = colors[layer % colors.length];
            ctx.shadowBlur = Math.max(3, H * 0.04);
            ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(1, H * 0.006);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1)) * W;
            const y = mid + data[i] * H * 0.2;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    /**
     * 2つの軌道が逆回転するオービット型ラジアル。
     */
    _drawRadial2(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        const size = Math.min(W, H);
        const phase = this._animationTime() * 0.42;
        const count = Math.min(48, mags.length);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowBlur = Math.max(2, size * 0.018);

        for (let orbit = 0; orbit < 2; orbit++) {
            const direction = orbit === 0 ? 1 : -1;
            const baseRadius = size * (0.18 + orbit * 0.105);
            for (let i = 0; i < count; i++) {
                const sourceIndex = Math.min(mags.length - 1, Math.floor((i / count) * mags.length));
                const level = Math.max(0.03, mags[sourceIndex]);
                const angle = direction * ((i / count) * Math.PI * 2 + phase * (1 + orbit * 0.32));
                const radius = baseRadius + level * size * 0.105;
                const arcLength = 0.035 + level * 0.13;
                const color = colors[(i + orbit * 2) % colors.length];
                ctx.strokeStyle = this._rgba(color, 0.78 + level * 0.22);
                ctx.shadowColor = color;
                ctx.lineWidth = Math.max(1.5, size * (0.005 + level * 0.008));
                ctx.beginPath();
                ctx.arc(cx, cy, radius, angle, angle + direction * arcLength * Math.PI * 2, direction < 0);
                ctx.stroke();
            }
        }
        ctx.restore();

        const level = mags.reduce((sum, value) => sum + value, 0) / mags.length;
        const coreRadius = size * (0.045 + level * 0.04);
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 3);
        core.addColorStop(0, this._rgba(colors[0], 0.95));
        core.addColorStop(0.35, this._rgba(colors[colors.length - 1], 0.45));
        core.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius * 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 周波数帯ごとに脈動する多重リングと周回ドット。
     */
    _drawCircle2(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        const size = Math.min(W, H);
        const phase = this._animationTime();
        const ringCount = 5;

        ctx.save();
        ctx.lineCap = 'round';
        for (let ring = 0; ring < ringCount; ring++) {
            const from = Math.floor((ring / ringCount) * mags.length);
            const to = Math.max(from + 1, Math.floor(((ring + 1) / ringCount) * mags.length));
            let band = 0;
            for (let i = from; i < to; i++) band += mags[i] || 0;
            band /= Math.max(1, to - from);

            const radius = size * (0.09 + ring * 0.065 + band * 0.025);
            const color = colors[ring % colors.length];
            const dash = Math.max(3, size * (0.018 + ring * 0.003));
            ctx.strokeStyle = this._rgba(color, 0.74 + band * 0.26);
            ctx.lineWidth = Math.max(1.5, size * (0.004 + band * 0.007));
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(2, size * 0.014);
            ctx.setLineDash([dash, dash * (0.45 + ring * 0.08)]);
            ctx.lineDashOffset = (ring % 2 === 0 ? -1 : 1) * phase * size * (0.035 + ring * 0.006);
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            const dotAngle = phase * (0.65 + ring * 0.12) * (ring % 2 === 0 ? 1 : -1) + ring;
            const dotX = cx + Math.cos(dotAngle) * radius;
            const dotY = cy + Math.sin(dotAngle) * radius;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(dotX, dotY, Math.max(2, size * (0.008 + band * 0.007)), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.setLineDash([]);
        ctx.restore();

        const average = mags.reduce((sum, value) => sum + value, 0) / mags.length;
        const glowRadius = size * (0.09 + average * 0.08);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        glow.addColorStop(0, this._rgba(colors[colors.length - 1], 0.72));
        glow.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 浮遊する光点を音量に応じて結ぶコンステレーション。
     */
    _drawParticles2(ctx, W, H, mags, colors) {
        const count = 32;
        const phase = this._animationTime();
        const size = Math.min(W, H);
        const points = [];

        for (let i = 0; i < count; i++) {
            const fx = (i * 0.61803398875) % 1;
            const fy = (i * 0.38196601125 + 0.19) % 1;
            const level = Math.max(0.04, mags[Math.floor((i / count) * mags.length)] || 0);
            points.push({
                x: W * (0.08 + fx * 0.84) + Math.sin(phase * (0.32 + (i % 5) * 0.025) + i) * W * 0.025,
                y: H * (0.09 + fy * 0.82) + Math.cos(phase * (0.28 + (i % 7) * 0.02) + i * 0.73) * H * 0.035,
                level,
                color: colors[i % colors.length],
            });
        }

        const linkDistance = size * 0.25;
        ctx.save();
        ctx.lineWidth = Math.max(0.75, size * 0.0025);
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dx = points[i].x - points[j].x;
                const dy = points[i].y - points[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance >= linkDistance) continue;
                const energy = (points[i].level + points[j].level) / 2;
                ctx.strokeStyle = this._rgba(points[i].color, (1 - distance / linkDistance) * (0.28 + energy * 0.52));
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }

        for (const point of points) {
            const radius = Math.max(1.5, size * (0.005 + point.level * 0.012));
            ctx.shadowColor = point.color;
            ctx.shadowBlur = radius * 3;
            ctx.fillStyle = this._rgba(point.color, 0.78 + point.level * 0.22);
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // ---------------------------------------------------------------------
    // 新デザイン群（シネマティック / フォト / タイム / パターン）
    // ---------------------------------------------------------------------

    /**
     * ホライゾン：中央を横切る光の帯とレンズフレア。音量で輝きが脈動する。
     */
    _drawHorizon(ctx, W, H, mags, colors) {
        const level = mags.reduce((a, b) => a + b, 0) / mags.length;
        const midY = H * 0.52;
        const cx = W / 2;
        const c0 = colors[0];
        const cMid = colors[Math.floor(colors.length / 2)];
        const cEnd = colors[colors.length - 1];

        // 横方向の光の帯（ソフトグロー）：中央が明るく端で消える
        ctx.save();
        ctx.translate(cx, midY);
        ctx.scale(1, 0.16 + level * 0.1);
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.55);
        halo.addColorStop(0, this._rgba(cMid, 0.5 + level * 0.4));
        halo.addColorStop(0.4, this._rgba(c0, 0.22 + level * 0.2));
        halo.addColorStop(1, this._rgba(c0, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, W * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // コアの光線（水平グラデーションライン）
        const line = ctx.createLinearGradient(0, 0, W, 0);
        line.addColorStop(0, this._rgba(c0, 0));
        line.addColorStop(0.2, this._rgba(c0, 0.75));
        line.addColorStop(0.5, this._rgba('#ffffff', 0.9));
        line.addColorStop(0.8, this._rgba(cEnd, 0.75));
        line.addColorStop(1, this._rgba(cEnd, 0));
        ctx.save();
        ctx.fillStyle = line;
        ctx.shadowColor = cMid;
        ctx.shadowBlur = Math.max(4, H * (0.03 + level * 0.05));
        ctx.fillRect(0, midY - Math.max(1, H * 0.0035), W, Math.max(2, H * 0.007));
        ctx.restore();

        // 細い波形の糸（帯の上下をゆるやかに横断する）
        const data = this._getTimeDomain();
        ctx.save();
        ctx.lineWidth = Math.max(1, H * 0.0035);
        ctx.strokeStyle = this._rgba(cEnd, 0.6);
        ctx.shadowColor = cEnd;
        ctx.shadowBlur = Math.max(2, H * 0.015);
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
            const x = (i / (data.length - 1)) * W;
            const envelope = Math.sin((i / (data.length - 1)) * Math.PI);
            const y = midY + data[i] * H * 0.16 * envelope + Math.sin(i * 0.22 + this._animationTime()) * H * 0.02 * envelope;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // 中央のフレアコア
        const coreR = H * (0.02 + level * 0.05);
        const core = ctx.createRadialGradient(cx, midY, 0, cx, midY, coreR * 4);
        core.addColorStop(0, this._rgba('#ffffff', 0.95));
        core.addColorStop(0.3, this._rgba(cMid, 0.55));
        core.addColorStop(1, this._rgba(cMid, 0));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, midY, coreR * 4, 0, Math.PI * 2);
        ctx.fill();

        // ビネット（四隅を締めてシネマティックに）
        const vg = ctx.createRadialGradient(cx, H / 2, Math.min(W, H) * 0.45, cx, H / 2, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
    }

    /**
     * フォトリング：中央画像（丸/四角トリミング）の周囲に放射状バーが反応する。
     */
    _drawPhotoRing(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        const size = Math.min(W, H);
        const level = mags.reduce((a, b) => a + b, 0) / mags.length;
        const photoR = size * 0.185 + level * size * 0.012;
        const r0 = photoR + size * 0.045;
        const maxLen = size * 0.16;
        const n = Math.min(72, mags.length * 2);

        // 放射状バー
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        colors.forEach((c, i) => grad.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c));
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(2, (2 * Math.PI * r0) / n * 0.55);
        for (let i = 0; i < n; i++) {
            const mag = mags[Math.floor((i / n) * mags.length)] || 0;
            const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
            const len = r0 + Math.max(2, mag * maxLen);
            const cos = Math.cos(ang);
            const sin = Math.sin(ang);
            ctx.beginPath();
            ctx.moveTo(cx + cos * r0, cy + sin * r0);
            ctx.lineTo(cx + cos * len, cy + sin * len);
            ctx.stroke();
        }
        ctx.restore();

        // ドット状のアクセントリング（回転）
        ctx.save();
        ctx.strokeStyle = this._rgba(colors[0], 0.85);
        ctx.lineWidth = Math.max(1.5, size * 0.006);
        const dash = Math.max(2, size * 0.012);
        ctx.setLineDash([dash, dash * 1.4]);
        ctx.lineDashOffset = -this._animationTime() * size * 0.05;
        ctx.beginPath();
        ctx.arc(cx, cy, photoR + size * 0.022, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 中央画像（丸 / 四角）
        this._drawCenterPhoto(ctx, cx, cy, photoR, colors);
    }

    /**
     * フォトカード：中央上に画像、下部に光沢のある波形マウンド＋リフレクション。
     */
    _drawPhotoCard(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W / 2;
        const photoCy = H * 0.40;
        const photoR = size * 0.17;
        const level = mags.reduce((a, b) => a + b, 0) / mags.length;
        const cEnd = colors[colors.length - 1];

        // 上部のティック列（目盛り風）
        const tickN = 48;
        ctx.save();
        ctx.strokeStyle = this._rgba('#ffffff', 0.55);
        ctx.lineWidth = Math.max(1, size * 0.004);
        ctx.lineCap = 'round';
        for (let i = 0; i < tickN; i++) {
            const mag = mags[Math.floor((i / tickN) * mags.length)] || 0;
            const x = (i / (tickN - 1)) * W * 0.9 + W * 0.05;
            const th = H * (0.012 + mag * 0.05);
            ctx.beginPath();
            ctx.moveTo(x, H * 0.09);
            ctx.lineTo(x, H * 0.09 + th);
            ctx.stroke();
        }
        ctx.restore();

        // 台座の楕円リング（脈動）
        ctx.save();
        ctx.strokeStyle = this._rgba('#ffffff', 0.75);
        ctx.lineWidth = Math.max(1.5, size * 0.006);
        ctx.shadowColor = cEnd;
        ctx.shadowBlur = Math.max(3, size * 0.02);
        ctx.beginPath();
        ctx.ellipse(cx, photoCy + photoR * 1.18, photoR * (1.15 + level * 0.18), photoR * 0.24, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 下部の光沢ウェーブマウンド＋リフレクション
        const baseline = H * 0.84;
        const mound = (alpha, scale) => {
            ctx.beginPath();
            ctx.moveTo(0, baseline);
            const n = 60;
            for (let i = 0; i <= n; i++) {
                const x = (i / n) * W;
                const mag = mags[Math.floor((i / n) * (mags.length - 1))] || 0;
                const y = baseline - Math.pow(mag, 1.2) * H * 0.22 * scale;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, baseline);
            ctx.closePath();
            const g = ctx.createLinearGradient(0, baseline - H * 0.22, 0, baseline);
            g.addColorStop(0, this._rgba('#ffffff', alpha));
            g.addColorStop(1, this._rgba('#ffffff', alpha * 0.55));
            ctx.fillStyle = g;
            ctx.fill();
        };
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = Math.max(3, size * 0.02);
        mound(0.9, 1);
        ctx.shadowBlur = 0;
        // リフレクション（上下反転・低アルファ）
        ctx.save();
        ctx.translate(0, baseline * 2);
        ctx.scale(1, -1);
        mound(0.16, 0.85);
        ctx.restore();
        // 床のライン
        ctx.strokeStyle = this._rgba('#ffffff', 0.5);
        ctx.lineWidth = Math.max(1, size * 0.003);
        ctx.beginPath();
        ctx.moveTo(0, baseline);
        ctx.lineTo(W, baseline);
        ctx.stroke();
        ctx.restore();

        // 中央画像
        this._drawCenterPhoto(ctx, cx, photoCy, photoR, colors);
    }

    /**
     * リングタイム：セグメント発光リングの中央に再生時間を表示する。
     */
    _drawRingTime(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        const size = Math.min(W, H);
        const rBase = size * 0.225;
        const phase = this._animationTime() * 0.35;
        const segs = 40;

        // 外周の淡いガイドリング
        ctx.save();
        ctx.strokeStyle = this._rgba(colors[0], 0.25);
        ctx.lineWidth = Math.max(1, size * 0.004);
        ctx.beginPath();
        ctx.arc(cx, cy, rBase + size * 0.075, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // セグメントリング（帯域ごとに半径・輝度が反応、全体はゆっくり回転）
        ctx.save();
        ctx.lineCap = 'butt';
        for (let i = 0; i < segs; i++) {
            const mag = mags[Math.floor((i / segs) * mags.length)] || 0;
            const ang = (i / segs) * Math.PI * 2 + phase;
            const arc = (Math.PI * 2 / segs) * 0.62;
            const r = rBase + mag * size * 0.05;
            const color = colors[i % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.35 + mag * 0.65);
            ctx.lineWidth = Math.max(3, size * (0.018 + mag * 0.02));
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(3, size * 0.022);
            ctx.beginPath();
            ctx.arc(cx, cy, r, ang, ang + arc);
            ctx.stroke();
        }
        ctx.restore();

        // 中央の再生時間
        const timeText = this._formatTime(this._currentTimeSeconds());
        ctx.save();
        ctx.fillStyle = this._rgba('#ffffff', 0.95);
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = Math.max(2, size * 0.02);
        ctx.font = \`700 \${Math.round(size * 0.085)}px 'Helvetica Neue', Arial, sans-serif\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(timeText, cx, cy);
        ctx.restore();
    }

    /**
     * カレイド：同心円と菱形が敷き詰められた幾何学パターンが音に脈動する。
     */
    _drawKaleido(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cell = size * 0.46;
        const level = mags.reduce((a, b) => a + b, 0) / mags.length;
        const phase = this._animationTime();
        const cols = Math.ceil(W / cell) + 1;
        const rows = Math.ceil(H / cell) + 1;
        const ringN = 4;

        ctx.save();
        ctx.lineCap = 'round';
        for (let gy = 0; gy < rows; gy++) {
            for (let gx = 0; gx < cols; gx++) {
                const cx = gx * cell;
                const cy = gy * cell;
                // 同心円（帯域ごとに半径が脈動）
                for (let ring = 0; ring < ringN; ring++) {
                    const from = Math.floor((ring / ringN) * mags.length);
                    const to = Math.max(from + 1, Math.floor(((ring + 1) / ringN) * mags.length));
                    let band = 0;
                    for (let i = from; i < to; i++) band += mags[i] || 0;
                    band /= Math.max(1, to - from);

                    const r = cell * (0.10 + ring * 0.095) * (1 + band * 0.14);
                    const color = colors[(ring + gx + gy) % colors.length];
                    ctx.strokeStyle = this._rgba(color, 0.65 + band * 0.35);
                    ctx.lineWidth = Math.max(1.5, cell * (0.022 + band * 0.012));
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
                // セル中間の菱形（低域で膨らむ）
                const dx = cx + cell / 2;
                const dy = cy + cell / 2;
                const bass = (mags[0] + (mags[1] || 0)) / 2;
                const d = cell * (0.12 + bass * 0.05) * (1 + Math.sin(phase * 1.4 + gx + gy) * 0.06);
                const dColor = colors[(gx + gy + 1) % colors.length];
                ctx.strokeStyle = this._rgba(dColor, 0.7 + bass * 0.3);
                ctx.lineWidth = Math.max(1.5, cell * 0.02);
                ctx.beginPath();
                ctx.moveTo(dx, dy - d);
                ctx.lineTo(dx + d * 0.62, dy);
                ctx.lineTo(dx, dy + d);
                ctx.lineTo(dx - d * 0.62, dy);
                ctx.closePath();
                ctx.stroke();
                // 菱形の芯
                ctx.fillStyle = this._rgba(dColor, 0.5 + level * 0.4);
                ctx.beginPath();
                ctx.arc(dx, dy, Math.max(1.5, cell * 0.02 + bass * cell * 0.015), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    /**
     * ラインズ：細い水平スキャンラインが局所的にバーストするレトロ調の波形。
     */
    _drawLines(ctx, W, H, mags, colors) {
        const rows = [0.30, 0.50, 0.70];
        const phase = this._animationTime();
        const samples = 160;

        ctx.save();
        ctx.lineJoin = 'round';
        rows.forEach((ry, rowIndex) => {
            const y0 = H * ry;
            const color = colors[Math.floor((rowIndex / rows.length) * colors.length)] || colors[0];
            // 帯域を行ごとに分担（上=高域 / 中=中域 / 下=低域）
            const from = Math.floor(((rows.length - 1 - rowIndex) / rows.length) * mags.length);
            const to = Math.max(from + 1, Math.floor(((rows.length - rowIndex) / rows.length) * mags.length));
            let band = 0;
            for (let i = from; i < to; i++) band += mags[i] || 0;
            band /= Math.max(1, to - from);

            // バースト中心（時間でゆっくり流れる）
            const centers = [
                ((phase * 0.05 + rowIndex * 0.37) % 1),
                ((phase * 0.033 + rowIndex * 0.61 + 0.45) % 1),
            ];

            ctx.strokeStyle = this._rgba(color, 0.85);
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(1.5, H * 0.008);
            ctx.lineWidth = Math.max(1, H * 0.004);
            ctx.beginPath();
            for (let i = 0; i <= samples; i++) {
                const t = i / samples;
                const x = t * W;
                // ガウス状のバースト包絡線
                let envelope = 0.035;
                for (const c of centers) {
                    const dist = Math.min(Math.abs(t - c), 1 - Math.abs(t - c));
                    envelope += Math.exp(-Math.pow(dist / 0.055, 2)) * (0.4 + band * 1.4);
                }
                const wave = Math.sin(t * 110 + phase * 9 + rowIndex * 2)
                    + Math.sin(t * 47 + phase * 5.2) * 0.6;
                const y = y0 + wave * H * 0.016 * envelope;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        });
        ctx.restore();
    }

    // ---------------------------------------------------------------------
    // プレミアムデザイン群（幾何学 / フォト / タイポグラフィ / スタジオ）
    // ---------------------------------------------------------------------

    /** 三角形の三辺から外側へ伸びるネオンスペクトラム。 */
    _drawNeonTriangle(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W / 2;
        const cy = H * 0.51;
        const phase = this._animationTime();
        const points = [
            { x: cx, y: cy - size * 0.34 },
            { x: cx + size * 0.34, y: cy + size * 0.28 },
            { x: cx - size * 0.34, y: cy + size * 0.28 },
        ];
        const grad = this._themeGradient(ctx, cx - size * 0.35, cy, cx + size * 0.35, cy, colors);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(1.5, size * 0.008);
        ctx.shadowColor = colors[colors.length - 1];
        ctx.shadowBlur = Math.max(4, size * 0.035);
        ctx.beginPath();
        points.forEach((p, index) => index === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.stroke();

        const count = Math.min(72, Math.max(36, mags.length));
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(1.2, size * 0.0045);
        for (let i = 0; i < count; i++) {
            const sample = this._polygonSample(points, i / count, cx, cy);
            const mag = mags[Math.floor((i / count) * mags.length)] || 0;
            const pulse = 0.82 + Math.sin(phase * 2.2 + i * 0.37) * 0.18;
            const length = size * (0.012 + mag * 0.115 * pulse);
            const color = colors[i % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.55 + mag * 0.45);
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.moveTo(sample.x, sample.y);
            ctx.lineTo(sample.x + sample.nx * length, sample.y + sample.ny * length);
            ctx.stroke();
        }

        ctx.globalAlpha = 0.42;
        ctx.lineWidth = Math.max(1, size * 0.003);
        ctx.setLineDash([size * 0.016, size * 0.022]);
        ctx.lineDashOffset = -phase * size * 0.04;
        ctx.beginPath();
        points.forEach((p, index) => {
            const x = cx + (p.x - cx) * 0.72;
            const y = cy + (p.y - cy) * 0.72;
            index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: cx, y: cy - size * 0.005, align: 'center', maxWidth: size * 0.46,
            titleSize: size * 0.062, timeSize: size * 0.038, uppercase: true,
        });
    }

    /** 奥へ吸い込まれる多角形のプリズムトンネル。 */
    _drawPrismTunnel(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W / 2;
        const cy = H / 2;
        const isSquare = W / H < 1.2;
        const spread = isSquare ? 0.82 : 1;
        const offsetScale = isSquare ? 0.58 : 1;
        const phase = this._animationTime();
        const level = this._averageLevel(mags);
        const sides = 6;
        const layers = 9;

        ctx.save();
        ctx.lineJoin = 'round';
        for (let layer = layers - 1; layer >= 0; layer--) {
            const depth = layer / (layers - 1);
            const radius = size * (0.075 + depth * 0.47) * spread * (1 + level * 0.035);
            const offsetX = Math.sin(phase * 0.38 + layer * 0.46) * size * 0.025 * depth * offsetScale;
            const offsetY = Math.cos(phase * 0.31 + layer * 0.39) * size * 0.018 * depth * offsetScale;
            const rotation = phase * (0.055 + depth * 0.025) + layer * 0.075;
            const color = colors[layer % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.28 + (1 - depth) * 0.62 + level * 0.1);
            ctx.lineWidth = Math.max(1, size * (0.003 + (1 - depth) * 0.006));
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(2, size * (0.008 + (1 - depth) * 0.018));
            ctx.beginPath();
            for (let side = 0; side <= sides; side++) {
                const angle = rotation + (side / sides) * Math.PI * 2 - Math.PI / 2;
                const band = mags[Math.floor((side / sides) * (mags.length - 1))] || 0;
                const r = radius * (1 + band * 0.045);
                const x = cx + offsetX + Math.cos(angle) * r;
                const y = cy + offsetY + Math.sin(angle) * r * 0.72;
                side === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 外周から消失点へ伸びる奥行き線。
        ctx.globalAlpha = 0.28 + level * 0.18;
        ctx.lineWidth = Math.max(1, size * 0.0025);
        for (let side = 0; side < sides; side++) {
            const angle = phase * 0.055 + (side / sides) * Math.PI * 2 - Math.PI / 2;
            ctx.strokeStyle = colors[side % colors.length];
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * size * (isSquare ? 0.45 : 0.53), cy + Math.sin(angle) * size * 0.38);
            ctx.lineTo(cx, cy);
            ctx.stroke();
        }
        ctx.restore();

        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.18);
        core.addColorStop(0, this._rgba('#020617', 0.72));
        core.addColorStop(0.55, this._rgba(colors[0], 0.12 + level * 0.12));
        core.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.18, 0, Math.PI * 2);
        ctx.fill();

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: cx, y: cy - size * 0.018, align: 'center', maxWidth: size * 0.43,
            titleSize: size * 0.058, timeSize: size * 0.036, uppercase: true,
        });
    }

    /** 左にレコード、右に3本の波形レーンを置くデッキデザイン。 */
    _drawVinylDeck(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W * 0.27;
        const cy = H * 0.55;
        const radius = size * 0.23;
        const phase = this._animationTime();
        const bass = this._bandLevel(mags, 0, 0.16);
        const data = this._getTimeDomain();

        ctx.save();
        // レコード本体と溝。
        const disc = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, radius * 0.04, cx, cy, radius);
        disc.addColorStop(0, this._rgba(colors[0], 0.38));
        disc.addColorStop(0.22, 'rgba(15,23,42,0.94)');
        disc.addColorStop(0.72, 'rgba(2,6,23,0.98)');
        disc.addColorStop(1, this._rgba(colors[colors.length - 1], 0.58));
        ctx.fillStyle = disc;
        ctx.shadowColor = colors[0];
        ctx.shadowBlur = Math.max(3, size * 0.025);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        for (let groove = 1; groove <= 8; groove++) {
            ctx.strokeStyle = this._rgba(groove % 2 ? colors[0] : '#ffffff', 0.08 + groove * 0.012);
            ctx.lineWidth = Math.max(0.7, size * 0.0018);
            ctx.beginPath();
            ctx.arc(cx, cy, radius * (0.24 + groove * 0.085), phase * 0.18 + groove, phase * 0.18 + groove + Math.PI * 1.55);
            ctx.stroke();
        }

        // 音に反応する外周ティック。
        const ticks = 48;
        ctx.lineCap = 'round';
        for (let i = 0; i < ticks; i++) {
            const mag = mags[Math.floor((i / ticks) * mags.length)] || 0;
            const angle = (i / ticks) * Math.PI * 2 + phase * 0.08;
            const inner = radius * 1.04;
            const outer = inner + size * (0.012 + mag * 0.055);
            const color = colors[i % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.48 + mag * 0.5);
            ctx.lineWidth = Math.max(1, size * 0.004);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
            ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
            ctx.stroke();
        }

        ctx.fillStyle = colors[colors.length - 1];
        ctx.beginPath();
        ctx.arc(cx, cy, size * (0.032 + bass * 0.018), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.009, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const x0 = W * 0.52;
        const x1 = W * 0.94;
        [0.39, 0.56, 0.73].forEach((ratio, index) => {
            this._drawWaveTrack(ctx, data, x0, x1, H * ratio, H * (0.05 + index * 0.006), colors[index % colors.length], index * 17);
        });
        this._drawStudioTicks(ctx, x0, x1, H * 0.82, size * 0.018, colors[0], 24);

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: x0, y: H * 0.14, align: 'left', maxWidth: W * 0.41,
            titleSize: size * 0.06, timeSize: size * 0.035, uppercase: true,
        });
    }

    /** 中央写真を矩形スペクトラムで囲むフレームデザイン。 */
    _drawSpectrumFrame(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W / 2;
        const cy = H * 0.52;
        const frameW = Math.min(W * 0.64, size * 0.78);
        const frameH = Math.min(H * 0.62, size * 0.72);
        const x = cx - frameW / 2;
        const y = cy - frameH / 2;
        const phase = this._animationTime();

        ctx.save();
        const frameGradient = this._themeGradient(ctx, x, y, x + frameW, y + frameH, colors);
        ctx.strokeStyle = frameGradient;
        ctx.lineWidth = Math.max(1.5, size * 0.006);
        ctx.shadowColor = colors[colors.length - 1];
        ctx.shadowBlur = Math.max(3, size * 0.022);
        ctx.beginPath();
        this._roundRectPath(ctx, x, y, frameW, frameH, size * 0.025);
        ctx.stroke();

        const count = 72;
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(1, size * 0.0035);
        for (let i = 0; i < count; i++) {
            const sample = this._rectPerimeterSample(x, y, frameW, frameH, i / count);
            const mag = mags[Math.floor((i / count) * mags.length)] || 0;
            const length = size * (0.01 + mag * 0.085 * (0.9 + Math.sin(phase * 1.7 + i) * 0.1));
            const color = colors[i % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.55 + mag * 0.45);
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.moveTo(sample.x, sample.y);
            ctx.lineTo(sample.x + sample.nx * length, sample.y + sample.ny * length);
            ctx.stroke();
        }
        ctx.restore();

        this._drawCenterPhoto(ctx, cx, cy, size * 0.155, colors);
        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: cx, y: Math.max(H * 0.06, y - size * 0.105), align: 'center', maxWidth: W * 0.78,
            titleSize: size * 0.052, timeSize: size * 0.032, uppercase: true,
        });
    }

    /** 3層の半透明オーロラ光帯。 */
    _drawAuroraRibbon(ctx, W, H, mags, colors) {
        const data = this._getTimeDomain();
        const phase = this._animationTime();
        const level = this._averageLevel(mags);

        ctx.save();
        for (let layer = 2; layer >= 0; layer--) {
            const mid = H * (0.42 + layer * 0.09);
            const amp = H * (0.105 + layer * 0.028 + level * 0.035);
            const thickness = H * (0.055 + layer * 0.018);
            const gradient = this._themeGradient(ctx, 0, mid, W, mid, colors, 0.72 - layer * 0.1);
            ctx.fillStyle = gradient;
            ctx.shadowColor = colors[(layer + 1) % colors.length];
            ctx.shadowBlur = Math.max(4, H * (0.035 + layer * 0.012));
            ctx.globalAlpha = 0.72 - layer * 0.13;
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
                const x = (i / (data.length - 1)) * W;
                const drift = Math.sin(phase * (0.55 + layer * 0.16) + i * 0.07 + layer * 1.8) * H * 0.035;
                const y = mid + data[i] * amp + drift - thickness / 2;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            for (let i = data.length - 1; i >= 0; i--) {
                const x = (i / (data.length - 1)) * W;
                const drift = Math.sin(phase * (0.55 + layer * 0.16) + i * 0.07 + layer * 1.8) * H * 0.035;
                const y = mid + data[i] * amp + drift + thickness / 2;
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: W / 2, y: H * 0.15, align: 'center', maxWidth: W * 0.78,
            titleSize: Math.min(W, H) * 0.064, timeSize: Math.min(W, H) * 0.036,
            uppercase: true,
        });
    }

    /** 発光する都市バーと床面反射。 */
    _drawEqualizerCity(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const baseline = H * 0.68;
        const count = Math.min(36, mags.length);
        const stride = W / count;
        const barW = stride * 0.72;
        const phase = this._animationTime();

        ctx.save();
        for (let i = 0; i < count; i++) {
            const source = Math.floor((i / count) * mags.length);
            const mag = Math.max(0.055, mags[source] || 0);
            const bh = H * (0.07 + mag * 0.48);
            const x = i * stride + (stride - barW) / 2;
            const color = colors[i % colors.length];
            const g = ctx.createLinearGradient(0, baseline - bh, 0, baseline);
            g.addColorStop(0, this._rgba('#ffffff', 0.88));
            g.addColorStop(0.16, this._rgba(color, 0.92));
            g.addColorStop(1, this._rgba(color, 0.28));
            ctx.fillStyle = g;
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(2, size * 0.018);
            ctx.beginPath();
            this._roundRectPath(ctx, x, baseline - bh, barW, bh, Math.min(barW * 0.24, size * 0.01));
            ctx.fill();

            // 小さな窓。列・行数を抑えて高DPRでも軽く保つ。
            ctx.shadowBlur = 0;
            ctx.fillStyle = this._rgba('#ffffff', 0.52 + mag * 0.28);
            const rows = Math.min(5, Math.max(1, Math.floor(bh / (H * 0.055))));
            for (let row = 0; row < rows; row++) {
                if ((row + i) % 3 === 0) continue;
                const wy = baseline - H * 0.025 - row * H * 0.045;
                ctx.fillRect(x + barW * 0.26, wy, Math.max(1, barW * 0.16), Math.max(1, H * 0.009));
                ctx.fillRect(x + barW * 0.60, wy, Math.max(1, barW * 0.16), Math.max(1, H * 0.009));
            }

            // 水面/床の反射。
            const reflectionH = Math.min(H * 0.22, bh * 0.58);
            const rg = ctx.createLinearGradient(0, baseline, 0, baseline + reflectionH);
            rg.addColorStop(0, this._rgba(color, 0.28));
            rg.addColorStop(1, this._rgba(color, 0));
            ctx.fillStyle = rg;
            ctx.fillRect(x, baseline + H * 0.008, barW, reflectionH);
        }
        const horizon = this._themeGradient(ctx, 0, 0, W, 0, colors, 0.72);
        ctx.fillStyle = horizon;
        ctx.globalAlpha = 0.55 + Math.sin(phase * 1.4) * 0.08;
        ctx.fillRect(0, baseline, W, Math.max(1, H * 0.006));
        ctx.restore();

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: W * 0.055, y: H * 0.105, align: 'left', maxWidth: W * 0.72,
            titleSize: size * 0.066, timeSize: size * 0.036, uppercase: true,
        });
    }

    /** 左の人物写真を光の台座に載せ、右にタイトルと時間を置くステージ。 */
    _drawPortraitStage(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const isSquare = W / H < 1.2;
        const cx = W * (isSquare ? 0.33 : 0.29);
        const cy = H * 0.45;
        const photoR = size * (isSquare ? 0.16 : 0.185);
        const phase = this._animationTime();
        const level = this._averageLevel(mags);
        const data = this._getTimeDomain();

        // 背面の縦光柱。
        ctx.save();
        const beam = ctx.createLinearGradient(cx, H * 0.08, cx, H * 0.82);
        beam.addColorStop(0, this._rgba(colors[0], 0));
        beam.addColorStop(0.42, this._rgba(colors[0], 0.13 + level * 0.16));
        beam.addColorStop(1, this._rgba(colors[colors.length - 1], 0));
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(cx - photoR * 1.7, H * 0.08);
        ctx.lineTo(cx + photoR * 1.7, H * 0.08);
        ctx.lineTo(cx + photoR * 1.12, H * 0.82);
        ctx.lineTo(cx - photoR * 1.12, H * 0.82);
        ctx.closePath();
        ctx.fill();

        // 音に反応する楕円ステージ。
        for (let ring = 2; ring >= 0; ring--) {
            const color = colors[ring % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.34 + (2 - ring) * 0.2);
            ctx.lineWidth = Math.max(1, size * (0.004 + (2 - ring) * 0.002));
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(3, size * 0.025);
            ctx.beginPath();
            ctx.ellipse(
                cx,
                cy + photoR * 1.22 + ring * size * 0.016,
                photoR * (1.2 + ring * 0.22 + level * 0.13),
                photoR * (0.18 + ring * 0.045),
                0,
                0,
                Math.PI * 2,
            );
            ctx.stroke();
        }
        ctx.restore();

        this._drawCenterPhoto(ctx, cx, cy, photoR, colors);

        // 下部の細い波形と上部のスタジオ目盛り。
        this._drawWaveTrack(ctx, data, W * 0.08, W * 0.92, H * 0.84, H * 0.075, colors[colors.length - 1], 7);
        this._drawStudioTicks(ctx, W * 0.08, W * 0.92, H * 0.11, size * 0.018, colors[0], 38, phase * 0.04);

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: W * 0.55, y: H * 0.31, align: 'left', maxWidth: W * 0.39,
            titleSize: size * 0.069, timeSize: size * 0.041, uppercase: true,
        });
    }

    /** 半透明グラスカード内に写真・情報・下部EQをまとめたプレイヤー。 */
    _drawGlassPlayer(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const x = W * 0.065;
        const y = H * 0.12;
        const w = W * 0.87;
        const h = H * 0.76;
        const cx = x + w * 0.24;
        const cy = y + h * 0.43;
        const photoR = Math.min(size * 0.16, w * 0.16);
        const level = this._averageLevel(mags);
        const phase = this._animationTime();

        ctx.save();
        ctx.beginPath();
        this._roundRectPath(ctx, x, y, w, h, size * 0.055);
        const glass = ctx.createLinearGradient(x, y, x + w, y + h);
        glass.addColorStop(0, 'rgba(255,255,255,0.16)');
        glass.addColorStop(0.46, this._rgba(colors[0], 0.075));
        glass.addColorStop(1, 'rgba(15,23,42,0.32)');
        ctx.fillStyle = glass;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.34)';
        ctx.lineWidth = Math.max(1, size * 0.0035);
        ctx.stroke();

        // カード上端の動くハイライト。
        const shineX = x + ((phase * 0.055) % 1) * w;
        const shine = ctx.createLinearGradient(shineX - w * 0.18, 0, shineX + w * 0.18, 0);
        shine.addColorStop(0, 'rgba(255,255,255,0)');
        shine.addColorStop(0.5, 'rgba(255,255,255,0.46)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        ctx.fillRect(x + size * 0.04, y, w - size * 0.08, Math.max(1, size * 0.004));
        ctx.restore();

        // 写真の周囲に短いセグメントリング。
        ctx.save();
        const ticks = 40;
        ctx.lineCap = 'round';
        for (let i = 0; i < ticks; i++) {
            const mag = mags[Math.floor((i / ticks) * mags.length)] || 0;
            const angle = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const inner = photoR * 1.16;
            const outer = inner + size * (0.012 + mag * 0.045);
            const color = colors[i % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.52 + mag * 0.46);
            ctx.lineWidth = Math.max(1.4, size * 0.004);
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(1, size * 0.008);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
            ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
            ctx.stroke();
        }
        ctx.restore();
        this._drawCenterPhoto(ctx, cx, cy, photoR, colors);

        // 装飾用のプレイヤーボタン（実操作はCanvas上のオーバーレイが担う）。
        const controlsY = y + h * 0.60;
        [0.59, 0.71, 0.83].forEach((ratio, index) => {
            const bx = x + w * ratio;
            const br = size * (index === 1 ? 0.042 : 0.032);
            ctx.fillStyle = index === 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.13)';
            ctx.strokeStyle = index === 1 ? this._rgba(colors[0], 0.76) : 'rgba(255,255,255,0.4)';
            ctx.lineWidth = Math.max(1, size * 0.003);
            ctx.beginPath();
            ctx.arc(bx, controlsY, br * (1 + level * 0.025), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // カード下部EQ。
        const eqX = x + w * 0.055;
        const eqY = y + h * 0.88;
        const eqW = w * 0.89;
        const bars = 46;
        const stride = eqW / bars;
        for (let i = 0; i < bars; i++) {
            const mag = mags[Math.floor((i / bars) * mags.length)] || 0;
            const bh = Math.max(size * 0.006, h * mag * 0.16);
            ctx.fillStyle = this._rgba(colors[i % colors.length], 0.58 + mag * 0.38);
            ctx.beginPath();
            this._roundRectPath(ctx, eqX + i * stride, eqY - bh / 2, Math.max(1, stride * 0.52), bh, stride * 0.25);
            ctx.fill();
        }

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: x + w * 0.50, y: y + h * 0.23, align: 'left', maxWidth: w * 0.44,
            titleSize: size * 0.061, timeSize: size * 0.037,
        });
    }

    /** 中央写真から音に合わせて光線と粒子が飛び出すスターバースト。 */
    _drawStarburst(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W / 2;
        const cy = H * 0.53;
        const photoR = size * 0.145;
        const phase = this._animationTime();
        const level = this._averageLevel(mags);
        const count = 80;

        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < count; i++) {
            const mag = mags[Math.floor((i / count) * mags.length)] || 0;
            const angle = (i / count) * Math.PI * 2 + Math.sin(phase * 0.23) * 0.035;
            const inner = photoR * 1.13;
            const ray = size * (0.035 + mag * 0.26);
            const gap = (i % 3) * size * 0.012;
            const color = colors[i % colors.length];
            ctx.strokeStyle = this._rgba(color, 0.24 + mag * 0.72);
            ctx.lineWidth = Math.max(0.9, size * (0.0025 + mag * 0.005));
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(1, size * 0.012);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * (inner + gap), cy + Math.sin(angle) * (inner + gap));
            ctx.lineTo(cx + Math.cos(angle) * (inner + gap + ray), cy + Math.sin(angle) * (inner + gap + ray));
            ctx.stroke();
        }

        // 疑似乱数を使わない決定的な粒子（静的プレビューでもちらつかない）。
        for (let i = 0; i < 34; i++) {
            const angle = i * 2.399963 + phase * (0.035 + (i % 4) * 0.006);
            const orbit = photoR * 1.45 + ((i * 37) % 100) / 100 * size * 0.34;
            const mag = mags[i % mags.length] || 0;
            const px = cx + Math.cos(angle) * orbit;
            const py = cy + Math.sin(angle) * orbit;
            const color = colors[i % colors.length];
            ctx.fillStyle = this._rgba(color, 0.32 + mag * 0.56);
            ctx.beginPath();
            ctx.arc(px, py, Math.max(1, size * (0.0025 + mag * 0.006)), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        const halo = ctx.createRadialGradient(cx, cy, photoR * 0.7, cx, cy, photoR * (1.8 + level * 0.25));
        halo.addColorStop(0, this._rgba(colors[0], 0));
        halo.addColorStop(0.7, this._rgba(colors[0], 0.13 + level * 0.12));
        halo.addColorStop(1, this._rgba(colors[colors.length - 1], 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, photoR * (1.8 + level * 0.25), 0, Math.PI * 2);
        ctx.fill();
        this._drawCenterPhoto(ctx, cx, cy, photoR, colors);

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: cx, y: H * 0.09, align: 'center', maxWidth: W * 0.78,
            titleSize: size * 0.057, timeSize: size * 0.034, uppercase: true,
        });
    }

    /** 同心円と菱形を反復する音反応グリッド。 */
    _drawPulseGrid(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cell = size * 0.31;
        const cols = Math.ceil(W / cell) + 1;
        const rows = Math.ceil(H / cell) + 1;
        const phase = this._animationTime();

        ctx.save();
        ctx.lineCap = 'round';
        for (let row = -1; row < rows; row++) {
            for (let col = -1; col < cols; col++) {
                const cx = col * cell + (row % 2 ? cell * 0.5 : 0);
                const cy = row * cell;
                const index = Math.abs(row * 7 + col * 11);
                const mag = mags[index % mags.length] || 0;
                for (let ring = 0; ring < 3; ring++) {
                    const radius = cell * (0.13 + ring * 0.105) * (1 + mag * 0.12 + Math.sin(phase * 1.2 + index + ring) * 0.025);
                    const color = colors[(index + ring) % colors.length];
                    ctx.strokeStyle = this._rgba(color, 0.38 + ring * 0.15 + mag * 0.22);
                    ctx.lineWidth = Math.max(1, size * (0.003 + mag * 0.003));
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }

                const dx = cx + cell * 0.5;
                const dy = cy + cell * 0.5;
                const d = cell * (0.075 + mag * 0.035);
                const color = colors[(index + 2) % colors.length];
                ctx.strokeStyle = this._rgba(color, 0.56 + mag * 0.35);
                ctx.lineWidth = Math.max(1, size * 0.004);
                ctx.beginPath();
                ctx.moveTo(dx, dy - d);
                ctx.lineTo(dx + d, dy);
                ctx.lineTo(dx, dy + d);
                ctx.lineTo(dx - d, dy);
                ctx.closePath();
                ctx.stroke();
            }
        }
        ctx.restore();

        // テキストの可読性だけを確保する小さな半透明プレート。
        if (this.config.showTitle || this.config.showTime) {
            const plateW = Math.min(W * 0.62, size * 0.82);
            const plateH = size * 0.19;
            ctx.save();
            ctx.fillStyle = 'rgba(2,6,23,0.62)';
            ctx.strokeStyle = this._rgba(colors[0], 0.38);
            ctx.lineWidth = Math.max(1, size * 0.003);
            ctx.beginPath();
            this._roundRectPath(ctx, W / 2 - plateW / 2, H / 2 - plateH / 2, plateW, plateH, plateH / 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: W / 2, y: H / 2 - size * 0.02, align: 'center', maxWidth: Math.min(W * 0.54, size * 0.72),
            titleSize: size * 0.055, timeSize: size * 0.032, uppercase: true,
        });
    }

    /** 中央の多重軌道と大きなタイトルを組み合わせたタイポグラフィ。 */
    _drawOrbitTypography(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const cx = W / 2;
        const cy = H / 2;
        const phase = this._animationTime();
        const level = this._averageLevel(mags);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineCap = 'round';
        for (let orbit = 0; orbit < 5; orbit++) {
            const mag = this._bandLevel(mags, orbit / 5, (orbit + 1) / 5);
            const rx = size * (0.17 + orbit * 0.065 + mag * 0.025);
            const ry = rx * (0.38 + orbit * 0.055);
            const rotation = (orbit % 2 ? -1 : 1) * (0.25 + orbit * 0.14);
            const color = colors[orbit % colors.length];
            ctx.save();
            ctx.rotate(rotation);
            ctx.strokeStyle = this._rgba(color, 0.32 + mag * 0.55);
            ctx.lineWidth = Math.max(1, size * (0.003 + mag * 0.004));
            ctx.shadowColor = color;
            ctx.shadowBlur = Math.max(2, size * 0.012);
            ctx.setLineDash([size * (0.025 + orbit * 0.004), size * 0.016]);
            ctx.lineDashOffset = (orbit % 2 ? 1 : -1) * phase * size * (0.024 + orbit * 0.004);
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            const dotAngle = phase * (0.55 + orbit * 0.09) * (orbit % 2 ? -1 : 1) + orbit;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(Math.cos(dotAngle) * rx, Math.sin(dotAngle) * ry, Math.max(2, size * (0.006 + mag * 0.006)), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();

        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * (0.16 + level * 0.05));
        core.addColorStop(0, 'rgba(2,6,23,0.74)');
        core.addColorStop(0.65, this._rgba(colors[0], 0.12));
        core.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, size * (0.16 + level * 0.05), 0, Math.PI * 2);
        ctx.fill();

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: cx, y: cy - size * 0.03, align: 'center', maxWidth: W * 0.82,
            titleSize: size * 0.09, timeSize: size * 0.04, uppercase: true,
        });
    }

    /** 複数波形レーンと目盛り・再生ヘッドを持つスタジオ表示。 */
    _drawWaveformStudio(ctx, W, H, mags, colors) {
        const size = Math.min(W, H);
        const data = this._getTimeDomain();
        const phase = this._animationTime();
        const x0 = W * 0.065;
        const x1 = W * 0.935;
        const lanes = [0.28, 0.44, 0.60, 0.76];

        ctx.save();
        // スタジオの横罫と左チャンネル番号。
        lanes.forEach((ratio, index) => {
            const y = H * ratio;
            ctx.strokeStyle = 'rgba(255,255,255,0.10)';
            ctx.lineWidth = Math.max(1, size * 0.002);
            ctx.beginPath();
            ctx.moveTo(x0, y);
            ctx.lineTo(x1, y);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.48)';
            ctx.font = \`600 \${Math.max(8, Math.round(size * 0.025))}px 'SF Mono', Consolas, monospace\`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(index + 1).padStart(2, '0'), x0 - size * 0.018, y);
            this._drawWaveTrack(ctx, data, x0, x1, y, H * (0.045 + index * 0.007), colors[index % colors.length], index * 23);
        });

        this._drawStudioTicks(ctx, x0, x1, H * 0.18, size * 0.018, colors[0], 32, phase * 0.06);
        this._drawStudioTicks(ctx, x0, x1, H * 0.85, -size * 0.018, colors[colors.length - 1], 32, -phase * 0.04);

        // 動く再生ヘッド。
        const progress = (phase * 0.045) % 1;
        const headX = x0 + (x1 - x0) * progress;
        ctx.strokeStyle = this._rgba('#ffffff', 0.72);
        ctx.lineWidth = Math.max(1, size * 0.0025);
        ctx.shadowColor = colors[colors.length - 1];
        ctx.shadowBlur = Math.max(2, size * 0.012);
        ctx.beginPath();
        ctx.moveTo(headX, H * 0.19);
        ctx.lineTo(headX, H * 0.84);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(headX - size * 0.012, H * 0.18);
        ctx.lineTo(headX + size * 0.012, H * 0.18);
        ctx.lineTo(headX, H * 0.205);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        this._drawPremiumMetadata(ctx, W, H, colors, {
            x: x0, y: H * 0.075, align: 'left', maxWidth: W * 0.68,
            titleSize: size * 0.05, timeSize: size * 0.03, inlineTime: true, uppercase: true,
        });
    }

    /** マグニチュード全体の平均（0〜1）。 */
    _averageLevel(mags) {
        if (!Array.isArray(mags) || mags.length === 0) return 0;
        return mags.reduce((sum, value) => sum + (Number(value) || 0), 0) / mags.length;
    }

    /** 指定した比率範囲の帯域平均（0〜1）。 */
    _bandLevel(mags, fromRatio, toRatio) {
        if (!Array.isArray(mags) || mags.length === 0) return 0;
        const from = Math.max(0, Math.min(mags.length - 1, Math.floor(fromRatio * mags.length)));
        const to = Math.max(from + 1, Math.min(mags.length, Math.ceil(toRatio * mags.length)));
        let sum = 0;
        for (let i = from; i < to; i++) sum += Number(mags[i]) || 0;
        return sum / Math.max(1, to - from);
    }

    /** テーマ色を均等配置した線形グラデーション。 */
    _themeGradient(ctx, x0, y0, x1, y1, colors, alpha = 1) {
        const palette = Array.isArray(colors) && colors.length
            ? colors
            : ['#22d3ee', '#818cf8', '#c084fc', '#f472b6'];
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        palette.forEach((color, index) => {
            const stop = palette.length === 1 ? 0 : index / (palette.length - 1);
            gradient.addColorStop(stop, alpha >= 1 ? color : this._rgba(color, alpha));
        });
        return gradient;
    }

    /** 多角形の周上の座標と、中心から外向きの単位ベクトルを返す。 */
    _polygonSample(points, progress, cx, cy) {
        const lengths = [];
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            const length = Math.hypot(b.x - a.x, b.y - a.y);
            lengths.push(length);
            perimeter += length;
        }
        let target = ((progress % 1) + 1) % 1 * perimeter;
        let edge = 0;
        while (edge < lengths.length - 1 && target > lengths[edge]) {
            target -= lengths[edge];
            edge++;
        }
        const a = points[edge];
        const b = points[(edge + 1) % points.length];
        const ratio = lengths[edge] > 0 ? target / lengths[edge] : 0;
        const x = a.x + (b.x - a.x) * ratio;
        const y = a.y + (b.y - a.y) * ratio;
        const distance = Math.max(0.0001, Math.hypot(x - cx, y - cy));
        return { x, y, nx: (x - cx) / distance, ny: (y - cy) / distance };
    }

    /** 矩形の周上の座標と外向き法線を返す。 */
    _rectPerimeterSample(x, y, w, h, progress) {
        const perimeter = Math.max(1, 2 * (w + h));
        let target = ((progress % 1) + 1) % 1 * perimeter;
        if (target < w) return { x: x + target, y, nx: 0, ny: -1 };
        target -= w;
        if (target < h) return { x: x + w, y: y + target, nx: 1, ny: 0 };
        target -= h;
        if (target < w) return { x: x + w - target, y: y + h, nx: 0, ny: 1 };
        target -= w;
        return { x, y: y + h - target, nx: -1, ny: 0 };
    }

    /** 1本の波形レーンを描画する。 */
    _drawWaveTrack(ctx, data, x0, x1, y, amplitude, color, offset = 0) {
        if (!Array.isArray(data) || data.length < 2) return;
        const count = Math.min(128, data.length);
        ctx.save();
        ctx.strokeStyle = this._rgba(color, 0.16);
        ctx.lineWidth = Math.max(1, Math.abs(amplitude) * 0.025);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();

        ctx.strokeStyle = this._rgba(color, 0.84);
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.max(2, Math.abs(amplitude) * 0.22);
        ctx.lineWidth = Math.max(1.2, Math.abs(amplitude) * 0.055);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const source = (Math.floor((i / count) * data.length) + offset) % data.length;
            const x = x0 + (i / (count - 1)) * (x1 - x0);
            const envelope = Math.sin((i / (count - 1)) * Math.PI) * 0.18 + 0.82;
            const py = y + (data[source] || 0) * amplitude * envelope;
            i === 0 ? ctx.moveTo(x, py) : ctx.lineTo(x, py);
        }
        ctx.stroke();
        ctx.restore();
    }

    /** スタジオ/タイムライン風の等間隔目盛り。 */
    _drawStudioTicks(ctx, x0, x1, y, height, color, count = 32, offset = 0) {
        const span = x1 - x0;
        ctx.save();
        ctx.strokeStyle = this._rgba(color, 0.45);
        ctx.lineWidth = Math.max(1, Math.abs(height) * 0.08);
        for (let i = 0; i <= count; i++) {
            const shifted = (((i / count) + offset) % 1 + 1) % 1;
            const x = x0 + shifted * span;
            const tickH = height * (i % 4 === 0 ? 1 : (i % 2 === 0 ? 0.62 : 0.36));
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + tickH);
            ctx.stroke();
        }
        ctx.restore();
    }

    /** 新タイプ固有レイアウトへタイトルと現在時間/総時間を描画する。 */
    _drawPremiumMetadata(ctx, W, H, colors, options = {}) {
        const showTitle = !!this.config.showTitle;
        const showTime = !!this.config.showTime;
        if (!showTitle && !showTime) return;

        const size = Math.min(W, H);
        const x = Number.isFinite(options.x) ? options.x : W / 2;
        let y = Number.isFinite(options.y) ? options.y : H / 2;
        const align = options.align || 'center';
        const maxWidth = Math.max(size * 0.16, options.maxWidth || W * 0.8);
        const titleSize = Math.max(8, options.titleSize || size * 0.064);
        const timeSize = Math.max(7, options.timeSize || size * 0.036);
        const verticalGap = Math.max(size * 0.026, titleSize * 0.72);
        const palette = Array.isArray(colors) && colors.length ? colors : ['#ffffff'];
        const current = showTime ? this._formatTime(this._currentTimeSeconds()) : '';
        const duration = showTime ? this._durationSeconds() : null;
        const timeText = showTime
            ? (duration !== null ? \`\${current} / \${this._formatTime(duration)}\` : current)
            : '';
        const inlinePair = !!options.inlineTime && showTitle && showTime;

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.96)';
        ctx.shadowColor = 'rgba(0,0,0,0.72)';
        ctx.shadowBlur = Math.max(2, size * 0.014);
        ctx.textBaseline = 'middle';
        ctx.textAlign = align;

        // インライン配置は同じ幅をタイトルと時間で奪い合うため、時間を先に計測する。
        // align に関係なく1つの安全なブロックへ左=タイトル、右=時間として収める。
        let timeWidth = 0;
        if (showTime) {
            ctx.font = \`600 \${Math.round(timeSize)}px 'SF Mono', Consolas, monospace\`;
            timeWidth = ctx.measureText(timeText).width;
        }
        const inlineGap = inlinePair ? Math.max(size * 0.018, timeSize * 0.65) : 0;
        const titleMaxWidth = inlinePair
            ? Math.max(0, maxWidth - timeWidth - inlineGap)
            : maxWidth;
        const blockLeft = align === 'center' ? x - maxWidth / 2 : (align === 'right' ? x - maxWidth : x);
        const blockRight = blockLeft + maxWidth;

        if (showTitle) {
            ctx.font = \`700 \${Math.round(titleSize)}px 'Helvetica Neue', Arial, sans-serif\`;
            if ('letterSpacing' in ctx) ctx.letterSpacing = \`\${Math.max(1, Math.round(size * 0.008))}px\`;
            let title = String(this.config.title || 'YOUR SOUND');
            if (options.uppercase) title = title.toUpperCase();
            const ellipsisWidth = ctx.measureText('…').width;
            title = titleMaxWidth >= ellipsisWidth ? this._ellipsize(ctx, title, titleMaxWidth) : '';
            if (title) {
                ctx.textAlign = inlinePair ? 'left' : align;
                ctx.fillText(title, inlinePair ? blockLeft : x, y);
            }
            if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        }

        if (showTime) {
            ctx.font = \`600 \${Math.round(timeSize)}px 'SF Mono', Consolas, monospace\`;
            ctx.fillStyle = this._rgba(palette[0], 0.95);
            if (inlinePair) {
                ctx.textAlign = 'right';
                ctx.fillText(timeText, blockRight, y);
            } else {
                y += showTitle ? verticalGap : 0;
                ctx.textAlign = align;
                ctx.fillText(timeText, x, y);
            }
        }
        ctx.restore();
    }

    /** Canvasの横方向圧縮を避け、長いタイトルを省略記号で収める。 */
    _ellipsize(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        const ellipsis = '…';
        let low = 0;
        let high = text.length;
        while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) low = mid;
            else high = mid - 1;
        }
        return text.slice(0, low) + ellipsis;
    }

    /**
     * 中央画像を丸 / 四角トリミングで描画する（未設定時は発光ディスク）。
     */
    _drawCenterPhoto(ctx, cx, cy, r, colors) {
        const shape = this.config.centerPhotoShape === 'square' ? 'square' : 'circle';
        const img = this._centerImg;
        const hasImg = img && img.complete && img.naturalWidth > 0;

        ctx.save();
        // トリミングパスを作ってクリップ
        ctx.beginPath();
        if (shape === 'square') {
            const side = r * 2;
            this._roundRectPath(ctx, cx - r, cy - r, side, side, r * 0.16);
        } else {
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        ctx.closePath();
        if (hasImg) {
            ctx.save();
            ctx.clip();
            // cover 描画（centerPhotoZoom % で拡大し、フォーカス位置 centerPhotoPosX/PosY % で
            // はみ出し分の表示位置を調整）
            const ir = img.naturalWidth / img.naturalHeight;
            let dw = r * 2, dh = r * 2;
            if (ir > 1) { dw = dh * ir; } else { dh = dw / ir; }
            const zoom = this._zoomPercent(this.config.centerPhotoZoom);
            dw *= zoom / 100;
            dh *= zoom / 100;
            const posX = this._posPercent(this.config.centerPhotoPosX);
            const posY = this._posPercent(this.config.centerPhotoPosY);
            const dx = cx - r - (dw - r * 2) * (posX / 100);
            const dy = cy - r - (dh - r * 2) * (posY / 100);
            ctx.drawImage(img, dx, dy, dw, dh);
            ctx.restore();
        } else {
            // 画像未設定：発光ディスク
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, this._rgba(colors[0], 0.9));
            g.addColorStop(1, this._rgba(colors[colors.length - 1], 0.35));
            ctx.fillStyle = g;
            ctx.fill();
        }
        // 縁取りリング
        ctx.strokeStyle = this._rgba('#ffffff', 0.85);
        ctx.lineWidth = Math.max(1.5, r * 0.035);
        ctx.beginPath();
        if (shape === 'square') {
            this._roundRectPath(ctx, cx - r, cy - r, r * 2, r * 2, r * 0.16);
        } else {
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
    }

    /**
     * タイトル / 再生時間のオーバーレイを描画する。
     * リングタイムは自前で時間を描画するため、時間オーバーレイをスキップする。
     */
    _drawOverlays(ctx, W, H, colors) {
        const size = Math.min(W, H);

        // タイトル
        if (this.config.showTitle && this.config.title) {
            const y = this.config.type === 'horizon' ? H * 0.36
                : (this.config.type === 'photo-card' ? H * 0.20 : H * 0.13);
            ctx.save();
            ctx.fillStyle = this._rgba('#ffffff', 0.95);
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = Math.max(2, size * 0.015);
            ctx.font = \`600 \${Math.round(size * 0.065)}px 'Helvetica Neue', Arial, sans-serif\`;
            if ('letterSpacing' in ctx) ctx.letterSpacing = \`\${Math.round(size * 0.012)}px\`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(this.config.title), W / 2, y, W * 0.9);
            if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
            ctx.restore();
        }

        // 再生時間（現在 / 全体）
        if (this.config.showTime && this.config.type !== 'ring-time') {
            const current = this._formatTime(this._currentTimeSeconds());
            const durationSeconds = this._durationSeconds();
            const duration = durationSeconds !== null ? ' / ' + this._formatTime(durationSeconds) : '';
            ctx.save();
            ctx.fillStyle = this._rgba('#ffffff', 0.85);
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = Math.max(2, size * 0.01);
            ctx.font = \`500 \${Math.round(size * 0.042)}px 'SF Mono', 'Consolas', monospace\`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(current + duration, W * 0.035, H * 0.955);
            ctx.restore();
        }
    }

    /** フォーカス位置（0〜100%）を返す。未指定・不正値は 50（中央）。 */
    _posPercent(value) {
        const n = typeof value === 'number' ? value : parseFloat(value);
        if (!Number.isFinite(n)) return 50;
        return Math.max(0, Math.min(100, n));
    }

    /** 中央画像の拡大率（100〜300%）を返す。未指定・不正値は 100（cover等倍）。 */
    _zoomPercent(value) {
        const n = typeof value === 'number' ? value : parseFloat(value);
        if (!Number.isFinite(n)) return 100;
        return Math.max(100, Math.min(300, n));
    }

    /** 現在の再生位置（秒）。デモ時計は見本位置から総時間内で進める。 */
    _currentTimeSeconds() {
        if (this.media && Number.isFinite(this.media.currentTime)) return this.media.currentTime;
        if (Number.isFinite(this.config.previewCurrentTime)) {
            let current = Math.max(0, this.config.previewCurrentTime);
            if (this.config.previewTimeAdvances && Number.isFinite(this._previewClockStartedAt)) {
                current += Math.max(0, performance.now() / 1000 - this._previewClockStartedAt);
            }
            const duration = this._durationSeconds();
            if (duration !== null) {
                if (duration <= 0) return 0;
                return this.config.previewTimeAdvances
                    ? current % duration
                    : Math.min(current, duration);
            }
            return current;
        }
        return this._animationTime();
    }

    /** 総再生時間（秒）。未確定の場合は null。 */
    _durationSeconds() {
        if (this.media && Number.isFinite(this.media.duration)) return this.media.duration;
        if (Number.isFinite(this.config.previewDuration)) return this.config.previewDuration;
        return null;
    }

    /** 秒を m:ss 形式の文字列にする。 */
    _formatTime(sec) {
        if (!Number.isFinite(sec) || sec < 0) sec = 0;
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + String(s).padStart(2, '0');
    }

    /** 中央画像（センターフォト）を読み込む。 */
    _loadCenterImage() {
        const url = this.config.centerPhotoUrl;
        if (!url) {
            this._centerImg = null;
            this._centerImgUrl = null;
            return;
        }
        if (url === this._centerImgUrl && this._centerImg) return;
        const img = new Image();
        this._centerImg = img;
        this._centerImgUrl = url;
        img.onerror = () => {
            // URL切替後に旧リクエストが失敗しても、新しい画像を消さない。
            if (this._centerImg !== img || this._centerImgUrl !== url || this.config.centerPhotoUrl !== url) return;
            this._centerImg = null;
            this._centerImgUrl = null;
        };
        img.src = url;
    }

    // ---------------------------------------------------------------------
    // ユーティリティ
    // ---------------------------------------------------------------------

    _animationTime() {
        if (Number.isFinite(this._previewPhase)) return this._previewPhase;
        if (this.media && Number.isFinite(this.media.currentTime)) return this.media.currentTime;
        return performance.now() / 1000;
    }

    _colors() {
        const key = this.config.colorScheme;
        const schemes = this.config.schemes || {};
        if (schemes[key] && Array.isArray(schemes[key].colors) && schemes[key].colors.length) {
            return schemes[key].colors;
        }
        return ['#22d3ee', '#818cf8', '#c084fc', '#f472b6'];
    }

    _vGradient(ctx, H, colors) {
        const g = ctx.createLinearGradient(0, H, 0, 0);
        const n = colors.length;
        colors.forEach((c, i) => g.addColorStop(n === 1 ? 0 : i / (n - 1), c));
        return g;
    }

    _roundRectPath(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }

    _opacity(key, fallback) {
        const v = this.config[key];
        const n = typeof v === 'number' ? v : parseInt(v, 10);
        if (isNaN(n)) return fallback / 100;
        return Math.max(0, Math.min(100, n)) / 100;
    }

    _rgba(hex, alpha) {
        const c = this._hexToRgb(hex);
        if (!c) return \`rgba(0,0,0,\${alpha})\`;
        return \`rgba(\${c.r},\${c.g},\${c.b},\${alpha})\`;
    }

    _hexToRgb(hex) {
        if (typeof hex !== 'string') return null;
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map((x) => x + x).join('');
        if (h.length !== 6) return null;
        const num = parseInt(h, 16);
        if (isNaN(num)) return null;
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }

    _loadBgImage() {
        const url = this.config.bgPhotoUrl;
        if (!url) {
            this._bgImg = null;
            this._bgImgUrl = null;
            return;
        }
        if (url === this._bgImgUrl && this._bgImg) return;
        const img = new Image();
        this._bgImg = img;
        this._bgImgUrl = url;
        // crossOrigin は付けない：canvas の画素を読み戻さない（描画専用）ため不要で、
        // 付けると CORS ヘッダを返さないストレージ配信の背景画像が読み込み失敗する。
        img.onerror = () => {
            // URL切替後に旧リクエストが失敗しても、新しい画像を消さない。
            if (this._bgImg !== img || this._bgImgUrl !== url || this.config.bgPhotoUrl !== url) return;
            this._bgImg = null;
            this._bgImgUrl = null;
        };
        img.src = url;
    }

    _resize() {
        const rect = this.canvas.getBoundingClientRect();
        const cw = Math.max(1, Math.floor(rect.width));
        const ch = Math.max(1, Math.floor(rect.height));
        this._dpr = Math.max(1, window.devicePixelRatio || 1);
        this.canvas.width = cw * this._dpr;
        this.canvas.height = ch * this._dpr;
        this._w = this.canvas.width;
        this._h = this.canvas.height;
    }

    // ---------------------------------------------------------------------
    // 静的プレビュー（設定 UI のサムネイル用・音声不要）
    // ---------------------------------------------------------------------

    /**
     * 固定の擬似スペクトルで代表フレームを 1 枚描画する。
     * @param {HTMLCanvasElement} canvas
     * @param {object} opts { type, colors, bgColor, bgColors }
     */
    static renderPreview(canvas, opts = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const cw = Math.max(1, Math.floor(rect.width || canvas.width));
        const ch = Math.max(1, Math.floor(rect.height || canvas.height));
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;

        const stub = Object.create(LseedAudioVisualizer.prototype);
        stub.ctx = ctx;
        stub.canvas = canvas;
        stub.media = null;
        stub._dpr = dpr;
        stub._analyser = null;
        stub._particles = [];
        stub._demoActive = true;
        stub._previewPhase = 1.75;
        // 実際に設定された背景画像・中央画像を描画するため、読み込み済み Image を受け取る
        stub._bgImg = (opts.bgImg && opts.bgImg.complete && opts.bgImg.naturalWidth > 0) ? opts.bgImg : null;
        stub._centerImg = (opts.centerImg && opts.centerImg.complete && opts.centerImg.naturalWidth > 0) ? opts.centerImg : null;
        stub._w = canvas.width;
        stub._h = canvas.height;
        const previewType = opts.type || 'bars';
        const integratedMetadata = stub._usesIntegratedMetadata(previewType);
        stub.config = {
            type: previewType,
            colorScheme: '__preview__',
            bgColor: opts.bgColor || 'none',
            bgColorOpacity: opts.bgColorOpacity != null ? opts.bgColorOpacity : 60,
            bgPhotoOpacity: opts.bgPhotoOpacity != null ? opts.bgPhotoOpacity : 100,
            centerPhotoShape: opts.centerPhotoShape || 'circle',
            centerPhotoPosX: opts.centerPhotoPosX,
            centerPhotoPosY: opts.centerPhotoPosY,
            centerPhotoZoom: opts.centerPhotoZoom,
            // 新タイプのサムネイルは、未指定でも見本タイトル・時間を表示して
            // レイアウトの特徴がカードだけで伝わるようにする。
            title: opts.title || 'YOUR SOUND',
            showTitle: opts.showTitle != null ? !!opts.showTitle : integratedMetadata,
            showTime: opts.showTime != null ? !!opts.showTime : integratedMetadata,
            previewCurrentTime: Number.isFinite(opts.previewCurrentTime) ? opts.previewCurrentTime : 46,
            previewDuration: Number.isFinite(opts.previewDuration) ? opts.previewDuration : 142,
            schemes: { __preview__: { colors: opts.colors || ['#22d3ee', '#818cf8', '#c084fc', '#f472b6'] } },
        };

        const W = stub._w;
        const H = stub._h;
        ctx.clearRect(0, 0, W, H);
        // プレビュー下地（設定パネルの白背景でも視認できるよう暗色を敷く）
        ctx.fillStyle = '#0b1220';
        ctx.fillRect(0, 0, W, H);
        // 実際の背景色・背景画像を反映
        stub._drawBackground(ctx, W, H);

        const colors = stub._colors();
        const n = 40;
        const mags = new Array(n);
        for (let i = 0; i < n; i++) {
            const env = Math.pow(1 - i / n, 0.7);
            const wobble = Math.sin(i * 0.9) * 0.5 + 0.5;
            mags[i] = Math.max(0.08, (0.35 + wobble * 0.6) * env);
        }
        stub._bars = n;

        stub._drawType(ctx, W, H, mags, colors, { preview: true });
        if (!stub._usesIntegratedMetadata()) {
            stub._drawOverlays(ctx, W, H, colors);
        }
    }

    _drawPreviewWave(ctx, W, H, colors) {
        const n = 80;
        const mid = H / 2;
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        ctx.lineWidth = Math.max(2, H * 0.02);
        ctx.strokeStyle = grad;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const x = (i / (n - 1)) * W;
            const y = mid + (Math.sin(i * 0.5) * 0.6 + Math.sin(i * 1.1) * 0.4) * (H * 0.32);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    _drawPreviewParticles(ctx, W, H, mags, colors) {
        const cx = W / 2;
        const cy = H / 2;
        for (let i = 0; i < 60; i++) {
            const ang = (i / 60) * Math.PI * 2 + i;
            const dist = ((i * 37) % 100) / 100 * Math.min(W, H) * 0.42;
            const x = cx + Math.cos(ang) * dist;
            const y = cy + Math.sin(ang) * dist;
            ctx.globalAlpha = 1 - dist / (Math.min(W, H) * 0.5);
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(x, y, (2 + (i % 3)) * this._dpr, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.12);
        rg.addColorStop(0, this._rgba(colors[0], 0.95));
        rg.addColorStop(1, this._rgba(colors[0], 0));
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(W, H) * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }

    // ---------------------------------------------------------------------
    // デモアニメーション（ホバー時のサムネイル用・音声不要）
    // ---------------------------------------------------------------------

    /**
     * 合成波形で動く「デモ用スタブ」を生成する。frame() を rAF で呼ぶと動く。
     * @param {HTMLCanvasElement} canvas
     * @param {string} type
     * @param {array}  colors
     * @param {object} [bg]   { bgColor, bgColorOpacity, bgPhotoUrl, bgPhotoOpacity }
     * @returns {object} stub（frame() を持つ）
     */
    static _buildDemoStub(canvas, type, colors, bg) {
        const ctx = canvas.getContext('2d');
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const cw = Math.max(1, Math.floor(rect.width || canvas.width));
        const ch = Math.max(1, Math.floor(rect.height || canvas.height));
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;

        const stub = Object.create(LseedAudioVisualizer.prototype);
        stub.ctx = ctx;
        stub.canvas = canvas;
        stub.media = null;
        stub._dpr = dpr;
        stub._analyser = null;
        stub._freq = null;
        stub._time = null;
        stub._particles = [];
        stub._bgImg = null;
        stub._bgImgUrl = null;
        stub._w = canvas.width;
        stub._h = canvas.height;
        stub._bars = 48;
        stub._demoActive = true;       // 合成波形を「再生中」として振る舞わせる
        stub._previewClockStartedAt = performance.now() / 1000;
        stub._baseFill = '#0b1220';    // 下地色（静的プレビューと揃える）
        const b = bg || {};
        const integratedMetadata = stub._usesIntegratedMetadata(type || 'bars');
        stub.config = {
            type: type || 'bars',
            colorScheme: '__demo__',
            bgColor: b.bgColor || 'none',
            bgColorOpacity: b.bgColorOpacity != null ? b.bgColorOpacity : 60,
            bgPhotoUrl: b.bgPhotoUrl || null,
            bgPhotoOpacity: b.bgPhotoOpacity != null ? b.bgPhotoOpacity : 100,
            centerPhotoUrl: b.centerPhotoUrl || null,
            centerPhotoShape: b.centerPhotoShape || 'circle',
            centerPhotoPosX: b.centerPhotoPosX,
            centerPhotoPosY: b.centerPhotoPosY,
            centerPhotoZoom: b.centerPhotoZoom,
            title: b.title || 'YOUR SOUND',
            showTitle: b.showTitle != null ? !!b.showTitle : integratedMetadata,
            showTime: b.showTime != null ? !!b.showTime : integratedMetadata,
            // 静的サムネイルの 0:46 から連続して進め、duration 到達後は循環させる。
            // 波形アニメーション自体は _animationTime() の実時間を使い続ける。
            previewCurrentTime: Number.isFinite(b.previewCurrentTime) ? b.previewCurrentTime : 46,
            previewTimeAdvances: true,
            previewDuration: Number.isFinite(b.previewDuration) ? b.previewDuration : 142,
            schemes: { __demo__: { colors: colors || ['#22d3ee', '#818cf8', '#c084fc', '#f472b6'] } },
        };
        // 背景画像・中央画像を非同期ロード（読み込み後は frame() が描画）
        stub._loadBgImage();
        stub._loadCenterImage();

        stub.frame = function () {
            // 表示サイズが変わっていたら追従（比率変更など）
            const r = this.canvas.getBoundingClientRect();
            const w2 = Math.max(1, Math.floor(r.width)) * this._dpr;
            const h2 = Math.max(1, Math.floor(r.height)) * this._dpr;
            if (w2 !== this._w || h2 !== this._h) {
                this.canvas.width = w2;
                this.canvas.height = h2;
                this._w = w2;
                this._h = h2;
            }
            this._draw();
        };

        return stub;
    }
}

window.LseedAudioVisualizer = LseedAudioVisualizer;

/**
 * 種類選択カードの静的サムネイルプレビュー描画マネージャ。
 * カラーテーマ変更・表示切替のたびに renderAll() を呼び、全カードを再描画する。
 */
window.LseedMsVizPreview = {
    // canvas -> rAF id（ホバー中のデモアニメーション管理）
    _demos: new Map(),
    _renderSignature: null,

    /**
     * 全カードの静的サムネイルを描画する。
     * @param {string}  schemeKey   現在のカラーテーマキー
     * @param {boolean} _enabledDep 依存登録用（未使用）
     * @param {object}  payload     { schemes, bgColors }
     * @param {string}  _aspectDep  依存登録用（画面比率。変更時に再描画するため）
     */
    // 静的プレビュー用の共有背景画像・中央画像（1枚だけ保持し、読み込み後に再描画）
    _bgImg: null,
    _bgImgUrl: null,
    _bgImgOnReady: null,
    _centerImg: null,
    _centerImgUrl: null,
    _centerImgOnReady: null,

    renderAll(schemeKey, _enabledDep, payload, _aspectDep, bg, _attempt) {
        if (!window.LseedAudioVisualizer) return;
        const attempt = _attempt || 0;
        const b = bg || {};
        const colors = this._colorsFor(schemeKey, payload);
        const renderSignature = JSON.stringify({
            schemeKey,
            colors,
            aspectRatio: _aspectDep,
            bgColor: b.bgColor,
            bgColorOpacity: b.bgColorOpacity,
            bgPhotoUrl: b.bgPhotoUrl,
            bgPhotoOpacity: b.bgPhotoOpacity,
            centerPhotoUrl: b.centerPhotoUrl,
            centerPhotoShape: b.centerPhotoShape,
            centerPhotoPosX: b.centerPhotoPosX,
            centerPhotoPosY: b.centerPhotoPosY,
            centerPhotoZoom: b.centerPhotoZoom,
            title: b.title,
            showTitle: b.showTitle,
            showTime: b.showTime,
            previewCurrentTime: b.previewCurrentTime,
            previewDuration: b.previewDuration,
        });
        // テーマ・背景・比率が変わったら、旧設定で動くホバーデモも停止して全件を描き直す。
        if (renderSignature !== this._renderSignature) {
            this.stopAll();
            this._renderSignature = renderSignature;
        }
        const bgImg = this._ensureBgImg(b.bgPhotoUrl, () =>
            this.renderAll(schemeKey, _enabledDep, payload, _aspectDep, bg));
        const centerImg = this._ensureCenterImg(b.centerPhotoUrl, () =>
            this.renderAll(schemeKey, _enabledDep, payload, _aspectDep, bg));
        requestAnimationFrame(() => {
            const canvases = document.querySelectorAll('canvas[data-viz-preview]');
            if (!canvases.length) return;
            let anyUnsized = false;
            canvases.forEach((c) => {
                // ホバー中のデモが走っている canvas は上書きしない
                if (this._demos.has(c)) return;
                // パネルを開いた直後はまだレイアウト前でサイズ 0 のことがある。
                // その場合は描画せず、後でリトライする（空サムネイル防止）。
                const rect = c.getBoundingClientRect();
                if (rect.width < 2 || rect.height < 2) { anyUnsized = true; return; }
                window.LseedAudioVisualizer.renderPreview(c, {
                    type: c.getAttribute('data-viz-preview'),
                    colors: colors,
                    bgColor: b.bgColor,
                    bgColorOpacity: b.bgColorOpacity,
                    bgImg: bgImg,
                    bgPhotoOpacity: b.bgPhotoOpacity,
                    centerImg: centerImg,
                    centerPhotoShape: b.centerPhotoShape,
                    centerPhotoPosX: b.centerPhotoPosX,
                    centerPhotoPosY: b.centerPhotoPosY,
                    centerPhotoZoom: b.centerPhotoZoom,
                    title: b.title,
                    showTitle: b.showTitle,
                    showTime: b.showTime,
                    previewCurrentTime: b.previewCurrentTime,
                    previewDuration: b.previewDuration,
                });
                // 描画済みフラグ（ローディング表示を消すため）
                c.setAttribute('data-viz-ready', '1');
            });
            // サイズ未確定の canvas が残っていれば少し待って再描画（最大 ~2 秒）
            if (anyUnsized && attempt < 24) {
                setTimeout(() => this.renderAll(schemeKey, _enabledDep, payload, _aspectDep, bg, attempt + 1), 80);
            }
        });
    },

    /**
     * ホバー時に該当 canvas のデモアニメーションを開始する。
     * @param {HTMLCanvasElement} canvas
     * @param {string} type
     * @param {string} schemeKey
     * @param {object} payload
     * @param {object} [bg] { bgColor, bgColorOpacity, bgPhotoUrl, bgPhotoOpacity }
     */
    startDemo(canvas, type, schemeKey, payload, bg) {
        if (!canvas || !window.LseedAudioVisualizer) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.stopDemo(canvas);
        const colors = this._colorsFor(schemeKey, payload);
        const stub = window.LseedAudioVisualizer._buildDemoStub(canvas, type, colors, bg);
        const loop = () => {
            if (!canvas.isConnected || !this._demos.has(canvas)) {
                this._demos.delete(canvas);
                return;
            }
            stub.frame();
            this._demos.set(canvas, requestAnimationFrame(loop));
        };
        this._demos.set(canvas, requestAnimationFrame(loop));
    },

    /**
     * デモアニメーションを停止し、静的プレビューへ戻す。
     * @param {HTMLCanvasElement} canvas
     * @param {string} [type]
     * @param {string} [schemeKey]
     * @param {object} [payload]
     * @param {object} [bg]
     */
    stopDemo(canvas, type, schemeKey, payload, bg) {
        if (!canvas) return;
        const id = this._demos.get(canvas);
        if (id !== undefined) {
            cancelAnimationFrame(id);
            this._demos.delete(canvas);
        }
        if (type !== undefined && window.LseedAudioVisualizer) {
            const b = bg || {};
            window.LseedAudioVisualizer.renderPreview(canvas, {
                type: type,
                colors: this._colorsFor(schemeKey, payload),
                bgColor: b.bgColor,
                bgColorOpacity: b.bgColorOpacity,
                bgImg: this._ensureBgImg(b.bgPhotoUrl),
                bgPhotoOpacity: b.bgPhotoOpacity,
                centerImg: this._ensureCenterImg(b.centerPhotoUrl),
                centerPhotoShape: b.centerPhotoShape,
                centerPhotoPosX: b.centerPhotoPosX,
                centerPhotoPosY: b.centerPhotoPosY,
                centerPhotoZoom: b.centerPhotoZoom,
                title: b.title,
                showTitle: b.showTitle,
                showTime: b.showTime,
                previewCurrentTime: b.previewCurrentTime,
                previewDuration: b.previewDuration,
            });
        }
    },

    /**
     * カルーセル移動時などに、対象領域内で動いているデモをまとめて停止する。
     * @param {HTMLElement|null} scope
     */
    stopAll(scope) {
        for (const [canvas, id] of this._demos.entries()) {
            if (scope && !scope.contains(canvas)) continue;
            cancelAnimationFrame(id);
            this._demos.delete(canvas);
        }
    },

    _colorsFor(schemeKey, payload) {
        const schemes = (payload && payload.schemes) || {};
        return (schemes[schemeKey] && schemes[schemeKey].colors) || undefined;
    },

    _ensureBgImg(url, onReady) {
        if (!url) {
            this._bgImg = null;
            this._bgImgUrl = null;
            this._bgImgOnReady = null;
            return null;
        }
        if (url === this._bgImgUrl && this._bgImg) {
            // 同じ画像の読込中に設定が変わった場合は、最新の再描画だけを残す。
            if (!this._bgImg.complete && typeof onReady === 'function') this._bgImgOnReady = onReady;
            return this._bgImg;
        }
        const img = new Image();
        this._bgImg = img;
        this._bgImgUrl = url;
        this._bgImgOnReady = typeof onReady === 'function' ? onReady : null;
        img.onload = () => {
            // 新URLへ切替済みなら、旧画像の完了通知は無視する。
            if (this._bgImg !== img || this._bgImgUrl !== url) return;
            const callback = this._bgImgOnReady;
            this._bgImgOnReady = null;
            if (typeof callback === 'function') callback();
        };
        img.onerror = () => {
            if (this._bgImg !== img || this._bgImgUrl !== url) return;
            this._bgImg = null;
            this._bgImgUrl = null;
            this._bgImgOnReady = null;
        };
        img.src = url;
        return img;
    },

    _ensureCenterImg(url, onReady) {
        if (!url) {
            this._centerImg = null;
            this._centerImgUrl = null;
            this._centerImgOnReady = null;
            return null;
        }
        if (url === this._centerImgUrl && this._centerImg) {
            if (!this._centerImg.complete && typeof onReady === 'function') this._centerImgOnReady = onReady;
            return this._centerImg;
        }
        const img = new Image();
        this._centerImg = img;
        this._centerImgUrl = url;
        this._centerImgOnReady = typeof onReady === 'function' ? onReady : null;
        img.onload = () => {
            if (this._centerImg !== img || this._centerImgUrl !== url) return;
            const callback = this._centerImgOnReady;
            this._centerImgOnReady = null;
            if (typeof callback === 'function') callback();
        };
        img.onerror = () => {
            if (this._centerImg !== img || this._centerImgUrl !== url) return;
            this._centerImg = null;
            this._centerImgUrl = null;
            this._centerImgOnReady = null;
        };
        img.src = url;
        return img;
    },
};

/**
 * ビジュアライザー背景色の「＋」ボタン用カラーパレット。
 * Tiptap / デザインビルダーと同一の共通パレット（window.createLseedColorPalette）を開く。
 * 選択色は HEX に正規化して onPick へ渡す。
 */
window.LseedVizColorPalette = {
    _p: null,
    /**
     * @param {HTMLElement} anchor  ポップオーバーの基準要素
     * @param {Array} groups        プリセットグループ [{key,label,colors:[]}]
     * @param {Array} favorites     保存済みカスタム色 [{id,color}]
     * @param {function} onPick     色確定コールバック（HEX or 'none'）
     * @param {object} hooks        { onSaveCustom, onDeleteCustom }
     */
    open(anchor, groups, favorites, onPick, hooks) {
        if (typeof window.createLseedColorPalette !== 'function') return;
        const h = hooks || {};
        if (!this._p) {
            this._p = window.createLseedColorPalette({
                groups: Array.isArray(groups) ? groups : [],
                favorites: Array.isArray(favorites) ? favorites : [],
                onSaveCustom: h.onSaveCustom,
                onDeleteCustom: h.onDeleteCustom,
            });
        }
        this._p.open(anchor, {
            onSelect: (c) => onPick(this.toHex(c)),
            onClear: () => onPick('none'),
        });
    },

    setCustomColorId(tempId, id) {
        if (this._p && typeof this._p.setCustomColorId === 'function') {
            this._p.setCustomColorId(tempId, id);
        }
    },

    /** rgb()/rgba()/#rgb/#rrggbb を #rrggbb へ正規化する（不能なら 'none'）。 */
    toHex(color) {
        if (typeof color !== 'string') return 'none';
        const s = color.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
        if (/^#[0-9a-fA-F]{3}$/.test(s)) {
            return '#' + s.slice(1).split('').map((x) => x + x).join('').toLowerCase();
        }
        const m = s.match(/^rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/i);
        if (m) {
            const hex = (n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, '0');
            return '#' + hex(m[1]) + hex(m[2]) + hex(m[3]);
        }
        return 'none';
    },
};

window.LseedAudioVisualizer = LseedAudioVisualizer;
`
