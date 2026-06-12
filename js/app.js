const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   3D SCENE — CITY + HERO ON ROOFTOP + SCROLL-FIRED WEB
   Clean scene: skyline, hero silhouette, one epic web line
   that draws farther across the sky with every scroll.
============================================================ */
const canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.setClearColor(0x000000,0);

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xFBFAF5,26,60);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,200);
camera.position.set(-2,3.5,14);

const INK=0x15151C, RED=0xE0202F, BLUE=0x2342D6, YELLOW=0xE8A800, PAPER=0xF2EFE6;

/* ---------- CITY SKYLINE (windows texture + ink edges) ---------- */
function windowTexture(w,h){
  const c=document.createElement('canvas');c.width=64;c.height=128;
  const x=c.getContext('2d');
  x.fillStyle='#EFEBDE';x.fillRect(0,0,64,128);
  x.fillStyle='rgba(21,21,28,.8)';
  for(let r=8;r<124;r+=14)for(let col=8;col<60;col+=14){
    if(Math.random()<.72)x.fillRect(col,r,7,8);
    else{x.fillStyle='rgba(255,196,0,.9)';x.fillRect(col,r,7,8);x.fillStyle='rgba(21,21,28,.8)';}
  }
  const t=new THREE.CanvasTexture(c);
  t.repeat.set(Math.max(1,Math.round(w/1.4)),Math.max(1,Math.round(h/2.4)));
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  return t;
}
const city=new THREE.Group();
const buildingDefs=[
  // [x, width, height, z]
  [-13,3,7,-6],[-9.5,2.6,10,-5],[-6,3.4,14,-4.5],[-2.4,2.4,8,-6.5],
  [0.8,3,11,-5.5],[4.4,2.8,9,-6],[8.2,3.6,12.5,-2.6],[12.6,3,8,-6.2],[16.2,3.4,10.5,-5.4],
  [-17,3,9,-7],[19.8,2.8,7.5,-7]
];
const HERO_BIDX=6, HERO_BH=12.5;
let heroBuilding=null;
buildingDefs.forEach((d,i)=>{
  const [bx,bw,bh,bz]=d;
  const g=new THREE.BoxGeometry(bw,bh,bw);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:windowTexture(bw,bh)}));
  m.position.set(bx,bh/2-4.5,bz);
  city.add(m);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.9}));
  edges.position.copy(m.position);
  city.add(edges);
  // rooftop ledge
  const ledge=new THREE.Mesh(new THREE.BoxGeometry(bw+.3,.22,bw+.3),new THREE.MeshBasicMaterial({color:INK}));
  ledge.position.set(bx,bh-4.5+.11,bz);
  city.add(ledge);
  if(i===HERO_BIDX)heroBuilding=m; // foreground right tower = hero's perch
});
scene.add(city);

/* distant flat skyline silhouette for depth */
const farRow=new THREE.Group();
for(let i=0;i<16;i++){
  const w=2+Math.random()*2.5,h=4+Math.random()*8;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xD9D4C4,transparent:true,opacity:.55}));
  m.position.set(-22+i*3,h/2-4.5,-16);
  farRow.add(m);
}
scene.add(farRow);

/* a couple of comic clouds */
const clouds=new THREE.Group();
for(let i=0;i<4;i++){
  const cg=new THREE.Group();
  for(let b=0;b<4;b++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(.7+Math.random()*.5,10,10),new THREE.MeshBasicMaterial({color:0xFFFFFF}));
    s.position.set(b*.9-1.3,Math.random()*.3,0);
    cg.add(s);
    const o=new THREE.LineSegments(new THREE.EdgesGeometry(s.geometry),new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.12}));
    o.position.copy(s.position);cg.add(o);
  }
  cg.position.set(-14+i*9,6.5+Math.random()*3,-10-Math.random()*4);
  cg.userData={sp:.08+Math.random()*.12};
  clouds.add(cg);
}
scene.add(clouds);

