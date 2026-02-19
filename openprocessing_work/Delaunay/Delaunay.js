let nodes = [];
let numNodes = 700;
let delaunay;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  const target = document.getElementById("sketch") || document.body;
  canvas.parent(target);
  background(0);
  for (let i = 0; i < numNodes; i++) {
    nodes.push(new Node(random(-width / 2, width / 2), random(-height / 2, height / 2), random(-200, 200)));
  }
  delaunay = new DelaunayTriangulation(nodes);
}

function draw() {
  background(0);
  rotateY(frameCount * 0.01);
  delaunay.update();
  delaunay.show();
  for (let node of nodes) {
    node.update();
    node.show();
  }
}

class Node {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.vz = random(-1, 1);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vx *= 0.9;
    this.vy *= 0.9;
    this.vz *= 0.9;
    
    if (this.x < -width / 2 || this.x > width / 2 || this.y < -height / 2 || this.y > height / 2 || this.z < -200 || this.z > 200) {
      this.respawn();
    }
  }
  
  respawn() {
    this.x = random(-width / 2, width / 2);
    this.y = random(-height / 2, height / 2);
    this.z = random(-200, 200);
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.vz = random(-1, 1);
  }
  
  show() {
    push();
    translate(this.x, this.y, this.z);
    fill(255);
    noStroke();
    sphere(4);
    pop();
  }
}

class DelaunayTriangulation {
  constructor(nodes) {
    this.nodes = nodes;
  }
  
  update() {
    let points = this.nodes.map(n => [n.x, n.y, n.z]);
    this.triangles = Delaunator.from(points.map(p => [p[0], p[1]])).triangles;
  }
  
  show() {
    stroke(255, 100);
    noFill();
    for (let i = 0; i < this.triangles.length; i += 3) {
      let p1 = this.nodes[this.triangles[i]];
      let p2 = this.nodes[this.triangles[i + 1]];
      let p3 = this.nodes[this.triangles[i + 2]];
      beginShape();
      vertex(p1.x, p1.y, p1.z);
      vertex(p2.x, p2.y, p2.z);
      vertex(p3.x, p3.y, p3.z);
      endShape(CLOSE);
    }
  }
}
