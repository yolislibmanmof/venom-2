/**
 * ============================================================
 *  VENOM PARTICLE FIELD v1.0 — js/venom-particles.js
 *  Latar partikel premium untuk template admin VENOM (SLiMS 9.8).
 *  Tanpa dependensi. Menempel di .v-bg, kanvas transparan.
 *
 *  Otomatis: ikut --v-accent, data-venom-mode, data-venom-fx,
 *  event venom:accent, prefers-reduced-motion, jeda saat tab hidden.
 *  Panel setel: Alt+P (tersembunyi default, tidak menghalangi admin).
 *  Setelan tersimpan per-user: localStorage venom:<uid>:pfx
 * ============================================================
 */
(function () {
  'use strict';
  if (window.VenomParticles) return;

  var C = window.VENOM || {};
  var UID = C.uid || 0;
  var KEY = 'venom:' + UID + ':pfx';

  var DEF = {
    count: 190, size: 1.45, speed: 0.72, turbulence: 0.5, parallax: 0.85,
    glow: 1.05, trail: 0.16, nebula: 0.62, pulse: true, ghost: false,
    links: true, linkDist: 116, linkAlpha: 0.3,
    pointerForce: 0.4, pointerGlow: true,
    palette: 'venom', hueSpread: 24, quality: 'high', enabled: true
  };

  var PRESETS = {
    symbiote: { count:190,size:1.45,speed:.72,turbulence:.5,parallax:.85,glow:1.05,trail:.16,nebula:.62,pulse:true,ghost:false,links:true,linkDist:116,linkAlpha:.3,pointerForce:.4,pointerGlow:true,palette:'venom',hueSpread:24 },
    spore:    { count:300,size:1.0,speed:.34,turbulence:.85,parallax:1.35,glow:.8,trail:.05,nebula:1.05,pulse:true,ghost:false,links:false,linkDist:100,linkAlpha:.2,pointerForce:.22,pointerGlow:true,palette:'venom',hueSpread:42 },
    neural:   { count:160,size:1.1,speed:.3,turbulence:.26,parallax:.55,glow:.9,trail:.1,nebula:.4,pulse:false,ghost:false,links:true,linkDist:168,linkAlpha:.5,pointerForce:.55,pointerGlow:true,palette:'cyan',hueSpread:16 },
    ember:    { count:230,size:1.3,speed:1.9,turbulence:1.25,parallax:1.05,glow:1.5,trail:.7,nebula:.28,pulse:true,ghost:false,links:false,linkDist:90,linkAlpha:.25,pointerForce:-.65,pointerGlow:true,palette:'amber',hueSpread:32 },
    aurora:   { count:80,size:2.2,speed:.46,turbulence:.4,parallax:1.6,glow:1.95,trail:.4,nebula:1.35,pulse:true,ghost:false,links:true,linkDist:196,linkAlpha:.16,pointerForce:.28,pointerGlow:true,palette:'spectrum',hueSpread:50 },
    minimal:  { count:60,size:1.1,speed:.32,turbulence:.28,parallax:.45,glow:.55,trail:0,nebula:.3,pulse:false,ghost:false,links:false,linkDist:110,linkAlpha:.2,pointerForce:.18,pointerGlow:false,palette:'venom',hueSpread:10 },
    ghost:    { count:180,size:1.65,speed:.56,turbulence:.66,parallax:1.15,glow:.48,trail:.22,nebula:.46,pulse:true,ghost:true,links:true,linkDist:138,linkAlpha:.28,pointerForce:.46,pointerGlow:false,palette:'toxin',hueSpread:38 }
  };

  var QUAL = { low:{dpr:1,mul:.5}, medium:{dpr:1.5,mul:.75}, high:{dpr:2,mul:1}, ultra:{dpr:2.5,mul:1.4} };
  var PALS = {
    venom:['#00e57a','#7c3aed','#38bdf8'],
    toxin:['#00e57a','#ff2d95','#7c3aed'],
    cyan:['#38bdf8','#22d3ee','#00e57a'],
    amber:['#ffb020','#ff7a18','#ff4d5e'],
    spectrum:['#00e57a','#7c3aed','#38bdf8','#ff2d95','#ffb020','#34d399']
  };
  var BUCKETS = 10;

  /* ---------- state ---------- */
  var o = {}; for (var k in DEF) o[k] = DEF[k];
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') for (var s in saved) if (o.hasOwnProperty(s)) o[s] = saved[s];
  } catch (e) {}
  if (C.particles !== undefined) o.enabled = !!Number(C.particles);
  if (C.pfx && PRESETS[C.pfx]) { var pp = PRESETS[C.pfx]; for (var q in pp) o[q] = pp[q]; }

  var accent = C.accent || '#00e57a';
  var mode = 'dark', fxOff = false, reduce = false;
  var host = null, cv = null, ctx = null;
  var W = 1, H = 1, DPR = 1;
  var parts = [], sprites = [], nebulae = [], grid = new Map();
  var raf = 0, running = false, last = 0, t = 0, linkCount = 0;
  var fps = 60, fpsAcc = 0, fpsN = 0, statT = 0;
  var ptr = { x:-9999, y:-9999, tx:-9999, ty:-9999, on:false };
  var ro = null, mo = null, destroyed = false, lab = null;

  /* ---------- helpers ---------- */
  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
  function hex2rgb(h){ h=String(h||'#00e57a').replace('#',''); if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n=parseInt(h,16); if(isNaN(n)) n=0x00e57a; return [(n>>16)&255,(n>>8)&255,n&255]; }
  function rgb2hsl(r,g,b){ r/=255;g/=255;b/=255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),h=0,s=0,l=(mx+mn)/2,d=mx-mn;
    if(d){ s=l>.5?d/(2-mx-mn):d/(mx+mn); h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4); h/=6; }
    return [h*360,s,l]; }
  function hsl2rgb(h,s,l){ h=((h%360)+360)%360/360; var r,g,b;
    if(!s){ r=g=b=l; } else { var qq=l<.5?l*(1+s):l+s-l*s, p=2*l-qq;
      var f=function(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<.5)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
      r=f(p,qq,h+1/3); g=f(p,qq,h); b=f(p,qq,h-1/3); }
    return [Math.round(r*255),Math.round(g*255),Math.round(b*255)]; }
  function palBase(){ var a=(PALS[o.palette]||PALS.venom).slice(); a[0]=accent;
    if(o.palette==='cyan'||o.palette==='amber') a[a.length-1]=accent; return a; }
  function isLight(){ return mode==='light'; }
  function still(){ return fxOff || reduce; }
  function persist(){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }

  /* ---------- sprites ---------- */
  function buildSprites(){
    sprites=[]; nebulae=[];
    var base=palBase(), light=isLight();
    for(var i=0;i<base.length;i++){
      var rgb=hex2rgb(base[i]), hsl=rgb2hsl(rgb[0],rgb[1],rgb[2]);
      for(var b=0;b<BUCKETS;b++){
        var hj=hsl[0]+((b/(BUCKETS-1))-.5)*o.hueSpread;
        var ll=light?clamp(hsl[2]*.6,.16,.44):clamp(hsl[2]+.06,.4,.72);
        var ss=light?clamp(hsl[1]*1.05,.4,1):clamp(hsl[1],.55,1);
        var c=hsl2rgb(hj,ss,ll);
        var scv=document.createElement('canvas'); scv.width=scv.height=64;
        var sc=scv.getContext('2d');
        var g=sc.createRadialGradient(32,32,0,32,32,32);
        g.addColorStop(0,'rgba('+c[0]+','+c[1]+','+c[2]+',1)');
        g.addColorStop(.22,'rgba('+c[0]+','+c[1]+','+c[2]+',.55)');
        g.addColorStop(.55,'rgba('+c[0]+','+c[1]+','+c[2]+',.16)');
        g.addColorStop(1,'rgba('+c[0]+','+c[1]+','+c[2]+',0)');
        sc.fillStyle=g; sc.fillRect(0,0,64,64);
        sprites.push({cv:scv,rgb:c});
      }
    }
    for(var n=0;n<3;n++){
      var col=hex2rgb(base[n%base.length]);
      var nb=document.createElement('canvas'); nb.width=nb.height=256;
      var nc=nb.getContext('2d'), al=light?.26:.4;
      var ng=nc.createRadialGradient(128,128,0,128,128,128);
      ng.addColorStop(0,'rgba('+col[0]+','+col[1]+','+col[2]+','+al+')');
      ng.addColorStop(.45,'rgba('+col[0]+','+col[1]+','+col[2]+','+(al*.34)+')');
      ng.addColorStop(1,'rgba('+col[0]+','+col[1]+','+col[2]+',0)');
      nc.fillStyle=ng; nc.fillRect(0,0,256,256);
      nebulae.push(nb);
    }
  }

  /* ---------- pool ---------- */
  function targetCount(){
    var mul=(QUAL[o.quality]||QUAL.high).mul;
    var n=Math.round(clamp(o.count,0,800)*mul);
    return still()?Math.round(n*.4):n;
  }
  function mk(){
    var base=palBase(), bi=Math.floor(Math.random()*base.length), bu=Math.floor(Math.random()*BUCKETS);
    var z=.34+Math.random()*.66;
    return { x:Math.random()*W, y:Math.random()*H, vx:0, vy:0,
      dx:(Math.random()-.5)*.22, dy:(Math.random()-.5)*.22-.05,
      z:z, r:(.7+Math.random()*1.9)*z, si:bi*BUCKETS+bu, ph:Math.random()*6.283, lk:0, rx:0, ry:0 };
  }
  function pool(){ var n=targetCount(); while(parts.length<n) parts.push(mk()); if(parts.length>n) parts.length=n; }

  function resize(){
    if(destroyed||!cv) return;
    W=Math.max(1,host.clientWidth||window.innerWidth);
    H=Math.max(1,host.clientHeight||window.innerHeight);
    DPR=Math.min(window.devicePixelRatio||1,(QUAL[o.quality]||QUAL.high).dpr);
    cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    for(var i=0;i<parts.length;i++){ if(parts[i].x>W) parts[i].x=Math.random()*W; if(parts[i].y>H) parts[i].y=Math.random()*H; }
    if(still()) draw(0.016);
  }

  function flow(x,y,tt){
    return (Math.sin(x*.0016+tt*.18)+Math.cos(y*.0019-tt*.14)+Math.sin((x+y)*.0011+tt*.09))*1.9;
  }

  /* ---------- render ---------- */
  function draw(dt){
    var light=isLight(), sp=still()?0:o.speed, tb=still()?0:o.turbulence;
    var pulse=(o.pulse&&!still())?(.86+.14*Math.sin(t*1.15)):1;
    t+=dt;
    ptr.x+=(ptr.tx-ptr.x)*.14; ptr.y+=(ptr.ty-ptr.y)*.14;

    if(o.trail>.01 && !still()){
      ctx.globalCompositeOperation='destination-out';
      ctx.fillStyle='rgba(0,0,0,'+clamp(1-o.trail,.04,1)+')';
      ctx.fillRect(0,0,W,H);
      ctx.globalCompositeOperation='source-over';
    } else {
      ctx.clearRect(0,0,W,H);
    }

    if(o.nebula>.01){
      ctx.globalCompositeOperation=light?'multiply':'lighter';
      var big=Math.max(W,H);
      for(var n=0;n<nebulae.length;n++){
        var sz=big*(.62+n*.2);
        var nx=W*(.22+.3*n)+(still()?0:Math.sin(t*.055+n*2.1)*W*.16);
        var ny=H*(.3+.22*n)+(still()?0:Math.cos(t*.047+n*1.7)*H*.18);
        ctx.globalAlpha=clamp(o.nebula*(light?.28:.22)*pulse,0,1);
        ctx.drawImage(nebulae[n],nx-sz/2,ny-sz/2,sz,sz);
      }
      ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    }

    var cx=W/2, cy=H/2, m=40;
    for(var i=0;i<parts.length;i++){
      var p=parts[i];
      if(!still()){
        var a=flow(p.x,p.y,t);
        p.vx+=Math.cos(a)*tb*11*dt; p.vy+=Math.sin(a)*tb*11*dt;
        if(o.pointerForce!==0 && ptr.on){
          var ddx=p.x-ptr.x, ddy=p.y-ptr.y, d2=ddx*ddx+ddy*ddy;
          if(d2<44000 && d2>1){ var d=Math.sqrt(d2), f=(1-d/210)*o.pointerForce*150*dt/d; p.vx+=ddx*f; p.vy+=ddy*f; }
        }
        p.vx*=.982; p.vy*=.982;
        p.x+=(p.vx+p.dx)*sp*dt*60*p.z; p.y+=(p.vy+p.dy)*sp*dt*60*p.z;
        if(p.x<-m)p.x=W+m; else if(p.x>W+m)p.x=-m;
        if(p.y<-m)p.y=H+m; else if(p.y>H+m)p.y=-m;
      }
      p.lk=0;
      var po=(ptr.on&&!still())?o.parallax:0;
      p.rx=p.x+(ptr.x-cx)*po*(p.z-.5)*.055;
      p.ry=p.y+(ptr.y-cy)*po*(p.z-.5)*.055;
    }

    linkCount=0;
    if(o.links && o.linkAlpha>.01 && parts.length){
      var LD=Math.max(24,o.linkDist), cell=LD;
      grid.clear();
      for(var j=0;j<parts.length;j++){
        var qq=parts[j], key=Math.floor(qq.rx/cell)*100003+Math.floor(qq.ry/cell);
        var arr=grid.get(key); if(!arr){ arr=[]; grid.set(key,arr); } arr.push(j);
      }
      var acc=hex2rgb(accent);
      var lcol=light?hsl2rgb(rgb2hsl(acc[0],acc[1],acc[2])[0],.65,.34):acc;
      ctx.strokeStyle='rgb('+lcol[0]+','+lcol[1]+','+lcol[2]+')'; ctx.lineWidth=1;
      var maxLinks=Math.min(1000,parts.length*4);
      outer:
      for(var s2=0;s2<parts.length;s2++){
        var A=parts[s2]; if(A.lk>=4) continue;
        var ax=Math.floor(A.rx/cell), ay=Math.floor(A.ry/cell);
        for(var ox=-1;ox<=1;ox++) for(var oy=-1;oy<=1;oy++){
          var bk=grid.get((ax+ox)*100003+(ay+oy)); if(!bk) continue;
          for(var b2=0;b2<bk.length;b2++){
            var idx=bk[b2]; if(idx<=s2) continue;
            var B=parts[idx]; if(B.lk>=4) continue;
            var dx2=A.rx-B.rx, dy2=A.ry-B.ry, dd=dx2*dx2+dy2*dy2;
            if(dd<LD*LD){
              var al=(1-Math.sqrt(dd)/LD)*o.linkAlpha*((A.z+B.z)/2)*pulse;
              if(al>.012){ ctx.globalAlpha=al; ctx.beginPath(); ctx.moveTo(A.rx,A.ry); ctx.lineTo(B.rx,B.ry); ctx.stroke();
                linkCount++; if(linkCount>=maxLinks) break outer; }
              A.lk++; B.lk++;
            }
          }
        }
      }
      ctx.globalAlpha=1;
    }

    ctx.globalCompositeOperation=light?'source-over':'lighter';
    for(var u=0;u<parts.length;u++){
      var P=parts[u], sp2=sprites[P.si]; if(!sp2) continue;
      var br=(o.pulse&&!still())?(.82+.18*Math.sin(t*1.6+P.ph)):1;
      var rad=P.r*o.size*(1+o.glow*1.9)*br;
      var alpha=clamp((light?.46:.6)*P.z*pulse*(.55+o.glow*.42),0,1);
      if(o.ghost){
        ctx.globalAlpha=clamp(alpha*1.15,0,1);
        ctx.strokeStyle='rgb('+sp2.rgb[0]+','+sp2.rgb[1]+','+sp2.rgb[2]+')';
        ctx.lineWidth=Math.max(.6,P.r*o.size*.34);
        ctx.beginPath(); ctx.arc(P.rx,P.ry,Math.max(1.2,P.r*o.size*1.7),0,6.2832); ctx.stroke();
      } else {
        ctx.globalAlpha=alpha;
        ctx.drawImage(sp2.cv,P.rx-rad,P.ry-rad,rad*2,rad*2);
        if(P.r*o.size>1.05){
          ctx.globalAlpha=clamp(alpha*1.5,0,1);
          ctx.fillStyle=light?'rgba('+sp2.rgb[0]+','+sp2.rgb[1]+','+sp2.rgb[2]+',.9)':'rgba(255,255,255,.85)';
          ctx.beginPath(); ctx.arc(P.rx,P.ry,Math.max(.5,P.r*o.size*.36),0,6.2832); ctx.fill();
        }
      }
    }
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';

    if(o.pointerGlow && ptr.on && !still() && sprites.length){
      ctx.globalCompositeOperation=light?'multiply':'lighter';
      var gs=190*(.7+o.glow*.5);
      ctx.globalAlpha=light?.14:.22;
      ctx.drawImage(sprites[0].cv,ptr.x-gs/2,ptr.y-gs/2,gs,gs);
      ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    }
  }

  function frame(now){
    if(!running||destroyed) return;
    raf=requestAnimationFrame(frame);
    var dt=last?Math.min((now-last)/1000,.05):.016; last=now;
    if(dt>0){ fpsAcc+=1/dt; fpsN++; }
    draw(dt);
    statT+=dt;
    if(statT>.3){ if(fpsN){ fps=fpsAcc/fpsN; fpsAcc=0; fpsN=0; } statT=0; labStats(); }
  }

  function start(){ if(destroyed||running) return;
    if(still()){ draw(.016); labStats(); return; }
    running=true; last=0; raf=requestAnimationFrame(frame); }
  function stop(){ running=false; if(raf){ cancelAnimationFrame(raf); raf=0; } }

  /* ---------- events ---------- */
  function onMove(e){
    if(!host) return;
    var r=host.getBoundingClientRect();
    var x=(e.touches&&e.touches[0])?e.touches[0].clientX:e.clientX;
    var y=(e.touches&&e.touches[0])?e.touches[0].clientY:e.clientY;
    ptr.tx=x-r.left; ptr.ty=y-r.top;
    if(!ptr.on){ ptr.x=ptr.tx; ptr.y=ptr.ty; } ptr.on=true;
  }
  function onLeave(){ ptr.on=false; ptr.tx=-9999; ptr.ty=-9999; }
  function onVis(){ if(document.hidden) stop(); else start(); }
  function onAccent(e){ if(e&&e.detail&&e.detail.accent){ accent=e.detail.accent; buildSprites(); if(still()) draw(.016); } }
  function onKey(e){
    if(e.altKey && !e.ctrlKey && (e.key==='p'||e.key==='P')){ e.preventDefault(); labToggle(); }
  }

  /* ---------- lab panel (Alt+P) ---------- */
  var LAB_CSS =