/* ---------- HERO SILHOUETTE (original ink figure, crouched, arm out) ---------- */
const hero=new THREE.Group();
const inkMat=new THREE.MeshBasicMaterial({color:INK});
function part(geom,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){
  const m=new THREE.Mesh(geom,inkMat);
  m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.set(sx,sy,sz);
  hero.add(m);return m;
}
/* crouched pose built from primitives — pure silhouette */
part(new THREE.SphereGeometry(.34,14,14), .12,1.62,0, 0,0,0, 1,.92,1);            // head
part(new THREE.CylinderGeometry(.26,.34,.95,10), -.08,.95,0, 0,0,.5);             // torso (leaning forward)
part(new THREE.CylinderGeometry(.11,.13,.85,8), -.42,.42,.16, 0,0,1.25);          // back thigh
part(new THREE.CylinderGeometry(.09,.11,.8,8), -.95,.18,.16, 0,0,-.9);            // back shin folded
part(new THREE.CylinderGeometry(.11,.13,.8,8), -.1,.36,-.18, 0,0,.35);            // front thigh
part(new THREE.CylinderGeometry(.09,.11,.75,8), .12,.0,-.18, 0,0,-.15);           // front shin
part(new THREE.BoxGeometry(.34,.12,.16), .16,-.36,-.18);                          // front foot
part(new THREE.BoxGeometry(.34,.12,.16), -1.2,-.1,.16);                           // back foot
part(new THREE.CylinderGeometry(.09,.1,.8,8), .58,1.45,.05, 0,0,-1.35);           // firing arm (extended)
part(new THREE.SphereGeometry(.12,10,10), .98,1.62,.05);                          // firing hand
part(new THREE.CylinderGeometry(.08,.09,.6,8), -.28,1.15,-.22, 0,0,.9);           // support arm down
part(new THREE.SphereGeometry(.1,10,10), -.52,.88,-.22);                          // support hand on ledge
hero.scale.setScalar(2.2);
/* place hero on rooftop corner of his tower, facing LEFT across the city */
const perch=new THREE.Vector3(heroBuilding.position.x-.4, heroBuilding.position.y+(HERO_BH/2)+.25, heroBuilding.position.z+1.2);
hero.position.copy(perch);
const HERO_BASE_ROT=2.75; // turned so the firing arm points left across the skyline
hero.rotation.y=HERO_BASE_ROT;
scene.add(hero);
/* world-space position of the firing hand (recomputed each frame) */
const handLocal=new THREE.Vector3(.98,1.62,.05);
function handWorld(){return hero.localToWorld(handLocal.clone());}

/* ---------- GIANT COMIC MOON behind the hero (silhouette pops) ---------- */
const moon=new THREE.Group();
const moonDisc=new THREE.Mesh(new THREE.CircleGeometry(4.6,48),new THREE.MeshBasicMaterial({color:0xFFE9A8}));
const moonRing=new THREE.Mesh(new THREE.RingGeometry(4.6,4.78,48),new THREE.MeshBasicMaterial({color:INK}));
const moonRing2=new THREE.Mesh(new THREE.RingGeometry(5.1,5.16,48),new THREE.MeshBasicMaterial({color:INK,transparent:true,opacity:.35}));
moon.add(moonDisc,moonRing,moonRing2);
/* halftone craters */
for(let i=0;i<7;i++){
  const cr=new THREE.Mesh(new THREE.CircleGeometry(.22+Math.random()*.4,20),new THREE.MeshBasicMaterial({color:0xF3D67C}));
  const a=Math.random()*Math.PI*2, r=Math.random()*3.4;
  cr.position.set(Math.cos(a)*r,Math.sin(a)*r,.01);
  moon.add(cr);
}
moon.position.set(perch.x+.6, perch.y+2.6, perch.z-6.5);
scene.add(moon);

