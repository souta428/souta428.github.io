let myHandLandmarker;
let handLandmarks;
let myCapture;
let lastVideoTime = -1;
let doFlipHorizontal = true;
let cameraStarted = false;

// パーティクル配列 & 音オシレーター
let particles = [];
let osc1, osc2, osc3;
const NUM_PARTICLES = 2000; // 常時表示するパーティクル数

// 3D効果用の変数
let rotationAngle = 0;
let depthOffset = 0;

// 指本数の段階を記憶し、切り替わった時にパーティクルをリセット
let currentStage = -1;  // -1: 未定義

// 指先の軌跡を記録する配列
let fingerTrails = [];
const TRAIL_LENGTH = 30; // 軌跡の長さ

async function preload() {
  const mediapipe_module = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js"
  );
  HandLandmarker = mediapipe_module.HandLandmarker;
  FilesetResolver = mediapipe_module.FilesetResolver;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.7/wasm"
  );

  // 両手検出用ハンドランドマーカー
  myHandLandmarker = await HandLandmarker.createFromOptions(vision, {
    numHands: 2,
    runningMode: "VIDEO",
    baseOptions: {
      delegate: "GPU",
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
  });
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight, WEBGL); // WEBGL モードで3D表現可能に
  const target = document.getElementById("sketch") || document.body;
  canvas.parent(target);
  background(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  fill(255);
  text("Starting camera...", 0, 0);

  // 音のセットアップ
  osc1 = new p5.Oscillator("sine");
  osc2 = new p5.Oscillator("triangle");
  osc3 = new p5.Oscillator("square");
  osc1.start();
  osc2.start();
  osc3.start();
  osc1.amp(0);
  osc2.amp(0);
  osc3.amp(0);

  // リバーブ効果を追加
  reverb = new p5.Reverb();
  reverb.process(osc1, 3, 2);
  reverb.process(osc2, 3, 2);
  reverb.process(osc3, 3, 2);

  // パーティクルを生成（常に表示）
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle(random(-width/2, width/2), random(-height/2, height/2), random(-200, 200)));
  }
  
  // 自動的にカメラを開始
  startCamera();
}

function startCamera() {
  if (!cameraStarted) {
    userStartAudio(); // ブラウザの音再生許可
    myCapture = createCapture(VIDEO);
    myCapture.size(windowWidth, windowHeight);
    myCapture.hide();
    predictWebcam();
    cameraStarted = true;
  }
}

// クリックでもカメラを開始できるように残す
function mousePressed() {
  if (!cameraStarted) {
    startCamera();
  }
}

async function predictWebcam() {
  let startTimeMs = performance.now();
  if (lastVideoTime !== myCapture.elt.currentTime) {
    if (myHandLandmarker) {
      const detected = myHandLandmarker.detectForVideo(myCapture.elt, startTimeMs);
      if (detected) {
        handLandmarks = detected;
      }
    }
    lastVideoTime = myCapture.elt.currentTime;
  }
  window.requestAnimationFrame(predictWebcam);
}

function draw() {
  background(0);

  if (!cameraStarted) {
    push();
    fill(255);
    textSize(24);
    text("Starting camera...", 0, 0);
    pop();
    return;
  }

  // 3D効果 - カメラの位置と向きを調整
  let camX = sin(frameCount * 0.01) * 100;
  let camY = cos(frameCount * 0.01) * 100;
  camera(camX, camY, (height / 2) / tan(PI / 6), 0, 0, 0, 0, 1, 0);

  // 現在のステージに応じた背景効果
  drawBackground();
  
  // カメラ映像を3D空間に表示
  drawVideoBackground();
  
  // 指先の軌跡を描画
  drawFingerTrails();
  
  // 手のランドマークを3D表示
  drawHandLandmarks();

  // 両手合わせて最大10本 → 0~10段階
  if (handLandmarks && handLandmarks.landmarks && handLandmarks.landmarks.length > 0) {
    analyzeHandGesture();
    updateFingerTrails(); // 指先の位置を記録
  }

  // 3D回転の更新
  rotationAngle += 0.005;
  depthOffset = sin(frameCount * 0.05) * 50;

  // パーティクルの更新＆描画
  push();
  rotateY(rotationAngle);
  rotateX(rotationAngle * 0.5);
  for (let p of particles) {
    p.update();
    p.show();
  }
  pop();

  // ステージ情報を表示
  displayStageInfo();
}

