let particles = [];
let numParticles = 350;

// サウンド解析
let mic, fft;
let soundLevel = 1;
let time = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(0);

  mic = new p5.AudioIn();
  fft = new p5.FFT();
  fft.setInput(mic);
  mic.start();

  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  background(0);

  let spectrum = fft.analyze();

  let levels = [];
  for (let i = 0; i < 40; i++) {
    levels.push(fft.getEnergy(i * 100 + 1, (i + 1) * 100));
  }

  let level = 1;
  for (let i = 1; i < 40; i++) {
    if (levels[i] > 100) level = i + 1;
  }

  soundLevel = 0.8 * soundLevel + 0.2 * level;
  soundLevel = constrain(soundLevel, 1, 40);

  applyAnimation(round(soundLevel));

  for (let p of particles) {
    p.update();
    p.show();
  }

  time += 0.01;
}

function drawConnections() {
  stroke(255, 50);
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].pos.x, particles[i].pos.y, particles[i].pos.z,
        particles[j].pos.x, particles[j].pos.y, particles[j].pos.z
      );
      if (d < 100) {
        line(
          particles[i].pos.x, particles[i].pos.y, particles[i].pos.z,
          particles[j].pos.x, particles[j].pos.y, particles[j].pos.z
        );
      }
    }
  }
  noStroke();
}

function applyAnimation(level) {
  switch (level) {
    case 1:
      rotateY(time);
      break;
    case 2:
      for (let p of particles) p.moveToCenter();
      break;
    case 3:
      rotateX(time);
      break;
    case 4:
      rotateX(time);
      rotateY(time);
      break;
    case 5:
      for (let p of particles) p.explode();
      break;
    case 6:
      for (let p of particles) p.randomColor();
      break;
    case 7:
      for (let p of particles) p.randomSize();
      break;
    case 8:
      drawConnections();
      rotateY(time);
      break;
    case 9:
      drawConnections();
      rotateX(time);
      break;
    case 10:
      drawConnections();
      for (let p of particles) {
        p.randomColor();
        p.randomSize();
      }
      rotateY(time);
      break;
    case 11:
      for (let p of particles) p.waveMotion();
      break;
    case 12:
      for (let p of particles) p.spiralMotion();
      break;
    case 13:
      for (let p of particles) p.jitter();
      break;
    case 14:
      for (let p of particles) p.flock();
      break;
    case 15:
      for (let p of particles) p.orbit();
      break;
    case 16:
      for (let p of particles) p.expandContract();
      break;
    case 17:
      for (let p of particles) p.chainReaction();
      break;
    case 18:
      for (let p of particles) p.cluster();
      break;
    case 19:
      for (let p of particles) p.shockwave();
      break;
    case 20:
      for (let p of particles) p.teleport();
      break;
    case 21:
      for (let p of particles) p.randomJump();
      break;
    case 22:
      for (let p of particles) p.fadeInOut();
      break;
    case 23:
      for (let p of particles) p.zigzagMotion();
      break;
    case 24:
      for (let p of particles) p.chase();
      break;
    case 25:
      for (let p of particles) p.splitMerge();
      break;
    case 26:
      for (let p of particles) p.magneticAttraction();
      break;
    case 27:
      for (let p of particles) p.bounceAround();
      break;
    case 28:
      for (let p of particles) p.sineWaveMove();
      break;
    case 29:
      for (let p of particles) p.tornadoSpin();
      break;
    case 30:
      for (let p of particles) p.randomOrbit();
      break;
    case 31:
      for (let p of particles) p.scatter();
      break;
    case 32:
      for (let p of particles) p.expandDisappear();
      break;
    case 33:
      for (let p of particles) p.exponentialGrowth();
      break;
    case 34:
      for (let p of particles) p.slowDrift();
      break;
    case 35:
      for (let p of particles) p.vibrate();
      break;
    case 36:
      for (let p of particles) p.galaxyFormation();
      break;
    case 37:
      for (let p of particles) p.cometTrail();
      break;
    case 38:
      for (let p of particles) p.pulsate();
      break;
    case 39:
      for (let p of particles) p.gravityPull();
      break;
    case 40:
      for (let p of particles) p.wormholeWarp();
      break;
  }
}

class Particle {
  constructor() {
    this.pos = createVector(random(-width / 2, width / 2), random(-height / 2, height / 2), random(-200, 200));
    this.vel = p5.Vector.random3D().mult(random(0.5, 1));
    this.size = 2;
    this.color = color(255);
  }

  update() {
    this.pos.add(this.vel);
    if (this.pos.x < -width / 2 || this.pos.x > width / 2) this.vel.x *= -1;
    if (this.pos.y < -height / 2 || this.pos.y > height / 2) this.vel.y *= -1;
    if (this.pos.z < -200 || this.pos.z > 200) this.vel.z *= -1;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    fill(this.color);
    noStroke();
    sphere(this.size);
    pop();
  }

  moveToCenter() {
    this.pos.mult(0.95);
  }

  explode() {
    this.pos.add(p5.Vector.random3D().mult(5));
  }

  randomColor() {
    this.color = color(random(255), random(255), random(255));
  }