/* ---------- THE WEB — long 3D strand that draws on scroll ---------- */
const WEB_SEGS=900, RADIAL=6;
function buildWebCurve(){
  const h=handWorld();
  const pts=[
    h,
    h.clone().add(new THREE.Vector3(-3.2,2.6,1.2)),
    new THREE.Vector3(3.5,8,-1),
    new THREE.Vector3(-1,5,2.5),
    new THREE.Vector3(-6,9,-2),
    new THREE.Vector3(-11,5.5,3),
    new THREE.Vector3(-16,10,-3),
    new THREE.Vector3(-21,6.5,2),
    new THREE.Vector3(-27,10.5,-4),
    new THREE.Vector3(-33,7.5,1)
  ];
  return new THREE.CatmullRomCurve3(pts);
}
let webCurve=buildWebCurve();
const webGeo=new THREE.TubeGeometry(webCurve,WEB_SEGS,.045,RADIAL,false);
const web=new THREE.Mesh(webGeo,new THREE.MeshBasicMaterial({color:INK}));
web.geometry.setDrawRange(0,0);
scene.add(web);
/* thin twin strand slightly offset (double thread look) */
const web2=new THREE.Mesh(new THREE.TubeGeometry(webCurve,WEB_SEGS,.016,RADIAL,false),new THREE.MeshBasicMaterial({color:RED}));
web2.position.y=.09;
web2.geometry.setDrawRange(0,0);
scene.add(web2);

/* glowing tip + spark at the leading end of the web */
const tip=new THREE.Mesh(new THREE.SphereGeometry(.14,10,10),new THREE.MeshBasicMaterial({color:RED}));
const tipRing=new THREE.Mesh(new THREE.TorusGeometry(.3,.02,6,24),new THREE.MeshBasicMaterial({color:INK,transparent:true,opacity:.7}));
scene.add(tip,tipRing);

/* radial web "checkpoints" that pop in as the web passes them */
const checkpoints=[];
[ .22, .45, .68, .9 ].forEach((at,i)=>{
  const grp=new THREE.Group();
  const SP=10;
  for(let s=0;s<SP;s++){
    const a=s/SP*Math.PI*2;
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(Math.cos(a)*.9,Math.sin(a)*.9,0)]);
    grp.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.8})));
  }
  for(let r=.25;r<=.85;r+=.2){
    const ringPts=[];
    for(let s=0;s<=SP;s++){const a=s/SP*Math.PI*2;ringPts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0));}
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts),new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.6})));
  }
  const p=webCurve.getPointAt(at);
  grp.position.copy(p);
  grp.scale.setScalar(0);
  grp.userData={at,shown:false};
  scene.add(grp);
  checkpoints.push(grp);
});

/* ---------- scroll drives the web ---------- */
let webProgress=0, webTarget=0;
function setHud(p){
  document.getElementById('hudWeb').textContent=String(Math.round(p*100)).padStart(3,'0')+'%';
}
addEventListener('scroll',()=>{
  const h=document.documentElement;
  const p=h.scrollTop/(h.scrollHeight-h.clientHeight);
  webTarget=p;
  document.getElementById('progFill').style.width=p*100+'%';
  document.getElementById('hudScroll').textContent=String(Math.round(p*100)).padStart(3,'0')+'%';
},{passive:true});

/* ---------- camera follows the web tip across the city ---------- */
const camBase={x:0,y:5,z:14};

/* mouse parallax + web sway */
const mouse={x:0,y:0};
addEventListener('pointermove',e=>{mouse.x=e.clientX/innerWidth-.5;mouse.y=e.clientY/innerHeight-.5;});

