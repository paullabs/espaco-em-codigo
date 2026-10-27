// Corpos celestes completos (esfera com superfície procedural, atmosfera, nuvens, anéis, halo, feixes de pulsar).
// criarCorpo('lua' | 'marte' | 'jupiter' | 'estrelaG' | ...) devolve { grupo, atualizar(t), raioUn, dados }.
// O raio do grupo é 1 unidade; escale o grupo para o tamanho desejado na cena.
import * as THREE from 'three';
import { RUIDO } from './glsl.js';
import { SUP } from './superficies.js';
import { DADOS } from './dados.js';
import { cor3 } from './corte.js';
import { criarNuvens, criarAtmosfera } from './planeta.js';
import { texturaHalo } from './fundo.js';
import { estiloDaUrl } from './estilos.js';

// desenho dos planetas no estilo escolhido (estilos.js, token 'corpo'); o clássico não tem: fica como o v11
const CORPO = estiloDaUrl().corpo || {};

// texturas de coroa e de risco de lente (canvas, sem arquivo): raios finos em volta da estrela e um traço horizontal
const _cache = {};
function texturaCoroa(semente = 1, n = 18) {
  const k = 'c' + semente + '_' + n; if (_cache[k]) return _cache[k];
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  let s = semente * 7919 + 13; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.translate(128, 128); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, len = 70 + rnd() * 58, w = 1.2 + rnd() * 3.2;
    g.save(); g.rotate(a);
    const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -w); g.lineTo(len, -w * 0.12); g.lineTo(len, w * 0.12); g.lineTo(0, w); g.closePath(); g.fill(); g.restore();
  }
  const r = g.createRadialGradient(0, 0, 0, 0, 0, 128); r.addColorStop(0, 'rgba(255,255,255,0.45)'); r.addColorStop(0.35, 'rgba(255,255,255,0.10)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(-128, -128, 256, 256);
  return (_cache[k] = new THREE.CanvasTexture(c));
}
function texturaRisco() {
  if (_cache.risco) return _cache.risco;
  const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 28, 512, 8);
  const gv = g.createLinearGradient(0, 0, 0, 64); gv.addColorStop(0, 'rgba(0,0,0,1)'); gv.addColorStop(0.5, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = gv; g.fillRect(0, 0, 512, 64);
  return (_cache.risco = new THREE.CanvasTexture(c));
}
// halo suave de planeta: cheio até a borda do corpo (0.625 do raio do sprite de 3.2) e somem até 1.6 raios
function texturaHaloPlaneta() {
  return _cache.haloPl || (_cache.haloPl = texturaHalo([[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,1)'], [0.64, 'rgba(255,255,255,0.5)'], [0.72, 'rgba(255,255,255,0.2)'], [0.85, 'rgba(255,255,255,0.05)'], [1, 'rgba(255,255,255,0)']]));
}

const TIPOS = { lua: 0, mercurio: 1, marte: 2, venus: 3, jupiter: 4, saturno: 5, urano: 6, netuno: 7, estrela: 8, terra: 9 };

const VERT = /* glsl */ `
varying vec3 vObj; varying vec3 vNw; varying vec3 vW;
void main(){ vObj=position; vNw=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vObj; varying vec3 vNw; varying vec3 vW;
uniform int uTipo; uniform vec3 uLuz; uniform vec3 uPal0,uPal1,uPal2,uPal3,uRim; uniform mat3 uRot;
uniform float uTime,uCelEsc,uCelContr,uCelSoft,uMancha,uBrilho,uEscuro,uQueima,uPres;
${RUIDO}
${SUP}
vec3 lit(vec3 alb,float ndl,float passos){
  float l=clamp(ndl*1.08+0.06,0.0,1.0);
  l=mix(l,floor(l*passos+0.5)/passos,0.6);
  vec3 sh=(uTipo<=2)?vec3(0.40,0.37,0.47):vec3(0.28,0.26,0.58);   // rochosos: sombra menos azul, para a Lua não parecer roxa
  vec3 tint=mix(sh,vec3(1.07,1.02,0.95),l);
  return alb*tint;
}
#ifdef CHAPADO
// desenho chapado (estilo 'vivo'): só dois tons, luz e sombra, com a divisão limpa entre eles; a sombra puxa para o azul.
// Liga na compilação (define CHAPADO): sem ele o shader é o mesmo do v11, pixel a pixel.
vec3 litChapado(vec3 alb,float ndl){
  float k=smoothstep(-0.012,0.012,ndl-0.02);
  vec3 sh=(uTipo<=2)?vec3(0.42,0.42,0.56):vec3(0.32,0.31,0.52);
  return alb*mix(sh,vec3(1.04,1.01,0.96),k);
}
#endif
void main(){
  vec3 n0=normalize(vObj);
  vec3 nw=normalize(vNw);
  vec3 v=normalize(cameraPosition-vW);
  float mu=clamp(dot(nw,v),0.0,1.0);
  vec3 L=normalize(uLuz);
  vec3 col;
  if(uTipo==8){
    col=estrela(n0,mu);
    col+=uRim*pow(1.0-mu,2.4)*(0.35+0.30*uPres);
    col*=1.0+uPres*0.10*smoothstep(0.55,0.0,mu);                // borda um pouco mais viva: a esfera ganha volume
    col*=uBrilho;
  } else {
    vec3 alb; vec3 grad=vec3(0.0); float br=0.0; float oc=0.0;
    float passos=4.0;
    if(uTipo<=2){ alb=rochoso(n0,uTipo,grad,br); passos=6.0; nw=normalize(nw-(uRot*grad)*0.55); }
    else if(uTipo==3){ alb=venus(n0); passos=14.0; }
    else if(uTipo==4){ alb=jupiter(n0); if(uEscuro>0.5) alb*=0.62; passos=14.0; }
    else if(uTipo==5){ alb=saturno(n0); passos=14.0; }
    else if(uTipo==6){ alb=gelo(n0,0.15); passos=14.0; }
    else if(uTipo==7){ alb=gelo(n0,1.0); passos=14.0; }
    else { alb=terraSup(n0,oc); }
    if(uPres>0.5){                                                   // textura fina: ondas no oceano, grão na terra e nas rochas
      float gr=vn(n0*190.0+vec3(uTime*0.15,0.0,0.0))-0.5;
#ifdef CHAPADO
      gr*=0.3;                                                       // chapado: superfície mais lisa
#endif
      if(uTipo==9) alb*=1.0+gr*(oc>0.5?0.10:0.07); else alb*=1.0+gr*0.10;
    }
    float ndl=dot(nw,L);
#ifdef CHAPADO
    col=litChapado(alb,ndl);
    float borda=smoothstep(0.70,0.74,1.0-mu)*smoothstep(0.02,0.12,ndl);    // filete claro e fino na borda do lado da luz
    col=mix(col,col*1.16+uRim*0.10,borda*0.8);
#else
    col=lit(alb,ndl,passos);
    float rim=pow(1.0-mu,3.0)*smoothstep(-0.1,0.5,ndl);
    col+=uRim*rim*(0.5+0.35*uPres);
#endif
    if(uTipo==9){
      float tmz=smoothstep(-0.10,0.0,ndl)*(1.0-smoothstep(0.0,0.20,ndl));   // faixa quente do entardecer entre o dia e a noite
#ifdef CHAPADO
      tmz*=0.5;
#endif
      col+=vec3(1.0,0.50,0.22)*tmz*0.20*uPres;
      vec3 rf=reflect(-L,normalize(vNw)); float g=pow(max(dot(rf,v),0.0),260.0);
      col+=vec3(1.0,0.95,0.8)*step(0.5,g)*oc*0.45;
      float night=1.0-smoothstep(-0.12,0.06,ndl);
      float cm=step(0.0,0.5-oc)*smoothstep(0.42,0.56,fbm(n0*3.1+vec3(4.0)));
      vec2 vv=vor(n0*30.0);
      float dots=smoothstep(0.30,0.10,vv.x)*step(0.40,h31(floor(n0*30.0)));
      col+=vec3(1.0,0.784,0.341)*dots*cm*night*2.2;
      if(uQueima>0.001){
        vec2 vq=vor(n0*5.0+vec3(uTime*0.3)); float cr=smoothstep(0.10,0.0,vq.y-vq.x);
        float lava=0.6+0.8*fbm(n0*7.0+vec3(uTime*0.5));
        vec3 magma=mix(vec3(0.35,0.04,0.02),vec3(1.0,0.45,0.10),lava);
        col=mix(col*vec3(1.0,0.45,0.35),magma,uQueima*0.85);
        col+=vec3(1.0,0.55,0.15)*cr*uQueima*2.2;
      }
    }
  }
  gl_FragColor=vec4(col,1.0);
}`;

const FRAG_ANEL = /* glsl */ `
precision highp float;
varying vec3 vObj; varying vec3 vW;
uniform vec3 uLuz,uCentro,uCor0,uCor1; uniform float uR;
${RUIDO}
float faixa(float r,float a,float b,float s){ return smoothstep(a-s,a+s,r)-smoothstep(b-s,b+s,r); }
void main(){
  float r=length(vObj.xy);       // 1.25 .. 2.4 (em raios do planeta)
  float dens=0.0;
  dens+=faixa(r,1.28,1.52,0.015)*0.30;                      // anel C (fraco)
  dens+=faixa(r,1.54,1.94,0.012)*0.95;                      // anel B (denso)
  dens+=faixa(r,2.03,2.28,0.010)*0.62*(1.0-faixa(r,2.205,2.225,0.004)); // anel A com divisão de Encke
  dens+=faixa(r,2.325,2.345,0.004)*0.30;                    // anel F
  float estria=0.6+0.4*vn(vec3(r*95.0,1.3,0.0))+0.15*vn(vec3(r*310.0,4.0,0.0));
  dens*=clamp(estria,0.0,1.2);
  if(dens<0.02) discard;
  vec3 col=mix(uCor1,uCor0,clamp(0.35+0.5*vn(vec3(r*30.0,7.0,0.0)),0.0,1.0));
  col=mix(col,col*vec3(0.78,0.68,0.62),faixa(r,1.28,1.52,0.02));
  // sombra do planeta sobre o anel
  vec3 L=normalize(uLuz); vec3 P=vW; float t=dot(uCentro-P,L);
  float sombra=0.0;
  if(t>0.0){ float d=length(P+L*t-uCentro); sombra=smoothstep(uR*1.0,uR*0.96,d); }
  col*=mix(1.0,0.28,sombra);
  col*=mix(vec3(0.70,0.64,0.86),vec3(1.06,1.02,0.95),1.0-sombra*0.6);
  gl_FragColor=vec4(col,clamp(dens,0.0,1.0)*0.96);
}`;

const FRAG_FEIXE = /* glsl */ `
precision highp float; varying vec2 vUv; uniform vec3 uCor; uniform float uA;
void main(){ float x=vUv.x; float y=abs(vUv.y*2.0-1.0); float a=smoothstep(1.0,0.0,y)*smoothstep(1.0,0.05,x)*smoothstep(0.0,0.08,x); a=pow(a,1.6); gl_FragColor=vec4(uCor*a*uA,a*uA); }`;

export function criarCorpo(chave, opc = {}) {
  const d = DADOS[chave];
  if (!d) throw new Error('corpo desconhecido: ' + chave);
  const grupo = new THREE.Group();
  const tipo = TIPOS[d.tipo];
  const luz = opc.luz || new THREE.Vector3(-1, 0.35, 0.7);
  const rim = d.rim || (d.atm ? d.atm[0] : '#8FA8FF');
  const chapado = opc.chapado ?? CORPO.chapado ?? 0;
  const kHalo = d.tipo === 'estrela' ? 0 : (opc.haloPlaneta ?? CORPO.halo ?? 0);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    defines: chapado ? { CHAPADO: 1 } : {},
    uniforms: {
      uTipo: { value: tipo },
      uLuz: { value: luz.clone().normalize() },
      uPal0: { value: cor3(d.pal[0]) }, uPal1: { value: cor3(d.pal[1]) }, uPal2: { value: cor3(d.pal[2]) }, uPal3: { value: cor3(d.pal[3]) },
      uRim: { value: cor3(rim) },
      uRot: { value: new THREE.Matrix3() },
      uTime: { value: 0 },
      uCelEsc: { value: d.celEsc || 8 }, uCelContr: { value: d.celContr ?? 1 }, uCelSoft: { value: d.celSoft ?? 0 }, uMancha: { value: d.mancha || 0 },
      uBrilho: { value: d.brilho || 1 }, uEscuro: { value: d.escura ? 1 : 0 }, uQueima: { value: 0 }, uPres: { value: opc.presenca ? 1 : 0 },
    },
  });
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), mat);
  grupo.userData.material = mat;
  grupo.add(corpo);
  const extras = [];

  if (d.atm) {
    const atm = criarAtmosfera({ centro: new THREE.Vector3(), raio: 1 });
    atm.material.uniforms.c1.value = cor3(d.atm[0]);
    atm.material.uniforms.c2.value = cor3(d.atm[1]);
    atm.material.uniforms.uForca.value = (d.atmForca ?? 0.7) * (opc.presenca ? 1.3 : 1);
    atm.material.uniforms.uLight.value.copy(luz).normalize();
    grupo.add(atm);
    grupo.userData.atm = atm;
    extras.push(() => atm.material.uniforms.uCenter.value.setFromMatrixPosition(grupo.matrixWorld));
  }
  if (d.nuvens) {
    const nv = criarNuvens({ centro: new THREE.Vector3(), raio: 1, cobertura: opc.presenca ? 0.535 : 0.60, suavidade: opc.presenca ? 0.07 : 0.02, chapado });
    nv.material.uniforms.uLight.value.copy(luz).normalize();
    grupo.add(nv);
    extras.push((t) => {
      nv.material.uniforms.uCenter.value.setFromMatrixPosition(grupo.matrixWorld);
      nv.material.uniforms.uRadius.value = new THREE.Vector3().setFromMatrixScale(grupo.matrixWorld).x;
      nv.material.uniforms.uTime.value = t;
      nv.material.uniforms.uSpin.value.copy(new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationY(-(t * 0.05))));
    });
  }
  if (d.aneis) {
    const am = new THREE.ShaderMaterial({
      vertexShader: VERT.replace('varying vec3 vNw;', '').replace('vNw=normalize(mat3(modelMatrix)*normal);', ''),
      fragmentShader: FRAG_ANEL,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uLuz: { value: luz.clone().normalize() }, uCentro: { value: new THREE.Vector3() }, uR: { value: 1 }, uCor0: { value: cor3('#F4E4B8') }, uCor1: { value: cor3('#C9A36A') } },
    });
    const anel = new THREE.Mesh(new THREE.RingGeometry(1.25, 2.4, 192, 1), am);
    anel.rotation.x = -Math.PI / 2 + 0.0;
    anel.renderOrder = 2;
    const incl = new THREE.Group();
    incl.rotation.z = THREE.MathUtils.degToRad(opc.inclinacao ?? 18);
    incl.add(anel);
    grupo.add(incl);
    extras.push(() => {
      am.uniforms.uCentro.value.setFromMatrixPosition(grupo.matrixWorld);
      am.uniforms.uR.value = new THREE.Vector3().setFromMatrixScale(grupo.matrixWorld).x;
    });
    corpo.rotation.z = THREE.MathUtils.degToRad(opc.inclinacao ?? 18);
  }
  if (kHalo > 0) {                                          // halo suave na cor do planeta (atrás do corpo, aditivo)
    const hp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturaHaloPlaneta(), color: new THREE.Color(d.atm ? d.atm[0] : rim), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: kHalo }));
    hp.scale.setScalar(3.2);
    hp.renderOrder = -1;
    grupo.add(hp);
    grupo.userData.haloPlaneta = hp;
  }
  if (d.tipo === 'estrela') {
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texturaHalo([[0, (d.halo || 'rgba(255,200,120,0.7)')], [0.25, (d.halo || 'rgba(255,200,120,0.7)').replace(/[\d.]+\)$/, '0.28)')], [0.55, (d.halo || 'rgba(255,200,120,0.7)').replace(/[\d.]+\)$/, '0.08)')], [1, 'rgba(0,0,0,0)']]),
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    halo.scale.setScalar(opc.halo ?? 5.0);
    halo.renderOrder = -1;
    grupo.add(halo);
    grupo.userData.halo = halo;
    if (opc.presenca) {                                       // coroa viva: raios finos girando em sentidos opostos e um risco de lente
      const corTons = { estrelaG: '#ffd9a0', estrelaM: '#ff8a6a', estrelaB: '#bcd4ff' }[chave] || '#ffe2b0';
      const mk = (tex, esc, op, rot0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(corTons), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op, rotation: rot0 })); sp.scale.setScalar(esc); sp.renderOrder = -1; grupo.add(sp); return sp; };
      const base = (opc.halo ?? 5.0);
      const cA = mk(texturaCoroa(3, 20), base * 1.15, 0.34, 0), cB = mk(texturaCoroa(8, 14), base * 0.8, 0.26, 1.2);
      let risco = null; if (chave !== 'estrelaG' && opc.risco !== false) { risco = mk(texturaRisco(), base * 1.5, 0.16, 0); risco.scale.set(base * 1.5, base * 0.16, 1); }
      grupo.userData.coroa = { cA, cB, risco };
    }
  }
  if (d.pulsar) {
    const feixes = new THREE.Group();
    for (const s of [1, -1]) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 1.1),
        new THREE.ShaderMaterial({
          vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
          fragmentShader: FRAG_FEIXE,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uCor: { value: cor3('#9CD0FF') }, uA: { value: 0.9 } },
        })
      );
      m.position.x = s * 7;
      m.rotation.y = s > 0 ? 0 : Math.PI;
      feixes.add(m);
      const m2 = m.clone();
      m2.rotation.x = Math.PI / 2;
      feixes.add(m2);
    }
    feixes.rotation.z = THREE.MathUtils.degToRad(-35);
    grupo.add(feixes);
    grupo.userData.feixes = feixes;
  }

  const q = new THREE.Quaternion();
  return {
    grupo, dados: d, chave,
    atualizar(t, { spin = 0.08 } = {}) {
      mat.uniforms.uTime.value = t;
      if (!d.aneis) corpo.rotation.y = t * spin;
      else corpo.rotation.y = t * spin;
      grupo.updateMatrixWorld(true);
      corpo.getWorldQuaternion(q);
      mat.uniforms.uRot.value.setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
      extras.forEach((f) => f(t));
      if (grupo.userData.feixes) grupo.userData.feixes.rotation.y = t * 3.2;
      const hp = grupo.userData.haloPlaneta; if (hp) hp.material.opacity = kHalo * Math.max(0, 1 - mat.uniforms.uQueima.value * 2.5); // a Terra queimando perde o halo, como perde a atmosfera
      const co = grupo.userData.coroa; if (co) { co.cA.material.rotation = t * 0.06; co.cB.material.rotation = 1.2 - t * 0.045; const h = grupo.userData.halo ? grupo.userData.halo.scale.x / (opc.halo ?? 5.0) : 1; const kc = opc.coroa ?? 1; co.cA.material.opacity = 0.34 * kc * Math.min(1.6, h); co.cB.material.opacity = 0.26 * kc * Math.min(1.6, h); }
    },
  };
}
