'use client';

/**
 * BookShowcase
 * ------------------------------------------------------------------------
 * Ported from a standalone HTML/Three.js page into a self-contained React
 * section. All the original logic (procedural cover painting, page-turn
 * physics, orbit drag, the "open slip" cursor affordance, the exit/return
 * choreography) is preserved — the changes are only in *how* it talks to
 * the DOM, so it can live inside a React tree instead of owning the page:
 *
 *  - `document.getElementById(...)` calls become refs.
 *  - `document.body.classList` (for `.detail-open` / `.transit`) becomes
 *    classList on this component's own root element.
 *  - `window.innerWidth/innerHeight` and viewport-relative pointer
 *    coordinates become the *container's* bounding rect, so this renders
 *    correctly as a section rather than assuming it owns the whole page.
 *  - The render loop, all event listeners, and the Three.js renderer are
 *    torn down on unmount (important in React StrictMode, which mounts
 *    effects twice in development).
 *
 * Requires `three` as a dependency (`npm i three` — types via `@types/three`
 * if you want them; this file deliberately stays loosely typed around the
 * Three.js internals since it's a direct port of imperative scene code).
 *
 * Cover art: `coverURL` on each entry in BOOKS points at
 * `/covers/<name>.jpg` for local art (drop files in `public/covers/`) or an
 * external URL. External hosts without CORS headers (most stock photo /
 * retailer CDNs) will silently fall back to the procedurally painted cover,
 * exactly as in the original.
 *
 * Note on Three.js versions: this was written against three r128's API
 * (`THREE.sRGBEncoding`, `renderer.outputEncoding`). If your `three`
 * version is r152+, swap those for `THREE.SRGBColorSpace` /
 * `renderer.outputColorSpace` respectively.
 * ------------------------------------------------------------------------
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './book-showcase.css';

export function BooksScene() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const openBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dpRef = useRef<HTMLDivElement | null>(null);
  const dpTitleRef = useRef<HTMLHeadingElement | null>(null);
  const dpDescRef = useRef<HTMLParagraphElement | null>(null);
  const dpStarsRef = useRef<HTMLDivElement | null>(null);
  const dpYearRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvasEl = canvasRef.current;
    if (!root || !canvasEl) return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const setT = (fn: () => void, ms: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timeouts.push(id);
      return id;
    };

    // ---------------------------------------------------------------------
    // 0. Small utilities
    // ---------------------------------------------------------------------
    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    class Spring {
      v: number;
      t: number;
      vel: number;
      k: number;
      d: number;
      constructor(v: number, k?: number, d?: number) {
        this.v = v;
        this.t = v;
        this.vel = 0;
        this.k = k || 120;
        this.d = d || 14;
      }
      set(v: number) {
        this.v = v;
        this.t = v;
        this.vel = 0;
        return this;
      }
      update(dt: number) {
        const a = this.k * (this.t - this.v) - this.d * this.vel;
        this.vel += a * dt;
        this.v += this.vel * dt;
        return this.v;
      }
    }

    function mkCanvas(w: number, h: number) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    }

    function drawSpaced(x: CanvasRenderingContext2D, text: string, cx: number, y: number, ls: number) {
      const prev = x.textAlign;
      x.textAlign = 'left';
      const chars = [...text];
      let tot = 0;
      const ws = chars.map((ch) => {
        const w = x.measureText(ch).width;
        tot += w;
        return w;
      });
      tot += ls * (chars.length - 1);
      let px = cx - tot / 2;
      chars.forEach((ch, i) => {
        x.fillText(ch, px, y);
        px += ws[i] + ls;
      });
      x.textAlign = prev;
    }

    function rr(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number) {
      x.beginPath();
      x.moveTo(px + r, py);
      x.arcTo(px + w, py, px + w, py + h, r);
      x.arcTo(px + w, py + h, px, py + h, r);
      x.arcTo(px, py + h, px, py, r);
      x.arcTo(px, py, px + w, py, r);
      x.closePath();
    }

    // ---------------------------------------------------------------------
    // 1. Renderer, scene, camera, lights
    // ---------------------------------------------------------------------
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasEl,
        antialias: true,
        alpha: true,
      });
    } catch (e) {
      const fail = document.createElement('div');
      fail.className = 'bs-webgl-fail';
      fail.textContent =
        'This experience needs WebGL, which your browser blocked or does not support.';
      root.appendChild(fail);
      return;
    }

    // container-relative sizing: this section does not assume it owns the
    // whole viewport, so every place the original used innerWidth/innerHeight
    // now reads from `dims`, refreshed on resize.
    const dims = { w: 0, h: 0 };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const ANISO = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.set(0, 0.1, 9.6);

    function envBlob(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, rgb: string, a: number) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
      g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(cx, cy, r, 0, 6.2832);
      x.fill();
    }
    (function buildEnv() {
      const c = mkCanvas(512, 256),
        x = c.getContext('2d')!;
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#5a6ba6');
      g.addColorStop(0.55, '#262e52');
      g.addColorStop(1, '#0a0d1d');
      x.fillStyle = g;
      x.fillRect(0, 0, 512, 256);
      envBlob(x, 140, 66, 95, '255,255,255', 0.95);
      envBlob(x, 405, 84, 55, '255,214,168', 0.55);
      envBlob(x, 256, 150, 120, '255,155,185', 0.28);
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(tex).texture;
      tex.dispose();
      pmrem.dispose();
    })();

    const hemi = new THREE.HemisphereLight(0x8fa0d8, 0x0d1024, 0.32);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 0.82);
    key.position.set(3.5, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    const fillLight = new THREE.DirectionalLight(0xa9b6ff, 0.2);
    fillLight.position.set(-4, 1, 4);
    scene.add(fillLight);
    const rim = new THREE.DirectionalLight(0xff9db8, 0.3);
    rim.position.set(-2, 3, -5);
    scene.add(rim);

    const bookRoot = new THREE.Group();
    scene.add(bookRoot);

    // ---------------------------------------------------------------------
    // 2. Shared procedural textures
    // ---------------------------------------------------------------------
    function tex(c: HTMLCanvasElement) {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = ANISO;
      return t;
    }

    function noiseTexture(base: number, amp: number, scratches: boolean) {
      const s = 256,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      const img = x.createImageData(s, s),
        d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = base + (Math.random() - 0.5) * 2 * amp;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      if (scratches) {
        x.strokeStyle = 'rgba(200,200,200,.25)';
        x.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          x.beginPath();
          const y = Math.random() * s;
          x.moveTo(0, y);
          x.lineTo(s, y + (Math.random() - 0.5) * 22);
          x.stroke();
        }
      }
      return new THREE.CanvasTexture(c);
    }
    const laminateBump = noiseTexture(128, 10, true);
    const clothBump = (function () {
      const s = 128,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      x.fillStyle = '#808080';
      x.fillRect(0, 0, s, s);
      for (let i = 0; i < s; i += 2) {
        x.fillStyle = i % 4 === 0 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)';
        x.fillRect(i, 0, 1, s);
        x.fillRect(0, i, s, 1);
      }
      return new THREE.CanvasTexture(c);
    })();

    function striationTexture(vertical: boolean) {
      const s = 512,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      x.fillStyle = '#ece4d2';
      x.fillRect(0, 0, s, s);
      let p = 0;
      while (p < s) {
        const w = 1 + Math.random() * 2.4,
          tone = Math.random();
        x.fillStyle =
          tone < 0.12
            ? 'rgba(140,125,95,.5)'
            : tone < 0.5
              ? 'rgba(255,255,252,.55)'
              : 'rgba(190,178,150,.45)';
        if (vertical) x.fillRect(p, 0, w, s);
        else x.fillRect(0, p, s, w);
        p += w + 0.6 + Math.random() * 1.6;
      }
      for (let i = 0; i < 2600; i++) {
        x.fillStyle = 'rgba(120,108,84,' + (Math.random() * 0.1).toFixed(3) + ')';
        x.fillRect(Math.random() * s, Math.random() * s, 1.2, 1.2);
      }
      return tex(c);
    }
    const striV = striationTexture(true);
    const striH = striationTexture(false);

    const endpaperTex = (function () {
      const s = 512,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      x.fillStyle = '#f3edde';
      x.fillRect(0, 0, s, s);
      for (let i = 0; i < 1400; i++) {
        x.fillStyle = 'rgba(120,105,70,' + (0.04 + Math.random() * 0.08).toFixed(3) + ')';
        x.fillRect(Math.random() * s, Math.random() * s, 1.4, 1.4);
      }
      const g = x.createLinearGradient(0, 0, s, 0);
      g.addColorStop(0, 'rgba(0,0,0,.07)');
      g.addColorStop(0.12, 'rgba(0,0,0,0)');
      g.addColorStop(0.88, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.07)');
      x.fillStyle = g;
      x.fillRect(0, 0, s, s);
      return tex(c);
    })();

    const blobTex = (function () {
      const s = 256,
        c = mkCanvas(s, s),
        x = c.getContext('2d')!;
      const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(0,0,0,.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, s, s);
      return new THREE.CanvasTexture(c);
    })();

    // ---------------------------------------------------------------------
    // 3. Cover painters + book data
    // ---------------------------------------------------------------------
    function paintMoney(x: CanvasRenderingContext2D, w: number, h: number) {
      const GREEN = '#4cb960',
        INK = '#0d1117';
      x.fillStyle = GREEN;
      x.fillRect(0, 0, w, h);
      x.fillStyle = INK;
      x.font = '600 27px Georgia';
      drawSpaced(x, 'OVER EIGHT MILLION COPIES SOLD', w / 2, 84, 5);
      x.textAlign = 'center';
      x.font = '400 96px Georgia';
      x.fillText('The', w / 2, 190);
      x.textAlign = 'left';
      x.font = '700 152px Georgia';
      drawSpaced(x, 'Psychology', w / 2, 320, 0);
      x.textAlign = 'center';
      x.font = '400 96px Georgia';
      x.fillText('of', w / 2, 425);
      x.fillStyle = '#ffffff';
      x.font = '700 190px Georgia';
      x.fillText('Money', w / 2, 570);
      x.textAlign = 'left';

      const bcx = w / 2,
        bcy = 862;
      for (let side = -1; side <= 1; side += 2) {
        x.save();
        x.beginPath();
        x.ellipse(bcx + side * 118, bcy, 116, 148, side * 0.06, 0, 6.2832);
        x.clip();
        x.fillStyle = '#b9bfab';
        x.fillRect(bcx + side * 118 - 130, bcy - 160, 260, 320);
        for (let r = 0; r < 9; r++) {
          const yy = bcy - 132 + r * 34;
          x.lineCap = 'round';
          x.strokeStyle = 'rgba(38,44,34,.5)';
          x.lineWidth = 30;
          x.beginPath();
          x.moveTo(bcx + side * 4, yy + 8);
          x.bezierCurveTo(bcx + side * 96, yy - 24, bcx + side * 168, yy + 30, bcx + side * 250, yy + 12);
          x.stroke();
          x.strokeStyle = r % 2 ? '#eceadb' : '#cdd2bd';
          x.lineWidth = 21;
          x.beginPath();
          x.moveTo(bcx + side * 4, yy);
          x.bezierCurveTo(bcx + side * 96, yy - 32, bcx + side * 168, yy + 22, bcx + side * 250, yy + 4);
          x.stroke();
          x.strokeStyle = 'rgba(70,84,62,.45)';
          x.lineWidth = 2;
          x.beginPath();
          x.moveTo(bcx + side * 20, yy - 4);
          x.bezierCurveTo(bcx + side * 100, yy - 34, bcx + side * 164, yy + 18, bcx + side * 236, yy);
          x.stroke();
        }
        x.restore();
      }
      x.fillStyle = GREEN;
      x.fillRect(bcx - 7, bcy - 156, 14, 312);

      x.fillStyle = '#ffffff';
      x.beginPath();
      x.arc(w - 176, 900, 104, 0, 6.2832);
      x.fill();
      x.textAlign = 'center';
      x.fillStyle = '#2f9a52';
      x.font = 'italic 27px Georgia';
      x.fillText('Special', w - 176, 866);
      x.fillText('Edition', w - 176, 898);
      x.fillStyle = INK;
      x.font = '600 21px Arial';
      x.fillText('Includes 2', w - 176, 936);
      x.fillText('Bonus Chapters', w - 176, 962);

      x.textAlign = 'left';
      x.fillStyle = INK;
      x.font = '700 40px Arial';
      drawSpaced(x, 'TIMELESS LESSONS ON WEALTH,', w / 2, 1104, 4);
      drawSpaced(x, 'GREED, AND HAPPINESS', w / 2, 1158, 4);
      x.fillStyle = '#ffffff';
      x.font = '700 66px Arial';
      drawSpaced(x, 'MORGAN HOUSEL', w / 2, 1272, 10);
      x.fillStyle = INK;
      x.textAlign = 'center';
      x.font = '500 27px Georgia';
      x.fillText('"Everyone should own a copy."', w / 2, 1364);
      x.textAlign = 'left';
      x.font = '700 29px Arial';
      drawSpaced(x, 'JAMES CLEAR', w / 2, 1404, 5);
      x.textAlign = 'center';
      x.font = 'italic 25px Georgia';
      x.fillText('Bestselling Author of Atomic Habits', w / 2, 1442);
      x.textAlign = 'left';
    }

    function paintAlchemist(x: CanvasRenderingContext2D, w: number, h: number) {
      const RED = '#af2024',
        ORANGE = '#e8501f',
        GOLD = '#f2b31c',
        INK = '#2a1508';
      x.fillStyle = RED;
      x.fillRect(0, 0, w, h);
      x.fillStyle = ORANGE;
      x.fillRect(38, 38, w - 76, h - 76);
      x.strokeStyle = GOLD;
      x.lineWidth = 3;
      x.strokeRect(20, 20, w - 40, h - 40);

      const cx = w / 2,
        cy = 700,
        R = 292;
      x.save();
      x.beginPath();
      x.rect(38, 38, w - 76, h - 76);
      x.clip();

      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * 6.2832 + 0.098;
        x.save();
        x.translate(cx, cy);
        x.rotate(a);
        x.fillStyle = 'rgba(242,179,28,.85)';
        x.beginPath();
        x.moveTo(R + 8, -13);
        x.lineTo(1180, 0);
        x.lineTo(R + 8, 13);
        x.closePath();
        x.fill();
        for (let d = 0; d < 4; d++) {
          const rd = R + 120 + d * 190,
            sz = 20 - d * 2;
          x.fillStyle = d % 2 ? 'rgba(242,179,28,.95)' : 'rgba(175,32,36,.9)';
          x.beginPath();
          x.moveTo(rd, -sz);
          x.lineTo(rd + sz, 0);
          x.lineTo(rd, sz);
          x.lineTo(rd - sz, 0);
          x.closePath();
          x.fill();
        }
        x.restore();
      }

      x.fillStyle = '#b8351f';
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * 6.2832;
        x.beginPath();
        x.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 34, 0, 6.2832);
        x.fill();
      }
      x.fillStyle = GOLD;
      x.beginPath();
      x.arc(cx, cy, R - 4, 0, 6.2832);
      x.fill();
      x.strokeStyle = '#b8351f';
      x.lineWidth = 7;
      x.beginPath();
      x.arc(cx, cy, R - 26, 0, 6.2832);
      x.stroke();
      x.fillStyle = '#b8351f';
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * 6.2832;
        x.beginPath();
        x.arc(cx + Math.cos(a) * (R - 46), cy + Math.sin(a) * (R - 46), 5, 0, 6.2832);
        x.fill();
      }
      x.save();
      x.beginPath();
      x.arc(cx, cy, R - 56, 0, 6.2832);
      x.clip();
      x.strokeStyle = 'rgba(199,100,0,.55)';
      x.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        const yy = cy - 150 + i * 78;
        x.beginPath();
        x.moveTo(cx - 240, yy);
        x.bezierCurveTo(cx - 90, yy - 34, cx + 80, yy + 34, cx + 240, yy - 6);
        x.stroke();
      }
      x.restore();
      x.restore();

      x.fillStyle = INK;
      x.textAlign = 'center';
      x.font = 'italic 74px Georgia';
      x.fillText('The', cx, 638);
      x.textAlign = 'left';
      x.font = '700 78px Georgia';
      drawSpaced(x, 'ALCHEMIST', cx, 748, 3);
      x.textAlign = 'center';
      x.fillStyle = '#8f2a12';
      x.font = 'italic 40px Georgia';
      x.fillText('25th', cx, 826);
      x.textAlign = 'left';
      x.font = '600 20px Arial';
      drawSpaced(x, 'ANNIVERSARY', cx, 862, 6);
      drawSpaced(x, 'EDITION', cx, 890, 6);

      x.fillStyle = INK;
      x.font = '700 66px Georgia';
      drawSpaced(x, 'PAULO COELHO', cx, 1382, 4);
      x.fillStyle = 'rgba(242,179,28,.9)';
      [
        [140, 1400],
        [w - 140, 1400],
      ].forEach(([px, py]) => {
        x.beginPath();
        x.moveTo(px, py - 62);
        x.lineTo(px + 58, py);
        x.lineTo(px - 58, py);
        x.closePath();
        x.fill();
      });
      [
        [128, 118],
        [w - 128, 118],
      ].forEach(([px, py]) => {
        x.beginPath();
        x.moveTo(px - 46, py);
        x.quadraticCurveTo(px - 14, py - 30, px, py + 6);
        x.quadraticCurveTo(px + 14, py - 30, px + 46, py);
        x.quadraticCurveTo(px + 12, py + 4, px, py + 30);
        x.quadraticCurveTo(px - 12, py + 4, px - 46, py);
        x.closePath();
        x.fill();
      });
    }

    function paintBornACrime(x: CanvasRenderingContext2D, w: number, h: number) {
      const TEAL = '#07b1cb',
        YELLOW = '#f6e400';
      x.fillStyle = TEAL;
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const px = (((i * 977) % 1000) / 1000) * w,
          py = (((i * 613) % 1000) / 1000) * h,
          rw = 14 + ((i * 37) % 70),
          rh = 10 + ((i * 53) % 58);
        x.fillStyle =
          i % 3 === 0 ? 'rgba(214,206,190,.55)' : i % 3 === 1 ? 'rgba(6,132,152,.5)' : 'rgba(160,196,196,.32)';
        x.beginPath();
        x.ellipse(px, py, rw / 2, rh / 2, i, 0, 6.2832);
        x.fill();
      }

      const fx = w / 2 - 30,
        fy = 520,
        SKIN = '#c98b5c',
        SHADE = '#a96c42';
      x.fillStyle = '#22262a';
      x.beginPath();
      x.moveTo(fx - 330, h);
      x.quadraticCurveTo(fx - 250, fy + 250, fx, fy + 250);
      x.quadraticCurveTo(fx + 250, fy + 250, fx + 320, h);
      x.closePath();
      x.fill();
      x.strokeStyle = SHADE;
      x.lineWidth = 78;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(fx - 320, fy + 190);
      x.quadraticCurveTo(fx - 350, fy - 130, fx - 150, fy - 246);
      x.stroke();
      x.fillStyle = SKIN;
      x.beginPath();
      x.ellipse(fx, fy, 196, 244, 0.03, 0, 6.2832);
      x.fill();
      x.fillStyle = SHADE;
      x.beginPath();
      x.ellipse(fx - 150, fy + 40, 62, 148, 0.16, 0, 6.2832);
      x.fill();
      x.beginPath();
      x.ellipse(fx + 190, fy + 10, 30, 56, 0, 0, 6.2832);
      x.fill();
      x.fillStyle = '#2b2119';
      x.beginPath();
      x.ellipse(fx, fy - 186, 190, 96, 0, Math.PI, 6.2832);
      x.fill();
      x.fillStyle = SKIN;
      x.beginPath();
      x.ellipse(fx - 96, fy - 228, 104, 52, -0.22, 0, 6.2832);
      x.fill();
      for (let i = 0; i < 4; i++) {
        x.strokeStyle = 'rgba(120,74,42,.5)';
        x.lineWidth = 4;
        x.beginPath();
        x.moveTo(fx - 176 + i * 46, fy - 258);
        x.lineTo(fx - 162 + i * 46, fy - 196);
        x.stroke();
      }
      x.strokeStyle = '#2b1d12';
      x.lineWidth = 15;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(fx - 116, fy - 96);
      x.quadraticCurveTo(fx - 76, fy - 116, fx - 38, fy - 94);
      x.moveTo(fx + 40, fy - 100);
      x.quadraticCurveTo(fx + 80, fy - 120, fx + 116, fy - 98);
      x.stroke();
      x.fillStyle = '#f3e7d8';
      [
        [fx - 78, fy - 48],
        [fx + 78, fy - 52],
      ].forEach(([ex, ey]) => {
        x.beginPath();
        x.ellipse(ex, ey, 42, 20, 0, 0, 6.2832);
        x.fill();
      });
      x.fillStyle = '#3a2415';
      [
        [fx - 74, fy - 48],
        [fx + 82, fy - 52],
      ].forEach(([ex, ey]) => {
        x.beginPath();
        x.arc(ex, ey, 17, 0, 6.2832);
        x.fill();
      });
      x.strokeStyle = 'rgba(120,74,42,.65)';
      x.lineWidth = 9;
      x.beginPath();
      x.moveTo(fx + 6, fy - 30);
      x.quadraticCurveTo(fx + 16, fy + 46, fx - 22, fy + 62);
      x.stroke();
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.moveTo(fx - 96, fy + 122);
      x.quadraticCurveTo(fx - 4, fy + 100, fx + 92, fy + 118);
      x.quadraticCurveTo(fx - 2, fy + 204, fx - 96, fy + 122);
      x.fill();
      x.strokeStyle = 'rgba(90,52,30,.55)';
      x.lineWidth = 5;
      x.stroke();

      x.fillStyle = '#ffffff';
      x.font = '700 36px Arial';
      drawSpaced(x, 'THE MILLION-SELLING MUST-READ MEMOIR', w / 2, 82, 2);
      x.fillStyle = YELLOW;
      x.font = '700 34px Arial';
      x.textAlign = 'left';
      x.fillText("'POWERFUL", 700, 196);
      x.fillText('AND UNIQUE\'', 700, 236);
      x.fillStyle = '#ffffff';
      x.font = 'italic 30px Georgia';
      x.fillText('The Times', 700, 276);
      x.font = '700 34px Arial';
      x.fillText("'ESSENTIAL'", 84, 926);
      x.font = 'italic 30px Georgia';
      x.fillText('Guardian', 84, 966);

      x.fillStyle = '#ffffff';
      x.font = '700 168px Arial';
      drawSpaced(x, 'TREVOR', w / 2, 1116, 8);
      drawSpaced(x, 'NOAH', w / 2, 1268, 8);
      x.fillStyle = YELLOW;
      x.font = '700 116px Arial';
      drawSpaced(x, 'BORN A CRIME', w / 2, 1386, 4);
      x.fillStyle = '#ffffff';
      x.font = '700 34px Arial';
      drawSpaced(x, 'STORIES FROM A SOUTH AFRICAN CHILDHOOD', w / 2, 1462, 1);
    }

    type BookCfg = {
      id: string;
      title: string;
      author: string;
      year: string;
      stars: number;
      desc: string;
      front: (x: CanvasRenderingContext2D, w: number, h: number) => void;
      edge: string;
      backBg: string;
      backInk: string;
      spineBg: string;
      spineInk: string;
      spineFont: string;
      chapters: string[];
      coverURL: string | null;
    };

    function paintBack(x: CanvasRenderingContext2D, w: number, h: number, cfg: BookCfg) {
      x.fillStyle = cfg.backBg;
      x.fillRect(0, 0, w, h);
      const ink = cfg.backInk;
      x.fillStyle = 'rgba(' + ink + ',.5)';
      rr(x, 150, 190, w - 460, 28, 14);
      x.fill();
      for (let i = 0; i < 9; i++) {
        const lw = i === 8 ? w - 560 : w - 300 - Math.random() * 180;
        x.fillStyle = 'rgba(' + ink + ',.2)';
        rr(x, 150, 300 + i * 56, lw, 15, 7);
        x.fill();
      }
      x.fillStyle = 'rgba(' + ink + ',.45)';
      x.beginPath();
      x.arc(178, h - 186, 26, 0, 6.2832);
      x.fill();
      x.fillStyle = '#fff';
      rr(x, w - 330, h - 262, 236, 152, 8);
      x.fill();
      x.fillStyle = '#111';
      let bx = w - 310;
      while (bx < w - 118) {
        const bw = 2 + Math.random() * 6;
        if (Math.random() > 0.42) x.fillRect(bx, h - 242, bw, 96);
        bx += bw + 2 + Math.random() * 4;
      }
      x.font = '500 21px Arial';
      x.textAlign = 'center';
      x.fillText('9 781234 567890', w - 212, h - 124);
      x.textAlign = 'left';
    }

    function paintSpine(x: CanvasRenderingContext2D, w: number, h: number, cfg: BookCfg) {
      x.fillStyle = cfg.spineBg;
      x.fillRect(0, 0, w, h);
      x.save();
      x.translate(w / 2, h / 2);
      x.rotate(Math.PI / 2);
      x.fillStyle = cfg.spineInk;
      x.font = cfg.spineFont;
      drawSpaced(x, cfg.title.toUpperCase(), -h * 0.1, 15, 6);
      x.globalAlpha = 0.85;
      x.font = '600 25px Arial';
      drawSpaced(x, cfg.author.toUpperCase(), h * 0.325, 9, 4);
      x.globalAlpha = 1;
      x.restore();
      x.fillStyle = cfg.spineInk;
      x.globalAlpha = 0.6;
      x.fillRect(w / 2 - 26, 92, 52, 3);
      x.fillRect(w / 2 - 26, h - 95, 52, 3);
      x.globalAlpha = 1;
    }

    function trimToWidth(x: CanvasRenderingContext2D, text: string, maxW: number) {
      if (x.measureText(text).width <= maxW) return text;
      let t = text;
      while (t.length > 1 && x.measureText(t + '...').width > maxW) t = t.slice(0, -1);
      return t + '...';
    }

    function makeIndexPageTex(cfg: BookCfg) {
      const w = 1024,
        h = 1536,
        c = mkCanvas(w, h),
        x = c.getContext('2d')!;
      x.fillStyle = '#f4efdf';
      x.fillRect(0, 0, w, h);

      x.fillStyle = 'rgba(130,110,80,0.07)';
      for (let i = 0; i < 1600; i++) {
        x.fillRect(Math.random() * w, Math.random() * h, 1.1, 1.1);
      }

      x.fillStyle = '#2f2a23';
      x.textAlign = 'center';
      x.font = '700 84px Georgia';
      x.fillText('INDEX', w / 2, 190);
      x.globalAlpha = 0.26;
      x.fillRect(220, 225, w - 440, 3);
      x.globalAlpha = 1;

      const chapters = cfg.chapters || [
        'Introduction',
        'Main Ideas',
        'Practical Lessons',
        'Case Studies',
        'Takeaways',
        'Final Notes',
      ];
      x.textAlign = 'left';
      x.font = '500 46px Georgia';
      let y = 318;
      for (let i = 0; i < chapters.length; i++) {
        const n = String(i + 1).padStart(2, '0');
        const pageNo = String(7 + i * 14).padStart(3, ' ');
        const left = n + '. ' + trimToWidth(x, chapters[i], 650);
        x.fillStyle = '#2f2a23';
        x.fillText(left, 150, y);
        x.textAlign = 'right';
        x.fillStyle = '#5d5043';
        x.fillText(pageNo, w - 150, y);
        x.textAlign = 'left';
        x.globalAlpha = 0.22;
        x.fillRect(150, y + 16, w - 300, 2);
        x.globalAlpha = 1;
        y += 112;
      }
      return tex(c);
    }

    const BOOKS: BookCfg[] = [
      {
        id: 'money',
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        year: '2020',
        stars: 4,
        desc: 'The Psychology of Money is a set of nineteen short stories about how people actually behave around wealth, greed, risk, and happiness. Morgan Housel makes the case that doing well with money depends far less on intelligence than on temperament, patience, and the stories we tell ourselves.',
        front: paintMoney,
        edge: '#e4ead9',
        backBg: '#4cb960',
        backInk: '13,17,23',
        spineBg: '#4cb960',
        spineInk: '#ffffff',
        spineFont: '700 42px Georgia',
        chapters: [
          "No One's Crazy",
          'Luck and Risk',
          'Never Enough',
          'Confounding Compounding',
          'Tails, You Win',
          'Reasonable Over Rational',
        ],
        coverURL: '/covers/psychology-of-money.jpg',
      },
      {
        id: 'alchemist',
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        year: '1988',
        stars: 4,
        desc: 'The Alchemist follows Santiago, an Andalusian shepherd boy who leaves his flock to chase a recurring dream of treasure in the Egyptian pyramids. Paulo Coelho turns the journey into a fable about listening to your heart, reading the omens along the way, and the price of abandoning your own Personal Legend.',
        front: paintAlchemist,
        edge: '#e9dcbc',
        backBg: '#af2024',
        backInk: '252,232,196',
        spineBg: '#af2024',
        spineInk: '#f2b31c',
        spineFont: '700 44px Georgia',
        chapters: [
          'The Boy and His Dream',
          "Melchizedek's Gift",
          'Learning the Desert',
          'The Language of Omens',
          'The Alchemist',
          'The Treasure Revealed',
        ],
        coverURL: 'https://m.media-amazon.com/images/I/81ioPZFMeUL._UF1000,1000_QL80_.jpg',
      },
      {
        id: 'borncrime',
        title: 'Born a Crime',
        author: 'Trevor Noah',
        year: '2016',
        stars: 4,
        desc: "Born a Crime is Trevor Noah's memoir of growing up mixed-race in apartheid South Africa, where his very existence was illegal. Eighteen stories move between poverty, violence, and absurd comedy, held together by his mother's fierce, funny, unbreakable love.",
        front: paintBornACrime,
        edge: '#dce9e6',
        backBg: '#07b1cb',
        backInk: '255,255,255',
        spineBg: '#07b1cb',
        spineInk: '#f6e400',
        spineFont: '700 44px Arial',
        chapters: ['Run', 'Trevor, Pray', 'Chameleon', 'The Second Girl', 'Go Hitler!', "My Mother's Life"],
        coverURL: 'https://m.media-amazon.com/images/I/81fh8hPklHL._AC_UF1000,1000_QL80_.jpg',
      },
    ];

    // ---------------------------------------------------------------------
    // 4. Book construction
    // ---------------------------------------------------------------------
    const W = 1.42,
      H = 2.14,
      T = 0.34,
      CT = 0.032,
      OV = 0.05;
    const PAGE_N = 12,
      PW = W - 0.02,
      PH = H - 0.02;
    const BLOCK_D = 0.245,
      BLOCK_Z = -0.0205,
      PIVOT_Z = T / 2 + CT / 2,
      BPIVOT_Z = -(T / 2 + CT / 2);

    const coverGeo = new THREE.BoxGeometry(W + OV, H + OV * 2, CT);
    const blockGeo = new THREE.BoxGeometry(W - 0.015, H, BLOCK_D);
    const pageGeo = new THREE.PlaneGeometry(PW, PH);
    const spineGeo = new THREE.BoxGeometry(0.028, H + OV * 2, T + CT * 2 + 0.006);
    const hitGeo = new THREE.BoxGeometry(1.8, 2.5, 1.15);
    const blobGeo = new THREE.PlaneGeometry(1, 1);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    function std(o: THREE.MeshStandardMaterialParameters) {
      return new THREE.MeshStandardMaterial(Object.assign({ metalness: 0.02 }, o));
    }

    const paperFlat = std({ color: 0xf2ecdd, roughness: 0.95, envMapIntensity: 0.2 });
    const striMatV = std({ map: striV, bumpMap: striV, bumpScale: 0.0025, roughness: 0.95, envMapIntensity: 0.2 });
    const striMatH = std({ map: striH, bumpMap: striH, bumpScale: 0.0025, roughness: 0.95, envMapIntensity: 0.2 });
    const endpaperMat = std({ map: endpaperTex, roughness: 0.9, envMapIntensity: 0.25 });
    const pageMats = [0xf4eee0, 0xf1ebdb, 0xf6f0e3].map((c) =>
      std({ color: c, roughness: 0.92, envMapIntensity: 0.22, side: THREE.DoubleSide }),
    );

    type Book = {
      cfg: BookCfg;
      index: number;
      root: THREE.Group;
      float: THREE.Group;
      pivot: THREE.Group;
      backPivot: THREE.Group;
      frontMesh: THREE.Mesh;
      spine: THREE.Mesh;
      block: THREE.Mesh;
      pages: THREE.Group[];
      pageF: number[];
      pagesB: THREE.Group[];
      pageFB: number[];
      hit: THREE.Mesh;
      springs: Record<string, Spring>;
      phase: number;
      slotScale: number;
      hitEdge: number | null;
      scr: { x: number; y: number };
      orbY: number;
      orbYv: number;
      orbPhase: string;
      orbTarget: number;
      orbXs: Spring;
      exit: { segs: any[]; i: number; t: number } | null;
    };

    const books: Book[] = [];
    const hitMeshes: THREE.Mesh[] = [];

    function buildBook(cfg: BookCfg, index: number): Book {
      const root = new THREE.Group();
      const float = new THREE.Group();
      root.add(float);
      bookRoot.add(root);

      const fc = mkCanvas(1024, 1536);
      cfg.front(fc.getContext('2d')!, 1024, 1536);
      const bc = mkCanvas(1024, 1536);
      paintBack(bc.getContext('2d')!, 1024, 1536, cfg);
      const sc = mkCanvas(220, 1536);
      paintSpine(sc.getContext('2d')!, 220, 1536, cfg);
      const frontTex = tex(fc),
        backTex = tex(bc),
        spineTex = tex(sc);
      const indexPageMat = std({
        map: makeIndexPageTex(cfg),
        roughness: 0.92,
        envMapIntensity: 0.2,
        side: THREE.DoubleSide,
      });

      const mEdge = std({ color: cfg.edge, bumpMap: laminateBump, bumpScale: 0.0035, roughness: 0.68, envMapIntensity: 0.3 });
      const mFront = std({ map: frontTex, bumpMap: laminateBump, bumpScale: 0.0035, roughness: 0.54, envMapIntensity: 0.28 });
      const mBack = std({ map: backTex, bumpMap: laminateBump, bumpScale: 0.0035, roughness: 0.58, envMapIntensity: 0.26 });
      const mSpine = std({ map: spineTex, bumpMap: clothBump, bumpScale: 0.006, roughness: 0.78, envMapIntensity: 0.22 });

      if (cfg.coverURL) {
        new THREE.TextureLoader().setCrossOrigin('anonymous').load(
          cfg.coverURL,
          (t) => {
            if (cancelled) return;
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = ANISO;
            mFront.map = t;
            mFront.needsUpdate = true;
          },
          undefined,
          () => console.warn('Cover blocked by CORS, procedural kept:', cfg.title),
        );
      }

      const backPivot = new THREE.Group();
      backPivot.position.set(-W / 2, 0, BPIVOT_Z);
      const backMesh = new THREE.Mesh(coverGeo, [mEdge, mEdge, mEdge, mEdge, endpaperMat, mBack]);
      backMesh.position.x = (W + OV) / 2;
      backMesh.castShadow = backMesh.receiveShadow = true;
      backPivot.add(backMesh);
      float.add(backPivot);

      const pivot = new THREE.Group();
      pivot.position.set(-W / 2, 0, PIVOT_Z);
      const frontMesh = new THREE.Mesh(coverGeo, [mEdge, mEdge, mEdge, mEdge, mFront, endpaperMat]);
      frontMesh.position.x = (W + OV) / 2;
      frontMesh.castShadow = frontMesh.receiveShadow = true;
      pivot.add(frontMesh);
      float.add(pivot);

      const spine = new THREE.Mesh(spineGeo, mSpine);
      spine.position.set(-W / 2 - 0.013, 0, 0);
      spine.castShadow = true;
      float.add(spine);

      const block = new THREE.Mesh(blockGeo, [striMatV, paperFlat, striMatH, striMatH, paperFlat, paperFlat]);
      block.position.set(-0.0075, 0, BLOCK_Z);
      block.castShadow = block.receiveShadow = true;
      float.add(block);

      const pages: THREE.Group[] = [],
        pageF: number[] = [];
      for (let i = 0; i < PAGE_N; i++) {
        const pp = new THREE.Group();
        pp.position.set(-W / 2 + 0.01, (Math.random() - 0.5) * 0.006, 0.166 - i * 0.0042);
        const pm = new THREE.Mesh(pageGeo, i === 0 ? indexPageMat : pageMats[i % 3]);
        pm.position.x = PW / 2;
        pm.rotation.z = (Math.random() - 0.5) * 0.006;
        pp.add(pm);
        float.add(pp);
        pages.push(pp);
        pageF.push(0.3 * Math.pow(1 - i / PAGE_N, 2.6));
      }

      const pagesB: THREE.Group[] = [],
        pageFB: number[] = [];
      for (let i = 0; i < 6; i++) {
        const pp = new THREE.Group();
        pp.position.set(-W / 2 + 0.01, (Math.random() - 0.5) * 0.006, -0.166 + i * 0.0042);
        const pm = new THREE.Mesh(pageGeo, pageMats[i % 3]);
        pm.position.x = PW / 2;
        pm.rotation.z = (Math.random() - 0.5) * 0.006;
        pp.add(pm);
        float.add(pp);
        pagesB.push(pp);
        pageFB.push(0.3 * Math.pow(1 - i / 6, 2.6));
      }

      const blob = new THREE.Mesh(
        blobGeo,
        new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0.45, depthWrite: false }),
      );
      blob.scale.set(3.1, 3.9, 1);
      blob.position.set(0.1, -0.3, -0.85);
      blob.renderOrder = -5;
      root.add(blob);

      const hit = new THREE.Mesh(hitGeo, hitMat);
      float.add(hit);
      hitMeshes.push(hit);

      const springs: Record<string, Spring> = {
        px: new Spring(0, 17, 6.8),
        py: new Spring(0, 17, 6.8),
        pz: new Spring(0, 17, 6.8),
        rx: new Spring(0, 17, 6.8),
        ry: new Spring(0, 17, 6.8),
        rz: new Spring(0, 17, 6.8),
        sc: new Spring(1, 17, 6.8),
        tiltX: new Spring(0, 120, 13),
        tiltY: new Spring(0, 120, 13),
        lift: new Spring(0, 120, 13),
        cover: new Spring(0, 90, 12),
        coverB: new Spring(0, 90, 12),
        drag: new Spring(0, 160, 16),
      };

      const b: Book = {
        cfg,
        index,
        root,
        float,
        pivot,
        backPivot,
        frontMesh,
        spine,
        block,
        pages,
        pageF,
        pagesB,
        pageFB,
        hit,
        springs,
        phase: Math.random() * 6.28,
        slotScale: 1,
        hitEdge: null,
        scr: { x: 0, y: 0 },
        orbY: 0,
        orbYv: 0,
        orbPhase: 'idle',
        orbTarget: 0,
        orbXs: new Spring(0, 60, 12),
        exit: null,
      };
      books.push(b);
      return b;
    }
    BOOKS.forEach(buildBook);
    const bookByHit = (m: THREE.Object3D) => books.find((b) => b.hit === m)!;

    // ---------------------------------------------------------------------
    // 5. Floating leaves (detail view)
    // ---------------------------------------------------------------------
    const leaves = {
      items: [] as any[],
      anchor: null as Book | null,
      activate(book: Book) {
        this.anchor = book;
        this.items.forEach((l) => {
          l.kick.set(-l.hx + (Math.random() - 0.5) * 0.6, -l.hy + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.5);
          l.s.t = l.size;
          l.mesh.visible = true;
        });
      },
      deactivate() {
        this.items.forEach((l) => {
          l.s.t = 0;
        });
      },
      push(dx: number, dy: number) {
        if (!this.anchor) return;
        this.items.forEach((l) => {
          l.kick.x += dx * 2.4 * Math.random();
          l.kick.y += -dy * 2.4 * Math.random();
        });
      },
      update(dt: number, t: number) {
        if (!this.anchor) return;
        const ap = this.anchor.root.position;
        const w = RM ? 0.15 : 1;
        this.items.forEach((l) => {
          l.kick.multiplyScalar(Math.exp(-1.15 * dt));
          l.mesh.position.set(
            ap.x + l.hx + Math.sin(t * l.sp + l.ph) * 0.4 * w + l.kick.x,
            ap.y + l.hy + Math.cos(t * l.sp * 0.83 + l.ph * 1.3) * 0.3 * w + l.kick.y,
            ap.z * 0.4 + l.hz + l.kick.z,
          );
          l.mesh.rotation.x += l.rv.x * dt * (0.3 + w);
          l.mesh.rotation.y += l.rv.y * dt * (0.3 + w);
          l.mesh.rotation.z += l.rv.z * dt * (0.3 + w);
          const s = l.s.update(dt);
          l.mesh.scale.setScalar(Math.max(s, 0.0001));
          if (l.s.t === 0 && s < 0.01) l.mesh.visible = false;
        });
      },
    };
    (function buildLeaves() {
      const shape = new THREE.Shape();
      shape.moveTo(0, -0.5);
      shape.bezierCurveTo(0.3, -0.28, 0.3, 0.22, 0, 0.55);
      shape.bezierCurveTo(-0.3, 0.22, -0.3, -0.28, 0, -0.5);
      const geo = new THREE.ShapeGeometry(shape, 10);
      const cols = [0x3e7c3f, 0x57944a, 0x2f6136, 0x6aa557];
      for (let i = 0; i < 16; i++) {
        const mat = std({ color: cols[i % 4], roughness: 0.55, envMapIntensity: 0.3, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        bookRoot.add(mesh);
        let hx = (Math.random() - 0.5) * 4.6;
        if (i % 5 === 0) hx += 2.8 * Math.sign(hx || 1);
        leaves.items.push({
          mesh,
          hx,
          hy: (Math.random() - 0.5) * 3.2,
          hz: -0.5 + Math.random() * 1.5,
          sp: 0.25 + Math.random() * 0.5,
          ph: Math.random() * 6.28,
          rv: new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8),
          kick: new THREE.Vector3(),
          size: 0.14 + Math.random() * 0.16,
          s: new Spring(0, 60, 10),
        });
      }
    })();

    // ---------------------------------------------------------------------
    // 6. Layout slots + state machine
    // ---------------------------------------------------------------------
    const state: {
      mode: string;
      selected: Book | null;
      hovered: Book | null;
      pillLock: Book | null;
      kbIndex: number;
    } = { mode: 'hero', selected: null, hovered: null, pillLock: null, kbIndex: -1 };

    type Slot = { p: [number, number, number]; r: [number, number, number]; s: number };
    const SLOTS: { hero: Slot[]; detail: Slot | null; portrait: boolean } = { hero: [], detail: null, portrait: false };

    function computeSlots() {
      const a = dims.w / Math.max(1, dims.h);
      const fit = clamp(a / 1.75, 0.56, 1);
      bookRoot.scale.setScalar(fit);
      bookRoot.position.y = -(1 - fit) * 0.55;
      SLOTS.portrait = a < 0.85;

      SLOTS.hero = SLOTS.portrait
        ? [
            { p: [-1.36, -1.0, -0.12], r: [-0.045, 0.4, 0.185], s: 1.39 },
            { p: [0.2, -0.45, 0.6], r: [-0.05, -0.1, -0.035], s: 1.52 },
            { p: [1.62, -1.1, -0.34], r: [-0.045, -0.42, -0.17], s: 1.39 },
          ]
        : [
            { p: [-2.06, -1.23, -0.12], r: [-0.045, 0.4, 0.185], s: 1.39 },
            { p: [0.3, -1.08, 0.6], r: [-0.05, -0.1, -0.035], s: 1.52 },
            { p: [2.45, -1.41, -0.34], r: [-0.045, -0.42, -0.17], s: 1.39 },
          ];

      if (SLOTS.portrait) {
        const el = dpRef.current;
        const panelH = el && el.offsetHeight > 40 ? el.offsetHeight : dims.h * 0.44;
        const gap = dims.h * 0.035,
          navB = dims.h * 0.1;
        const freeTop = navB;
        const freeBot = Math.max(dims.h - panelH - gap, freeTop + 140);
        const midPx = (freeTop + freeBot) / 2;
        const T13 = 0.23087,
          camZp = 9.9,
          zw = 0.8 * fit,
          rootY = -(1 - fit) * 0.55;
        const yw = 0.1 + (1 - (2 * midPx) / dims.h) * T13 * (camZp - zw);
        const availW = (((freeBot - freeTop) * 0.92) / dims.h) * 2 * T13 * (camZp - zw);
        const s = clamp(availW / fit / 2.3, 0.5, 1.15);
        SLOTS.detail = { p: [0, (yw - rootY) / fit, 0.8], r: [-0.02, -0.4, 0.06], s };
      } else {
        SLOTS.detail = { p: [-1.95, 0.0, 1.1], r: [0.02, -0.52, 0.1], s: 1.26 };
      }
    }

    function setTargets(b: Book, slot: Slot) {
      const s = b.springs;
      s.px.t = slot.p[0];
      s.py.t = slot.p[1];
      s.pz.t = slot.p[2];
      s.rx.t = slot.r[0];
      s.ry.t = slot.r[1];
      s.rz.t = slot.r[2];
      b.slotScale = slot.s;
    }

    const EASE = {
      hold: () => 1,
      outQuad: (t: number) => 1 - (1 - t) * (1 - t),
      outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
      inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
    };

    const LIFT = 0.38,
      CLEAR = 4.2;

    function playY(b: Book, segs: any[]) {
      b.exit = { segs, i: 0, t: 0 };
    }

    function stepY(b: Book, dt: number) {
      const ex = b.exit!,
        s = b.springs;
      ex.t += dt;
      let seg = ex.segs[ex.i];
      while (seg && ex.t >= seg.d) {
        ex.t -= seg.d;
        s.py.v = seg.to;
        if (seg.end) seg.end();
        seg = ex.segs[++ex.i];
      }
      if (seg) s.py.v = seg.from + (seg.to - seg.from) * seg.ease(ex.t / seg.d);
      else b.exit = null;
      s.py.t = s.py.v;
      s.py.vel = 0;
    }

    function pinInPlace(b: Book) {
      const s = b.springs;
      s.px.t = s.px.v;
      s.pz.t = s.pz.v;
      s.rx.t = s.rx.v;
      s.ry.t = s.ry.v;
      s.rz.t = s.rz.v;
    }

    function sendOut(b: Book, i: number, delay: number) {
      const y0 = SLOTS.hero[i].p[1],
        here = b.springs.py.v,
        apex = y0 + LIFT;
      b.root.visible = true;
      pinInPlace(b);
      playY(b, [
        { d: delay, from: here, to: here, ease: EASE.hold },
        { d: 0.28, from: here, to: apex, ease: EASE.outQuad },
        {
          d: 0.9,
          from: apex,
          to: y0 - CLEAR,
          ease: EASE.inOutSine,
          end: () => {
            b.root.visible = false;
          },
        },
      ]);
    }

    function bringBack(b: Book, i: number, delay: number) {
      const here = b.springs.py.v;
      b.root.visible = true;
      pinInPlace(b);
      playY(b, [
        { d: delay, from: here, to: here, ease: EASE.hold },
        { d: 1.0, from: here, to: SLOTS.hero[i].p[1], ease: EASE.outQuint },
      ]);
    }

    function applyMode() {
      if (state.mode === 'hero' || state.mode === 'closing') {
        books.forEach((b, i) => setTargets(b, SLOTS.hero[i]));
      } else if (state.selected) {
        setTargets(state.selected, SLOTS.detail!);
      }
    }

    const camX = new Spring(0, 13, 6.5),
      camY = new Spring(0.1, 13, 6.5),
      camZ = new Spring(9.6, 13, 6.5);
    const lookX = new Spring(0, 13, 6.5),
      lookY = new Spring(0, 13, 6.5);
    const parX = new Spring(0, 60, 10),
      parY = new Spring(0, 60, 10);

    function camTo(mode: string) {
      if (mode === 'detail') {
        camX.t = SLOTS.portrait ? 0 : -0.4;
        camZ.t = SLOTS.portrait ? 9.9 : 8.9;
        lookX.t = SLOTS.portrait ? 0 : -0.5;
        lookY.t = SLOTS.portrait ? 0 : 0.15;
      } else {
        camX.t = 0;
        camZ.t = 9.6;
        lookX.t = 0;
        lookY.t = 0;
      }
    }

    function populatePanel(cfg: BookCfg) {
      if (dpTitleRef.current) dpTitleRef.current.textContent = cfg.title;
      if (dpDescRef.current) dpDescRef.current.textContent = cfg.desc;
      if (dpYearRef.current) dpYearRef.current.textContent = cfg.year;
      const STAR =
        '<svg viewBox="0 0 24 24" class="CLS"><path d="M12 2.6l2.8 6 6.6.6-5 4.4 1.5 6.5L12 16.7 6.1 20.1l1.5-6.5-5-4.4 6.6-.6z"/></svg>';
      let s = '';
      for (let i = 0; i < 5; i++) s += STAR.replace('CLS', i < cfg.stars ? '' : 'dim');
      if (dpStarsRef.current) dpStarsRef.current.innerHTML = s;
    }

    const pillX = new Spring(0, 190, 23),
      pillY = new Spring(0, 190, 23);
    let pillOn = false;
    function hidePill() {
      openBtnRef.current?.classList.remove('on');
      pillOn = false;
    }

    function open(book: Book | null) {
      if (state.mode !== 'hero' || !book) return;
      state.mode = 'opening';
      state.selected = book;
      state.pillLock = null;
      state.kbIndex = -1;
      hidePill();
      book.exit = null;
      root!.classList.add('transit');
      populatePanel(book.cfg);
      computeSlots();

      let out = 0;
      books.forEach((b, i) => {
        if (b !== book) sendOut(b, i, out++ * 0.08);
      });

      setT(() => {
        if (state.mode !== 'opening' && state.mode !== 'detail') return;
        book.orbY = RM ? 0 : -6.2832;
        book.orbYv = RM ? 0 : 3;
        book.orbPhase = 'return';
        book.orbTarget = 0;
        book.orbXs.set(0);
        applyMode();
        camTo('detail');
      }, 760);
      setT(() => leaves.activate(book), 1000);
      setT(() => {
        if (state.mode === 'opening') {
          root!.classList.add('detail-open');
          state.mode = 'detail';
        }
      }, 1400);
    }

    function close() {
      if (state.mode !== 'detail') return;
      state.mode = 'closing';
      root!.classList.remove('detail-open');
      leaves.deactivate();
      orbit.drag = false;
      const b = state.selected;
      if (b) {
        b.orbTarget = Math.round(b.orbY / 6.2832) * 6.2832 + 6.2832;
        b.orbYv = Math.max(b.orbYv, 3);
        b.orbPhase = 'return';
        b.orbXs.t = 0;
      }
      setT(() => {
        root!.classList.remove('transit');
        applyMode();
        camTo('hero');
        let back = 0;
        books.forEach((bk, i) => {
          if (bk !== b) bringBack(bk, i, 0.85 + back++ * 0.1);
        });
      }, 250);
      setT(() => {
        if (state.mode === 'closing') {
          state.mode = 'hero';
          state.selected = null;
        }
      }, 1600);
    }

    const onCloseClick = () => close();
    closeBtnRef.current?.addEventListener('click', onCloseClick);

    // ---------------------------------------------------------------------
    // 7. Input: pointer as hand, drag to peel, keyboard
    // ---------------------------------------------------------------------
    const ptr = {
      ndcX: 0,
      ndcY: 0,
      cx: 0,
      cy: 0,
      lastX: 0,
      lastY: 0,
      down: false,
      downX: 0,
      downY: 0,
      moved: 0,
      t0: 0,
      type: 'mouse',
      seen: false,
      id: null as number | null,
    };
    const isTouch = () => ptr.type === 'touch' || ptr.type === 'pen';
    let dragBook: Book | null = null,
      rayBook: Book | null = null;
    const orbit = { drag: false, dxAcc: 0, dyAcc: 0 };
    const ray = new THREE.Raycaster();
    const tmpV = new THREE.Vector3();

    const canvas = canvasEl;
    const onContextMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', onContextMenu);

    const onPointerLeave = () => {
      rayBook = null;
      state.pillLock = null;
      state.kbIndex = -1;
    };
    canvas.addEventListener('pointerleave', onPointerLeave);

    const localXY = (e: PointerEvent) => {
      const r = root!.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (ptr.id !== null && e.pointerId !== ptr.id) return;
      const { x: cx, y: cy } = localXY(e);
      const dxN = (cx - ptr.lastX) / dims.w;
      const dyN = (cy - ptr.lastY) / dims.h;
      ptr.lastX = cx;
      ptr.lastY = cy;
      ptr.cx = cx;
      ptr.cy = cy;
      ptr.ndcX = (cx / dims.w) * 2 - 1;
      ptr.ndcY = -(cy / dims.h) * 2 + 1;
      ptr.type = e.pointerType || 'mouse';
      ptr.seen = true;
      if (state.mode === 'detail') leaves.push(dxN, dyN);
      if (ptr.down && dragBook) {
        ptr.moved += Math.abs(dxN * dims.w) + Math.abs(dyN * dims.h);
        dragBook.springs.drag.t = clamp(((ptr.downX - cx) / dims.w) * 3.4, 0, 1.0);
      }
      if (ptr.down && orbit.drag) {
        orbit.dxAcc += dxN;
        orbit.dyAcc += dyN;
        ptr.moved += Math.abs(dxN * dims.w) + Math.abs(dyN * dims.h);
      }
    };
    canvas.addEventListener('pointermove', onPointerMove);

    const onPointerDown = (e: PointerEvent) => {
      if (ptr.id !== null) return;
      ptr.id = e.pointerId;
      const { x: cx, y: cy } = localXY(e);
      ptr.cx = cx;
      ptr.cy = cy;
      ptr.lastX = cx;
      ptr.lastY = cy;
      ptr.ndcX = (cx / dims.w) * 2 - 1;
      ptr.ndcY = -(cy / dims.h) * 2 + 1;
      ptr.type = e.pointerType || 'mouse';
      ptr.seen = true;
      castRay();
      if (state.mode === 'hero' && rayBook) {
        ptr.down = true;
        dragBook = rayBook;
        ptr.downX = cx;
        ptr.downY = cy;
        ptr.moved = 0;
        ptr.t0 = performance.now();
        canvas.setPointerCapture(e.pointerId);
      } else if (state.mode === 'detail' && rayBook === state.selected) {
        ptr.down = true;
        orbit.drag = true;
        orbit.dxAcc = 0;
        orbit.dyAcc = 0;
        ptr.moved = 0;
        ptr.t0 = performance.now();
        canvas.setPointerCapture(e.pointerId);
      } else {
        state.pillLock = null;
        state.kbIndex = -1;
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);

    const onPointerUp = (e: PointerEvent) => {
      if (ptr.id !== null && e.pointerId !== ptr.id) return;
      ptr.id = null;
      orbit.drag = false;
      if (dragBook) {
        const slop = isTouch() ? 26 : 14;
        const limit = isTouch() ? 650 : 450;
        const wasDrag = ptr.moved > slop;
        dragBook.springs.drag.t = 0;
        if (!wasDrag && state.mode === 'hero' && performance.now() - ptr.t0 < limit) open(dragBook);
        dragBook = null;
      }
      ptr.down = false;
      if (isTouch()) rayBook = null;
    };
    window.addEventListener('pointerup', onPointerUp);

    const cancelPointer = (e?: PointerEvent) => {
      if (e && ptr.id !== null && e.pointerId !== ptr.id) return;
      ptr.id = null;
      ptr.down = false;
      orbit.drag = false;
      if (dragBook) {
        dragBook.springs.drag.t = 0;
        dragBook = null;
      }
      if (isTouch()) rayBook = null;
    };
    window.addEventListener('pointercancel', cancelPointer as any);
    canvas.addEventListener('lostpointercapture', cancelPointer as any);

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (state.mode !== 'hero') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const d = e.key === 'ArrowRight' ? 1 : -1;
        state.kbIndex = ((state.kbIndex < 0 ? (d > 0 ? -1 : 1) : state.kbIndex) + d + 3) % 3;
        state.pillLock = null;
        e.preventDefault();
      }
      if (e.key === 'Enter' && state.hovered) open(state.hovered);
    };
    window.addEventListener('keydown', onKeydown);

    function castRay() {
      ray.setFromCamera({ x: ptr.ndcX, y: ptr.ndcY } as THREE.Vector2, camera);
      const hits = ray.intersectObjects(hitMeshes, false);
      if (hits.length) {
        rayBook = bookByHit(hits[0].object);
        const lp = rayBook.hit.worldToLocal(hits[0].point.clone());
        rayBook.hitEdge = clamp((lp.x / 0.9) * 0.5 + 0.5, 0, 1);
      } else {
        rayBook = null;
      }
    }

    // ---------------------------------------------------------------------
    // 8. Frame loop
    // ---------------------------------------------------------------------
    const clock = new THREE.Clock();
    const idle = RM ? 0 : 1;
    const DETAIL_OPEN_ANGLE = 1.18;
    const DETAIL_OPEN_SWAY = 0.05;

    function screenPos(b: Book) {
      b.root.getWorldPosition(tmpV).project(camera);
      b.scr.x = (tmpV.x * 0.5 + 0.5) * dims.w;
      b.scr.y = (-tmpV.y * 0.5 + 0.5) * dims.h;
    }

    function tickBook(b: Book, dt: number, t: number) {
      const s = b.springs;
      const isHov = state.hovered === b;
      const inDetail = state.mode === 'detail' && state.selected === b;
      const orbitActive = state.selected === b && state.mode !== 'hero';

      let activity = 0;
      if (orbitActive) {
        if (orbit.drag && inDetail) {
          const step = orbit.dxAcc * 6.5;
          orbit.dxAcc = 0;
          b.orbY += step;
          b.orbYv = clamp(b.orbYv * 0.5 + (step / Math.max(dt, 0.001)) * 0.5, -14, 14);
          b.orbXs.t = clamp(b.orbXs.t + orbit.dyAcc * 3.2, -0.55, 0.55);
          orbit.dyAcc = 0;
          b.orbPhase = 'drag';
        } else {
          b.orbXs.t = 0;
          if (b.orbPhase === 'drag') {
            if (Math.abs(b.orbYv) > 0.6) {
              b.orbPhase = 'spin';
            } else {
              b.orbPhase = 'return';
              b.orbTarget = Math.round((b.orbY + b.orbYv * 1.2) / Math.PI) * Math.PI;
            }
          }
          if (b.orbPhase === 'spin') {
            b.orbYv *= Math.exp(-0.9 * dt);
            b.orbY += b.orbYv * dt;
            if (Math.abs(b.orbYv) < 0.5) {
              b.orbPhase = 'return';
              b.orbTarget = Math.round((b.orbY + b.orbYv * 1.2) / Math.PI) * Math.PI;
            }
          } else if (b.orbPhase === 'return') {
            const acc = 16 * (b.orbTarget - b.orbY) - 8 * b.orbYv;
            b.orbYv += acc * dt;
            b.orbY += b.orbYv * dt;
            if (Math.abs(b.orbTarget - b.orbY) < 0.002 && Math.abs(b.orbYv) < 0.01) {
              b.orbY = b.orbTarget;
              b.orbYv = 0;
              b.orbPhase = 'idle';
            }
          }
        }
        const distRest = Math.abs(b.orbY - Math.round(b.orbY / 6.2832) * 6.2832);
        activity = clamp(Math.abs(b.orbYv) * 1.5 + (orbit.drag ? 1 : 0) + distRest * 2, 0, 1);
      }
      b.orbXs.update(dt);

      let coverBase = 0;
      if (inDetail) coverBase = DETAIL_OPEN_ANGLE + Math.sin(t * 0.8 + b.phase) * DETAIL_OPEN_SWAY * idle;
      const fan = orbitActive ? clamp(b.orbYv * 0.16, 0, 0.75) : 0;
      const fanB = orbitActive ? clamp(-b.orbYv * 0.16, 0, 0.75) : 0;
      let coverBBase = 0;
      if (inDetail) {
        coverBBase = 0.2 + Math.sin(t * 0.8 + b.phase + 1.7) * 0.02 * idle;
      }

      if (isHov && ptr.seen && state.mode === 'hero') {
        const dxN = (ptr.cx - b.scr.x) / (dims.w * 0.25);
        const dyN = (b.scr.y - ptr.cy) / (dims.h * 0.3);
        s.tiltY.t = clamp(dxN * 0.28, -0.15, 0.15);
        s.tiltX.t = clamp(-dyN * 0.1, -0.09, 0.1);
        s.lift.t = 0.3;
        const edge = b.hitEdge != null ? b.hitEdge : 0.5;
        coverBase = 0.085 + edge * 0.16 + clamp(dyN, 0, 1) * 0.09;
      } else {
        s.tiltY.t = 0;
        s.tiltX.t = 0;
        s.lift.t = 0;
      }
      s.cover.t = coverBase + fan;
      s.coverB.t = coverBBase + fanB;
      s.sc.t = b.slotScale * (isHov && state.mode === 'hero' ? 1.09 : 1);

      s.px.update(dt);
      if (b.exit) stepY(b, dt);
      else s.py.update(dt);
      s.pz.update(dt);
      s.rx.update(dt);
      s.ry.update(dt);
      s.rz.update(dt);
      s.sc.update(dt);
      s.tiltX.update(dt);
      s.tiltY.update(dt);
      s.lift.update(dt);
      s.cover.update(dt);
      s.coverB.update(dt);
      s.drag.update(dt);

      b.float.position.y = Math.sin(t * 0.7 + b.phase) * 0.035 * idle;
      b.float.rotation.z = Math.sin(t * 0.9 + b.phase * 1.7) * 0.006 * idle;

      b.root.position.set(s.px.v, s.py.v, s.pz.v + s.lift.v);
      const sway = inDetail ? Math.sin(t * 0.45 + b.phase) * 0.035 * idle * (1 - activity) : 0;
      const swing = clamp(-s.px.vel * 0.12, -0.5, 0.5);
      b.root.rotation.set(s.rx.v + s.tiltX.v + b.orbXs.v, s.ry.v + s.tiltY.v + b.orbY + sway + swing, s.rz.v);
      b.root.scale.setScalar(Math.max(s.sc.v, 0.001));

      const ang = Math.max(0, s.cover.v + s.drag.v);
      const angB = Math.max(0, s.coverB.v);
      b.pivot.rotation.y = -ang;
      b.pivot.position.z = PIVOT_Z + ang * 0.022;
      b.backPivot.rotation.y = angB;
      b.backPivot.position.z = BPIVOT_Z - angB * 0.022;
      b.spine.rotation.y = -ang * 0.16 + angB * 0.16;
      b.block.scale.z = 1 - (ang + angB) * 0.05;
      b.block.position.z = BLOCK_Z - ang * 0.006 + angB * 0.006;
      for (let i = 0; i < PAGE_N; i++) {
        const fl = idle * Math.sin(t * 1.15 + b.phase + i * 0.6) * 0.006 * (1 - i / PAGE_N);
        b.pages[i].rotation.y = -(ang * b.pageF[i] + Math.max(0, fl));
      }
      for (let i = 0; i < 6; i++) b.pagesB[i].rotation.y = angB * b.pageFB[i];
    }

    let rafId = 0;
    function animate() {
      if (cancelled) return;
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (ptr.seen && (ptr.type === 'mouse' || ptr.down)) castRay();
      let hov: Book | null = null;
      if (state.mode === 'hero') {
        hov = rayBook || state.pillLock || (state.kbIndex >= 0 ? books[state.kbIndex] : null);
      } else if (state.mode === 'detail') {
        hov = rayBook === state.selected ? rayBook : null;
      }
      state.hovered = hov;
      let cur = 'default';
      if (state.mode === 'hero' && hov) cur = 'pointer';
      else if (state.mode === 'detail' && state.selected) {
        if (orbit.drag) cur = 'grabbing';
        else if (rayBook === state.selected) cur = 'grab';
      }
      canvas.style.cursor = cur;

      books.forEach((b) => screenPos(b));
      books.forEach((b) => tickBook(b, dt, t));
      leaves.update(dt, t);

      parX.t = RM ? 0 : ptr.ndcX * 0.02;
      parY.t = RM ? 0 : -ptr.ndcY * 0.012;
      bookRoot.rotation.y = parX.update(dt);
      bookRoot.rotation.x = parY.update(dt);

      camera.position.set(camX.update(dt), camY.update(dt), camZ.update(dt));
      camera.lookAt(lookX.update(dt), lookY.update(dt), 0);

      if (state.mode === 'hero' && state.hovered && ptr.seen && !isTouch() && !(ptr.down && ptr.moved > 14)) {
        const tx = ptr.cx,
          ty = ptr.cy + 34;
        if (!pillOn) {
          pillX.set(tx);
          pillY.set(ty);
          pillOn = true;
        }
        pillX.t = tx;
        pillY.t = ty;
        if (openBtnRef.current) {
          openBtnRef.current.style.left = pillX.update(dt) + 'px';
          openBtnRef.current.style.top = pillY.update(dt) + 'px';
          openBtnRef.current.classList.add('on');
        }
      } else {
        hidePill();
      }

      renderer.render(scene, camera);
    }

    // ---------------------------------------------------------------------
    // 9. Entrance + resize
    // ---------------------------------------------------------------------
    function relayout() {
      const r = root!.getBoundingClientRect();
      dims.w = Math.max(1, Math.round(r.width));
      dims.h = Math.max(1, Math.round(r.height));
      renderer.setSize(dims.w, dims.h);
      camera.aspect = dims.w / dims.h;
      camera.updateProjectionMatrix();
      computeSlots();
      applyMode();
      camTo(state.mode === 'detail' || state.mode === 'opening' ? 'detail' : 'hero');
    }

    relayout();
    books.forEach((b, i) => {
      const slot = SLOTS.hero[i];
      const s = b.springs;
      s.px.set(slot.p[0]);
      s.py.set(slot.p[1] - 3.9);
      s.pz.set(slot.p[2]);
      s.rx.set(slot.r[0]);
      s.ry.set(slot.r[1]);
      s.rz.set(slot.r[2] + 0.35 * (i === 1 ? -1 : Math.sign(slot.p[0])));
      s.sc.set(slot.s);
      b.slotScale = slot.s;
      setT(() => setTargets(b, slot), 240 + i * 150);
    });
    camTo('hero');
    animate();

    const onWindowResize = () => relayout();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onWindowResize);
    let orientationTimeout: ReturnType<typeof setTimeout> | null = null;
    const onOrientation = () => {
      relayout();
      orientationTimeout = setT(relayout, 250);
    };
    window.removeEventListener('orientationchange', onWindowResize);
    window.addEventListener('orientationchange', onOrientation);
    let visualViewportHandler: (() => void) | null = null;
    if (window.visualViewport) {
      visualViewportHandler = () => relayout();
      window.visualViewport.addEventListener('resize', visualViewportHandler);
    }
    const ro = new ResizeObserver(() => relayout());
    ro.observe(root);

    // ---------------------------------------------------------------------
    // Cleanup
    // ---------------------------------------------------------------------
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      timeouts.forEach((id) => clearTimeout(id));
      if (orientationTimeout) clearTimeout(orientationTimeout);

      ro.disconnect();
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onOrientation);
      if (visualViewportHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', visualViewportHandler);
      }
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', cancelPointer as any);
      window.removeEventListener('keydown', onKeydown);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('lostpointercapture', cancelPointer as any);
      closeBtnRef.current?.removeEventListener('click', onCloseClick);

      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            Object.values(m).forEach((v: any) => {
              if (v && v.isTexture) v.dispose();
            });
            m.dispose();
          });
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={rootRef} className="book-showcase">
      <div className="bs-hero-word">
        <span>Books</span>
      </div>

      <canvas ref={canvasRef} className="bs-gl" />

      <nav className="bs-nav">
        <div className="bs-logo">Bestsellers</div>
        <div className="bs-nav-r">
          <button className="bs-menu-btn" aria-label="Menu">
            =
          </button>
          <button className="bs-cta">Get Tickets</button>
        </div>
      </nav>

      <button ref={openBtnRef} className="bs-open-btn" tabIndex={-1} aria-hidden="true">
        Open
      </button>
      <button ref={closeBtnRef} className="bs-close-btn" aria-label="Close detail view">
        &#10005;
      </button>

      <div className="bs-dp" ref={dpRef} aria-live="polite">
        <h1 ref={dpTitleRef} />
        <p ref={dpDescRef} />
        <div className="bs-meta">
          <div className="bs-stars" ref={dpStarsRef} />
          <div className="bs-sep" />
          <div className="bs-src">Goodreads</div>
          <div className="bs-year" ref={dpYearRef} />
        </div>
        <div className="bs-rule" />
        <div className="bs-actions">
          <button className="bs-pill bs-lang">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.8 2.6 2.8 15.4 0 18M12 3c-2.8 2.6-2.8 15.4 0 18" />
            </svg>
            <span>English</span>
          </button>
          <button className="bs-pill bs-buy">Buy Now</button>
          <button className="bs-pill bs-buy">Buy Audiobook</button>
          <button className="bs-pill bs-iconb" aria-label="Save">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M7 3h10v18l-5-4-5 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BooksScene;