/* ---------- CLICK = hero fires a quick web at your cursor ---------- */
const shots=[];
const WORDS=['THWACK!','BAM!','ZAP!','DEBUNG!','COMPILED!','SHIP IT!'];
function comicBurst(x,y){
  const el=document.createElement('div');
  el.className='burst';
  el.style.left=x+'px';el.style.top=y+'px';
  const word=WORDS[Math.floor(Math.random()*WORDS.length)];
  const col=Math.random()<.5?'#E0202F':'#2342D6';
  el.innerHTML=`<svg viewBox="0 0 100 100"><polygon points="50,2 58,30 88,12 70,38 98,46 70,56 86,84 56,68 50,98 42,68 14,86 30,56 2,48 30,40 12,12 42,30" fill="${col}" stroke="#15151C" stroke-width="3"/></svg><b>${word}</b>`;
  document.body.appendChild(el);
  gsap.fromTo(el,{scale:0,rotate:-20},{scale:1,rotate:6,duration:.35,ease:'back.out(3)'});
  gsap.to(el,{scale:0,opacity:0,duration:.3,delay:.55,ease:'back.in(2)',onComplete:()=>el.remove()});
}
function webSplat(x,y){
  const el=document.createElement('div');
  el.className='websplat';
  el.style.left=x+'px';el.style.top=y+'px';
  let spokes='',rings='';
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;spokes+=`<line x1="60" y1="60" x2="${60+Math.cos(a)*56}" y2="${60+Math.sin(a)*56}"/>`;}
  for(let r=14;r<=52;r+=13){
    let d='';
    for(let i=0;i<=10;i++){const a=i/10*Math.PI*2;d+=(i===0?'M':'L')+(60+Math.cos(a)*r)+','+(60+Math.sin(a)*r);}
    rings+=`<path d="${d}Z" fill="none"/>`;
  }
  el.innerHTML=`<svg width="120" height="120" viewBox="0 0 120 120" stroke="#15151C" stroke-width="1.6" opacity=".75">${spokes}${rings}</svg>`;
  document.body.appendChild(el);
  gsap.fromTo(el,{scale:.2,opacity:1,rotate:Math.random()*40-20},{scale:1,duration:.3,ease:'back.out(2)'});
  gsap.to(el,{opacity:0,scale:1.15,duration:.6,delay:.5,onComplete:()=>el.remove()});
}
addEventListener('pointerdown',e=>{
  if(e.target.closest('button') || e.target.closest('a') || e.target.closest('input') || e.target.closest('textarea')) return;
  // unproject cursor onto a plane in front of camera
  const v=new THREE.Vector3((e.clientX/innerWidth)*2-1,-(e.clientY/innerHeight)*2+1,.5).unproject(camera);
  const dir=v.sub(camera.position).normalize();
  const target=camera.position.clone().add(dir.multiplyScalar(13));
  const start=handWorld();
  const mid=start.clone().lerp(target,.5).add(new THREE.Vector3(0,1.2,0));
  const curve=new THREE.CatmullRomCurve3([start,mid,target]);
  const SEG=60;
  const g=new THREE.TubeGeometry(curve,SEG,.03,5,false);
  g.setDrawRange(0,0);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:RED}));
  scene.add(m);
  const shot={mesh:m,seg:SEG,t:0};
  shots.push(shot);
  // quick hero arm recoil
  gsap.fromTo(hero.rotation,{z:0},{z:-.06,duration:.08,yoyo:true,repeat:1});
  comicBurst(e.clientX,e.clientY);
  webSplat(e.clientX,e.clientY);
});