// 指先の軌跡を更新する関数
function updateFingerTrails() {
  // 現在のフレームの指先の位置を取得
  let currentFingerTips = [];
  
  const nHands = handLandmarks.landmarks.length;
  for (let h = 0; h < nHands; h++) {
    const joints = handLandmarks.landmarks[h];
    // 指先のインデックス: 4, 8, 12, 16, 20
    for (let tipIndex of [4, 8, 12, 16, 20]) {
      if (joints[tipIndex]) {
        const x = map(joints[tipIndex].x, 0, 1, width/2, -width/2);
        const y = map(joints[tipIndex].y, 0, 1, -height/2, height/2);
        const z = joints[tipIndex].z * 500;
        
        currentFingerTips.push({
          pos: createVector(x, y, z),
          color: color(255, 0, 255, 200) // 指先の色
        });
      }
    }
  }
  
  // 軌跡配列に現在の位置を追加
  fingerTrails.push(currentFingerTips);
  
  // 一定の長さを超えたら古いものを削除
  if (fingerTrails.length > TRAIL_LENGTH) {
    fingerTrails.shift();
  }
}

// 指先の軌跡を描画する関数
function drawFingerTrails() {
  if (fingerTrails.length < 2) return;
  
  push();
  noFill();
  strokeWeight(3);
  
  // 全ての記録された指先について
  for (let i = 0; i < fingerTrails.length - 1; i++) {
    const currentFrame = fingerTrails[i];
    const nextFrame = fingerTrails[i+1];
    
    // 透明度を徐々に減少させる（古い軌跡ほど透明に）
    const alpha = map(i, 0, fingerTrails.length - 1, 50, 200);
    
    // 同じインデックスの指先同士を線で結ぶ
    for (let j = 0; j < Math.min(currentFrame.length, nextFrame.length); j++) {
      const current = currentFrame[j];
      const next = nextFrame[j];
      
      if (current && next) {
        // 色を設定（アルファ値を変更）
        const trailColor = color(red(current.color), green(current.color), blue(current.color), alpha);
        stroke(trailColor);
        
        // 線を描画
        line(current.pos.x, current.pos.y, current.pos.z, next.pos.x, next.pos.y, next.pos.z);
      }
    }
  }
  
  pop();
}

function displayStageInfo() {
  push();
  textSize(32);
  fill(255);
  stroke(0);
  strokeWeight(4);
  textAlign(CENTER, CENTER);
  text(`Stage: ${currentStage}`, 0, -height/2 + 50);
  pop();
}

// 現在のステージに応じた背景効果
function drawBackground() {
  push();
  noStroke();
  
  // ステージに応じた背景効果
  if (currentStage >= 0) {
    for (let i = 0; i < 5; i++) {
      let size = map(sin(frameCount * 0.05 + i), -1, 1, width * 0.5, width * 1.5);
      let hue = (currentStage * 36 + frameCount) % 360;
      fill(hue, 80, 50, 10);
      rotateZ(sin(frameCount * 0.001) * 0.1);
      rotateX(cos(frameCount * 0.001) * 0.1);
      sphere(size, 8, 8);
    }
  }
  pop();
}

// 映像を左右反転して3D空間に配置
function drawVideoBackground() {
  push();
  translate(0, 0, -500); // 背景として配置
  
  if (doFlipHorizontal) {
    scale(-1, 1, 1);
  }
  
  texture(myCapture);
  noStroke();
  plane(width, height);
  pop();
}

