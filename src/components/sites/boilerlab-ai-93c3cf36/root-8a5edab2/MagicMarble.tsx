"use client";

// Magic Marble — Originkit (supplied by the user, dropped in verbatim aside
// from the export shape at the bottom). Replaces the flat rotating moon
// image in ContactsSlide with an interactive WebGL glass marble: draggable,
// and it steps through `palette` on click.
import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

const SPHERE_R = 1;
const SPHERE_SEGMENTS: [number, number] = [64, 32];

const CAMERA_DIST = 2;
const FIT_MARGIN = 1.18;
const BASE_SPAN = SPHERE_R * 2 * FIT_MARGIN;

const CAMERA_TILT = 0.22;

const HDRI_URL = "https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/hdri/empty_warehouse_01_1k.hdr";

const HEIGHT_MAP_URL = "https://cdn.jsdelivr.net/gh/mattrossman/magic-marble-tutorial@master/public/noise.jpg";
const DISPLACEMENT_MAP_URL =
  "https://cdn.jsdelivr.net/gh/mattrossman/magic-marble-tutorial@master/public/noise3D.jpg";

const PRESS_SCALE = 0.95;

const PRESS_RATE = 14;

const STEP_RATE = 2;

const STEP_ADVANCE = 0.2;

const DRAG_SLOP = 5;

const KICK_RATE = 2.6;

const DRAG_DECAY = 3;

const PITCH_LIMIT = 1.0;
// Upper bound on the drawing buffer (device pixels). ~1265² — the hero moon's
// soft pigment shows no difference, and it keeps the biggest canvas cheap.
const MAX_RENDER_PIXELS = 1_600_000;

const DEFAULTS = {
  palette: ["#FF0000", "#FFFF00", "#00FF80", "#5252E0", "#CCCCCC"],
  core: "#000000",
  depth: 12,
  grain: 5,
  softness: 4,
  detail: 12,
  polish: 10,
  speed: 5,
  spin: 5,
  direction: "right",
  drag: 8,
  sizePercent: 64,
};

type Config = {
  palette: string[];
  core: string;
  depth: number;
  grain: number;
  softness: number;
  detail: number;
  polish: number;
  speed: number;
  spin: number;
  direction: "right" | "left";
  drag: number;
  sizePercent: number;
  colorBlend?: "hsl" | "rgb";
  colorSource?: { readonly current: string | null };
};

function clamp(v: number, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "number" && isFinite(v) ? v : fallback;
  return Math.max(lo, Math.min(hi, n));
}

function settingsFor(cfg: Config) {
  return {
    depth: clamp(cfg.depth, 1, 20, DEFAULTS.depth) * 0.05,

    displacement: clamp(cfg.grain, 0, 20, DEFAULTS.grain) * 0.02,

    smoothing: clamp(cfg.softness, 1, 20, DEFAULTS.softness) * 0.05,

    iterations: clamp(cfg.detail, 1, 20, DEFAULTS.detail) * 4,

    roughness: 1 - clamp(cfg.polish, 1, 10, DEFAULTS.polish) * 0.06,
    speed: clamp(cfg.speed, 0, 20, DEFAULTS.speed) * 0.00625,

    spin: clamp(cfg.spin, 0, 20, DEFAULTS.spin) * 0.06,
    heading: cfg.direction === "left" ? -1 : 1,

    drag: clamp(cfg.drag, 0, 20, DEFAULTS.drag) * 0.0025,
    zoom: 100 / clamp(cfg.sizePercent, 20, 100, DEFAULTS.sizePercent),
  };
}

const textureCache = new Map<string, THREE.Texture>();
const texturePending = new Map<string, Promise<THREE.Texture | null>>();

function loadTexture(
  url: string,
  loader: THREE.Loader<THREE.Texture> = new THREE.TextureLoader(),
): Promise<THREE.Texture | null> {
  const cached = textureCache.get(url);
  if (cached) return Promise.resolve(cached);

  const pending = texturePending.get(url);
  if (pending) return pending;

  const request = new Promise<THREE.Texture | null>((resolve) => {
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (texture: THREE.Texture) => {
        textureCache.set(url, texture);
        resolve(texture);
      },
      undefined,

      () => resolve(null),
    );
  });
  texturePending.set(url, request);
  return request;
}

