import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { OUTLINE, PINS, ROUTE_ORDER, type MapPin } from '../../../data/territory';
import MapPinLabel from '../../atoms/MapPinLabel/MapPinLabel';
import './territoryMap.css';

interface TerritoryMapProps {
    activeSlug: string | null;
    onSelectPin: (pin: MapPin) => void;
}

const TerritoryMap = ({ activeSlug, onSelectPin }: TerritoryMapProps) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const camTarget = useRef({ x: 0, z: 0, dist: 11.5, active: false });
    const hoverRef = useRef<Record<string, boolean>>({});

    // keep camera focus in sync with the active pin (also handles tap-out → activeSlug null)
    useEffect(() => {
        const pin = PINS.find((p) => p.slug === activeSlug);
        if (pin) { camTarget.current = { x: pin.x, z: pin.z, dist: 6, active: true }; }
        else { camTarget.current = { x: 0, z: 0, dist: 11.5, active: false }; }
    }, [activeSlug]);

    useEffect(() => {
        const mount = mountRef.current!;
        const isPhone = window.matchMedia('(max-width: 48em)').matches;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x070708, 0.055);
        const camera = new THREE.PerspectiveCamera(isPhone ? 50 : 38, innerWidth / innerHeight, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, isPhone ? 1.5 : 2));
        renderer.setSize(innerWidth, innerHeight);
        mount.appendChild(renderer.domElement);
        const world = new THREE.Group(); scene.add(world);

        // ---- slab ----
        const shape = new THREE.Shape();
        shape.moveTo(OUTLINE[0][0], OUTLINE[0][1]);
        for (let i = 1; i < OUTLINE.length; i++) shape.lineTo(OUTLINE[i][0], OUTLINE[i][1]);
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 });
        geo.rotateX(-Math.PI / 2); geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        const topMat = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_mouse: { value: new THREE.Vector2() },
                u_bbmin: { value: new THREE.Vector2(bb.min.x, bb.min.z) }, u_bbsize: { value: new THREE.Vector2(bb.max.x - bb.min.x, bb.max.z - bb.min.z) } },
            vertexShader: `varying vec3 vPos; varying vec3 vN; void main(){vPos=position;vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
            fragmentShader: `precision highp float; varying vec3 vPos; varying vec3 vN;
                uniform float u_time; uniform vec2 u_mouse; uniform vec2 u_bbmin; uniform vec2 u_bbsize;
                float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
                float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
                float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.0;a*=.5;}return v;}
                float bayer(vec2 q){int x=int(mod(q.x,4.));int y=int(mod(q.y,4.));int idx=x+y*4;float m[16];
                  m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
                  float v=0.;for(int i=0;i<16;i++){if(i==idx)v=m[i];}return v/16.;}
                void main(){
                  if(vN.y<0.5){gl_FragColor=vec4(0.025,0.025,0.03,1.0);return;}
                  vec2 uv=(vPos.xz-u_bbmin)/u_bbsize;
                  float h=fbm(vPos.xz*0.6+u_time*0.04); h=0.35+0.5*h;
                  float contour=abs(fract(h*8.0)-0.5); float contourLine=smoothstep(0.07,0.0,contour)*0.18;
                  float riverX=0.0+0.9*sin(uv.y*3.0)+0.4*sin(uv.y*7.0);
                  float river=smoothstep(0.55,0.0,abs(vPos.x-riverX));
                  float spot=smoothstep(1.6,0.0,distance(vPos.xz,u_mouse))*0.22;
                  float lum=clamp(h+contourLine+spot,0.0,1.0); lum=mix(lum,0.04,river*0.92);
                  vec2 cell=floor(uv*u_bbsize*46.0); float d=step(bayer(cell),lum);
                  vec3 col=mix(vec3(0.045,0.045,0.05),vec3(0.82,0.83,0.78),d);
                  float glint=step(bayer(cell),river*0.12*(0.5+0.5*sin(uv.y*40.0+u_time)));
                  col=mix(col,vec3(0.18,0.2,0.22),glint*river);
                  gl_FragColor=vec4(col,1.0);
                }`,
            side: THREE.DoubleSide,
        });
        world.add(new THREE.Mesh(geo, topMat));
        world.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 40), new THREE.LineBasicMaterial({ color: 0x02d77b, transparent: true, opacity: 0.3 })));
        const TOP_Y = 0.85;

        // ---- pins ----
        const pinMeshes: THREE.Group[] = [];
        PINS.forEach((p, i) => {
            const g = new THREE.Group();
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0x02d77b, transparent: true, opacity: 0.6 })); stem.position.y = 0.25;
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 18, 18), new THREE.MeshBasicMaterial({ color: 0x02d77b })); head.position.y = 0.5;
            const ring = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.16, 32), new THREE.MeshBasicMaterial({ color: 0x02d77b, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012;
            g.add(stem, head, ring);
            g.position.set(p.x, TOP_Y, p.z);
            g.userData = { baseY: TOP_Y, i, slug: p.slug, ring };
            world.add(g); pinMeshes.push(g);
        });

        // ---- routes ----
        for (let i = 0; i < ROUTE_ORDER.length - 1; i++) {
            const a = PINS[ROUTE_ORDER[i]], b = PINS[ROUTE_ORDER[i + 1]];
            const mid = new THREE.Vector3((a.x + b.x) / 2, TOP_Y + 0.5, (a.z + b.z) / 2);
            const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(a.x, TOP_Y + 0.02, a.z), mid, new THREE.Vector3(b.x, TOP_Y + 0.02, b.z)]);
            world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.01, 6, false), new THREE.MeshBasicMaterial({ color: 0x02d77b, transparent: true, opacity: 0.4 })));
        }

        // ---- massing ----
        PINS.forEach((p) => {
            for (let k = 0; k < 5; k++) {
                const bw = 0.12 + Math.random() * 0.12, bh = 0.1 + Math.random() * 0.4;
                const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), new THREE.MeshBasicMaterial({ color: 0x141414 }));
                const ang = Math.random() * 7, rad = 0.3 + Math.random() * 0.6;
                m.position.set(p.x + Math.cos(ang) * rad, TOP_Y + bh / 2, p.z + Math.sin(ang) * rad);
                world.add(m);
                const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x02d77b, transparent: true, opacity: 0.12 }));
                e.position.copy(m.position); world.add(e);
            }
        });

        // ---- dust ----
        const N = isPhone ? 120 : 260;
        const dustGeo = new THREE.BufferGeometry();
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = Math.random() * 6; pos[i * 3 + 2] = (Math.random() - 0.5) * 16; }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fd9bf, size: 0.025, transparent: true, opacity: 0.4, depthWrite: false }));
        world.add(dust);

        // ---- interaction ----
        const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
        const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / innerWidth; mouse.ty = e.clientY / innerHeight; };
        window.addEventListener('pointermove', onMove);
        const onResize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); };
        window.addEventListener('resize', onResize);

        let curX = 0, curZ = 0, curDist = 11.5;
        const tmpV = new THREE.Vector3();
        const start = performance.now();
        let raf = 0;
        const animate = () => {
            const t = (performance.now() - start) / 1000;
            mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
            const ct = camTarget.current;
            curX += (ct.x - curX) * 0.05; curZ += (ct.z - curZ) * 0.05; curDist += (ct.dist - curDist) * 0.05;
            const orbit = t * 0.05 + (mouse.x - 0.5) * 0.7;
            camera.position.x = curX + Math.sin(orbit) * curDist;
            camera.position.z = curZ + Math.cos(orbit) * curDist;
            camera.position.y = (ct.active ? 4 : 8) + (mouse.y - 0.5) * -2.2;
            camera.lookAt(curX, 0, curZ);
            topMat.uniforms.u_time.value = t;
            topMat.uniforms.u_mouse.value.set((mouse.x - 0.5) * 9, (mouse.y - 0.5) * 9);
            pinMeshes.forEach((g, i) => {
                g.position.y = g.userData.baseY + Math.sin(t * 1.4 + i) * 0.05;
                g.userData.ring.rotation.z = t * 0.6;
                const tgt = hoverRef.current[g.userData.slug] || activeSlug === g.userData.slug ? 1.5 : 1;
                g.scale.x += (tgt - g.scale.x) * 0.15; g.scale.y = g.scale.x; g.scale.z = g.scale.x;
            });
            const dp = dust.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < N; i++) { dp[i * 3 + 1] += 0.004; if (dp[i * 3 + 1] > 6) dp[i * 3 + 1] = 0; }
            dust.geometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
            PINS.forEach((p) => {
                tmpV.set(p.x, TOP_Y + 0.6, p.z); tmpV.project(camera);
                const el = labelRefs.current[p.slug];
                if (!el) return;
                el.style.transform = `translate(${(tmpV.x * 0.5 + 0.5) * innerWidth}px, ${(-tmpV.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -150%)`;
                el.style.opacity = tmpV.z < 1 ? '1' : '0';
            });
            raf = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            mount.removeChild(renderer.domElement);
        };
    }, [activeSlug]);

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