// 手のランドマーク & 接続線を3D空間に描画
function drawHandLandmarks() {
  if (!(handLandmarks && handLandmarks.landmarks)) return;

  const nHands = handLandmarks.landmarks.length;
  for (let h = 0; h < nHands; h++) {
    const joints = handLandmarks.landmarks[h];

    // ポイント描画
    for (let i = 0; i < joints.length; i++) {
      const x = map(joints[i].x, 0, 1, width/2, -width/2);
      const y = map(joints[i].y, 0, 1, -height/2, height/2);
      const z = joints[i].z * 500; // z座標を強調

      push();
      translate(x, y, z);
      
      // 関節の種類によって色を変える
      if (i === 0) {
        fill(255, 255, 0); // 手首は黄色
        sphere(12);
      } else if (i % 4 === 0) {
        fill(255, 0, 255); // 指先はマゼンタ
        sphere(10);
      } else {
        fill(0, 255, 255); // その他の関節はシアン
        sphere(8);
      }
      
      pop();
    }
    drawConnections(joints);
  }
}

// 指が開いているかを簡易判定 (MCP→TIP)
function isFingerOpen(mcp, tip) {
  // tip.y が mcp.yよりさらに 0.07 小さいと \"開き\"
  return (tip.y < mcp.y - 0.07);
}

// 片手の開いている指を数える
function countOpenFingersOneHand(joints) {
  if (!joints || joints.length < 21) return 0;

  // 親指 (2->4), 人差し指 (5->8), 中指 (9->12), 薬指 (13->16), 小指 (17->20)
  let thumb = isFingerOpen(joints[2], joints[4]);
  let index = isFingerOpen(joints[5], joints[8]);
  let middle = isFingerOpen(joints[9], joints[12]);
  let ring = isFingerOpen(joints[13], joints[16]);
  let pinky = isFingerOpen(joints[17], joints[20]);

  return [thumb, index, middle, ring, pinky].filter(Boolean).length;
}

// 両手の指の合計を 0~10 の段階にしてアニメーションを切り替え (重複なし)
function analyzeHandGesture() {
  const nHands = handLandmarks.landmarks.length;

  let totalOpen = 0; // 0..10
  for (let i = 0; i < nHands; i++) {
    totalOpen += countOpenFingersOneHand(handLandmarks.landmarks[i]);
  }
  totalOpen = constrain(totalOpen, 0, 10);

  // 前回の段階と異なる場合にリセット＆アニメーション呼び出し
  if (totalOpen !== currentStage) {
    resetParticles(); // ★パーティクルを初期状態に戻す
    currentStage = totalOpen; // 更新

    // 10種類のアニメーションが重複しない
    switch (currentStage) {
      case 0:
        convergeParticles();
        updateSound(200, 0.4);
        break;
      case 1:
        swirlParticles();
        updateSound(300, 0.5);
        break;
      case 2:
        waveParticles();
        updateSound(350, 0.6);
        break;
      case 3:
        colorSparkParticles();
        updateSound(400, 0.6);
        break;
      case 4:
        randomDriftParticles();
        updateSound(450, 0.7);
        break;
      case 5:
        scatterParticles();
        updateSound(500, 0.7);
        break;
      case 6:
        revolveParticles();
        updateSound(550, 0.8);
        break;
      case 7:
        bounceParticles();
        updateSound(600, 0.8);
        break;
      case 8:
        vortexParticles();
        updateSound(700, 0.9);
        break;
      case 9:
        fractalParticles();
        updateSound(800, 1.0);
        break;
      case 10:
        fireworksParticles();
        updateSound(1000, 1.0);
        break;
    }
  }
}

// パーティクルの状態を初期化 (位置・速度・色を再生成など)
function resetParticles() {
  particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle(
      random(-width/2, width/2), 
      random(-height/2, height/2),
      random(-200, 200)
    ));
  }
}