function patchMarbleShader(shader: THREE.WebGLProgramParametersWithUniforms, uniforms: Record<string, THREE.IUniform>) {
  shader.uniforms = { ...shader.uniforms, ...uniforms };

  shader.vertexShader =
    `
      varying vec3 v_pos;
      varying vec3 v_dir;
    ` + shader.vertexShader;

  shader.vertexShader = shader.vertexShader.replace(
    /void main\(\) {/,
    (match) =>
      match +
      `
        v_dir = position - cameraPosition; // Points from camera to vertex
        v_pos = position;
        `,
  );

  shader.fragmentShader =
    `
      #define FLIP vec2(1., -1.)

      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform sampler2D heightMap;
      uniform sampler2D displacementMap;
      uniform int iterations;
      uniform float depth;
      uniform float smoothing;
      uniform float displacement;
      uniform float time;

      varying vec3 v_pos;
      varying vec3 v_dir;
    ` + shader.fragmentShader;

  shader.fragmentShader = shader.fragmentShader.replace(
    /void main\(\) {/,
    (match) =>
      `
        /**
         * @param p - Point to displace
         * @param strength - How much the map can displace the point
         * @returns Point with scrolling displacement applied
         */
        vec3 displacePoint(vec3 p, float strength) {
          vec2 uv = equirectUv(normalize(p));
          vec2 scroll = vec2(time, 0.);
          vec3 displacementA = texture(displacementMap, uv + scroll).rgb; // Upright
          vec3 displacementB = texture(displacementMap, uv * FLIP - scroll).rgb; // Upside down

          // Center the range to [-0.5, 0.5], note the range of their sum is [-1, 1]
          displacementA -= 0.5;
          displacementB -= 0.5;

          return p + strength * (displacementA + displacementB);
        }

        /**
          * @param rayOrigin - Point on sphere
          * @param rayDir - Normalized ray direction
          * @returns Diffuse RGB color
          */
        vec3 marchMarble(vec3 rayOrigin, vec3 rayDir) {
          float perIteration = 1. / float(iterations);
          vec3 deltaRay = rayDir * perIteration * depth;

          // Start at point of intersection and accumulate volume
          vec3 p = rayOrigin;
          float totalVolume = 0.;

          for (int i=0; i<iterations; ++i) {
            // Read heightmap from spherical direction of displaced ray position
            vec3 displaced = displacePoint(p, displacement);
            vec2 uv = equirectUv(normalize(displaced));
            float heightMapVal = texture(heightMap, uv).r;

            // Take a slice of the heightmap
            float height = length(p); // 1 at surface, 0 at core, assuming radius = 1
            float cutoff = 1. - float(i) * perIteration;
            float slice = smoothstep(cutoff, cutoff + smoothing, heightMapVal);

            // Accumulate the volume and advance the ray forward one step
            totalVolume += slice * perIteration;
            p += deltaRay;
          }
          return mix(colorA, colorB, totalVolume);
        }
      ` + match,
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    /vec4 diffuseColor.*;/,
    `
      vec3 rayDir = normalize(v_dir);
      vec3 rayOrigin = v_pos;

      vec3 rgb = marchMarble(rayOrigin, rayDir);
      vec4 diffuseColor = vec4(rgb, 1.);
      `,
  );
}

class MagicMarbleScene {
  private container: HTMLElement;
  private cfg: Config;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  private group = new THREE.Group();
  private geometry: THREE.SphereGeometry;
  private material: THREE.MeshStandardMaterial;
  private pmrem: THREE.PMREMGenerator | null = null;
  private envTarget: THREE.WebGLRenderTarget | null = null;

  private width = 1;
  private height = 1;
  private frameId = 0;
  private lastT = 0;
  private disposed = false;
  // Render budget (see sleepOrResize): skip frames while off screen or fully
  // transparent, and render at the size the marble is actually shown at.
  private onScreen = true;
  private shown = true;
  private lastBudgetCheck = 0;
  private basePixelRatio = 1;
  private pixelRatio = 1;
  private io: IntersectionObserver | null = null;

  private flow = 0;
  private timeOffset = 0;
  private targetOffset = 0;

  private azimuth = 0;
  private elevation = 0;
  private velAz = 0;
  private velEl = 0;

  private step = 0;
  // Remaining azimuth (radians) from `kick()`, eased in over a few frames.
  private kickRemaining = 0;
  private hovering = false;
  private pressed = false;
  private dragging = false;
  private scale = 1;
  private downX = 0;
  private downY = 0;
  private lastX = 0;
  private lastY = 0;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private targetColor = new THREE.Color();

  private uniforms: Record<string, THREE.IUniform> = {
    time: { value: 0 },
    colorA: { value: new THREE.Color(0, 0, 0) },
    colorB: { value: new THREE.Color(1, 0, 0) },
    heightMap: { value: null },
    displacementMap: { value: null },
    iterations: { value: 48 },
    depth: { value: 0.6 },
    smoothing: { value: 0.2 },
    displacement: { value: 0.1 },
  };

  constructor(container: HTMLElement, cfg: Config) {
    this.container = container;
    this.cfg = cfg;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    this.pixelRatio = this.basePixelRatio;
    this.renderer.setPixelRatio(this.pixelRatio);

    const canvas = this.renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.cursor = "grab";
    container.appendChild(canvas);

    this.geometry = new THREE.SphereGeometry(SPHERE_R, SPHERE_SEGMENTS[0], SPHERE_SEGMENTS[1]);
    this.material = new THREE.MeshStandardMaterial({ roughness: 0.1 });
    this.material.onBeforeCompile = (shader) => patchMarbleShader(shader, this.uniforms);

    this.material.customProgramCacheKey = () => "magic-marble";

    const mesh = new THREE.Mesh(this.geometry, this.material);
    this.group.add(mesh);
    this.scene.add(this.group);

    this.applyPalette(true);
    this.loadAssets();

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerleave", this.onPointerLeave);

    this.io = new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting;
    });
    this.io.observe(container);

    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  private loadAssets() {
    loadTexture(HEIGHT_MAP_URL).then((tex) => {
      if (this.disposed || !tex) return;
      tex.minFilter = THREE.NearestFilter;
      this.uniforms.heightMap.value = tex;
    });
    loadTexture(DISPLACEMENT_MAP_URL).then((tex) => {
      if (this.disposed || !tex) return;
      tex.minFilter = THREE.NearestFilter;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      this.uniforms.displacementMap.value = tex;
    });
    loadTexture(HDRI_URL, new RGBELoader()).then((tex) => {
      if (this.disposed || !tex) return;
      tex.mapping = THREE.EquirectangularReflectionMapping;

      this.pmrem = new THREE.PMREMGenerator(this.renderer);
      this.envTarget = this.pmrem.fromEquirectangular(tex);
      this.scene.environment = this.envTarget.texture;
    });
  }

  private applyPalette(immediate: boolean) {
    const palette = Array.isArray(this.cfg.palette) && this.cfg.palette.length ? this.cfg.palette : DEFAULTS.palette;
    const next = palette[this.step % palette.length] || DEFAULTS.palette[0];
    try {
      this.targetColor.set(next);
    } catch {
      this.targetColor.set(DEFAULTS.palette[0]);
    }
    try {
      (this.uniforms.colorA.value as THREE.Color).set(this.cfg.core || DEFAULTS.core);
    } catch {
      (this.uniforms.colorA.value as THREE.Color).set(DEFAULTS.core);
    }
    if (immediate) (this.uniforms.colorB.value as THREE.Color).copy(this.targetColor);
  }

  private hitsMarble(e: PointerEvent): boolean {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObject(this.group, true).length > 0;
  }

  private clampElevation(v: number): number {
    return Math.max(-PITCH_LIMIT - CAMERA_TILT, Math.min(PITCH_LIMIT - CAMERA_TILT, v));
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.disposed) return;
    if (!this.dragging) {
      this.hovering = this.hitsMarble(e);
      return;
    }
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;

    const s = settingsFor(this.cfg).drag;
    this.azimuth -= dx * s;
    this.elevation = this.clampElevation(this.elevation + dy * s);

    this.velAz = -dx * s;
    this.velEl = dy * s;
  };

  private onPointerLeave = () => {
    if (this.dragging) return;
    this.hovering = false;
    this.pressed = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.disposed) return;
    this.hovering = this.hitsMarble(e);
    this.pressed = this.hovering;
    this.dragging = true;
    this.downX = this.lastX = e.clientX;
    this.downY = this.lastY = e.clientY;

    this.velAz = 0;
    this.velEl = 0;
    this.renderer.domElement.style.cursor = "grabbing";
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.disposed) return;
    const wasPressed = this.pressed;
    this.dragging = false;
    this.pressed = false;
    this.renderer.domElement.style.cursor = "grab";
    if (!wasPressed) return;

    const travel = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
    if (travel > DRAG_SLOP || !this.hitsMarble(e)) return;

    this.step += 1;
    this.targetOffset = this.step * STEP_ADVANCE;
    this.applyPalette(false);
  };

  /** Spin the marble by `radians` (eased), and swirl its pigment along with it. */
  kick(radians: number) {
    if (this.disposed) return;
    this.kickRemaining += radians;
    this.targetOffset += Math.abs(radians) * 0.12;
  }

  start() {
    this.lastT = performance.now();
    const loop = () => {
      if (this.disposed) return;
      this.frameId = requestAnimationFrame(loop);
      if (this.sleepOrResize()) {
        this.lastT = performance.now(); // no time jump on wake
        return;
      }
      this.tick();
    };
    this.frameId = requestAnimationFrame(loop);
  }

  /**
   * The raymarched pigment is the costly part, so: don't render while the
   * marble is off screen (IntersectionObserver) or hidden/transparent via an
   * ancestor (e.g. the shared moon while FerrisSphere stands in for it), and
   * render at the size it's actually shown — the shared moon's canvas is laid
   * out at hero size and only CSS-scaled down elsewhere, so its layout size
   * would otherwise cost ~20× the pixels it needs. Checked a few times a
   * second, not every frame; the ratio only changes past a 15% step, so a
   * scroll-driven zoom reallocates the buffer a handful of times, not per
   * frame. Returns true when this frame should be skipped.
   */
  private sleepOrResize(): boolean {
    const now = performance.now();
    if (now - this.lastBudgetCheck > 200) {
      this.lastBudgetCheck = now;
      const el = this.container as HTMLElement & {
        checkVisibility?: (o: Record<string, boolean>) => boolean;
      };
      this.shown = el.checkVisibility
        ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true, checkOpacity: true, checkVisibilityCSS: true })
        : true;
      if (this.onScreen && this.shown) {
        const shownWidth = this.container.getBoundingClientRect().width;
        const scale = this.width > 0 ? Math.min(1, shownWidth / this.width) : 1;
        const byPixels = Math.sqrt(MAX_RENDER_PIXELS / (this.width * this.height));
        const target = Math.max(0.3, Math.min(this.basePixelRatio * scale, byPixels, this.basePixelRatio));
        const stepped = Math.round(target * 16) / 16;
        if (Math.abs(stepped - this.pixelRatio) / this.pixelRatio > 0.15) {
          this.pixelRatio = stepped;
          this.renderer.setPixelRatio(stepped);
          this.renderer.setSize(this.width, this.height, false);
        }
      }
    }
    return !this.onScreen || !this.shown;
  }

  setSize(width: number, height: number) {
    if (this.disposed) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.updateCamera();
  }

  updateConfig(cfg: Config) {
    if (this.disposed) return;
    this.cfg = cfg;
    this.applyPalette(false);
    this.updateCamera();
  }

  private updateCamera() {
    const aspect = this.width / this.height;
    const S = settingsFor(this.cfg);

    const span = (aspect < 1 ? BASE_SPAN / aspect : BASE_SPAN) * S.zoom;

    this.camera.aspect = aspect;
    this.camera.fov = 2 * Math.atan(span / 2 / CAMERA_DIST) * (180 / Math.PI);
    this.camera.updateProjectionMatrix();
  }

  private tick() {
    const now = performance.now();
    let dt = (now - this.lastT) / 1000;
    this.lastT = now;
    if (!isFinite(dt) || dt < 0) dt = 0;

    if (dt > 0.05) dt = 0.05;

    const S = settingsFor(this.cfg);

    this.flow += dt * S.speed;
    this.timeOffset += (this.targetOffset - this.timeOffset) * (1 - Math.exp(-dt * STEP_RATE));
    this.uniforms.time.value = this.timeOffset + this.flow;

    const colorB = this.uniforms.colorB.value as THREE.Color;
    const live = this.cfg.colorSource?.current;
    if (live) {
      // Externally driven (e.g. scroll-scrubbed): follow it exactly, no easing.
      try {
        this.targetColor.set(live);
      } catch {
        // keep the previous target
      }
      colorB.copy(this.targetColor);
    } else {
      const colorT = 1 - Math.exp(-dt * STEP_RATE);
      if (this.cfg.colorBlend === "rgb") colorB.lerp(this.targetColor, colorT);
      else colorB.lerpHSL(this.targetColor, colorT);
    }

    this.uniforms.depth.value = S.depth;
    this.uniforms.smoothing.value = S.smoothing;
    this.uniforms.displacement.value = S.displacement;
    this.uniforms.iterations.value = S.iterations;
    this.material.roughness = S.roughness;

    const targetScale = this.pressed && this.hovering ? PRESS_SCALE : 1;
    this.scale += (targetScale - this.scale) * (1 - Math.exp(-dt * PRESS_RATE));
    this.group.scale.setScalar(this.scale);

    if (!this.dragging) {
      const decay = Math.exp(-dt * DRAG_DECAY);
      this.azimuth += this.velAz;
      this.elevation = this.clampElevation(this.elevation + this.velEl);
      this.velAz *= decay;
      this.velEl *= decay;
      this.azimuth += dt * S.spin * S.heading;
    }
    if (this.kickRemaining !== 0) {
      const d = this.kickRemaining * (1 - Math.exp(-dt * KICK_RATE));
      this.azimuth += d;
      this.kickRemaining = Math.abs(this.kickRemaining - d) < 1e-4 ? 0 : this.kickRemaining - d;
    }

    const pitch = CAMERA_TILT + this.elevation;
    const ringR = Math.cos(pitch) * CAMERA_DIST;
    this.camera.position.set(Math.sin(this.azimuth) * ringR, Math.sin(pitch) * CAMERA_DIST, Math.cos(this.azimuth) * ringR);
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    this.io?.disconnect();

    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);

    this.geometry.dispose();
    this.material.dispose();
    this.envTarget?.dispose();
    this.pmrem?.dispose();
    this.scene.environment = null;
    this.renderer.dispose();
    if (canvas.parentNode === this.container) this.container.removeChild(canvas);
  }
}

