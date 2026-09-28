import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OUTLINE, PINS, ROUTE_ORDER, type MapPin } from '../../../data/territory';
import MapPinLabel from '../../atoms/MapPinLabel/MapPinLabel';
import './territoryMap.css';

interface TerritoryMapProps {
    activeSlug: string | null;
    onSelectPin: (pin: MapPin) => void;
}

const GREEN = 0x02d77b;
const TOP_Y = 0.85;
const OVERVIEW = { x: 0, z: 0, dist: 11.5, active: false };

/** Frame-rate independent easing: same feel at 60 / 120 / 144 Hz. `rate` is per second. */
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

/** Deterministic PRNG so the scenery is identical on every visit / re-render. */
const mulberry32 = (seed: number) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const TerritoryMap = ({ activeSlug, onSelectPin }: TerritoryMapProps) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const camTarget = useRef({ ...OVERVIEW });
    const hoverRef = useRef<Record<string, boolean>>({});
    const activeSlugRef = useRef<string | null>(activeSlug);

    // Camera focus follows the active pin. The 3D scene itself is built ONCE (see below),
    // so selecting / closing a pin no longer tears down and rebuilds WebGL.
    useEffect(() => {
        activeSlugRef.current = activeSlug;
        const pin = PINS.find((p) => p.slug === activeSlug);
        camTarget.current = pin ? { x: pin.x, z: pin.z, dist: 6, active: true } : { ...OVERVIEW };
    }, [activeSlug]);

    useEffect(() => {
        const mount = mountRef.current!;
        const isPhone = window.matchMedia('(max-width: 48em)').matches;
        const dpr = Math.min(window.devicePixelRatio || 1, isPhone ? 1.25 : 1.5);

        let width = window.innerWidth;
        let height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x070708, 0.055);
        const camera = new THREE.PerspectiveCamera(isPhone ? 50 : 38, width / height, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({
            antialias: dpr < 1.5,           // the dithered look doesn't need MSAA at higher DPR
            alpha: true,
            powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height);
        mount.appendChild(renderer.domElement);
        const world = new THREE.Group();
        scene.add(world);

        // ---- slab ----
        const shape = new THREE.Shape();
        shape.moveTo(OUTLINE[0][0], OUTLINE[0][1]);
        for (let i = 1; i < OUTLINE.length; i++) shape.lineTo(OUTLINE[i][0], OUTLINE[i][1]);
        shape.closePath();
        const slabGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
        slabGeo.rotateX(-Math.PI / 2);
        slabGeo.computeBoundingBox();
        const bb = slabGeo.boundingBox!;
        const octaves = isPhone ? 3 : 4;
        const topMat = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_mouse: { value: new THREE.Vector2() },
                u_bbmin: { value: new THREE.Vector2(bb.min.x, bb.min.z) },
                u_bbsize: { value: new THREE.Vector2(bb.max.x - bb.min.x, bb.max.z - bb.min.z) },
            },
            vertexShader: `varying vec3 vPos; varying vec3 vN; void main(){vPos=position;vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `precision highp float; varying vec3 vPos; varying vec3 vN;
                uniform float u_time; uniform vec2 u_mouse; uniform vec2 u_bbmin; uniform vec2 u_bbsize;
                float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
                float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
                float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<${octaves};i++){v+=a*noise(p);p*=2.0;a*=.5;}return v;}
                // 4x4 ordered-dither threshold computed arithmetically (no per-pixel array + 16-step loop)
                float bayer2(vec2 a){a=floor(a);return fract(a.x*0.5+a.y*a.y*0.75);}
                float bayer(vec2 a){return bayer2(0.5*a)*0.25+bayer2(a);}
                void main(){
                  if(vN.y<0.5){gl_FragColor=vec4(0.025,0.025,0.03,1.0);return;}
                  vec2 uv=(vPos.xz-u_bbmin)/u_bbsize;
                  float h=fbm(vPos.xz*0.6+u_time*0.04); h=0.35+0.5*h;
                  float contour=abs(fract(h*8.0)-0.5); float contourLine=smoothstep(0.07,0.0,contour)*0.18;
                  float riverX=0.0+0.9*sin(uv.y*3.0)+0.4*sin(uv.y*7.0);
                  float river=smoothstep(0.55,0.0,abs(vPos.x-riverX));
                  float spot=smoothstep(1.6,0.0,distance(vPos.xz,u_mouse))*0.22;
                  float lum=clamp(h+contourLine+spot,0.0,1.0); lum=mix(lum,0.04,river*0.92);
                  vec2 cell=floor(uv*u_bbsize*46.0); float b=bayer(cell); float d=step(b,lum);
                  vec3 col=mix(vec3(0.045,0.045,0.05),vec3(0.82,0.83,0.78),d);
                  float glint=step(b,river*0.12*(0.5+0.5*sin(uv.y*40.0+u_time)));
                  col=mix(col,vec3(0.18,0.2,0.22),glint*river);
                  gl_FragColor=vec4(col,1.0);
                }`,
            side: THREE.DoubleSide,
        });
        world.add(new THREE.Mesh(slabGeo, topMat));
        const slabEdgesGeo = new THREE.EdgesGeometry(slabGeo, 40);
        const slabEdgesMat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.3 });
        world.add(new THREE.LineSegments(slabEdgesGeo, slabEdgesMat));

        // ---- pins (geometry + materials shared across all pins) ----
        const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8);
        const headGeo = new THREE.SphereGeometry(0.07, 14, 14);
        const ringGeo = new THREE.RingGeometry(0.12, 0.16, 32);
        const stemMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.6 });
        const headMat = new THREE.MeshBasicMaterial({ color: GREEN });
        const ringMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.35, side: THREE.DoubleSide });

        const pinMeshes: { group: THREE.Group; ring: THREE.Mesh; slug: string }[] = PINS.map((p) => {
            const g = new THREE.Group();
            const stem = new THREE.Mesh(stemGeo, stemMat); stem.position.y = 0.25;
            const head = new THREE.Mesh(headGeo, headMat); head.position.y = 0.5;
            const ring = new THREE.Mesh(ringGeo, ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012;
            g.add(stem, head, ring);
            g.position.set(p.x, TOP_Y, p.z);
            world.add(g);
            return { group: g, ring, slug: p.slug };
        });

        // ---- routes (all segments merged into a single draw call) ----
        const routeParts: THREE.BufferGeometry[] = [];
        for (let i = 0; i < ROUTE_ORDER.length - 1; i++) {
            const a = PINS[ROUTE_ORDER[i]], b = PINS[ROUTE_ORDER[i + 1]];
            const mid = new THREE.Vector3((a.x + b.x) / 2, TOP_Y + 0.5, (a.z + b.z) / 2);
            const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(a.x, TOP_Y + 0.02, a.z), mid, new THREE.Vector3(b.x, TOP_Y + 0.02, b.z)]);
            routeParts.push(new THREE.TubeGeometry(curve, 32, 0.01, 5, false));
        }
        const routeGeo = mergeGeometries(routeParts)!;
        routeParts.forEach((g) => g.dispose());
        const routeMat = new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.4 });
        world.add(new THREE.Mesh(routeGeo, routeMat));

        // ---- massing (25 boxes + outlines merged into 2 draw calls, deterministic layout) ----
        const rand = mulberry32(184);
        const boxParts: THREE.BufferGeometry[] = [];
        const edgeParts: THREE.BufferGeometry[] = [];
        PINS.forEach((p) => {
            for (let k = 0; k < 5; k++) {
                const bw = 0.12 + rand() * 0.12, bh = 0.1 + rand() * 0.4;
                const ang = rand() * 7, rad = 0.3 + rand() * 0.6;
                const x = p.x + Math.cos(ang) * rad, y = TOP_Y + bh / 2, z = p.z + Math.sin(ang) * rad;
                const box = new THREE.BoxGeometry(bw, bh, bw);
                const edges = new THREE.EdgesGeometry(box);
                box.translate(x, y, z);
                edges.translate(x, y, z);
                boxParts.push(box);
                edgeParts.push(edges);
            }
        });
        const massingGeo = mergeGeometries(boxParts)!;
        const massingEdgesGeo = mergeGeometries(edgeParts)!;
        boxParts.forEach((g) => g.dispose());
        edgeParts.forEach((g) => g.dispose());
        const massingMat = new THREE.MeshBasicMaterial({ color: 0x141414 });
        const massingEdgesMat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.12 });
        world.add(new THREE.Mesh(massingGeo, massingMat));
        world.add(new THREE.LineSegments(massingEdgesGeo, massingEdgesMat));

        // ---- dust ----
        const N = isPhone ? 100 : 220;
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            dustPos[i * 3] = (rand() - 0.5) * 16;
            dustPos[i * 3 + 1] = rand() * 6;
            dustPos[i * 3 + 2] = (rand() - 0.5) * 16;
        }
        const dustAttr = new THREE.BufferAttribute(dustPos, 3);
        dustAttr.setUsage(THREE.DynamicDrawUsage);
        dustGeo.setAttribute('position', dustAttr);
        const dustMat = new THREE.PointsMaterial({ color: 0x9fd9bf, size: 0.025, transparent: true, opacity: 0.4, depthWrite: false });
        world.add(new THREE.Points(dustGeo, dustMat));

        // ---- interaction ----
        const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
        const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / width; mouse.ty = e.clientY / height; };
        window.addEventListener('pointermove', onMove, { passive: true });
        const onResize = () => {
            width = window.innerWidth; height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', onResize);

        // ---- loop ----
        let curX = 0, curZ = 0, curDist = OVERVIEW.dist;
        const tmpV = new THREE.Vector3();
        const lastLabel: Record<string, { x: number; y: number; o: string }> = {};
        let last = performance.now();
        let elapsed = 0;
        let raf = 0;

        const animate = (now: number) => {
            raf = requestAnimationFrame(animate);
            const dt = Math.min((now - last) / 1000, 0.1);   // clamp so tab-switches don't cause a jump
            last = now;
            elapsed += dt;
            const t = elapsed;

            const kMouse = damp(2.5, dt), kCam = damp(3.1, dt), kScale = damp(9.7, dt);
            mouse.x += (mouse.tx - mouse.x) * kMouse;
            mouse.y += (mouse.ty - mouse.y) * kMouse;

            const ct = camTarget.current;
            curX += (ct.x - curX) * kCam;
            curZ += (ct.z - curZ) * kCam;
            curDist += (ct.dist - curDist) * kCam;

            const orbit = t * 0.05 + (mouse.x - 0.5) * 0.7;
            camera.position.x = curX + Math.sin(orbit) * curDist;
            camera.position.z = curZ + Math.cos(orbit) * curDist;
            camera.position.y = (ct.active ? 4 : 8) + (mouse.y - 0.5) * -2.2;
            camera.lookAt(curX, 0, curZ);

            topMat.uniforms.u_time.value = t;
            topMat.uniforms.u_mouse.value.set((mouse.x - 0.5) * 9, (mouse.y - 0.5) * 9);

            const active = activeSlugRef.current;
            for (let i = 0; i < pinMeshes.length; i++) {
                const pm = pinMeshes[i];
                pm.group.position.y = TOP_Y + Math.sin(t * 1.4 + i) * 0.05;
                pm.ring.rotation.z = t * 0.6;
                const tgt = hoverRef.current[pm.slug] || active === pm.slug ? 1.5 : 1;
                const s = pm.group.scale.x + (tgt - pm.group.scale.x) * kScale;
                pm.group.scale.setScalar(s);
            }

            const arr = dustAttr.array as Float32Array;
            const rise = 0.24 * dt;
            for (let i = 0; i < N; i++) {
                const yi = i * 3 + 1;
                arr[yi] += rise;
                if (arr[yi] > 6) arr[yi] = 0;
            }
            dustAttr.needsUpdate = true;

            renderer.render(scene, camera);

            // DOM labels — one transform write per label, only when something changed
            camera.updateMatrixWorld();
            for (let i = 0; i < PINS.length; i++) {
                const p = PINS[i];
                const el = labelRefs.current[p.slug];
                if (!el) continue;
                tmpV.set(p.x, TOP_Y + 0.6, p.z).project(camera);
                const x = Math.round((tmpV.x * 0.5 + 0.5) * width * 10) / 10;
                const y = Math.round((-tmpV.y * 0.5 + 0.5) * height * 10) / 10;
                const o = tmpV.z < 1 ? '1' : '0';
                const prev = lastLabel[p.slug];
                if (!prev || prev.x !== x || prev.y !== y) {
                    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -150%)`;
                }
                if (!prev || prev.o !== o) el.style.opacity = o;
                lastLabel[p.slug] = { x, y, o };
            }
        };
        raf = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('resize', onResize);
            [slabGeo, slabEdgesGeo, stemGeo, headGeo, ringGeo, routeGeo, massingGeo, massingEdgesGeo, dustGeo].forEach((g) => g.dispose());
            [topMat, slabEdgesMat, stemMat, headMat, ringMat, routeMat, massingMat, massingEdgesMat, dustMat].forEach((m) => m.dispose());
            renderer.dispose();
            renderer.forceContextLoss();
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div className="territory-map">
            <div className="territory-map__canvas" ref={mountRef} />
            <div className="territory-map__labels">
                {PINS.map((p) => (
                    <MapPinLabel
                        key={p.slug}
                        ref={(el) => { labelRefs.current[p.slug] = el; }}
                        name={p.name}
                        coord={p.coord}
                        onSelect={() => onSelectPin(p)}
                        onHover={(h) => { hoverRef.current[p.slug] = h; }}
                    />
                ))}
            </div>
        </div>
    );
};

export default TerritoryMap;
