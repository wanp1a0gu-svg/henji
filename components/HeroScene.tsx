"use client";

import { useEffect, useRef } from "react";

/**
 * 首页 3D 点云场景（滚动驱动）。
 *
 * 三个形态随滚动进度变形：
 *   0 → 散乱尘埃（首屏）
 *   1 → 「痕」字点云（往下滑，粒子聚成字形）
 *   2 → 光环 / 罗盘（再往下，散成环状）
 *
 * 视觉：加法混合 + UnrealBloom 泛光 + 指数雾 = 暗场里的尘埃与微光。
 * 性能：DPR 封顶 1.75；手机减少粒子数；离开视口暂停；尊重 prefers-reduced-motion。
 * 体积：three 与后处理全部动态 import，不进首屏包。
 */
export function HeroScene({ glyph = "痕" }: { glyph?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      const THREE = await import("three");
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
        import("three/examples/jsm/postprocessing/EffectComposer.js"),
        import("three/examples/jsm/postprocessing/RenderPass.js"),
        import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
      ]);
      if (disposed || !hostRef.current) return;

      const isMobile = window.innerWidth < 768;
      const COUNT = isMobile ? 4200 : 9000;

      // ---------- 渲染器 ----------
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0b0a08, 0.055);

      const camera = new THREE.PerspectiveCamera(
        46,
        host.clientWidth / host.clientHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 7.0);

      // ---------- 三个形态 ----------
      const SPAN = 5.2;
      const rnd = (a: number, b: number) => a + Math.random() * (b - a);

      // 0）散乱尘埃：球壳 + 内部散布
      const dust: number[] = [];
      for (let i = 0; i < COUNT; i++) {
        const r = 2.2 + Math.pow(Math.random(), 0.6) * 2.6;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(rnd(-1, 1));
        dust.push(
          r * Math.sin(ph) * Math.cos(th),
          r * Math.cos(ph) * 0.72,
          r * Math.sin(ph) * Math.sin(th) * 0.55
        );
      }

      // 1）「痕」字：用 canvas 把字画出来再采样成点
      const textPts: [number, number][] = [];
      try {
        const S = 260;
        const cv = document.createElement("canvas");
        cv.width = cv.height = S;
        const ctx = cv.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `600 ${Math.round(S * 0.74)}px "Noto Serif SC", "Songti SC", serif`;
          ctx.fillText(glyph, S / 2, S / 2 + S * 0.02);
          const img = ctx.getImageData(0, 0, S, S).data;
          for (let y = 0; y < S; y += 1) {
            for (let x = 0; x < S; x += 1) {
              if (img[(y * S + x) * 4 + 3] > 190) textPts.push([x, y]);
            }
          }
        }
      } catch {
        /* 采样失败就退回球形 */
      }

      const glyphArr: number[] = [];
      for (let i = 0; i < COUNT; i++) {
        if (textPts.length) {
          const [px, py] = textPts[(Math.random() * textPts.length) | 0];
          const W = 4.0;
          glyphArr.push(
            (px / 260 - 0.5) * W + rnd(-0.012, 0.012),
            -(py / 260 - 0.5) * W + rnd(-0.012, 0.012),
            rnd(-0.09, 0.09)
          );
        } else {
          const r = 1.9 + Math.random() * 0.25;
          const th = Math.random() * Math.PI * 2;
          glyphArr.push(Math.cos(th) * r, Math.sin(th) * r, rnd(-0.1, 0.1));
        }
      }

      // 2）光环：两圈略微倾斜的环
      const ringArr: number[] = [];
      for (let i = 0; i < COUNT; i++) {
        const band = i % 3;
        const R = 2.35 + band * 0.42;
        const a = Math.random() * Math.PI * 2;
        const tilt = 0.22 + band * 0.06;
        const x = Math.cos(a) * R;
        const z = Math.sin(a) * R;
        ringArr.push(x, Math.sin(a) * R * tilt + rnd(-0.05, 0.05), z * 0.55);
      }

      const pos = new Float32Array(COUNT * 3);
      const aDust = new Float32Array(dust);
      const aGlyph = new Float32Array(glyphArr);
      const aRing = new Float32Array(ringArr);
      const seed = new Float32Array(COUNT);
      const tint = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        pos[i * 3] = dust[i * 3];
        pos[i * 3 + 1] = dust[i * 3 + 1];
        pos[i * 3 + 2] = dust[i * 3 + 2];
        seed[i] = Math.random() * Math.PI * 2;
        tint[i] = Math.random();
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("aDust", new THREE.BufferAttribute(aDust, 3));
      geo.setAttribute("aGlyph", new THREE.BufferAttribute(aGlyph, 3));
      geo.setAttribute("aRing", new THREE.BufferAttribute(aRing, 3));
      geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      geo.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uSize: { value: isMobile ? 15 : 10 },
          uPixel: { value: Math.min(window.devicePixelRatio || 1, 1.75) },
          uColorA: { value: new THREE.Color("#c9a87c") },
          uColorB: { value: new THREE.Color("#f0e4cd") },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aDust;
          attribute vec3 aGlyph;
          attribute vec3 aRing;
          attribute float aSeed;
          attribute float aTint;
          uniform float uTime;
          uniform float uMorph;
          uniform float uSize;
          uniform float uPixel;
          varying float vTint;
          varying float vFade;

          void main() {
            // 用 smoothstep 收紧过渡区间：0.80 就完全成字，避免残余尘埃点把字形糊掉
            float m1 = smoothstep(0.05, 0.80, uMorph);
            float m2 = smoothstep(1.05, 1.75, uMorph);
            vec3 p = mix(aDust, aGlyph, m1);
            p = mix(p, aRing, m2);

            // 呼吸：每个点按自己的相位轻轻浮动
            float t = uTime * 0.6 + aSeed;
            p.x += sin(t) * 0.035;
            p.y += cos(t * 1.13) * 0.035;
            p.z += sin(t * 0.77) * 0.03;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;

            float size = uSize * uPixel * (0.5 + aTint * 0.9);
            gl_PointSize = size / max(-mv.z, 0.4);

            vTint = aTint;
            vFade = smoothstep(14.0, 3.0, -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          varying float vTint;
          varying float vFade;

          void main() {
            // 圆形柔边点
            vec2 d = gl_PointCoord - vec2(0.5);
            float r = length(d);
            if (r > 0.5) discard;
            float a = smoothstep(0.5, 0.0, r);
            a = pow(a, 1.7);

            vec3 c = mix(uColorA, uColorB, vTint * 0.75);
            gl_FragColor = vec4(c, a * 0.85 * vFade);
          }
        `,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);

      // ---------- 后处理泛光 ----------
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(host.clientWidth, host.clientHeight),
        0.86,
        0.72,
        0.12
      );
      composer.addPass(bloom);

      // ---------- 尺寸 ----------
      const resize = () => {
        const w = host.clientWidth || window.innerWidth;
        const h = host.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
      };
      resize();
      window.addEventListener("resize", resize);

      // ---------- 滚动进度 ----------
      const readScroll = () => {
        const vh = window.innerHeight || 1;
        return window.scrollY / vh;
      };
      // 半屏内完成「尘埃 → 字形」，之后才轮到光环
      const morphOf = (p: number) => Math.max(0, Math.min(2, p * 1.85));

      let visible = true;
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0] ? entries[0].isIntersecting : true;
        },
        { threshold: 0 }
      );
      io.observe(host);

      // ---------- 主循环 ----------
      let morph = 0;
      const clock = new THREE.Clock();

      const frame = () => {
        raf = requestAnimationFrame(frame);
        if (!visible || disposed) return;

        const t = clock.getElapsedTime();
        const raw = readScroll();
        const target = morphOf(raw);
        morph += (target - morph) * 0.09;

        mat.uniforms.uTime.value = t;
        mat.uniforms.uMorph.value = morph;

        // 镜头随形态推进
        camera.position.z = 7.0 - morph * 0.3;
        camera.position.y = Math.sin(t * 0.18) * 0.16 + morph * 0.18;
        camera.lookAt(0, 0, 0);

        points.rotation.y = t * 0.045 + morph * 0.25;
        points.rotation.z = Math.sin(t * 0.08) * 0.03;

        const crisp = Math.min(1, morph);
        bloom.strength = 0.70 + Math.sin(t * 0.5) * 0.05 - crisp * 0.34;
        bloom.radius = 0.62 - crisp * 0.18;

        // 过了首屏就淡下去，别抢正文；两屏之后只留一点氛围
        const targetOpacity = raw < 0.55 ? 1 : Math.max(0.08, 1 - (raw - 0.55) * 1.9);
        host.style.opacity = String(targetOpacity);

        composer.render();
      };

      if (reduce) {
        // 减少动效：只渲染一帧静态
        mat.uniforms.uMorph.value = 0.55;
        composer.render();
      } else {
        raf = requestAnimationFrame(frame);
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", resize);
        geo.dispose();
        mat.dispose();
        composer.dispose?.();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    })().catch((e) => {
      console.error("[hero-scene] init failed:", e);
    });

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
  }, [glyph]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
    />
  );
}