'#vParticleLab{position:fixed;top:calc(var(--v-head-h,64px) + 10px);right:12px;bottom:12px;width:326px;z-index:10080;'+
'display:flex;flex-direction:column;border-radius:16px;overflow:hidden;border:1px solid var(--v-line,rgba(0,229,122,.2));'+
'background:color-mix(in srgb,var(--v-panel,#0d1512) 94%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);'+
'box-shadow:0 26px 70px rgba(0,0,0,.5);font-family:var(--v-font,system-ui);color:var(--v-text,#e8f5ee)}'+
'#vParticleLab[hidden]{display:none!important}'+
'#vParticleLab *{box-sizing:border-box}'+
'#vParticleLab .vpx-h{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--v-line-soft,rgba(255,255,255,.08));flex:0 0 auto}'+
'#vParticleLab .vpx-h b{font:800 11px var(--v-font,system-ui);letter-spacing:2.2px;text-transform:uppercase}'+
'#vParticleLab .vpx-h i{color:var(--v-accent,#00e57a);display:flex}'+
'#vParticleLab .vpx-x{margin-left:auto;width:26px;height:26px;border-radius:8px;cursor:pointer;border:1px solid var(--v-line-soft,rgba(255,255,255,.08));'+
'background:var(--v-panel-2,#121c17);color:var(--v-muted,#8fa89b);display:grid;place-items:center}'+
'#vParticleLab .vpx-x:hover{color:var(--v-danger,#ff4d5e);border-color:var(--v-danger,#ff4d5e)}'+
'#vParticleLab .vpx-p{display:flex;gap:6px;padding:10px 14px;overflow-x:auto;flex:0 0 auto;border-bottom:1px solid var(--v-line-soft,rgba(255,255,255,.08))}'+
'#vParticleLab .vpx-p button{flex:0 0 auto;padding:6px 11px;border-radius:999px;cursor:pointer;white-space:nowrap;'+
'font:700 10px var(--v-font,system-ui);border:1px solid var(--v-line-soft,rgba(255,255,255,.08));'+
'background:var(--v-panel-2,#121c17);color:var(--v-muted,#8fa89b);transition:all .16s}'+
'#vParticleLab .vpx-p button:hover{color:var(--v-accent,#00e57a);border-color:var(--v-accent,#00e57a)}'+
'#vParticleLab .vpx-b{flex:1 1 auto;overflow-y:auto;padding:4px 14px 14px}'+
'#vParticleLab .vpx-g{margin-top:13px}'+
'#vParticleLab .vpx-g>h4{margin:0 0 8px;font:800 8.5px var(--v-mono,monospace);letter-spacing:2.2px;text-transform:uppercase;color:var(--v-muted,#8fa89b)}'+
'#vParticleLab .vpx-c{margin-bottom:10px}'+
'#vParticleLab .vpx-t{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px}'+
'#vParticleLab .vpx-t label{font:700 10.5px var(--v-font,system-ui)}'+
'#vParticleLab .vpx-n{font:800 9.5px var(--v-mono,monospace);color:var(--v-accent,#00e57a);border:1px solid var(--v-line,rgba(0,229,122,.2));'+
'padding:2px 6px;border-radius:5px;min-width:44px;text-align:center}'+
'#vParticleLab input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:18px;background:transparent;cursor:pointer;margin:0;display:block}'+
'#vParticleLab input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:5px;'+
'background:linear-gradient(90deg,var(--v-accent,#00e57a) var(--p,50%),var(--v-panel-2,#121c17) var(--p,50%));border:1px solid var(--v-line-soft,rgba(255,255,255,.08))}'+
'#vParticleLab input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;margin-top:-5px;'+
'background:var(--v-accent,#00e57a);border:2px solid var(--v-panel,#0d1512);box-shadow:0 0 10px var(--v-accent,#00e57a)}'+
'#vParticleLab input[type=range]::-moz-range-track{height:5px;border-radius:5px;background:var(--v-panel-2,#121c17)}'+
'#vParticleLab input[type=range]::-moz-range-progress{height:5px;border-radius:5px;background:var(--v-accent,#00e57a)}'+
'#vParticleLab input[type=range]::-moz-range-thumb{width:12px;height:12px;border:2px solid var(--v-panel,#0d1512);border-radius:50%;background:var(--v-accent,#00e57a)}'+
'#vParticleLab .vpx-r{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0}'+
'#vParticleLab .vpx-r label{font:700 10.5px var(--v-font,system-ui)}'+
'#vParticleLab select{font:700 10.5px var(--v-font,system-ui);color:var(--v-text,#e8f5ee);background:var(--v-panel-2,#121c17);'+
'border:1px solid var(--v-line-soft,rgba(255,255,255,.08));border-radius:7px;padding:6px 8px;min-width:120px;cursor:pointer;outline:none}'+
'#vParticleLab select:focus{border-color:var(--v-accent,#00e57a)}'+
'#vParticleLab .vpx-sw{position:relative;width:38px;height:21px;flex:0 0 auto;cursor:pointer}'+
'#vParticleLab .vpx-sw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}'+
'#vParticleLab .vpx-sw span{position:absolute;inset:0;border-radius:999px;background:var(--v-panel-2,#121c17);border:1px solid var(--v-line-soft,rgba(255,255,255,.08));transition:all .2s}'+
'#vParticleLab .vpx-sw span::after{content:"";position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:var(--v-muted,#8fa89b);transition:all .2s}'+
'#vParticleLab .vpx-sw input:checked+span{background:color-mix(in srgb,var(--v-accent,#00e57a) 26%,transparent);border-color:var(--v-accent,#00e57a)}'+
'#vParticleLab .vpx-sw input:checked+span::after{left:19px;background:var(--v-accent,#00e57a)}'+
'#vParticleLab .vpx-f{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 14px;'+
'border-top:1px solid var(--v-line-soft,rgba(255,255,255,.08));background:color-mix(in srgb,var(--v-panel-2,#121c17) 55%,transparent)}'+
'#vParticleLab .vpx-f button{padding:8px 4px;border-radius:8px;cursor:pointer;font:800 9.5px var(--v-font,system-ui);'+
'border:1px solid var(--v-line-soft,rgba(255,255,255,.08));background:var(--v-panel-2,#121c17);color:var(--v-text,#e8f5ee);transition:all .16s}'+
'#vParticleLab .vpx-f button:hover{color:var(--v-accent,#00e57a);border-color:var(--v-accent,#00e57a);transform:translateY(-1px)}'+
'#vParticleLab .vpx-f .vpx-pri{grid-column:span 3;color:var(--v-ink,#04150c);border-color:transparent;'+
'background:linear-gradient(120deg,var(--v-accent,#00e57a),color-mix(in srgb,var(--v-accent,#00e57a) 62%,#7c3aed))}'+
'#vParticleLab .vpx-s{display:flex;gap:6px;padding:8px 14px;border-bottom:1px solid var(--v-line-soft,rgba(255,255,255,.08));flex:0 0 auto}'+
'#vParticleLab .vpx-s span{font:700 9px var(--v-mono,monospace);color:var(--v-muted,#8fa89b);border:1px solid var(--v-line-soft,rgba(255,255,255,.08));padding:3px 7px;border-radius:999px}'+
'#vParticleLab .vpx-s b{color:var(--v-accent,#00e57a)}'+
'#vParticleLab .vpx-b::-webkit-scrollbar,#vParticleLab .vpx-p::-webkit-scrollbar{width:9px;height:9px}'+
'#vParticleLab .vpx-b::-webkit-scrollbar-track,#vParticleLab .vpx-p::-webkit-scrollbar-track{background:transparent}'+
'#vParticleLab .vpx-b::-webkit-scrollbar-thumb,#vParticleLab .vpx-p::-webkit-scrollbar-thumb{border-radius:8px;border:2px solid var(--v-panel,#0d1512);'+
'background:linear-gradient(180deg,var(--v-accent,#00e57a),#7c3aed)}'+
'#vParticleLab .vpx-b,#vParticleLab .vpx-p{scrollbar-width:thin;scrollbar-color:var(--v-accent,#00e57a) transparent}'+
'@media (max-width:900px){#vParticleLab{left:10px;right:10px;width:auto;top:auto;height:56vh}}'+
'@media print{#vParticleLab{display:none!important}}';

  var LAB_SCHEMA=[
    {g:'Partikel',it:[
      {k:'count',l:'Kerapatan',t:'r',min:0,max:600,st:10},
      {k:'size',l:'Ukuran',t:'r',min:.3,max:3.5,st:.05,d:2},
      {k:'speed',l:'Kecepatan',t:'r',min:0,max:3,st:.05,d:2},
      {k:'turbulence',l:'Turbulensi',t:'r',min:0,max:2,st:.05,d:2},
      {k:'parallax',l:'Kedalaman',t:'r',min:0,max:2.5,st:.05,d:2}]},
    {g:'Cahaya',it:[
      {k:'glow',l:'Pijar',t:'r',min:0,max:2.6,st:.05,d:2},
      {k:'trail',l:'Jejak',t:'r',min:0,max:.9,st:.02,d:2},
      {k:'nebula',l:'Kabut',t:'r',min:0,max:1.6,st:.05,d:2},
      {k:'pulse',l:'Denyut',t:'t'},
      {k:'ghost',l:'Mode rangka',t:'t'}]},
    {g:'Jaringan',it:[
      {k:'links',l:'Tautan filamen',t:'t'},
      {k:'linkDist',l:'Jarak tautan',t:'r',min:30,max:230,st:5,u:'px'},
      {k:'linkAlpha',l:'Opasitas tautan',t:'r',min:0,max:1,st:.02,d:2}]},
    {g:'Interaksi',it:[
      {k:'pointerForce',l:'Gaya kursor',t:'r',min:-1.2,max:1.2,st:.05,d:2},
      {k:'pointerGlow',l:'Cahaya kursor',t:'t'}]},
    {g:'Warna & Render',it:[
      {k:'palette',l:'Palet',t:'s',op:[['venom','Venom'],['toxin','Toxin'],['cyan','Cyan'],['amber','Amber'],['spectrum','Spectrum']]},
      {k:'hueSpread',l:'Sebaran rona',t:'r',min:0,max:70,st:1,u:'°'},
      {k:'quality',l:'Kualitas',t:'s',op:[['low','Low'],['medium','Medium'],['high','High'],['ultra','Ultra']]},
      {k:'enabled',l:'Efek aktif',t:'t'}]}
  ];
  var labRefs={};

  function labBuild(){
    if(lab) return;
    var st=document.createElement('style'); st.id='vParticleLabCss'; st.textContent=LAB_CSS; document.head.appendChild(st);
    lab=document.createElement('div'); lab.id='vParticleLab'; lab.hidden=true;
    lab.setAttribute('role','dialog'); lab.setAttribute('aria-label','Setelan partikel latar');
    var h='<div class="vpx-h"><i><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg></i><b>Partikel Latar</b>'+
      '<button type="button" class="vpx-x" id="vpxClose" aria-label="Tutup"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>'+
      '<div class="vpx-s"><span><b id="vpxFps">60</b> FPS</span><span><b id="vpxCnt">0</b> PARTIKEL</span><span><b id="vpxLnk">0</b> TAUTAN</span></div>'+
      '<div class="vpx-p" id="vpxPresets"></div><div class="vpx-b" id="vpxBody"></div>'+
      '<div class="vpx-f"><button type="button" id="vpxReset">Reset</button><button type="button" id="vpxRand">Acak</button>'+
      '<button type="button" id="vpxPng">PNG</button><button type="button" class="vpx-pri" id="vpxCopy">Salin konfigurasi</button></div>';
    lab.innerHTML=h; document.body.appendChild(lab);

    var pw=lab.querySelector('#vpxPresets');
    Object.keys(PRESETS).forEach(function(kk){
      var b=document.createElement('button'); b.type='button'; b.textContent=kk.charAt(0).toUpperCase()+kk.slice(1);
      b.addEventListener('click',function(){ labApply(PRESETS[kk]); if(window.toastr) toastr.success('Preset '+kk+' diterapkan','VENOM'); });
      pw.appendChild(b);
    });

    var body=lab.querySelector('#vpxBody');
    LAB_SCHEMA.forEach(function(sec){
      var g=document.createElement('div'); g.className='vpx-g';
      var hh=document.createElement('h4'); hh.textContent=sec.g; g.appendChild(hh);
      sec.it.forEach(function(it){
        if(it.t==='r'){
          var c=document.createElement('div'); c.className='vpx-c';
          c.innerHTML='<div class="vpx-t"><label for="vpx_'+it.k+'">'+it.l+'</label><span class="vpx-n" id="vpxn_'+it.k+'"></span></div>';
          var r=document.createElement('input'); r.type='range'; r.id='vpx_'+it.k; r.min=it.min; r.max=it.max; r.step=it.st;
          r.addEventListener('input',function(){ var p={}; p[it.k]=parseFloat(r.value); labApply(p); });
          c.appendChild(r); g.appendChild(c); labRefs[it.k]={i:r,n:c.querySelector('.vpx-n'),d:it};
        } else if(it.t==='t'){
          var row=document.createElement('div'); row.className='vpx-r';
          row.innerHTML='<label for="vpx_'+it.k+'">'+it.l+'</label>';
          var sw=document.createElement('label'); sw.className='vpx-sw';
          var cb=document.createElement('input'); cb.type='checkbox'; cb.id='vpx_'+it.k;
          cb.addEventListener('change',function(){ var p={}; p[it.k]=cb.checked; labApply(p); });
          sw.appendChild(cb); sw.appendChild(document.createElement('span'));
          row.appendChild(sw); g.appendChild(row); labRefs[it.k]={i:cb,d:it};
        } else {
          var row2=document.createElement('div'); row2.className='vpx-r';
          row2.innerHTML='<label for="vpx_'+it.k+'">'+it.l+'</label>';
          var se=document.createElement('select'); se.id='vpx_'+it.k;
          it.op.forEach(function(op){ var o2=document.createElement('option'); o2.value=op[0]; o2.textContent=op[1]; se.appendChild(o2); });
          se.addEventListener('change',function(){ var p={}; p[it.k]=se.value; labApply(p); });
          row2.appendChild(se); g.appendChild(row2); labRefs[it.k]={i:se,d:it};
        }
      });
      body.appendChild(g);
    });

    lab.querySelector('#vpxClose').addEventListener('click',labToggle);
    lab.querySelector('#vpxReset').addEventListener('click',function(){ labApply(PRESETS.symbiote); parts.length=0; pool(); if(still()) draw(.016); });
    lab.querySelector('#vpxRand').addEventListener('click',labRandom);
    lab.querySelector('#vpxPng').addEventListener('click',function(){
      try{ var a=document.createElement('a'); a.href=cv.toDataURL('image/png'); a.download='venom-particles.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        if(window.toastr) toastr.success('PNG tersimpan','VENOM'); }catch(e){}
    });
    lab.querySelector('#vpxCopy').addEventListener('click',function(){
      var txt=JSON.stringify(o,null,2);
      var ok=function(){ if(window.toastr) toastr.success('Konfigurasi disalin','VENOM'); };
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok,fb); else fb();
      function fb(){ var ta=document.createElement('textarea'); ta.value=txt; ta.style.cssText='position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');ok();}catch(e){} document.body.removeChild(ta); }
    });
    labSync();
  }
  function labSync(){
    if(!lab) return;
    Object.keys(labRefs).forEach(function(kk){
      var r=labRefs[kk], v=o[kk];
      if(r.d.t==='r'){ r.i.value=v; r.n.textContent=(r.d.d?v.toFixed(r.d.d):String(v))+(r.d.u||'');
        r.i.style.setProperty('--p',((v-r.d.min)/(r.d.max-r.d.min)*100)+'%'); }
      else if(r.d.t==='t') r.i.checked=!!v;
      else r.i.value=v;
    });
  }
  function labStats(){
    if(!lab||lab.hidden) return;
    var f=lab.querySelector('#vpxFps'), c2=lab.querySelector('#vpxCnt'), l2=lab.querySelector('#vpxLnk');
    if(f) f.textContent=still()?'—':Math.round(fps);
    if(c2) c2.textContent=parts.length;
    if(l2) l2.textContent=linkCount;
  }
  function labApply(patch){
    var sprite=false, cnt=false, res=false;
    for(var kk in patch){
      if(kk==='palette'||kk==='hueSpread') sprite=true;
      if(kk==='count') cnt=true;
      if(kk==='quality'){ cnt=true; res=true; }
      o[kk]=patch[kk];
    }
    if(sprite) buildSprites();
    if(res) resize();
    if(cnt) pool();
    if(patch.enabled===false){ stop(); ctx.clearRect(0,0,W,H); }
    else if(patch.enabled===true){ start(); }
    if(still()){ stop(); draw(.016); } else if(o.enabled&&!running&&!document.hidden){ start(); }
    persist(); labSync(); labStats();
  }
  function labRandom(){
    var pick=function(a){return a[Math.floor(Math.random()*a.length)];};
    var rn=function(a,b,s){ var v=a+Math.random()*(b-a); return s?Math.round(v/s)*s:Math.round(v*100)/100; };
    labApply({ count:rn(60,400,10), size:rn(.8,2.3), speed:rn(.2,1.7), turbulence:rn(.15,1.2),
      parallax:rn(.3,1.8), glow:rn(.5,2), trail:rn(0,.6), nebula:rn(.2,1.3),
      links:Math.random()>.35, linkDist:rn(80,200,5), linkAlpha:rn(.14,.55),
      pointerForce:rn(-.7,.85), pointerGlow:Math.random()>.3, pulse:Math.random()>.3, ghost:Math.random()>.82,
      palette:pick(['venom','toxin','cyan','amber','spectrum']), hueSpread:rn(8,56,1) });
    if(window.toastr) toastr.info('Medan partikel diacak','VENOM');
  }
  function labToggle(){
    labBuild();
    lab.hidden=!lab.hidden;
    if(!lab.hidden){ labSync(); labStats(); }
  }

  /* ---------- boot ---------- */
  function boot(){
    var body=document.body;
    reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    fxOff = body.getAttribute('data-venom-fx')==='0';
    mode = body.getAttribute('data-venom-mode')==='light'?'light':'dark';

    host=document.querySelector('.v-bg');
    if(!host){ host=document.createElement('div'); host.className='v-bg'; host.setAttribute('aria-hidden','true');
      host.style.cssText='position:fixed;inset:0;z-index:-1;pointer-events:none'; body.insertBefore(host,body.firstChild); }
    cv=document.createElement('canvas');
    cv.style.cssText='display:block;width:100%;height:100%';
    cv.setAttribute('aria-hidden','true');
    host.appendChild(cv);
    ctx=cv.getContext('2d');
    if(!ctx){ host.removeChild(cv); return; }

    buildSprites(); resize(); pool();

    window.addEventListener('pointermove',onMove,{passive:true});
    window.addEventListener('pointerdown',onMove,{passive:true});
    window.addEventListener('pointerleave',onLeave,{passive:true});
    window.addEventListener('blur',onLeave);
    window.addEventListener('resize',resize);
    document.addEventListener('visibilitychange',onVis);
    document.addEventListener('venom:accent',onAccent);
    document.addEventListener('keydown',onKey);
    if(window.ResizeObserver){ ro=new ResizeObserver(resize); ro.observe(host); }
    if(window.MutationObserver){
      mo=new MutationObserver(function(){
        var m=body.getAttribute('data-venom-mode')==='light'?'light':'dark';
        var f=body.getAttribute('data-venom-fx')==='0';
        if(m!==mode){ mode=m; buildSprites(); }
        if(f!==fxOff){ fxOff=f; pool(); }
        if(still()){ stop(); draw(.016); } else if(o.enabled){ start(); }
        labStats();
      });
      mo.observe(body,{attributes:true,attributeFilter:['data-venom-mode','data-venom-fx']});
    }
    if(o.enabled) start(); else ctx.clearRect(0,0,W,H);
  }

  window.VenomParticles = {
    setOptions: function(p){ labBuild(); labApply(p||{}); return this; },
    getOptions: function(){ var c={}; for(var z in o) c[z]=o[z]; return c; },
    pause: function(){ stop(); return this; },
    resume: function(){ if(o.enabled) start(); return this; },
    toggleLab: labToggle,
    reseed: function(){ parts.length=0; pool(); if(still()) draw(.016); return this; },
    destroy: function(){
      destroyed=true; stop();
      window.removeEventListener('pointermove',onMove);
      window.removeEventListener('pointerdown',onMove);
      window.removeEventListener('pointerleave',onLeave);
      window.removeEventListener('blur',onLeave);
      window.removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',onVis);
      document.removeEventListener('venom:accent',onAccent);
      document.removeEventListener('keydown',onKey);
      if(ro) ro.disconnect(); if(mo) mo.disconnect();
      parts.length=0; sprites.length=0; nebulae.length=0; grid.clear();
      if(cv&&cv.parentNode) cv.parentNode.removeChild(cv);
      if(lab&&lab.parentNode) lab.parentNode.removeChild(lab);
      var sc=document.getElementById('vParticleLabCss'); if(sc) sc.parentNode.removeChild(sc);
      lab=null; labRefs={}; window.VenomParticles=null;
    }
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();