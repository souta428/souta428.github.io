//
// p5.js スケッチ
// - 相対論的補正＋紐アニメーション (前回までと同様)
// - 中心にある赤い丸(太陽)の周囲に、Perlin Noiseを使ったフレア(揺らめき)を描画
//

// ------------------------------
// グローバル変数・定数
// ------------------------------
const G = 1.0;       // 万有引力定数
const M = 10.0;       // 中央にある恒星(質量大きめ)
const alpha = 1;   // 相対論補正の強さ
const dt = 0.02;     // 数値積分ステップ

const numParticles = 580;     // 粒子数
const connectionDist = 60;   // 紐で結ぶ距離(ピクセル)

let particles = [];

// ノイズアニメーション用の時間 (Perlin noise の第3引数)
let noiseTime = 10.0;

// ------------------------------
// setup(): 最初に1回だけ呼ばれる
// ------------------------------
function setup() {
  const canvas = createCanvas(700, 700);
  const target = document.getElementById("sketch") || document.body;
  canvas.parent(target);

  // 粒子を生成
  for (let i = 0; i < numParticles; i++) {
    particles.push(new RelativisticParticle());
  }
}

// ------------------------------
// draw(): 毎フレーム呼ばれる
// ------------------------------
function draw() {
  // 背景を透明度 20 で塗りつぶし -> 前のフレームの残像を少し残す
  background(0, 20);

  // ノイズアニメーション用の時間を進める
  noiseTime += 0.01;

  // (A) 太陽を描画 (グロー + Perlin Noise フレア)
  drawSolar(noiseTime);

  // (B) 粒子を更新
  for (let p of particles) {
    p.update();
  }

  // (C) パーティクル同士を紐で結ぶ
  stroke(255, 80);
  strokeWeight(1);
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let distSq = dx*dx + dy*dy;
      if (distSq < connectionDist*connectionDist) {
        line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
      }
    }
  }

  // (D) パーティクルを描画
  noStroke();
  fill(255);
  for (let p of particles) {
    p.show();
  }
}

// ------------------------------
// 太陽を描く (グロー + ノイズフレア)
// ------------------------------
function drawSolar(t) {
  // 太陽の中心座標 & 大きさ
  let cx = width/2;
  let cy = height/2;
  let starRadius = 16;  // 太陽本体の半径

  // --- (1) 太陽周囲のグロー(放射グラデーション) ---
  push();
  noStroke();
  let glowRadius = 60; // グローの広がり
  for (let r = starRadius; r < starRadius + glowRadius; r++) {
    // 外側ほどアルファを下げる
    let alphaVal = map(r, starRadius, starRadius + glowRadius, 200, 0);
    fill(255, 80, 0, alphaVal);
    ellipse(cx, cy, r*1, r*1);
  }
  pop();

  // --- (2) 太陽本体の赤い丸 ---
  noStroke();
  fill(255, 0, 0, 200);
  ellipse(cx, cy, starRadius*1);

  // --- (3) Perlin Noise を使ったフレアの揺らめき ---
  //     円周をぐるっと回りながら、ノイズ値で半径をゆらす
  push();
  translate(cx, cy);
  noFill();
  stroke(255, 120, 0, 150);
  strokeWeight(2);

  beginShape();
  for (let angle = 0; angle < TWO_PI; angle += 0.05) {
    // ノイズの周波数や振幅
    let freq = 5;      // ノイズの伸び具合
    let amp = 50;        // 振幅 (フレアの尖り具合)
    let baseRadius = 1; // 太陽表面からどれぐらい外にフレアを描くか

    // x, y のノイズ座標: (cos, sin)を使う
    // さらに時間 t を第3引数にして動きのあるノイズ
    let nx = cos(angle)*freq;
    let ny = sin(angle)*freq;
    let nVal = noise(nx, ny, t);  // 0～1 の範囲のノイズ値

    // フレアの半径
    let r = starRadius + baseRadius + nVal * amp;

    // 楕円状に頂点を設定 (頂点をつなげて多角形→CLOSEで輪に)
    let x = r * cos(angle);
    let y = r * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);
  pop();
}

// --------------------------------------------------------------
// 粒子クラス (相対論的補正付き中心力 + ランダムな乱れ + 紐)
// --------------------------------------------------------------
class RelativisticParticle {
  constructor() {
    this.reset();
  }

  reset() {
    // 極座標でランダムに初期化
    this.r = random(50, 300);
    this.theta = random(TWO_PI);

    this.dr = 0;
    this.dtheta = sqrt(G * M / (this.r ** 3));

    this.centerX = width / 2;
    this.centerY = height / 2;
    this.updateXY();
  }

  updateXY() {
    this.x = this.centerX + this.r * cos(this.theta);
    this.y = this.centerY + this.r * sin(this.theta);
  }

  update() {
    // --- 相対論的補正を含む中心力による加速度 ---
    let r2 = this.r * this.r;
    let r4 = r2 * r2;
    let ddr = this.r * (this.dtheta**2)
             - (G * M)/r2
             + 3*alpha/r4;
    let ddtheta = -2*(this.dr*this.dtheta)/this.r;

    // --- ランダムな乱れを少し加える ---
    const randFactorR = 5;
    const randFactorT = 0.25;
    ddr     += random(-randFactorR, randFactorR);
    ddtheta += random(-randFactorT, randFactorT);

    // --- Euler法で速度・座標を更新 ---
    this.dr     += ddr * dt;
    this.dtheta += ddtheta * dt;
    this.r      += this.dr * dt;
    this.theta  += this.dtheta * dt;

    // 中心付近に落ちすぎないようにクリップ
    if (this.r < 1) {
      this.r = 1;
      this.dr = 0;
    }

    this.updateXY();

    // 画面外に出たらリセットしたい場合はここで判定
     if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
       this.reset();
     }
  }

  show() {
    ellipse(this.x, this.y, 4, 4);
  }
}
