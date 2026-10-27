// Superfícies procedurais em GLSL: corpos rochosos (Lua, Mercúrio, Marte) com crateras em várias escalas,
// bacias escuras, raios de ejeção e relevo (bump); gigantes gasosos com faixas, tempestades e vórtices;
// Vênus; estrelas por classe espectral (granulação, manchas, escurecimento de borda).
// Pressupõe os uniformes: uTime, uPal0..uPal3 (cores), uCelEsc, uCelContr, uMancha.
export const SUP = /* glsl */ `
// ---------- crateras: altura (relevo) e variação de albedo ----------
float crH(vec3 n,float esc,float dens,float seed,out float alb){
  vec3 p=n*esc; vec3 id=floor(p); vec3 f=p-id; float H=0.0; alb=0.0;
  for(int a=-1;a<=1;a++) for(int b=-1;b<=1;b++) for(int c=-1;c<=1;c++){
    vec3 g=vec3(float(a),float(b),float(c)); vec3 cid=id+g+seed;
    float pr=h31(cid*1.37+vec3(3.1,1.7,5.3));
    if(pr<dens){
      vec3 o=0.25+0.5*h33(cid*0.77);
      float R=0.14+0.30*h31(cid*2.31+vec3(9.0));
      float d=length(g+o-f)/R;
      if(d<2.4){
        float inside=(d<1.05)?1.0:0.0;
        float bowl=-(1.0-smoothstep(0.50,1.0,d))*inside*0.9;
        float rim=exp(-pow((d-1.02)/0.14,2.0))*0.8;
        float ej=(d>1.0)?smoothstep(2.4,1.05,d)*0.18:0.0;
        H+=(bowl+rim+ej)*R;
        alb+=rim*0.50+ej*0.9-inside*(1.0-smoothstep(0.0,1.0,d))*0.42;
      }
    }
  }
  return H;
}

// relevo total (3 escalas) e albedo delta (4 escalas)
float relevo(vec3 n,out float alb){
  float a1,a2,a3,a4;
  float H=crH(n,3.0,0.55,1.0,a1)*1.0+crH(n,8.0,0.50,7.0,a2)*0.55+crH(n,21.0,0.45,13.0,a3)*0.25;
  crH(n,52.0,0.40,29.0,a4);
  alb=a1*0.8+a2*0.7+a3*0.55+a4*0.35;
  return H;
}
float relevoSo(vec3 n){ float a; return relevo(n,a); }

// gradiente tangencial do relevo (para inclinar a normal)
vec3 gradRelevo(vec3 n,float h0){
  vec3 up=(abs(n.y)<0.9)?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
  vec3 t1=normalize(cross(n,up)); vec3 t2=cross(n,t1);
  float e=0.0035;
  float h1=relevoSo(normalize(n+t1*e)); float h2=relevoSo(normalize(n+t2*e));
  return ((h1-h0)/e)*t1+((h2-h0)/e)*t2;
}

// raios de ejeção de uma cratera jovem (estilo Tycho)
float raiosTycho(vec3 n,vec3 T){
  float c=clamp(dot(n,T),-1.0,1.0); float d=acos(c);
  vec3 up=(abs(T.y)<0.9)?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
  vec3 u=normalize(cross(T,up)); vec3 v=cross(T,u);
  float phi=atan(dot(n,v),dot(n,u));
  float r=smoothstep(0.55,0.85,vn(vec3(phi*6.0,d*2.2,1.3))+0.25*vn(vec3(phi*17.0,d*5.0,4.0)));
  return r*exp(-d*2.4)*smoothstep(0.02,0.12,d)+exp(-pow((d-0.06)/0.02,2.0))*0.5;
}

// kind: 0 Lua, 1 Mercúrio, 2 Marte. Paleta: uPal0 claro, uPal1 médio, uPal2 escuro (bacias), uPal3 detalhe
vec3 rochoso(vec3 n,int kind,out vec3 grad,out float brilho){
  float alb; float H=relevo(n,alb);
  grad=gradRelevo(n,H);
  float alto=fbm(n*3.2+vec3(2.0));
  vec3 col=mix(uPal0,uPal1,smoothstep(0.35,0.7,alto));
  brilho=0.0;
  if(kind==0){
    float mar=smoothstep(0.52,0.56,fbm(n*1.5+vec3(4.0))+0.10*vn(n*6.0)-0.10*smoothstep(0.55,0.95,abs(n.y)));
    col=mix(col,uPal2,mar*0.9);
    col=mix(col,uPal2*0.85,smoothstep(0.0,0.5,-alb)*0.25*mar);
    col*=1.0+alb*0.55;
    float ry=raiosTycho(n,normalize(vec3(-0.2,-0.78,0.55)));
    col=mix(col,vec3(1.0),clamp(ry*0.55,0.0,0.7)); brilho=ry;
    col*=0.95+0.10*vn(n*160.0);
  } else if(kind==1){
    col*=1.0+alb*0.6;
    float ry=raiosTycho(n,normalize(vec3(0.5,0.3,0.8)))+0.7*raiosTycho(n,normalize(vec3(-0.6,-0.4,0.6)));
    col=mix(col,vec3(1.0),clamp(ry*0.4,0.0,0.6));
    col=mix(col,uPal2,smoothstep(0.55,0.75,fbm(n*2.6+vec3(8.0)))*0.35);
    col*=0.93+0.14*vn(n*140.0);
  } else {
    // Marte: regiões escuras, cânion e calotas
    float esc=smoothstep(0.50,0.58,fbm(n*2.2+vec3(6.0)));
    col=mix(col,uPal2,esc*0.75);
    float cany=smoothstep(0.035,0.0,abs(n.y+0.08+0.05*fbm(n*6.0+vec3(3.0))))*smoothstep(0.35,0.55,vn(n*vec3(2.0,6.0,2.0)+vec3(1.0)))*smoothstep(-0.3,0.4,n.x);
    col=mix(col,uPal2*0.55,cany*0.9);
    col=mix(col,uPal3,smoothstep(0.55,0.75,fbm(n*7.0))*0.22);
    col*=1.0+alb*0.2; grad*=0.4;
    float pol=smoothstep(0.90,0.94,abs(n.y)+0.03*vn(n*20.0));
    col=mix(col,vec3(0.97,0.98,1.0),pol);
    col*=0.95+0.10*vn(n*120.0);
  }
  return col;
}

// ---------- gigantes gasosos ----------
// uPal0 zona clara, uPal1 zona média, uPal2 cinturão escuro, uPal3 detalhe/tempestade
vec3 jupiter(vec3 n){
  float lat=n.y;
  float warp=fbm(vec3(n.x*3.0,n.y*14.0,n.z*3.0)+vec3(uTime*0.004,0.0,0.0));
  float lon0=atan(n.z,n.x);
  float b=lat*1.0+(warp-0.5)*0.2+0.035*fbm(n*22.0);
  float band=0.5+0.5*sin(b*23.0+1.5*sin(b*8.3+1.0)+0.6*sin(b*37.0));
  float strk=fbm(vec3(lon0*2.6,lat*52.0,3.0));
  vec3 col=mix(uPal2,uPal0,smoothstep(0.28,0.72,band));
  col=mix(col,uPal1,smoothstep(0.35,0.85,fbm(vec3(n.x*5.0,n.y*28.0,n.z*5.0)+vec3(3.0)))*0.55);
  col*=0.86+0.30*strk;
  col=mix(col,uPal2,smoothstep(0.62,0.82,fbm(vec3(lon0*4.0,lat*90.0,7.0)))*0.25);
  float borda=1.0-smoothstep(0.0,0.28,abs(band-0.5));
  float turb=fbm(vec3(n.x*11.0,n.y*34.0,n.z*11.0)+vec3(uTime*0.01,0.0,0.0));
  col=mix(col,mix(uPal0,uPal2,turb),borda*0.35);
  // vórtices pequenos (ovais brancos)
  vec2 vv=vor(vec3(n.x*14.0,n.y*34.0,n.z*14.0));
  float oval=smoothstep(0.22,0.08,vv.x)*step(0.86,h31(floor(vec3(n.x*14.0,n.y*34.0,n.z*14.0))))*smoothstep(0.30,0.50,band)*(1.0-smoothstep(0.55,0.75,band));
  col=mix(col,vec3(1.0,0.97,0.9),oval*0.8);
  // Grande Mancha Vermelha
  float lon=atan(n.z,n.x); float latS=asin(clamp(n.y,-1.0,1.0));
  float dl=lon-0.9; dl=atan(sin(dl),cos(dl))*cos(latS);
  vec2 q=vec2(dl/0.30,(latS+0.30)/0.14);
  float r=length(q);
  float spot=smoothstep(1.0,0.82,r);
  float ang=atan(q.y,q.x)+r*5.5;
  vec3 red=mix(uPal3,uPal3*vec3(1.15,0.75,0.6),0.5+0.5*sin(ang*2.0));
  col=mix(col,vec3(1.0,0.93,0.82),smoothstep(1.35,1.0,r)*0.55*(1.0-spot));
  col=mix(col,red,spot);
  return col;
}

vec3 saturno(vec3 n){
  float b=n.y+0.05*(fbm(vec3(n.x*3.0,n.y*10.0,n.z*3.0))-0.5)+0.012*fbm(n*30.0);
  float band=0.5+0.5*sin(b*26.0+sin(b*7.0));
  vec3 col=mix(uPal1,uPal0,smoothstep(0.3,0.7,band));
  col=mix(col,uPal2,smoothstep(0.55,0.9,fbm(vec3(n.x*4.0,n.y*20.0,n.z*4.0)+vec3(5.0)))*0.35);
  float hex=smoothstep(0.78,0.9,abs(n.y))*0.5;      // polo mais escuro e azulado
  col=mix(col,uPal3,hex*0.6);
  return col;
}

vec3 gelo(vec3 n,float forte){
  float b=n.y+0.03*fbm(n*6.0);
  float band=0.5+0.5*sin(b*14.0+fbm(n*3.0)*3.0);
  vec3 col=mix(uPal1,uPal0,smoothstep(0.2,0.8,band)*0.6+0.2*fbm(n*4.0+vec3(2.0)));
  // nuvens brancas finas e mancha escura (Netuno)
  float nuv=smoothstep(0.60,0.72,fbm(vec3(n.x*3.0,n.y*16.0,n.z*3.0)+vec3(7.0)));
  col=mix(col,vec3(0.95,0.99,1.0),nuv*0.55*forte);
  float lon=atan(n.z,n.x); float latS=asin(clamp(n.y,-1.0,1.0));
  float dl=atan(sin(lon-2.0),cos(lon-2.0))*cos(latS); vec2 q=vec2(dl/0.28,(latS+0.30)/0.14);
  col=mix(col,uPal2,smoothstep(1.0,0.7,length(q))*0.8*forte);
  return col;
}

vec3 venus(vec3 n){
  vec3 w=n*2.4+vec3(uTime*0.01,0.0,0.0);
  vec3 q=w+0.9*vec3(fbm(w*1.3),fbm(w*1.3+4.0),fbm(w*1.3+8.0));
  float d=fbm(q*1.1);
  vec3 col=mix(uPal2,uPal1,smoothstep(0.25,0.55,d));
  col=mix(col,uPal0,smoothstep(0.50,0.80,d));
  float v=0.5+0.5*sin(n.y*9.0+fbm(q)*5.0);
  col=mix(col,uPal3,smoothstep(0.7,1.0,v)*0.25);
  return col;
}

// ---------- estrelas ----------
vec3 estrela(vec3 n,float mu){
  float t=uTime;
  vec3 p=n*uCelEsc+vec3(0.0,t*0.05,0.0);
  vec3 warp=vec3(fbm(n*2.0+vec3(t*0.02)),fbm(n*2.0+vec3(5.0)),0.0)*0.8;
  vec2 v=vor(p+warp);
  float cell=smoothstep(0.01,mix(0.16,0.60,uCelSoft),v.y-v.x);
  float big=fbm(n*2.3+vec3(t*0.03,0.0,0.0));
  float fino=fbm(n*uCelEsc*2.6+vec3(t*0.08));
  float k=clamp(mu,0.0,1.0);
  vec3 base=mix(uPal3,uPal2,smoothstep(0.0,0.30,k));
  base=mix(base,uPal1,smoothstep(0.30,0.70,k));
  base=mix(base,uPal0,smoothstep(0.70,1.0,k));
  float cc=mix(1.0,cell,uCelContr);
  base=mix(base*vec3(0.90,0.80,0.86),base*vec3(1.04,1.05,1.02),cc);
  base*=0.92+0.16*fino;                                     // granulação fina, visível mesmo nas quentes
  base+=(1.0-cell)*uCelContr*0.07*uPal0;                    // rede brilhante entre as células
  base+=(big-0.5)*0.14*vec3(1.0,0.7,0.4);
  float sp=fbm(n*2.1+vec3(9.0));
  float lim=0.745-uMancha*0.05;
  float core=smoothstep(lim,lim+0.02,sp)*clamp(uMancha,0.0,1.0);
  float pen=smoothstep(lim-0.035,lim-0.01,sp)*clamp(uMancha,0.0,1.0);
  base=mix(base,base*vec3(0.70,0.42,0.36),pen*0.75);
  base=mix(base,base*vec3(0.34,0.14,0.14),core);
  return base;
}

// ---------- Terra (mesma superfície do corte) ----------
vec3 terraSup(vec3 n, out float oc){
  vec3 w=n*1.05+vec3(3.1,1.7,5.3);
  vec3 q=w+0.55*vec3(fbm(w*1.7),fbm(w*1.7+7.3),fbm(w*1.7+13.1));
  float h=fbm(q);
  float lat=abs(n.y);
  vec3 deep=vec3(.043,.227,.549), mid=vec3(.09,.404,.788), sha=vec3(.184,.71,.839), foam=vec3(.56,.92,.89);
  vec3 col; float sea=0.535;
  oc=0.0;
  if(h<sea){
    oc=1.0;
    col=deep;
    col=mix(col,mid,st(0.40,h));
    col=mix(col,sha,st(0.47,h));
    col=mix(col,foam,st(0.515,h));
    col*=0.96+0.08*vn(n*55.0);
    col=mix(col,vec3(.83,.93,1.0),smoothstep(0.88,0.93,lat+0.03*vn(n*20.)));
  } else {
    float e=h-sea;
    float m=fbm(n*1.7+vec3(11.0))+0.30*(0.55-abs(n.y))+0.10*sin(abs(n.y)*9.0);
    vec3 desert=vec3(.949,.722,.294), desert2=vec3(.9,.6,.23), sav=vec3(.75,.84,.31), gra=vec3(.357,.788,.294), forest=vec3(.122,.627,.353), jun=vec3(.055,.498,.322);
    // faixas por umidade (da menor para a maior)
    col=jun;
    col=mix(col,forest,1.0-st(0.64,m));
    col=mix(col,gra,1.0-st(0.58,m));
    col=mix(col,sav,1.0-st(0.52,m));
    float dun=0.5+0.5*sin((n.x*9.0+n.z*5.0)+fbm(n*8.0)*6.0);
    col=mix(col,mix(desert,desert2,dun),(1.0-st(0.45,m))*(1.0-smoothstep(0.55,0.7,lat)));
    col=mix(col,vec3(.969,.863,.557),1.0-st(0.02,e));
    col=mix(col,vec3(.651,.51,.4),st(0.20,e));
    col=mix(col,vec3(.96,.98,1.0),st(0.30,e));
    col*=0.95+0.10*vn(n*70.0);
    col=mix(col,vec3(.93,.97,1.0),smoothstep(0.84,0.88,lat+0.04*vn(n*14.)));
  }
  return col;
}


`;
