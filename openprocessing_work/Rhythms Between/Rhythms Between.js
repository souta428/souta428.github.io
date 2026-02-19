let mic, fft;
let allSites = [];
let step = 14;
let maxPoints = 150;
let minPoints = 80;
let effects = [];
let comboActive = false;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  const target = document.getElementById("sketch") || document.body;
  canvas.parent(target);
  noiseDetail(3, 0.5);
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT(0.1, 64);
  fft.setInput(mic);
  for (let i = 0; i < minPoints; i++) {
    allSites.push(makeSite(randomType()));
  }
}

function draw() {
  background(0);
  let spectrum = fft.analyze();

  // 🎚 音域バランス補正（やや緩和）
  let low = avg(spectrum.slice(0, 10)) * 0.8;
  let mid = avg(spectrum.slice(11, 30)) * 1.2;
  let high = avg(spectrum.slice(31, 63)) * 1.5;
  let totalAmp = avg(spectrum);

  let isCombo = (low > 150 && mid > 150 && high > 150);
  comboActive = isCombo;

  for (let s of allSites) {
    let angle = frameCount * (s.type === 'low' ? 0.01 : s.type === 'mid' ? 0.03 : 0.06);
    let intensity = s.type === 'low' ? low : s.type === 'mid' ? mid : high;
    let shake = map(intensity, 0, 255, 0, 20);
    s.x = s.baseX + sin(angle + s.seed) * shake;
    s.y = s.baseY + cos(angle + s.seed) * shake;
    s.intensity = intensity;
    s.trail.push({ x: s.x, y: s.y, a: 255 });
    if (s.trail.length > 10) s.trail.shift();

    if (intensity > 180 && !s.effectActive) {
      s.effectActive = true;
      if (s.type === 'low') effects.push(makeWave(s.x, s.y));
      if (s.type === 'mid') effects.push(makeAura(s.x, s.y));
      if (s.type === 'high') {
        for (let i = 0; i < 8; i++) effects.push(makeSpark(s.x, s.y));
      }
    } else if (intensity < 100) {
      s.effectActive = false;
    }
  }

  if (comboActive) {
    strokeWeight(1.2);
    stroke(255, 255, 100, 100);
    for (let i = 0; i < allSites.length; i++) {
      for (let j = i + 1; j < allSites.length; j++) {
        let d = dist(allSites[i].x, allSites[i].y, allSites[j].x, allSites[j].y);
        if (d < 120) {  // 🔧 ネットワーク結線条件を緩和
          line(allSites[i].x, allSites[i].y, allSites[j].x, allSites[j].y);
        }
      }
    }
  }

  let waveThreshold = 12 + sin(frameCount * 0.05) * 6;
  noFill();
  strokeWeight(comboActive ? 3.2 : 2.2);
  stroke(255, 255, 255, comboActive ? 240 : 180);
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      let dists = allSites.map(s => sq(s.x - x) + sq(s.y - y));
      let sorted = [...dists].sort((a, b) => a - b);
      let diff = abs(sqrt(sorted[1]) - sqrt(sorted[0]));
      if (diff < waveThreshold) {
        point(x, y);
      }
    }
  }

  for (let s of allSites) {
    drawCell(s, comboActive);
  }

  drawEffects();
}

function drawCell(s, sync) {
  push();
  translate(s.x, s.y);
  noStroke();

  let base = s.baseColor;
  let brightBoost = map(s.intensity, 0, 255, 0, 80);
  let newColor = color(
    constrain(red(base) + brightBoost, 0, 255),
    constrain(green(base) + brightBoost, 0, 255),
    constrain(blue(base) + brightBoost, 0, 255)
  );

  let auraRadius = map(s.intensity, 0, 255, 10, 40);
  let auraAlpha = map(s.intensity, 0, 255, 30, 120);
  fill(red(newColor), green(newColor), blue(newColor), auraAlpha);
  beginShape();
  for (let a = 0; a < TWO_PI; a += PI / 30) {
    let noiseFactor = noise(cos(a) + s.seed, sin(a) + s.seed, frameCount * 0.01);
    let r = auraRadius + noiseFactor * 20;
    let x = cos(a) * r;
    let y = sin(a) * r;
    vertex(x, y);
  }
  endShape(CLOSE);

  for (let t of s.trail) {
    fill(red(newColor), green(newColor), blue(newColor), t.a);
    ellipse(t.x - s.x, t.y - s.y, 3);
    t.a *= 0.85;
  }

  let brightness = map(s.intensity, 0, 255, 100, 255);
  let pulse = sync ? map(sin(frameCount * 0.1), -1, 1, 0.8, 1.3) : 1;
  fill(red(newColor), green(newColor), blue(newColor), brightness);
  ellipse(0, 0, 6 * pulse);
  pop();
}

function makeSite(type) {
  return {
    baseX: random(width),
    baseY: random(height),
    x: 0,
    y: 0,
    type: type,
    baseColor: type === 'low' ? color(50, 150, 255)
              : type === 'mid' ? color(255, 180, 50)
              : color(255, 100, 200),
    intensity: 0,
    effectActive: false,
    seed: random(TWO_PI),
    trail: []
  };
}

function drawEffects() {
  for (let i = effects.length - 1; i >= 0; i--) {
    let e = effects[i];
    e.draw();
    e.age++;
    if (e.age > e.lifespan) effects.splice(i, 1);
  }
}

function makeWave(x, y) {
  return {
    x, y, age: 0, lifespan: 30,
    draw: function () {
      noFill();
      stroke(100, 200, 255, map(this.age, 0, this.lifespan, 200, 0));
      ellipse(this.x, this.y, this.age * 3);
    }
  };
}

function makeAura(x, y) {
  return {
    x, y, age: 0, lifespan: 30,
    draw: function () {
      push();
      translate(this.x, this.y);
      rotate(frameCount * 0.05);
      noFill();
      stroke(255, 180, 50, 150 - this.age * 5);
      ellipse(0, 0, 20 + this.age * 2);
      pop();
    }
  };
}

function makeSpark(x, y) {
  let angle = random(TWO_PI);
  let speed = random(1, 3);
  return {
    x, y,
    dx: cos(angle) * speed,
    dy: sin(angle) * speed,
    age: 0,
    lifespan: 20,
    draw: function () {
      fill(255, 100, 200, 200 - this.age * 10);
      noStroke();
      ellipse(this.x + this.dx * this.age, this.y + this.dy * this.age, 3);
    }
  };
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function randomType() {
  let r = random();
  return r < 0.33 ? 'low' : r < 0.66 ? 'mid' : 'high';
}

function mousePressed() {
  if (getAudioContext().state !== "running") {
    userStartAudio();
    mic.start();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