function drawConnections(joints) {
  const HAND_CONNECTIONS = [
    { start: 0, end: 1 },  { start: 1, end: 2 },  { start: 2, end: 3 },  { start: 3, end: 4 },
    { start: 0, end: 5 },  { start: 5, end: 6 },  { start: 6, end: 7 },  { start: 7, end: 8 },
    { start: 0, end: 9 },  { start: 9, end: 10 }, { start: 10, end: 11 },{ start: 11, end: 12 },
    { start: 0, end: 13 }, { start: 13, end: 14 },{ start: 14, end: 15 },{ start: 15, end: 16 },
    { start: 0, end: 17 }, { start: 17, end: 18 },{ start: 18, end: 19 },{ start: 19, end: 20 }
  ];
  
  push();
  strokeWeight(4);
  
  for (let conn of HAND_CONNECTIONS) {
    const x0 = map(joints[conn.start].x, 0, 1, width/2, -width/2);
    const y0 = map(joints[conn.start].y, 0, 1, -height/2, height/2);
    const z0 = joints[conn.start].z * 500;
    
    const x1 = map(joints[conn.end].x, 0, 1, width/2, -width/2);
    const y1 = map(joints[conn.end].y, 0, 1, -height/2, height/2);
    const z1 = joints[conn.end].z * 500;
    
    // 指によって線の色を変える
    if (conn.start === 0) {
      // 手首から指の付け根への線
      stroke(0, 255, 0, 200);
    } else {
      // それぞれの指の色を変える
      const colorIndex = Math.floor(conn.start / 4);
      const colors = [
        [255, 0, 0, 200],   // 親指: 赤
        [255, 165, 0, 200], // 人差し指: オレンジ
        [255, 255, 0, 200], // 中指: 黄色
        [0, 255, 0, 200],   // 薬指: 緑
        [0, 0, 255, 200]    // 小指: 青
      ];
      stroke(...colors[colorIndex]);
    }
    
    line(x0, y0, z0, x1, y1, z1);
  }
  pop();
}

// 3Dパーティクルクラス
class Particle {
  constructor(x, y, z) {
    this.pos = createVector(x, y, z);
    this.vel = createVector(random(-2, 2), random(-2, 2), random(-2, 2));
    this.acc = createVector(0, 0, 0);
    this.size = random(3, 12);
    this.color = color(255);
    this.lifespan = 255;
    this.maxSpeed = 5;
    
    // 3D形状のタイプ（より多様なタイプを追加）
    this.shapeType = floor(random(5));
    
    // エフェクト用
    this.rotX = random(TWO_PI);
    this.rotY = random(TWO_PI);
    this.rotZ = random(TWO_PI);
    this.rotSpeed = random(0.01, 0.05);
    
    // 特殊効果用パラメータ
    this.uniqueValue = random(100);
    this.pulseRate = random(0.02, 0.1);
    this.pulsePhase = random(TWO_PI);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 回転を更新
    this.rotX += this.rotSpeed;
    this.rotY += this.rotSpeed * 0.8;
    this.rotZ += this.rotSpeed * 0.6;
    
    // サイズを脈動させる
    this.pulseFactor = sin(frameCount * this.pulseRate + this.pulsePhase) * 0.3 + 1;
    
    // 画面外で跳ね返る
    if (this.pos.x < -width/2 || this.pos.x > width/2) this.vel.x *= -1;
    if (this.pos.y < -height/2 || this.pos.y > height/2) this.vel.y *= -1;
    if (this.pos.z < -500 || this.pos.z > 500) this.vel.z *= -1;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateX(this.rotX);
    rotateY(this.rotY);
    rotateZ(this.rotZ);
    
    noStroke();
    fill(this.color);
    
    // さらに多様な3D形状を使用
    const effectiveSize = this.size * this.pulseFactor;
    
    switch(this.shapeType) {
      case 0:
        sphere(effectiveSize);
        break;
      case 1:
        box(effectiveSize);
        break;
      case 2:
        torus(effectiveSize, effectiveSize/3);
        break;
      case 3:
        // 円錐形
        cone(effectiveSize * 0.8, effectiveSize * 1.5);
        break;
      case 4:
        // 円柱形
        cylinder(effectiveSize * 0.6, effectiveSize * 1.2);
        break;
    }
    
    pop();
  }

  // 中央に集まる
  convergeToCenter() {
    let center = createVector(0, 0, 0);
    let force = p5.Vector.sub(center, this.pos);
    force.setMag(10.3);
    this.applyForce(force);
    this.color = color(50, 50, 255, 200); // 青色
    
    // 変形効果を追加
    this.shapeType = this.pos.x > 0 ? 0 : 1; // 位置によって形を変える
  }

  // ランダムに散らばる
  scatter() {
    let randomForce = createVector(random(-1, 1), random(-1, 1), random(-1, 1));
    randomForce.mult(20);
    this.applyForce(randomForce);
    this.color = color(255, 50, 50, 200); // 赤色
    this.maxSpeed = 10;
    
    // 位置によってサイズを変える
    this.size = map(abs(this.pos.x + this.pos.y), 0, width, 3, 20);
  }