export interface MagicMarbleProps {
  palette?: string[];
  core?: string;
  depth?: number;
  grain?: number;
  softness?: number;
  detail?: number;
  polish?: number;
  speed?: number;
  spin?: number;
  direction?: "right" | "left";
  drag?: number;
  sizePercent?: number;
  style?: React.CSSProperties;
  /** How colour changes blend: "hsl" (default) sweeps the hue wheel, "rgb" fades directly. */
  colorBlend?: "hsl" | "rgb";
  /** Spin impulse: whenever `kick.id` changes, the marble spins by `kick.radians`. */
  kick?: { id: number; radians: number };
  /** Read every frame; a color here overrides the palette immediately (no
   * easing), so a caller can scrub the pigment color with scroll. null =
   * normal palette behavior. */
  colorSource?: { readonly current: string | null };
}

function OriginkitBaseMagicMarble(props: MagicMarbleProps) {
  const {
    palette = ["#FF0000", "#FFFF00", "#00FF80", "#5252E0", "#CCCCCC"],
    core = DEFAULTS.core,
    depth = DEFAULTS.depth,
    grain = DEFAULTS.grain,
    softness = DEFAULTS.softness,
    detail = DEFAULTS.detail,
    polish = DEFAULTS.polish,
    speed = DEFAULTS.speed,
    spin = DEFAULTS.spin,
    direction = DEFAULTS.direction as "right" | "left",
    drag = DEFAULTS.drag,
    sizePercent = DEFAULTS.sizePercent,
    style,
    kick,
    colorBlend,
    colorSource,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<MagicMarbleScene | null>(null);
  const cfgRef = useRef<Config>(null as unknown as Config);

  // Keeps cfgRef in sync with the latest props on every render (via an
  // effect, not during render itself — refs are only safe to write outside
  // render). Declared before the mount effect below so, on first mount,
  // this one runs first and cfgRef.current is already populated by the
  // time the scene is constructed.
  useEffect(() => {
    cfgRef.current = {
      palette,
      core,
      depth,
      grain,
      softness,
      detail,
      polish,
      speed,
      spin,
      direction,
      drag,
      sizePercent,
      colorBlend,
      colorSource,
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let scene: MagicMarbleScene;
    try {
      scene = new MagicMarbleScene(container, cfgRef.current);
    } catch {
      return;
    }
    sceneRef.current = scene;
    scene.setSize(container.clientWidth, container.clientHeight);
    scene.start();

    const ro = new ResizeObserver(() => {
      scene.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const paletteKey = palette?.join?.(",");
  useEffect(() => {
    sceneRef.current?.updateConfig(cfgRef.current);
  }, [paletteKey, core, depth, grain, softness, detail, polish, speed, spin, direction, drag, sizePercent]);

  const kickId = kick?.id;
  const kickRadians = kick?.radians ?? 0;
  useEffect(() => {
    if (kickId === undefined || kickRadians === 0) return;
    sceneRef.current?.kick(kickRadians);
  }, [kickId, kickRadians]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="A glass marble with swirling pigment inside, draggable, changing colour when clicked"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 120,
        minHeight: 120,
        overflow: "hidden",
        ...style,
      }}
    />
  );
}

const ORIGINKIT_PRESET_PROPS: MagicMarbleProps = {
  core: "#000000",
  depth: 12,
  grain: 5,
  softness: 4,
  detail: 12,
  polish: 10,
  speed: 5,
  spin: 5,
  direction: "right",
  drag: 8,
  sizePercent: 64,
};

export default function MagicMarble(props: MagicMarbleProps) {
  return <OriginkitBaseMagicMarble {...ORIGINKIT_PRESET_PROPS} {...props} />;
}
