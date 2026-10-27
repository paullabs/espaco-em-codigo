// Se o Sol sumisse hoje: a Terra só percebe 8 minutos e 20 segundos depois.
// Filmado como cinema, em fundo preto: 3 planos com lente, abertura e foco próprios, curvas de tempo suaves,
// poeira em 3D para paralaxe. Texto: um por vez, só o que é didático.
import * as THREE from 'three';
import { criarCorte, CAMADAS_SOL, CAMADAS_TERRA } from '../corte.js';
import { criarEstrelas, criarPoeiraMundo, texturaHalo, texturaRaios } from '../fundo.js';
import { criarNuvens, criarAtmosfera, criarLua, criarHaloSol } from '../planeta.js';
import { Rig } from '../camera.js';
import { COR } from '../design.js';

const DUR = 14;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x) => x * x * (3 - 2 * x);
const saida = (x) => 1 - Math.pow(1 - clamp(x), 3);
const entre = (t, a, b) => clamp((t - a) / (b - a));

export function montar({ scene, camera, ui, comp, W, H }) {
  const rig = new Rig(camera, W, H);
  camera.far = 400;
  scene.add(criarEstrelas({ n: 1700, raio: 80, semente: 2, tamanho: (H / 1080) * 1.1 }));
  scene.add(criarEstrelas({ n: 320, raio: 45, semente: 5, tamanho: (H / 1080) * 1.8 }));

  const pSol = new THREE.Vector3(-5.6, 0.55, 0);
  const rSol = 3.5;
  const pTerra = new THREE.Vector3(3.5, -0.2, 0);
  const rTerra = 1.5;
  const luz = pSol.clone().sub(pTerra).normalize().add(new THREE.Vector3(0.0, 0.18, 0.62)).normalize();

  scene.add(criarPoeiraMundo({ n: 150, centro: new THREE.Vector3(-1, 0, 0), raioMin: 3, raioMax: 16, tam: H / 1080, semente: 4 }));

  const halo = criarHaloSol({
    centro: pSol, raio: rSol,
    texHalo: texturaHalo([[0, 'rgba(255,196,100,0.62)'], [0.22, 'rgba(255,150,70,0.38)'], [0.4, 'rgba(255,94,126,0.18)'], [0.62, 'rgba(160,60,200,0.08)'], [1, 'rgba(40,20,90,0)']]),
    texRaios: texturaRaios(36, '255,190,110'),
  });
  halo.position.z = -0.6;
  scene.add(halo);

  const sol = criarCorte({ modo: 'sol', camadas: CAMADAS_SOL(), centro: pSol, raio: rSol, luz });
  sol.material.uniforms.uCut.value = 0;
  scene.add(sol);

  const terra = criarCorte({ modo: 'terra', camadas: CAMADAS_TERRA(), centro: pTerra, raio: rTerra, luz });
  terra.material.uniforms.uCut.value = 0;
  scene.add(terra);
  const nuvens = criarNuvens({ centro: pTerra, raio: rTerra });
  nuvens.material.uniforms.uLight.value.copy(luz);
  scene.add(nuvens);
  const atm = criarAtmosfera({ centro: pTerra, raio: rTerra });
  atm.material.uniforms.uLight.value.copy(luz);
  scene.add(atm);

  const lua = criarLua({ centro: new THREE.Vector3(1.05, -1.75, 0.9), raio: 0.36 });
  lua.material.uniforms.uLight.value.copy(luz);
  scene.add(lua);

  // linha tracejada Sol -> Terra e o grão de luz que viaja por ela
  const xIni = pSol.x + rSol * 0.99;
  const xFim = pTerra.x - rTerra * 1.08;
  const yLinha = 0.35;
  const linha = new THREE.Mesh(
    new THREE.PlaneGeometry(xFim - xIni, 0.03),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uA: { value: 0 }, uProg: { value: 0 }, uLen: { value: xFim - xIni } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `precision highp float; varying vec2 vUv; uniform float uA,uProg,uLen;
        void main(){ float d=step(0.5,fract(vUv.x*uLen*5.0)); float ate=step(vUv.x,uProg); float e=1.0-abs(vUv.y*2.0-1.0);
        vec3 c=mix(vec3(0.72,0.68,0.95),vec3(1.0,0.86,0.45),ate); gl_FragColor=vec4(c,d*uA*e*mix(0.5,1.0,ate)); }`,
    })
  );
  linha.position.set((xIni + xFim) / 2, yLinha, 0.2);
  scene.add(linha);
  const grao = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texturaHalo([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,236,170,0.95)'], [0.45, 'rgba(255,170,80,0.35)'], [1, 'rgba(255,120,60,0)']], 256),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  grao.position.set(xIni, yLinha, 0.3);
  scene.add(grao);

  // planos de câmera (lente, abertura e foco por plano; o movimento atravessa os cortes)
  const planos = [
    // 1) 24 mm: os dois no quadro. Sol grande à esquerda (peso), Terra pequena à direita (contrapeso); a câmera avança devagar
    { t0: 0, t1: 5, curva: 'parte', de: { centro: [-1.0, 0, 0], az: -14, el: -2, r: 21, mm: 24, f: 4, alvo: [-1.3, 0.3, 0], compo: { x: 0.5, y: 0.5 } }, para: { centro: [-0.8, 0, 0], az: -4, el: 2, r: 16.8, mm: 24, f: 4, alvo: [-0.9, 0.2, 0], compo: { x: 0.5, y: 0.5 } } },
    // 2) 50 mm: a Terra vira o herói no terço direito; o contador fica no vazio da esquerda
    { t0: 5, t1: 10, curva: 'meio', de: { centro: [3.5, -0.2, 0], az: -44, el: 5, r: 19, mm: 50, f: 2, alvo: [3.5, -0.2, 0], compo: { x: 0.64, y: 0.5 } }, para: { centro: [3.5, -0.2, 0], az: -16, el: 11, r: 15.5, mm: 50, f: 2, alvo: [3.5, -0.1, 0], compo: { x: 0.64, y: 0.5 } } },
    // 3) recuo 24 mm: os dois de novo, a Terra escurece
    { t0: 10, t1: DUR, curva: 'chega', de: { centro: [-0.8, 0, 0], az: -12, el: 5, r: 14, mm: 24, f: 4, alvo: [-0.4, 0, 0], compo: { x: 0.5, y: 0.5 } }, para: { centro: [-0.8, 0, 0], az: 0, el: 1, r: 17, mm: 24, f: 5.6, alvo: [-0.6, 0, 0], compo: { x: 0.5, y: 0.5 } } },
  ];

  function fmt(seg) {
    const s = Math.max(0, Math.round(seg));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  return {
    duracao: DUR,
    desenhar(t) {
      const q = rig.quadro(t, planos);
      const alvo = q.resolverAlvo((k) => new THREE.Vector3().fromArray(k));
      const lente = rig.aplicar(q, alvo, t);
      const eTerraHeroi = q.plano === planos[1];
      comp.registrar(pSol, rSol, { heroi: false, nome: 'sol' });
      comp.registrar(pTerra, rTerra, { heroi: eTerraHeroi, nome: 'terra' });

      // eventos
      const entra = saida(entre(t, 0.0, 1.4));
      const viaja = entre(t, 1.5, 3.8); // grão de luz Sol -> Terra
      const some = suave(entre(t, 4.2, 5.2)); // o Sol apaga
      const conta = entre(t, 5.4, 11.6); // contagem regressiva
      const noite = suave(entre(t, 11.8, 12.6)); // a Terra escurece
      const final = suave(entre(t, 12.9, 13.6));

      // Sol (o raio cresce no começo; o halo some junto com a luz)
      sol.material.uniforms.uTime.value = t;
      sol.material.uniforms.uApaga.value = some;
      sol.userData.giro(t * 0.04);
      sol.material.uniforms.uPulso.value = 1 + 0.2 * Math.sin(t * 1.6);
      const esc = 0.94 + 0.06 * entra;
      sol.userData.definirRaio(rSol * esc);
      halo.userData.halo.scale.setScalar(rSol * 5.2 * (1 + 0.012 * Math.sin(t * 1.4)) * esc);
      halo.userData.halo.material.opacity = (1 - some) * entra;
      halo.userData.raios.material.opacity = 0.2 * (1 - some) * entra;
      halo.userData.raios.material.rotation = t * 0.02;

      // Terra (gira; no fim a luz acaba e as cidades acendem)
      terra.material.uniforms.uTime.value = t;
      terra.userData.giro(t * 0.12 + 1.2);
      terra.material.uniforms.uNoite.value = noite;
      terra.userData.definirRaio(rTerra * (0.94 + 0.06 * entra));
      nuvens.material.uniforms.uTime.value = t;
      nuvens.material.uniforms.uSpin.value.copy(terra.material.uniforms.uSpin.value);
      nuvens.material.uniforms.uNoite.value = noite;
      atm.material.uniforms.uForca.value = 0.9 * (1 - noite * 0.92);
      const a = 0.35 * t;
      lua.position.set(pTerra.x - 2.3 - 0.35 * Math.cos(a * 0.4), pTerra.y - 0.55 + 0.25 * Math.sin(a * 0.5), 1.1 + 0.8 * Math.sin(a * 0.3));
      lua.material.uniforms.uCenter.value.copy(lua.position);
      lua.material.uniforms.uNoite.value = noite;

      // linha e grão
      linha.material.uniforms.uA.value = suave(entre(t, 1.2, 1.8)) * (1 - noite);
      linha.material.uniforms.uProg.value = viaja;
      grao.position.x = xIni + (xFim - xIni) * suave(viaja);
      grao.material.opacity = viaja > 0 && viaja < 1 ? 0.9 + 0.1 * Math.sin(t * 20) : 0;
      grao.scale.setScalar(0.8 + 0.1 * Math.sin(t * 9));

      // ---- texto: um por vez, sem título, sem notas ----
      ui.limpar();
      const aLinha = suave(entre(t, 1.9, 2.5)) * (1 - suave(entre(t, 4.0, 4.6)));
      const aCont = suave(entre(t, 5.5, 6.0)) * (1 - suave(entre(t, 11.5, 11.9)));
      if (final > 0.01) {
        ui.fechamento({ chave: '8 minutos', resto: 'de luz emprestada', x: 0.07, y: 0.5, alpha: final });
      } else if (aCont > 0.01) {
        const resto = 500 * (1 - suave(conta));
        ui.numero({ valor: fmt(resto), x: 0.24, y: 0.5, alpha: aCont, cor: resto < 1 ? COR.texto.ouro : COR.texto.branco });
      } else if (aLinha > 0.01) {
        const meio = ui.projetar(new THREE.Vector3((xIni + xFim) / 2, yLinha, 0.2), camera);
        ui.numero({ valor: '8 min 20 s', x: meio.x / W, y: (meio.y - 0.17 * H) / H, alpha: aLinha, cor: COR.texto.ouro, tam: 0.72 });
      }
      return lente;
    },
  };
}
