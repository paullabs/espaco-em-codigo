// Câmera de cinema do estúdio: lente em mm (sensor Super 35, 16:9), abertura f, foco, e movimento
// com curvas de tempo estilo After Effects (ease in / ease out / meio). A câmera orbita um centro e olha um alvo.
// Cada PLANO é um trecho de tempo com um "de" e um "para"; a curva do plano controla a velocidade entre os dois.
import * as THREE from 'three';

export const SENSOR_H = 13.5; // mm (altura útil do sensor em 16:9)
export const SENSOR_V = 24; // mm: no formato vertical (9:16) o lado maior do sensor fica na vertical
export const fovDeMm = (mm, vertical = false) => THREE.MathUtils.radToDeg(2 * Math.atan((vertical ? SENSOR_V : SENSOR_H) / (2 * mm)));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, e) => a + (b - a) * e;

// bezier de tempo (x1,y1,x2,y2): o mesmo desenho do gráfico de velocidade do After Effects
function bezierTempo(x1, y1, x2, y2) {
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 10; i++) {
      const cx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t - x;
      const d = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(d) < 1e-6) break;
      t = clamp(t - cx / d);
    }
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  };
}

// nomes das curvas:
//  suave  = Easy Ease (devagar no começo e no fim)
//  parte  = começa devagar e termina RÁPIDO (o movimento atravessa o corte e continua no próximo plano)
//  chega  = começa rápido (herdado do corte) e termina devagar
//  meio   = velocidade quase constante, com bordas leves
export const CURVAS = {
  suave: bezierTempo(0.33, 0, 0.67, 1),
  parte: bezierTempo(0.5, 0, 0.8, 0.6),
  chega: bezierTempo(0.2, 0.4, 0.5, 1),
  meio: bezierTempo(0.2, 0.15, 0.8, 0.85),
};

const sph = (az, el, r) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(r);
};
export { sph };

export class Rig {
  constructor(camera, W = 1920, H = 1080) {
    this.cam = camera;
    this.W = W;
    this.H = H;
  }

  // acha o plano do instante t e devolve os valores interpolados
  quadro(t, planos) {
    let p = planos[planos.length - 1];
    for (const x of planos) {
      if (t < x.t1) { p = x; break; }
    }
    const u = clamp((t - p.t0) / (p.t1 - p.t0));
    const e = (CURVAS[p.curva || 'suave'])(u);
    const v = (k, def) => lerp(p.de[k] ?? def, (p.para[k] ?? p.de[k]) ?? def, e);
    const centro = new THREE.Vector3().fromArray(p.de.centro || [0, 0, 0]).lerp(new THREE.Vector3().fromArray((p.para.centro || p.de.centro) || [0, 0, 0]), e);
    const az = v('az', 0);
    const el = v('el', 0);
    const r = v('r', 10);
    const pos = centro.clone().add(sph(az, el, r));
    return {
      plano: p, u, e, az, el, r, centro, pos,
      mm: v('mm', 35), f: v('f', 4), foco: v('foco', 1), roll: v('roll', 0), tremor: v('tremor', 1),
      // composição: onde o ponto de interesse cai no quadro (fração da largura e da altura); 0,5/0,5 = centro
      cx: lerp((p.de.compo || {}).x ?? 0.5, ((p.para.compo || p.de.compo) || {}).x ?? 0.5, e),
      cy: lerp((p.de.compo || {}).y ?? 0.5, ((p.para.compo || p.de.compo) || {}).y ?? 0.5, e),
      resolverAlvo: (res) => {
        const a = res(p.de.alvo || [0, 0, 0]);
        const b = res((p.para.alvo || p.de.alvo) || [0, 0, 0]);
        return a.clone().lerp(b, e);
      },
    };
  }

  // aplica na câmera do Three e devolve os parâmetros de lente para a pós
  aplicar(q, alvo, t) {
    const c = this.cam;
    const treme = 0.0025 * q.r * q.tremor; // respiração mínima: vida sem balanço de câmera na mão
    c.position.copy(q.pos).add(new THREE.Vector3(Math.sin(t * 0.9) * treme, Math.sin(t * 0.7 + 1.3) * treme, Math.sin(t * 0.5 + 2.1) * treme * 0.5));
    c.up.set(Math.sin(THREE.MathUtils.degToRad(q.roll)), Math.cos(THREE.MathUtils.degToRad(q.roll)), 0);
    c.lookAt(alvo);
    c.fov = fovDeMm(q.mm, this.H > this.W);
    // deslocamento de lente (lens shift): o alvo sai do centro sem girar a câmera
    if (Math.abs(q.cx - 0.5) > 1e-4 || Math.abs(q.cy - 0.5) > 1e-4) c.setViewOffset(this.W, this.H, (0.5 - q.cx) * this.W, (0.5 - q.cy) * this.H, this.W, this.H);
    else c.clearViewOffset();
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    const dist = c.position.distanceTo(alvo);
    return { mm: q.mm, f: q.f, foco: dist * q.foco, alvo, dist, cx: q.cx, cy: q.cy };
  }
}

export const resolverPadrao = (k) => (Array.isArray(k) ? new THREE.Vector3().fromArray(k) : k());
