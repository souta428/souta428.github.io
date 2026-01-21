let mic;
let fft;

function setup() {
  const canvas = createCanvas(800, 800); // キャンバスサイズ
  canvas.parent("sketch");
  noFill();
  strokeWeight(2);

  mic = new p5.AudioIn(); // マイク入力
  mic.start(); // マイクを開始

  fft = new p5.FFT(); // 周波数解析
  fft.setInput(mic); // マイクをFFTの入力に設定
}

function mousePressed() {
  if (getAudioContext().state !== "running") {
    userStartAudio();
    mic.start();
  }
}

function draw() {
  background(30); // 背景色

  let spectrum = fft.analyze(); // 周波数スペクトル

  // 周波数帯域ごとのエネルギーを取得
  let bass = fft.getEnergy('bass');       // ベース音域 (20-140 Hz)
  let lowMid = fft.getEnergy('lowMid');   // 低中音域 (140-400 Hz)
  let mid = fft.getEnergy('mid');         // 中音域 (400-2600 Hz)
  let highMid = fft.getEnergy('highMid'); // 高中音域 (2600-5200 Hz)
  let treble = fft.getEnergy('treble');   // 高音域 (5200-14000 Hz)

  let energies = [bass, lowMid, mid, highMid, treble];
  let colors = [
    color(255, 100, 100, 150), // ベース
    color(100, 255, 100, 150), // 低中音域
    color(100, 100, 255, 150), // 中音域
    color(255, 255, 100, 150), // 高中音域
    color(255, 100, 255, 150)  // 高音域
  ];

  // 各帯域に基づいて波紋を描画
  for (let i = 0; i < energies.length; i++) {
    let energy = energies[i];
    let radius = map(energy, 0, 255, 50, 400); // エネルギーに応じた半径
    stroke(colors[i]);
    ellipse(width / 2, height / 2, radius * 2, radius * 2);
  }

  // 周波数スペクトルに基づく追加波紋
  stroke(200, 150);
  beginShape();
  for (let i = 0; i < spectrum.length; i++) {
    let angle = map(i, 0, spectrum.length, 0, TWO_PI); // 周波数インデックスを角度にマップ
    let amp = spectrum[i]; // 周波数の振幅
    let r = map(amp, 0, 255, 50, 400); // 振幅を半径にマップ
    let x = width / 2 + r * cos(angle);
    let y = height / 2 + r * sin(angle);
    vertex(x, y);
  }
  endShape(CLOSE);
}
