const C = (container, canvas)=>{
  const X = canvas.getContext("2d");

  const Hue = (h,l,d)=>{
    const a = h*Math.PI*2;
    let r = Math.cos(a+0)*0.5+0.5;
    let g = Math.cos(a+Math.PI*2/3)*0.5+0.5;
    let b = Math.cos(a-Math.PI*2/3)*0.5+0.5;
    r = (1-(1-r)*l) * d;
    g = (1-(1-g)*l) * d;
    b = (1-(1-b)*l) * d;
    r = Math.round(r*255);
    g = Math.round(g*255);
    b = Math.round(b*255);
    return "rgb(" + r + "," + g + "," + b + ")";
  };

  let lastShape = null;
  const Affine = _=>{
    const q = [];
    const f = {};
    f.with = cb=>{
      X.save();
      q.forEach(e=>{
        e(X);
      });
      cb();
      X.restore();
      lastShape = null;
    };
    f.translate = (x,y)=>{
      q.push(X=>X.translate(x,y));
      return f;
    };
    f.rotate = a=>{
      q.push(X=>X.rotate(a));
      return f;
    };
    f.scale = s=>{
      q.push(X=>X.scale(s,s));
      return f;
    };
    return f;
  };

  function shape(s) {
    const o = {
      fill: (h,l,d)=>{
        if(lastShape != o) {
          lastShape = o;
          s();
        }
        X.fillStyle = Hue(h,l,d);
        X.fill();
        return o;
      },
      stroke: (h,l,d,b)=>{
        if(lastShape != o) {
          lastShape = o;
          s();
        }
        X.strokeStyle = Hue(h,l,d);
        X.lineWidth = b;
        X.stroke();
        return o;
      },
      clip: (cb)=>{
        if(lastShape != o) {
          lastShape = o;
          s();
        }
        X.save();
        X.clip();
        cb();
        X.restore();
      }
    };
    return o;
  }

  const Drawing = _=>{
    const r = {};
    r.text = (t,x,y,s)=>{
      let align = "center";
      const o = {
        fill: (h,l,d)=>{
          lastShape = null;
          X.textAlign = align;
          X.fillStyle = Hue(h,l,d);
          X.font = s + "px Cuprum";
          X.fillText(t,x,y);
          return o;
        },
        stroke: (h,l,d,b)=>{
          lastShape = null;
          X.textAlign = align;
          X.strokeStyle = Hue(h,l,d);
          X.lineWidth = b;
          X.font = s + "px Cuprum";
          X.strokeText(t,x,y);
          return o;
        }
      };
      o.l = _=>{
        align = "left";
        return o;
      };
      o.r = _=>{
        align = "right";
        return o;
      };
      return o;
    };
    r.shape = s=>shape(_=>{
      X.beginPath();
      s(X);
    });
    r.poly = (x,y,s,n,a)=>shape(_=>{
      X.beginPath();
      for(let i=0;i<=n;i++) {
        const dx = Math.cos((i/n+a)*Math.PI*2), dy = Math.sin((i/n+a)*Math.PI*2);
        if(i == 0) X.moveTo(x+dx*s, y+dy*s);
        else X.lineTo(x+dx*s,y+dy*s);
      }
    });
    r.polyOutline = (x,y,s,n,a,v)=>shape(_=>{
      X.beginPath();
      for(let i=0;i<=n;i++) {
        const dx = Math.cos((i/n+a)*Math.PI*2), dy = Math.sin((i/n+a)*Math.PI*2);
        if(i == 0) X.moveTo(x+dx*s, y+dy*s);
        else X.lineTo(x+dx*s,y+dy*s);
      }
      s *= v;
      for(let i=n;i>-1;i--) {
        const dx = Math.cos((i/n+a)*Math.PI*2), dy = Math.sin((i/n+a)*Math.PI*2);
        if(i == n) X.moveTo(x+dx*s, y+dy*s);
        else X.lineTo(x+dx*s,y+dy*s);
      }
    });
    r.circle = (x,y,r)=>shape(_=>{
      X.beginPath();
      X.arc(x,y,r,0,2*Math.PI,false);
    });
    r.ellipse = (x,y,r0,r1,o)=>shape(_=>{
      X.beginPath();
      X.ellipse(x,y,r0,r1,o,0,2*Math.PI,false);
    });
    r.rect = (x,y,w,h)=>shape(_=>{
      X.beginPath();
      X.rect(x,y,w,h);
    });
    r.line = (x0,y0,x1,y1)=>shape(_=>{
      X.beginPath();
      X.moveTo(x0,y0);
      X.lineTo(x1,y1);
    });

    r.translate = (x,y)=>Affine().translate(x,y);
    r.rotate = a=>Affine().rotate(a);
    r.scale = s=>Affine().scale(s);
    r.blend = (m,cb)=>{
      const o = X.globalCompositeOperation;
      X.globalCompositeOperation = m;
      cb();
      X.globalCompositeOperation = o;
    };
    r.alpha = (a,cb)=>{
      const o = X.globalAlpha;
      X.globalAlpha = a;
      cb();
      X.globalAlpha = o;
    }
    r.measure = (t,s)=>{
      X.font = s + "px Comfortaa";
      return X.measureText(t).width;
    };
    return r;
  };

  const o = Drawing();
  o.X = X;
  o.resize = (w,h)=>{
    canvas.width = o.w = w;
    canvas.height = o.h = h;
  };
  o.clear = _=>{
    X.clearRect(0,0,o.w,o.h);
    X.fillStyle = "rgb(0,0,0)";
    X.fillRect(0,0,o.w,o.h);
    X.lineCap = X.lineJoin = "round";
    X.textBaseline = "top";
  };

  const resize = _=>{
    o.resize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener("resize", resize);
  resize();

  return o;
};

window.onload = _=>{

const R = C(
  document.getElementById("container"),
  document.getElementById("canvas")
);
const bufSize = 4096; // 2^12
const sampleRate = 48000;
const waveForm = new Float32Array(bufSize*2);
const freqForm = new Float32Array(bufSize*2);
const resultForm = new Float32Array(bufSize*2);
const revBit = j=>{
  let ix = 0;
  let p = bufSize/2;
  for(let i=0;i<12;i++) {
    ix += p * (j%2);
    j = Math.floor(j/2);
    p /= 2;
  }
  return ix;
};
const FFT = (inForm, outForm, mult)=>{
  let b0 = new Float32Array(bufSize*2);
  let b1 = new Float32Array(bufSize*2);
  for(let j=0;j<bufSize;j++) b0[j*2+0] = inForm[revBit(j)*2+0], b0[j*2+1] = inForm[revBit(j)*2+1];
  for(let i=0;i<12;i++) {
    const order = Math.pow(2,i);
    for(let j=0;j<bufSize;j++) {
      const lo = j % (order*2);
      const dir = order * (lo < order ? +1 : -1);
      let v0x = b0[j*2+0], v0y = b0[j*2+1];
      let v1x = b0[(j+dir)*2+0], v1y = b0[(j+dir)*2+1];
      if(dir < 0) {
        let t;
        t = v0x; v0x = v1x; v1x = t;
        t = v0y; v0y = v1y; v1y = t;
      }
      const rota = lo / (order*2) * Math.PI * 2 * mult;
      b1[j*2+0] = v0x + v1x*Math.cos(rota) - v1y*Math.sin(rota);
      b1[j*2+1] = v0y + v1x*Math.sin(rota) + v1y*Math.cos(rota);
    }
    let bt;
    bt = b0; b0 = b1; b1 = bt;
  }
  for(let j=0;j<bufSize*2;j++) outForm[j] = b0[j] / Math.sqrt(bufSize);
};
function render() {
  R.clear();
  R.rect(0,0,R.w,R.h).fill(0,0,0.1);
  const p = 20;
  const h = (R.h-p*4)/3;
  R.rect(p,p,R.w-p*2,h).fill(0,0,0.08);
  R.rect(p,p,R.w-p*2,h).stroke(0,0,0.3,4);
  R.line(p*1.5,p+h/2,R.w-p*1.5,p+h/2).stroke(0,0,0.2,2);
  R.rect(p,h+p*2,R.w-p*2,h).fill(0,0,0.08);
  R.rect(p,h+p*2,R.w-p*2,h).stroke(0,0,0.3,4);
  R.line(p*1.5,h*2+p,R.w-p*1.5,h*2+p).stroke(0,0,0.2,2);
  R.text("0.125", R.w-p*1.7, h+p*2.7, h/4).r().fill(0,0,0.3);
  R.rect(p,h*2+p*3,R.w-p*2,h).fill(0,0,0.08);
  R.rect(p,h*2+p*3,R.w-p*2,h).stroke(0,0,0.3,4);
  R.line(p*1.5,h*2+h/2+p*3,R.w-p*1.5,h*2+h/2+p*3).stroke(0,0,0.2,2);
  const w = R.w-p*4;
  const m = h/4;
  R.translate(p*2,p+h/2).with(_=>{
    R.shape(X=>{
      X.moveTo(0,-waveForm[0]*m);
      for(let i=1;i<bufSize;i++) {
        X.lineTo(i*w/bufSize,-waveForm[i*2+0]*m);
      }
    }).stroke(0,0,0.3,2);
    R.shape(X=>{
      X.moveTo(0,-waveForm[1]*m);
      for(let i=1;i<bufSize;i++) {
        X.lineTo(i*w/bufSize,-waveForm[i*2+1]*m);
      }
    }).stroke(0,0,0.7,2);
  });
  R.translate(p*2,h*2+p).with(_=>{
    const u = 8;
    for(let i=0;i<bufSize/u;i++) {
      const x = freqForm[i*2+0];
      const y = freqForm[i*2+1];
      const mag = Math.sqrt(x*x+y*y);
      const arg = Math.atan2(y,x) / Math.PI / 2;
      R.line(i*w/bufSize*u,0,i*w/bufSize*u,-mag*m/4).stroke(arg,1-Math.exp(-mag*0.4),0.7,2);
    }
  });
  R.translate(p*2,h*2+h/2+p*3).with(_=>{
    R.shape(X=>{
      X.moveTo(0,-resultForm[0]*m);
      for(let i=1;i<bufSize;i++) {
        X.lineTo(i*w/bufSize,-resultForm[i*2+0]*m);
      }
    }).stroke(0,0,0.3,2);
    R.shape(X=>{
      X.moveTo(0,-resultForm[1]*m);
      for(let i=1;i<bufSize;i++) {
        X.lineTo(i*w/bufSize,-resultForm[i*2+1]*m);
      }
    }).stroke(0,0,0.7,2);
  });
  requestAnimationFrame(render);
}
render();

const S = new AudioContext();
const src = S.createBufferSource();
const buff = S.createBuffer(2, bufSize, sampleRate);
src.buffer = buff;
src.loop = true;
src.start();
const comp = S.createDynamicsCompressor();
const gain1 = S.createGain();
gain1.gain.value = 0;
const gain2 = S.createGain();
gain2.gain.value = 0;
src.connect(comp);
comp.connect(gain1).connect(S.destination);
comp.connect(gain2).connect(S.destination);

let mouseX = 0.5, mouseY = 0.5;
function tick() {
  gain1.gain.setTargetAtTime(0.1, S.currentTime, 0.001);
  gain1.gain.setTargetAtTime(0, S.currentTime+0.01, Math.exp(-(1-mouseX)*4));
  gain2.gain.setTargetAtTime((1-mouseY)*0.4, S.currentTime, 0.01);
  gain2.gain.setTargetAtTime(0, S.currentTime+0.01, 0.02);
}

let funcStr = "0", specStr = "1";
const K = _=>{
  const f = str=>new Function(`
    const sin = Math.sin, cos = Math.cos, tanh = Math.tanh;
    const pow = Math.pow, exp = Math.exp, sqrt = Math.sqrt;
    const sign = Math.sign, abs = Math.abs;
    const floor = Math.floor, fract = x=>{ return x - Math.floor(x); };
    const pi = Math.PI, tau = Math.PI * 2;
    const u = _=>{ return Math.random()-0.5; };
    const s = x=>{ return Math.sin(x*tau); };
    const c = x=>{ return Math.cos(x*tau); };
    const n = x=>{ return Math.exp(-x*x); };
    return t=>${str};
  `)();
  const func = f(funcStr), spec = f(specStr);
  for(let i=0;i<bufSize;i++) waveForm[i*2+0] = func(i/bufSize), waveForm[i*2+1] = func(i/bufSize+0.5);
  FFT(waveForm, freqForm, 1);
  for(let i=0;i<bufSize;i++) freqForm[i*2+0] *= spec(i/bufSize), freqForm[i*2+1] *= spec(i/bufSize);
  FFT(freqForm, resultForm, -1);
  const c0 = buff.getChannelData(0);
  const c1 = buff.getChannelData(1);
  for(let i=0;i<bufSize;i++) {
    const u = 1-Math.abs(i/bufSize*2-1);
    const v0 = resultForm[(i+bufSize*0/2)%bufSize*2+0];
    const v1 = resultForm[(i+bufSize*0/2)%bufSize*2+1];
    const w0 = resultForm[(i+bufSize*1/2)%bufSize*2+0];
    const w1 = resultForm[(i+bufSize*1/2)%bufSize*2+1];
    c0[i] = v0*u + w0*(1-u);
    c1[i] = v1*u + w1*(1-u);
  }
  S.resume();
  tick();
};
const F = str=>{
  funcStr = str;
  K();
};
const G = str=>{
  specStr = str;
  K();
};
window.F = F;
window.G = G;

window.addEventListener("mousemove", e=>{
  mouseX = e.clientX / R.w;
  mouseY = e.clientY / R.h;
});
window.addEventListener("click", _=>{
  tick();
});

};