/* ---------- render loop ---------- */
const clock=new THREE.Clock();
function tick(){
  const dt=clock.getDelta(), t=clock.getElapsedTime();

  /* hero idle: breathing + slight head/arm motion */
  hero.position.y=perch.y+Math.sin(t*1.6)*.04;
  hero.rotation.y=HERO_BASE_ROT+Math.sin(t*.5)*.05+mouse.x*.15;
  /* moon gently pulses + always faces camera */
  moon.lookAt(camera.position);
  const mp=1+Math.sin(t*1.2)*.015;
  moon.scale.set(mp,mp,mp);

  /* web extends toward scroll target with smoothing — fires fast on every scroll */
  webProgress+=(webTarget-webProgress)*.08;
  const segsOn=Math.floor(webProgress*WEB_SEGS);
  web.geometry.setDrawRange(0,Math.max(0,segsOn*RADIAL*6));
  web2.geometry.setDrawRange(0,Math.max(0,segsOn*RADIAL*6));
  setHud(webProgress);

  /* tip follows the leading end + spins */
  const tp=webCurve.getPointAt(Math.max(.001,Math.min(.999,webProgress)));
  tip.position.copy(tp);
  tip.scale.setScalar(1+Math.sin(t*8)*.18);
  tipRing.position.copy(tp);
  tipRing.rotation.z=t*3; tipRing.rotation.y=t*2;
  tipRing.scale.setScalar(1+Math.sin(t*5)*.12);

  /* gentle sway of the whole web like it's alive in the wind */
  web.rotation.z=Math.sin(t*.8)*.012+mouse.y*.02;
  web2.rotation.z=web.rotation.z;

  /* checkpoint radial webs pop when the strand reaches them */
  checkpoints.forEach(cp=>{
    if(!cp.userData.shown&&webProgress>cp.userData.at){
      cp.userData.shown=true;
      gsap.to(cp.scale,{x:1,y:1,z:1,duration:.6,ease:'back.out(2.5)'});
    }
    if(cp.userData.shown&&webProgress<cp.userData.at-.03){
      cp.userData.shown=false;
      gsap.to(cp.scale,{x:0,y:0,z:0,duration:.3});
    }
    cp.lookAt(camera.position);
  });

  /* camera: starts framing the hero on the right, then follows the web tip left across the city */
  const followX=THREE.MathUtils.lerp(camBase.x, tp.x*.55, webProgress);
  const followY=THREE.MathUtils.lerp(camBase.y, 2.5+tp.y*.35, webProgress);
  const followZ=THREE.MathUtils.lerp(camBase.z, 15.5, webProgress);
  camera.position.x+=((followX+mouse.x*1.6)-camera.position.x)*.05;
  camera.position.y+=((followY-mouse.y*1.0)-camera.position.y)*.05;
  camera.position.z+=(followZ-camera.position.z)*.05;
  const lookStart=new THREE.Vector3(perch.x-4.6,perch.y-2.2,perch.z); // hero sits right-of-center
  const look=new THREE.Vector3().lerpVectors(lookStart,tp,Math.min(1,webProgress*1.25+.05));
  camera.lookAt(look);

  /* clouds drift */
  clouds.children.forEach(c=>{c.position.x+=c.userData.sp*dt; if(c.position.x>22)c.position.x=-22;});

  /* fired shots animate out then fade */
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];
    s.t+=dt*3.2;
    const on=Math.min(1,s.t);
    s.mesh.geometry.setDrawRange(0,Math.floor(on*s.seg)*5*6);
    if(s.t>1.4){
      s.mesh.material.transparent=true;
      s.mesh.material.opacity=Math.max(0,1-(s.t-1.4)*2);
      if(s.mesh.material.opacity<=0){scene.remove(s.mesh);s.mesh.geometry.dispose();shots.splice(i,1);}
    }
  }

  renderer.render(scene,camera);
  if(!reduceMotion)requestAnimationFrame(tick);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

/* ============================================================
   CURSOR WEB TRAIL (2D)
============================================================ */
const trailC=document.getElementById('webTrail'), tx=trailC.getContext('2d');
function sizeTrail(){trailC.width=innerWidth;trailC.height=innerHeight;}
sizeTrail(); addEventListener('resize',sizeTrail);
const trail=[];
addEventListener('pointermove',e=>{trail.unshift({x:e.clientX,y:e.clientY});if(trail.length>26)trail.pop();});
(function trailLoop(){
  tx.clearRect(0,0,trailC.width,trailC.height);
  if(trail.length>2&&!reduceMotion){
    for(let i=1;i<trail.length;i++){
      const f=1-i/trail.length;
      tx.strokeStyle=`rgba(224,32,47,${f*.5})`;
      tx.lineWidth=f*3;
      tx.beginPath();tx.moveTo(trail[i-1].x,trail[i-1].y);tx.lineTo(trail[i].x,trail[i].y);tx.stroke();
      if(i%5===0){
        tx.strokeStyle=`rgba(21,21,28,${f*.3})`;tx.lineWidth=1;
        const dx=trail[i].x-trail[i-1].x,dy=trail[i].y-trail[i-1].y,L=Math.hypot(dx,dy)||1;
        const nx=-dy/L*7*f,ny=dx/L*7*f;
        tx.beginPath();tx.moveTo(trail[i].x-nx,trail[i].y-ny);tx.lineTo(trail[i].x+nx,trail[i].y+ny);tx.stroke();
      }
    }
  }
  requestAnimationFrame(trailLoop);
})();