  randomSize() {
    this.size = random(1, 5);
  }

  waveMotion() {
    this.pos.y += sin(time + this.pos.x * 0.1) * 2;
  }

  spiralMotion() {
    let angle = time * 0.1;
    this.pos.x += cos(angle) * 2;
    this.pos.z += sin(angle) * 2;
  }

  jitter() {
    this.pos.add(p5.Vector.random3D().mult(2));
  }

  flock() {
    let cohesion = createVector(0, 0, 0);
    for (let other of particles) {
      cohesion.add(other.pos);
    }
    cohesion.div(particles.length);
    this.pos.lerp(cohesion, 0.01);
  }

  orbit() {
    let angle = time * 0.05;
    this.pos.x = cos(angle) * this.pos.x - sin(angle) * this.pos.z;
    this.pos.z = sin(angle) * this.pos.x + cos(angle) * this.pos.z;
  }

  expandContract() {
    this.pos.mult(sin(time * 0.1) * 0.1 + 1);
  }

  chainReaction() {
    if (random(1) < 0.01) {
      this.vel = p5.Vector.random3D().mult(random(3, 6));
    }
  }

  cluster() {
    let center = createVector(0, 0, 0);
    this.pos.lerp(center, 0.02);
  }

  shockwave() {
    this.pos.y += sin(time) * 3;
  }

  teleport() {
    if (random(1) < 0.005) {
      this.pos = createVector(random(-width / 2, width / 2), random(-height / 2, height / 2), random(-200, 200));
    }
  }
  
  // 不足していたメソッドを追加
  randomJump() {
    if (random(1) < 0.05) {
      this.vel = p5.Vector.random3D().mult(random(1, 3));
    }
  }
  
  fadeInOut() {
    let alpha = (sin(time * 0.5) * 0.5 + 0.5) * 255;
    this.color = color(red(this.color), green(this.color), blue(this.color), alpha);
  }
  
  zigzagMotion() {
    this.pos.x += sin(time * 2) * 2;
  }
  
  chase() {
    let target = particles[0].pos.copy();
    let dir = p5.Vector.sub(target, this.pos);
    dir.normalize();
    dir.mult(0.5);
    this.vel.lerp(dir, 0.02);
  }
  
  splitMerge() {
    if (sin(time * 0.2) > 0) {
      this.pos.mult(1.01);
    } else {
      this.pos.mult(0.99);
    }
  }
  
  magneticAttraction() {
    let center = createVector(0, 0, 0);
    let dir = p5.Vector.sub(center, this.pos);
    dir.normalize();
    dir.mult(0.5);
    this.vel.lerp(dir, 0.01);
  }
  
  bounceAround() {
    this.vel.add(p5.Vector.random3D().mult(0.1));
    this.vel.limit(3);
  }
  
  sineWaveMove() {
    this.pos.x += sin(time + this.pos.y * 0.05) * 2;
  }
  
  tornadoSpin() {
    let angle = atan2(this.pos.z, this.pos.x);
    let radius = dist(0, 0, this.pos.x, this.pos.z);
    angle += 0.05;
    this.pos.x = cos(angle) * radius;
    this.pos.z = sin(angle) * radius;
    this.pos.y += 0.5;
  }
  
  randomOrbit() {
    let angle = time * random(0.02, 0.05);
    this.pos.y = cos(angle) * this.pos.y - sin(angle) * this.pos.z;
    this.pos.z = sin(angle) * this.pos.y + cos(angle) * this.pos.z;
  }
  
  scatter() {
    this.vel = p5.Vector.random3D().mult(random(1, 2));
  }
  
  expandDisappear() {
    this.pos.mult(1.01);
    this.size *= 0.99;
  }
  
  exponentialGrowth() {
    this.size = 2 + sin(time * 0.5) * 3;
  }
  
  slowDrift() {
    this.vel.mult(0.98);
    this.vel.add(p5.Vector.random3D().mult(0.05));
  }
  
  vibrate() {
    this.pos.add(p5.Vector.random3D().mult(sin(time * 5)));
  }
  
  galaxyFormation() {
    let center = createVector(0, 0, 0);
    let dir = p5.Vector.sub(center, this.pos);
    let dist = dir.mag();
    dir.normalize();
    dir.rotate(PI/2);
    dir.mult(0.5);
    this.vel.lerp(dir, 0.05);
  }
  
  cometTrail() {
    this.size = random(1, 3);
    this.vel.mult(1.001);
  }
  
  pulsate() {
    this.size = 2 + sin(time * 3) * 2;
  }
  
  gravityPull() {
    let center = createVector(0, 0, 0);
    let dir = p5.Vector.sub(center, this.pos);
    dir.normalize();
    dir.mult(0.2);
    this.vel.add(dir);
  }
  
  wormholeWarp() {
    if (dist(0, 0, 0, this.pos.x, this.pos.y, this.pos.z) < 50) {
      this.pos = p5.Vector.random3D().mult(random(100, 200));
    } else {
      let center = createVector(0, 0, 0);
      let dir = p5.Vector.sub(center, this.pos);
      dir.normalize();
      dir.mult(2);
      this.vel.add(dir);
    }
  }
}