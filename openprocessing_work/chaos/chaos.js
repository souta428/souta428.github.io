// ====================================================
// p5.js (JavaScript) での Lorenz Attractor 可視化サンプル
// OpenProcessing などでそのまま動かせます
// ====================================================

let sigma = 10;
let rho = 28;
let beta = 8 / 3;
let dt = 0.011; // 時間刻み

const NUM_PARTICLES = 4000;    // パーティクルの数
let particles = [];

function setup() {
  const canvas = createCanvas(1000, 1000, WEBGL);
  const target = document.getElementById("sketch") || document.body;
  canvas.parent(target);
  colorMode(HSB, 360, 100, 100, 100);
  
  // 複数のパーティクルを初期化
  for (let i = 0; i < NUM_PARTICLES; i++) {
    // 位置をランダムまたは微小な乱数を入れて初期化
    let x = random(-1, 1);
    let y = random(-1, 1);
    let z = random(-1, 1);
    
    // 色相をランダムにする
    let hue = random(360);
    
    particles.push({
      x: x,
      y: y,
      z: z,
      hue: hue
    });
  }
}

function draw() {
  background(0);
  
  // 3D シーンを回転させる
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  
  // 軸が小さいと見づらいのでスケールを拡大
  scale(8);
  
  // パーティクルを更新し描画
  for (let p of particles) {
    // ローレンツ方程式で位置を更新 (オイラー法)
    let dx = sigma * (p.y - p.x);
    let dy = p.x * (rho - p.z) - p.y;
    let dz = p.x * p.y - beta * p.z;
    
    p.x += dx * dt;
    p.y += dy * dt;
    p.z += dz * dt;
    
    // パーティクル描画
    stroke(p.hue, 100, 100);
    strokeWeight(3);
    point(p.x, p.y, p.z);
  }
}