/* ============================================================
   LOADER → ENTRANCE
============================================================ */
const statuses=['COMPILING CODE…','BREWING COFFEE…','LOADING SKILLS…','PUSHING TO MAIN…','READY TO DEPLOY!'];
let progress=0,si=0;
const loadFill=document.getElementById('loadFill'),loadStatus=document.getElementById('loadStatus');
const loadInt=setInterval(()=>{
  progress=Math.min(100,progress+Math.random()*14);
  loadFill.style.width=progress+'%';
  if(progress/100*statuses.length>si&&si<statuses.length-1){si++;loadStatus.textContent=statuses[si];}
  if(progress>=100){clearInterval(loadInt);loadStatus.textContent=statuses[statuses.length-1];setTimeout(launch,400);}
},110);

function launch(){
  document.getElementById('loader').classList.add('done');
  tick();
  if(reduceMotion){renderer.render(scene,camera);return;}
  const tl=gsap.timeline({defaults:{ease:'power4.out'}});
  tl.to('.hero h1 .row span',{y:0,rotateX:0,duration:1.4,stagger:.15,ease:'back.out(1.4)'},.2)
    .to('.hero-tag',{opacity:1,duration:1},.5)
    .to('.hero-sub',{opacity:1,duration:1},1)
    .to('.hero-actions',{opacity:1,duration:1},1.2)
    .to('.hero-meta',{opacity:1,duration:1},1.4)
    .from(camera.position,{z:24,y:8,duration:2.6,ease:'power3.out'},0);
  scrambleText(document.getElementById('scrambleTag'));
}

/* ============================================================
   3D HERO TEXT — mouse tilt, depth rows, idle bob
============================================================ */
const h13d=document.getElementById('h13d');
document.querySelectorAll('.hero h1 .row').forEach((r,i)=>r.style.transform=`translateZ(${i*38}px)`);
addEventListener('pointermove',e=>{
  if(reduceMotion)return;
  const x=e.clientX/innerWidth-.5, y=e.clientY/innerHeight-.5;
  gsap.to(h13d,{rotateY:x*14,rotateX:-y*10,duration:.8,ease:'power2.out',transformPerspective:1100});
});
gsap.to(h13d,{y:-8,duration:2.6,yoyo:true,repeat:-1,ease:'sine.inOut'});

/* ============================================================
   TEXT SCRAMBLE
============================================================ */
const CHARS='!<>-_\\/[]{}—=+*^?#01';
function scrambleText(el){
  const original=el.dataset.original||el.textContent;
  el.dataset.original=original;
  let frame=0;const total=40;
  const timer=setInterval(()=>{
    frame++;
    el.textContent=original.split('').map((ch,i)=>{
      if(ch===' ')return' ';
      if(i<(frame/total)*original.length)return ch;
      return CHARS[Math.floor(Math.random()*CHARS.length)];
    }).join('');
    if(frame>=total){el.textContent=original;clearInterval(timer);}
  },30);
}

/* ============================================================
   SCROLL FX
============================================================ */
gsap.utils.toArray('.reveal').forEach(el=>{
  gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}});
});
gsap.utils.toArray('.flip3d').forEach(el=>{
  gsap.to(el,{opacity:1,rotateX:0,y:0,duration:1.3,ease:'back.out(1.5)',transformPerspective:900,
    scrollTrigger:{trigger:el,start:'top 86%'}});
});
gsap.utils.toArray('.num[data-count]').forEach(el=>{
  const target=+el.dataset.count;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 88%',
    onEnter: () => {
      let countObj = { val: 0 };
      gsap.to(countObj, {
        val: target,
        duration: 2.2,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = Math.floor(countObj.val) + (el.dataset.count.includes('%') || el.textContent.includes('%') ? '%' : (el.dataset.count.includes('+') ? '+' : ''));
        },
        onComplete: () => {
          el.textContent = el.dataset.count; // Ensure exact final value
        }
      });
    }
  });
});

/* ============================================================
   CURSOR ACTIONS (DOT, RING & HOVER LABELS)
============================================================ */
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const cursorLabel = document.getElementById('cursorLabel');