  // 渦を巻く
  swirl() {
    let center = createVector(0, 0, 0);
    let direction = p5.Vector.sub(center, this.pos);
    let distance = direction.mag();
    direction.normalize();
    
    // 接線方向の力を加える
    let tangent = createVector(-direction.y, direction.x, direction.z);
    tangent.mult(10.5);
    this.applyForce(tangent);
    
    // 少しだけ中心に引き寄せる
    direction.mult(0.1);
    this.applyForce(direction);
    
    // 高さによって色が変わる螺旋効果
    let hue = map(this.pos.z, -300, 300, 180, 300);
    this.color = color(hue, 200, 255, 200);
    
    // 回転速度を距離に応じて変化
    this.rotSpeed = map(distance, 0, 500, 0.01, 0.1);
  }

  // 波のように動く
  wave() {
    // より複雑な波動パターン
    let xFreq = frameCount * 0.05 + this.pos.x * 0.01;
    let zFreq = frameCount * 0.03 + this.pos.z * 0.02;
    let force = createVector(
      sin(xFreq) * 20.2,
      sin(xFreq + zFreq) *30.3,
      cos(zFreq) * 20.2
    );
    this.applyForce(force);
    
    // 波の位置に応じた色変化
    let hue = map(sin(xFreq + this.pos.y * 0.01), -1, 1, 170, 270);
    let saturation = map(cos(zFreq), -1, 1, 150, 255);
    this.color = color(hue, saturation, 255, 200);
    
    // 波の動きに合わせて形状が変化
    this.shapeType = floor(map(sin(xFreq * 0.5), -1, 1, 0, 5));
  }

  // 色が変わりながら飛び散る
  colorSpark() {
    // より洗練された色の変化
    let t = frameCount * 0.01 + this.uniqueValue;
    let r = 128 + 127 * sin(t);
    let g = 128 + 127 * sin(t + PI/3);
    let b = 128 + 127 * sin(t + 2*PI/3);
    this.color = color(r, g, b, 200);
    
    // ランダムなバースト効果
    if (random() < 0.05) {
      let spark = p5.Vector.random3D();
      spark.mult(random(1, 5));
      this.applyForce(spark);
    }
    
    // サイズと形状もランダムに変化
    if (random() < 0.02) {
      this.size = random(3, 18);
      this.shapeType = floor(random(5));
    }
  }

  // ランダムな動き
  randomDrift() {
    // ノイズベースの自然な動き
    let noiseX = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01);
    let noiseY = noise(this.pos.y * 0.01, this.pos.z * 0.01, frameCount * 0.01 + 100);
    let noiseZ = noise(this.pos.z * 0.01, this.pos.x * 0.01, frameCount * 0.01 + 200);
    
    let drift = createVector(
      map(noiseX, 0, 1, -1, 1),
      map(noiseY, 0, 1, -1, 1),
      map(noiseZ, 0, 1, -1, 1)
    );
    drift.mult(10.7);
    this.applyForce(drift);
    
    // 虹色にゆっくり変化 + 明るさも変化
    let hue = (frameCount * 0.5 + this.uniqueValue) % 360;
    let brightness = map(noiseX * noiseY, 0, 1, 150, 255);
    this.color = color(hue, 230, brightness, 200);
    
