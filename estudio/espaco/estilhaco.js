// Planeta que se estilhaça em pedaços sólidos (e pode rebobinar).
// A superfície de cada pedaço usa o MESMO material do planeta (a textura vem da posição original), então o planeta
// inteiro e os pedaços juntos são idênticos; as faces internas são magma incandescente.
// criarEstilhacos({ material }) -> { grupo, atualizar(tau, t) }   tau = segundos desde a ruptura (0 = inteiro)
import * as THREE from 'three';
import { RUIDO } from './glsl.js';

const FRAG_MAGMA = /* glsl */ `
precision highp float; varying vec3 vP; uniform float uTime;
${RUIDO}
void main(){
  float r=length(vP);
  float n=fbm(vP*5.0+vec3(0.0,uTime*0.6,0.0));
  vec3 c=mix(vec3(0.35,0.03,0.02),vec3(1.0,0.38,0.06),smoothstep(0.25,0.75,n));
  c=mix(c,vec3(1.0,0.86,0.45),smoothstep(0.75,1.0,n)*smoothstep(0.9,0.3,r));
  gl_FragColor=vec4(c*1.25,1.0);
}`;

export function criarEstilhacos({ material, n = 90, semente = 4, detalhe = 12 }) {
  let s = semente * 7919 + 17;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const sementes = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996 + (rnd() - 0.5) * 0.6;
    sementes.push(new THREE.Vector3(Math.cos(a) * r, y + (rnd() - 0.5) * 0.08, Math.sin(a) * r).normalize());
  }
  const ico = new THREE.IcosahedronGeometry(1, detalhe).toNonIndexed();
  const P = ico.attributes.position;
  const baldes = Array.from({ length: n }, () => []);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();
  for (let i = 0; i < P.count; i += 3) {
    a.fromBufferAttribute(P, i); b.fromBufferAttribute(P, i + 1); c.fromBufferAttribute(P, i + 2);
    m.copy(a).add(b).add(c).normalize();
    let k = 0, best = -2;
    for (let j = 0; j < n; j++) { const d = m.dot(sementes[j]); if (d > best) { best = d; k = j; } }
    baldes[k].push(a.clone(), b.clone(), c.clone());
  }
  const magma = new THREE.ShaderMaterial({ vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: FRAG_MAGMA, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 } } });
  const grupo = new THREE.Group();
  const pecas = [];
  baldes.forEach((tri, k) => {
    if (!tri.length) return;
    const centro = sementes[k].clone().multiplyScalar(0.22 + 0.08 * rnd()); // ponto interno da peça
    const pos = [], nor = [];
    for (const v of tri) { pos.push(v.x, v.y, v.z); const nn = v.clone().normalize(); nor.push(nn.x, nn.y, nn.z); }
    const nExt = pos.length / 3;
    for (let i = 0; i < tri.length; i += 3) {
      for (let e = 0; e < 3; e++) {
        const p1 = tri[i + e], p2 = tri[i + ((e + 1) % 3)];
        const fn = new THREE.Vector3().subVectors(p2, p1).cross(new THREE.Vector3().subVectors(centro, p1)).normalize();
        for (const v of [p2, p1, centro]) { pos.push(v.x, v.y, v.z); nor.push(fn.x, fn.y, fn.z); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.addGroup(0, nExt, 0);
    g.addGroup(nExt, pos.length / 3 - nExt, 1);
    const malha = new THREE.Mesh(g, [material, magma]);
    malha.frustumCulled = false;
    // pivô no centro da peça: a geometria fica nas coordenadas originais (a textura não se mexe)
    const C = new THREE.Vector3(); tri.forEach((v) => C.add(v)); C.divideScalar(tri.length).multiplyScalar(0.8);
    const piv = new THREE.Group(); piv.position.copy(C); malha.position.copy(C).negate(); piv.add(malha); grupo.add(piv);
    pecas.push({ piv, C, dir: C.clone().normalize(), v: 1.4 + 1.8 * rnd(), w: (rnd() - 0.5) * 4.5, eixo: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize() });
  });
  grupo.visible = false;
  return {
    grupo, magma,
    atualizar(tau, t) {
      magma.uniforms.uTime.value = t;
      const T = Math.max(0, tau);
      for (const p of pecas) {
        const d = p.v * ((1 - Math.exp(-2.4 * T)) * 1.1 + 0.32 * T);
        p.piv.position.copy(p.C).addScaledVector(p.dir, d);
        p.piv.quaternion.setFromAxisAngle(p.eixo, p.w * T);
      }
    },
  };
}