let mX = 0, mY = 0;
let rX = 0, rY = 0;

window.addEventListener('pointermove', e => {
  mX = e.clientX;
  mY = e.clientY;
  
  // Instant follow for dot
  if (cursorDot) {
    gsap.set(cursorDot, { x: mX, y: mY });
  }
  
  // Position the label slightly offset
  if (cursorLabel) {
    gsap.set(cursorLabel, { x: mX, y: mY });
  }
});

// Smooth lag follow for ring
function updateRing() {
  rX += (mX - rX) * 0.15;
  rY += (mY - rY) * 0.15;
  if (cursorRing) {
    gsap.set(cursorRing, { x: rX, y: rY });
  }
  requestAnimationFrame(updateRing);
}
if (!reduceMotion) {
  requestAnimationFrame(updateRing);
}

// Hover effects
document.querySelectorAll('.hoverable').forEach(item => {
  item.addEventListener('pointerenter', () => {
    if (cursorRing) cursorRing.classList.add('hovering');
    
    // Check if it has a custom cursor label data attribute (like magnetic buttons)
    const labelText = item.getAttribute('data-label');
    if (labelText && cursorLabel) {
      cursorLabel.textContent = labelText;
      cursorLabel.style.opacity = 1;
    }
  });
  
  item.addEventListener('pointerleave', () => {
    if (cursorRing) cursorRing.classList.remove('hovering');
    if (cursorLabel) {
      cursorLabel.style.opacity = 0;
    }
  });
});

/* ============================================================
   MAGNETIC BUTTONS
============================================================ */
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('pointermove', e => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    gsap.to(btn, {
      x: x * 0.35,
      y: y * 0.35,
      duration: 0.3,
      ease: 'power2.out'
    });
  });
  
  btn.addEventListener('pointerleave', () => {
    gsap.to(btn, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'elastic.out(1.1, 0.4)'
    });
  });
});

/* ============================================================
   RESUME MODAL TRIGGERS
============================================================ */
const viewResumeBtn = document.getElementById('viewResumeBtn');
const resumeModal = document.getElementById('resumeModal');
const closeResume = document.getElementById('closeResume');

if (viewResumeBtn && resumeModal) {
  viewResumeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resumeModal.classList.add('open');
  });
}

if (closeResume && resumeModal) {
  closeResume.addEventListener('click', () => {
    resumeModal.classList.remove('open');
  });
}

if (resumeModal) {
  resumeModal.addEventListener('click', (e) => {
    if (e.target === resumeModal) {
      resumeModal.classList.remove('open');
    }
  });
}

/* ============================================================
   COLLABORATION FORM & TOAST
============================================================ */
const contactForm = document.getElementById('contactForm');
const successToast = document.getElementById('successToast');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Disable submit button temporarily
    const submitBtn = contactForm.querySelector('.form-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'SENDING...';
    }

    const formData = new FormData(contactForm);
    const dataObj = Object.fromEntries(formData);
    
    fetch("https://formsubmit.co/ajax/sanchitavinchu@gmail.com", {
      method: "POST",
      headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(dataObj)
    })
    .then(response => response.json())
    .then(data => {
      if (successToast) {
        successToast.classList.add('show');
        setTimeout(() => {
          successToast.classList.remove('show');
        }, 4000);
      }
      contactForm.reset();
    })
    .catch(error => {
      console.error('Error submitting form:', error);
      alert('Oops! There was an issue sending your message. Please try again.');
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'SEND IT →';
      }
    });
  });
}

/* ============================================================
   3D CARD TILT ON HOVER (Skills stack)
============================================================ */
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('pointermove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    
    const tiltX = (y - rect.height / 2) / (rect.height / 2) * -10;
    const tiltY = (x - rect.width / 2) / (rect.width / 2) * 10;
    gsap.to(card, {
      rotateX: tiltX,
      rotateY: tiltY,
      duration: 0.3,
      ease: 'power2.out',
      transformPerspective: 1400
    });
  });
  
  card.addEventListener('pointerleave', () => {
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  });
});