    // ノイズ値に応じてサイズ変更
    this.size = map(noiseZ, 0, 1, 3, 15);
  }

  // 回転
  revolve() {
    let center = createVector(0, 0, 0);
    let direction = p5.Vector.sub(center, this.pos);
    let distance = direction.mag();
    
    // 軌道回転に垂直な力を加える
    let angle = atan2(this.pos.y, this.pos.x) + PI/2; // 接線方向
    let orbitForce = createVector(cos(angle), sin(angle), 0);
    
    // 中心からの距離に応じて回転速度を変える
    let orbitStrength = map(distance, 0, 500, 1.5, 0.5);
    orbitForce.mult(orbitStrength);
    this.applyForce(orbitForce);
    
    // Z軸方向にも周期的な力を加えて螺旋状に
    let zForce = sin(frameCount * 0.05 + this.uniqueValue) * 10.2;
    this.applyForce(createVector(0, 0, zForce));
    
    // 軌道に応じた色の変化
    let orbitPhase = (angle + frameCount * 0.01) % TWO_PI;
    let hue = map(orbitPhase, 0, TWO_PI, 0, 360);
    this.color = color(hue, 255, 255, 200);
    
    // 距離に応じて形状も変える
    this.shapeType = floor(map(distance, 0, 500, 0, 5));
  }

  // バウンド
  bounce() {
    // より複雑なバウンス効果
    this.vel.y *= -1.1 - random(0.2);
    this.vel.x *= 1.1 + random(0.1);
    this.vel.z *= 1.1 + random(0.1);
    
    // ランダムな回転も追加
    this.rotSpeed *= 1.5;
    
    // 速度に応じた色 + ランダム要素
    let speed = this.vel.mag();
    let hue = map(speed, 0, this.maxSpeed * 1.5, 0, 60) + random(-20, 20);
    let brightness = map(speed, 0, this.maxSpeed, 100, 255);
    this.color = color(hue, 255, brightness, 200);
    
    // たまに形状を変える
    if (random() < 0.1) {
      this.shapeType = floor(random(5));
    }
  }

  // 渦
  // vortex関数の続き
  vortex() {
    let center = createVector(0, 0, 0);
    let direction = p5.Vector.sub(center, this.pos);
    let distance = direction.mag();
    
    // より複雑な渦効果
    // 距離に応じた力の適用
    let vortexStrength = map(distance, 0, 500, 0.01, 0.2);
    
    // 渦を形成する複雑な力
    let angle = atan2(this.pos.y, this.pos.x) + sin(frameCount * 0.03 + this.uniqueValue);
    let vortexForce = createVector(
      cos(angle) * vortexStrength,
      sin(angle) * vortexStrength,
      (sin(frameCount * 0.05 + distance * 0.01) * 0.1)
    );
    
    // 少しだけ中心に引き寄せる
    direction.normalize();
    direction.mult(0.4);
    this.applyForce(direction);
    
    // 渦の力を適用
    this.applyForce(vortexForce);
    
    // 螺旋状の動きに合わせた色
    let hue = map(distance, 0, 500, 180, 360) + frameCount * 0.2;
    hue = hue % 360;
    let sat = map(sin(frameCount * 0.02 + this.uniqueValue), -1, 1, 150, 255);
    this.color = color(hue, sat, 255, 150);
    
    // 回転速度を増加
    this.rotSpeed = map(distance, 0, 500, 0.05, 0.15);
    
    // Z位置に応じて形状を変更
    this.shapeType = floor(map(this.pos.z, -500, 500, 0, 5));
  }

  // フラクタル的な動き
  fractal() {
    // フラクタル的な自己相似パターン
    let scale = 0.005;
    let t = frameCount * 0.01;
    
    // フラクタル的なノイズベースの動き
    let noiseX = noise(this.pos.x * scale, this.pos.y * scale, t);
    let noiseY = noise(this.pos.y * scale, this.pos.z * scale, t + 10);
    let noiseZ = noise(this.pos.z * scale, this.pos.x * scale, t + 20);
    
    // 前方へのドリフト + ノイズ
    let force = createVector(
      map(noiseX, 0, 1, -1, 1) * 0.5,
      map(noiseY, 0, 1, -1, 1) * 0.5,
      map(noiseZ, 0, 1, -1, 1) * 0.5
    );
    
    // 中心からの距離に応じた引力/斥力
    let center = createVector(0, 0, 0);
    let toCenter = p5.Vector.sub(center, this.pos);
    let dist = toCenter.mag();
    
    // 一定の距離で引力が反転
    let centerForce = 0;
    if (dist < 200) {
      centerForce = -0.02; // 近くでは離れる
    } else {
      centerForce = 0.02;  // 遠くでは近づく
    }
    
    toCenter.normalize();
    toCenter.mult(centerForce);
    force.add(toCenter);
    
    this.applyForce(force);
    
    // 位置に応じた色
    let hue = map(noise(this.pos.x * 0.01, this.pos.y * 0.01, t), 0, 1, 0, 360);
    let sat = map(noise(this.pos.y * 0.01, this.pos.z * 0.01, t), 0, 1, 150, 255);
    let bri = map(noise(this.pos.z * 0.01, this.pos.x * 0.01, t), 0, 1, 150, 255);
    this.color = color(hue, sat, bri, 200);
    
    // ノイズ値に基づいて形状を変更
    if (random() < 0.02) {
      this.shapeType = floor(random(5));
    }
  }

  // 花火のような効果
  fireworks() {
    // 中央に向かう力
    let center = createVector(0, 0, 0);
    let toCenter = p5.Vector.sub(center, this.pos);
    let dist = toCenter.mag();
    
    // まず中央に向かって集まり、ある程度近づいたら爆発
    if (dist > 100) {
      toCenter.normalize();
      toCenter.mult(0.2);
      this.applyForce(toCenter);
      
      // 中央に向かう時は赤っぽい色
      this.color = color(10, 255, 255, 200);
    } else {
      // 爆発効果
      let explosion = p5.Vector.random3D();
      explosion.mult(random(0.5, 2.0));
      this.applyForce(explosion);
      
      // 爆発後はランダムな色に
      let hue = random(360);
      this.color = color(hue, 255, 255, 200);
      
      // サイズも変化させる
      this.size = random(3, 15);
    }
    
    // 重力効果
    let gravity = createVector(0, 0.05, 0);
    this.applyForce(gravity);
    
    // たまに形状を変える
    if (random() < 0.05) {
      this.shapeType = floor(random(5));
    }
    
    // 回転速度上昇
    this.rotSpeed = random(0.05, 0.2);
  }
}

