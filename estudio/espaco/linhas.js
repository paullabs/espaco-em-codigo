// Linhas grossas (em pixels) para diagramas: órbitas, réguas, trilhas. Usa Line2 do Three.
import * as THREE from 'three';
import { Line2 } from '/motor3d/node_modules/three/examples/jsm/lines/Line2.js';
import { LineMaterial } from '/motor3d/node_modules/three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from '/motor3d/node_modules/three/examples/jsm/lines/LineGeometry.js';

export function linhaGorda(pontos, { cor = '#B9B3E8', largura = 3, opacidade = 1, tracejada = false, traco = 1, espaco = 0.6, aditiva = false, W = 1080, H = 1920 } = {}) {
  const g = new LineGeometry();
  g.setPositions(pontos.flatMap((p) => [p.x, p.y, p.z]));
  const m = new LineMaterial({ color: new THREE.Color(cor).getHex(), linewidth: largura, transparent: true, opacity: opacidade, dashed: tracejada, dashSize: traco, gapSize: espaco, depthWrite: false });
  if (aditiva) m.blending = THREE.AdditiveBlending;
  m.resolution.set(W, H);
  const l = new Line2(g, m);
  if (tracejada) l.computeLineDistances();
  l.frustumCulled = false;
  l.userData.definir = (pts) => { g.setPositions(pts.flatMap((p) => [p.x, p.y, p.z])); if (tracejada) l.computeLineDistances(); };
  return l;
}

// pontos de um círculo no plano XZ
export function circulo(raio, n = 256, y = 0) {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; p.push(new THREE.Vector3(Math.cos(a) * raio, y, Math.sin(a) * raio)); }
  return p;
}

// marcador de tamanho fixo na tela (pontos de planetas e estrelas quando o tamanho real seria invisível)
export function marcador(textura, cor = '#ffffff', px = 18, H = 1920) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, color: new THREE.Color(cor), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: false }));
  s.renderOrder = 10;
  s.userData.pxv = px;
  // tamanho fixo em pixels: com sizeAttenuation=false a escala é fração da altura vista a 1 unidade, então depende do fov
  s.userData.ajustar = (camera, v = s.userData.pxv) => s.scale.setScalar((v / H) * 2 * Math.tan((camera.fov * Math.PI) / 360));
  return s;
}