// パーティクルの挙動を一斉に変更させる関数群

// 中央に集まる
function convergeParticles() {
  for (let p of particles) {
    p.maxSpeed = 3;
  }
}

// 渦を巻く
function swirlParticles() {
  for (let p of particles) {
    p.maxSpeed = 3;
    p.swirl();
  }
}

// 波のように動く
function waveParticles() {
  for (let p of particles) {
    p.maxSpeed = 400;
    p.wave();
  }
}

// 色が変わりながら飛び散る
function colorSparkParticles() {
  for (let p of particles) {
    p.maxSpeed = 5;
    p.colorSpark();
  }
}

// ランダムな動き
function randomDriftParticles() {
  for (let p of particles) {
    p.maxSpeed = 4;
    p.randomDrift();
  }
}

// ランダムに散らばる
function scatterParticles() {
  for (let p of particles) {
    p.maxSpeed = 8;
    p.scatter();
  }
}

// 回転
function revolveParticles() {
  for (let p of particles) {
    p.maxSpeed = 600;
    p.revolve();
  }
}

// バウンド
function bounceParticles() {
  for (let p of particles) {
    p.maxSpeed = 100;
    p.bounce();
  }
}

// 渦
function vortexParticles() {
  for (let p of particles) {
    p.maxSpeed = 700;
    p.vortex();
  }
}

// フラクタル的な動き
function fractalParticles() {
  for (let p of particles) {
    p.maxSpeed = 500;
    p.fractal();
  }
}

// 花火のような効果
function fireworksParticles() {
  for (let p of particles) {
    p.maxSpeed = 80;
    p.fireworks();
  }
}

// サウンドの更新
function updateSound(baseFreq, ampValue) {
  // 3種類のオシレーターに異なる周波数を設定
  osc1.freq(baseFreq);
  osc2.freq(baseFreq * 1.5);
  osc3.freq(baseFreq * 2);
  
  // 音量を設定（フェードイン）
  osc1.amp(ampValue * 0.3, 0.3);
  osc2.amp(ampValue * 0.2, 0.3);
  osc3.amp(ampValue * 0.1, 0.3);
  
  // しばらくしたら音量を下げる（フェードアウト）
  setTimeout(() => {
    osc1.amp(0, 12);
    osc2.amp(0, 12);
    osc3.amp(0, 12);
  }, 5000);
}

// ウィンドウサイズが変更されたときに再調整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (myCapture) {
    myCapture.size(windowWidth, windowHeight);
  }
}
