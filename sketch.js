// function preload() {
//   VCR_OSD_MONO = loadFont("/fonts/VCR_OSD.ttf");
//   aktivBD = loadFont("/fonts/aktivBD.ttf");
// }

let kdTree;
let debugMode = false;
let lineShow = true;
let colorShow = false;
const depth = 13;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // textFont(VCR_OSD_MONO);
  textAlign(CENTER, CENTER);

  kdTree = new KDTree();
  kdTree.buildCompleteTree(depth);
}

function draw() {
  background(255);
  kdTree.display();
  // kdTree.root.right.aPos.set(mouseX, mouseY);
}

function mousePressed() {
  kdTree.insert(createVector(mouseX, mouseY));
}

function keyPressed() {
  if (keyCode === 67) {
    colorShow = !colorShow;
  }
  if (keyCode === 68) {
    debugMode = !debugMode;
  }
  if (keyCode === 76) {
    lineShow = !lineShow;
  }

  if (keyCode === 48) {
    kdTree.traverseAllNodes(kdTree.root, (node) => {
      node.targetPercentage.set(0.5, 0.5);
      node.ease.update(node.targetPercentage);
    });
  }

  if (keyCode === 32) {
    kdTree.traverseAllNodes(kdTree.root, (node) => {
      const randomX = random(1);
      const randomY = random(1);
      node.axis === 0
        ? node.targetPercentage.set(randomX, node.percentage.y)
        : node.targetPercentage.set(node.percentage.x, randomY);
      node.ease.update(node.targetPercentage);
    });
  }
}

class Node {
  constructor(
    x,
    y,
    axis,
    minX = 0,
    maxX = width,
    minY = 0,
    maxY = height,
    depth
  ) {
    this.axis = axis;
    this.depth = depth;
    this.percentage = createVector(
      (x - minX) / (maxX - minX),
      (y - minY) / (maxY - minY)
    );
    this.aPercentage = createVector(
      (x - minX) / (maxX - minX),
      (y - minY) / (maxY - minY)
    );
    this.bPercentage = createVector(
      (x - minX) / (maxX - minX),
      (y - minY) / (maxY - minY)
    );
    this.left = null;
    this.right = null;

    this.padding = 0;

    this.minPos = createVector(minX + this.padding, minY + this.padding);
    this.maxPos = createVector(maxX - this.padding, maxY - this.padding);
    this.aPos = new p5.Vector(x, y);
    this.bPos = new p5.Vector(x, y);
    this.aVel = new p5.Vector(0, 0);
    this.bVel = new p5.Vector(0, 0);
    this.aAcc = new p5.Vector(0, 0);
    this.bAcc = new p5.Vector(0, 0);
    this.randomDecay = random(0.82, 0.85);
    this.randomElasticity = random(0.05, 0.1);
    // if (this.axis === 0) {
    //   this.aPos = createVector(x, this.minPos.y);
    //   this.bPos = createVector(x, this.maxPos.y);
    // } else {
    //   this.aPos = createVector(this.minPos.x, y);
    //   this.bPos = createVector(this.maxPos.x, y);
    // }

    this.colAlpha = 0;
    this.colLeft = color(random(255));
    this.colRight = color(random(255));

    this.targetPercentage = createVector(this.percentage.x, this.percentage.y);
    this.aTarget = createVector(this.aPos.x, this.aPos.y);
    this.bTarget = createVector(this.bPos.x, this.bPos.y);
    this.ease = new EaseVec2(this.percentage, this.targetPercentage);
    // this.easeA = new EaseVec2_(this.aPos, this.aTarget);
    // this.easeB = new EaseVec2_(this.bPos, this.bTarget);
    this.updatePos();
  }

  updatePos() {
    this.ease.easeVec2(0.7);
    // this.easeA.easeVec2(1);
    // this.easeB.easeVec2(1);

    this.pos = createVector(
      this.minPos.x + this.percentage.x * (this.maxPos.x - this.minPos.x),
      this.minPos.y + this.percentage.y * (this.maxPos.y - this.minPos.y)
    );

    if (this.axis === 0) {
      // this.aPos.set(this.pos.x, this.minPos.y);
      // this.bPos.set(this.pos.x, this.maxPos.y);
      this.aTarget.set(this.pos.x, this.minPos.y);
      this.bTarget.set(this.pos.x, this.maxPos.y);
    } else {
      // this.aPos.set(this.minPos.x, this.pos.y);
      // this.bPos.set(this.maxPos.x, this.pos.y);
      this.aTarget.set(this.minPos.x, this.pos.y);
      this.bTarget.set(this.maxPos.x, this.pos.y);
    }

    this.aAcc = p5.Vector.sub(this.aTarget, this.aPos).mult(
      this.randomElasticity
    );
    this.bAcc = p5.Vector.sub(this.bTarget, this.bPos).mult(
      this.randomElasticity
    );
    this.aVel.add(this.aAcc);
    this.bVel.add(this.bAcc);
    this.aVel.mult(this.randomDecay);
    this.bVel.mult(this.randomDecay);
    this.aPos.add(this.aVel);
    this.bPos.add(this.bVel);
    this.aAcc.mult(0);
    this.bAcc.mult(0);

    this.updateBounds(
      this.minPos.x,
      this.maxPos.x,
      this.minPos.y,
      this.maxPos.y
    );
  }

  updateBounds(minX, maxX, minY, maxY) {
    this.minPos.set(minX, minY);
    this.maxPos.set(maxX, maxY);

    if (this.left) {
      this.left.updateBounds(
        minX,
        this.axis === 0 ? this.pos.x : maxX,
        minY,
        this.axis === 1 ? this.pos.y : maxY
      );
    }
    if (this.right) {
      this.right.updateBounds(
        this.axis === 0 ? this.pos.x : minX,
        maxX,
        this.axis === 1 ? this.pos.y : minY,
        maxY
      );
    }
  }

  displayVertices() {
    // if (this.depth === depth - 1) {
    noFill();
    if (!this.right && !this.left) {
      line(this.aPos.x, this.aPos.y, this.bPos.x, this.bPos.y);
      if (this.axis === 0) {
        beginShape();
        vertex(this.aPos.x, this.aPos.y);
        vertex(this.minPos.x, this.minPos.y);
        vertex(this.minPos.x, this.maxPos.y);
        vertex(this.bPos.x, this.bPos.y);
        // vertex(this.aPos.x, this.aPos.y);
        vertex(this.maxPos.x, this.maxPos.y);
        vertex(this.maxPos.x, this.minPos.y);
        vertex(this.aPos.x, this.aPos.y);
        endShape();
      } else {
        beginShape();
        vertex(this.aPos.x, this.aPos.y);
        vertex(this.minPos.x, this.minPos.y);
        vertex(this.maxPos.x, this.minPos.y);
        vertex(this.bPos.x, this.bPos.y);
        // vertex(this.aPos.x, this.aPos.y);
        vertex(this.maxPos.x, this.maxPos.y);
        vertex(this.minPos.x, this.maxPos.y);
        vertex(this.aPos.x, this.aPos.y);
        endShape();
      }
      // }
    } else if (this.right && !this.left) {
      //
      // beginShape();
      // if (this.axis === 0) {
      //   vertex(this.aPos.x, this.aPos.y);
      //   vertex(this.minPos.x, this.minPos.y);
      //   vertex(this.minPos.x, this.maxPos.y);
      //   vertex(this.bPos.x, this.bPos.y);
      // } else {
      //   vertex(this.aPos.x, this.aPos.y);
      //   vertex(this.minPos.x, this.minPos.y);
      //   vertex(this.maxPos.x, this.minPos.y);
      //   vertex(this.bPos.x, this.bPos.y);
      // }
      // endShape();
    } else if (this.left && !this.right) {
      //
      // beginShape();
      // if (this.axis === 0) {
      //   vertex(this.aPos.x, this.aPos.y);
      //   vertex(this.maxPos.x, this.minPos.y);
      //   vertex(this.maxPos.x, this.maxPos.y);
      //   vertex(this.bPos.x, this.bPos.y);
      // } else {
      //   vertex(this.aPos.x, this.aPos.y);
      //   vertex(this.minPos.x, this.maxPos.y);
      //   vertex(this.maxPos.x, this.maxPos.y);
      //   vertex(this.bPos.x, this.bPos.y);
      // }
      // endShape();
    } else if (this.left && this.right) {
      //
    }

    if (this.left) {
      this.left.displayVertices();
    }
    if (this.right) {
      this.right.displayVertices();
    }
  }

  display() {
    this.updatePos();

    if (lineShow) {
      // stroke(255, 0, 255);
      stroke(0);
      strokeWeight(3);
    } else {
      noStroke();
    }

    // line(this.aPos.x, this.aPos.y, this.bPos.x, this.bPos.y);
    // ellipse(this.aPos.x, this.aPos.y, 10);
    // ellipse(this.bPos.x, this.bPos.y, 10);

    if (debugMode) {
      fill(0);
      noStroke();
      // ellipse(this.pos.x, this.pos.y, 5);
      // ellipse(this.aPos.x, this.aPos.y, 5);
      // ellipse(this.bPos.x, this.bPos.y, 5);
    }

    if (this.left) {
      this.left.display();
    }
    if (this.right) {
      this.right.display();
    }
  }
}

class KDTree {
  constructor() {
    this.root = null;
  }

  buildCompleteTree(depth) {
    this.root = this.buildRecursive(depth, 0, 0, width, 0, height, null);
  }

  buildRecursive(depth, currentDepth, minX, maxX, minY, maxY, parent) {
    if (currentDepth >= depth) {
      return null;
    }

    const axis = currentDepth % 2;
    const x = (minX + maxX) / 2;
    const y = (minY + maxY) / 2;

    const node = new Node(
      x,
      y,
      axis,
      minX,
      maxX,
      minY,
      maxY,
      currentDepth,
      parent
    );
    node.left = this.buildRecursive(
      depth,
      currentDepth + 1,
      minX,
      axis === 0 ? x : maxX,
      minY,
      axis === 1 ? y : maxY,
      node
    );
    node.right = this.buildRecursive(
      depth,
      currentDepth + 1,
      axis === 0 ? x : minX,
      maxX,
      axis === 1 ? y : minY,
      maxY,
      node
    );

    return node;
  }

  insert(
    pos,
    depth = 0,
    minX = 0,
    maxX = width,
    minY = 0,
    maxY = height,
    parent = null
  ) {
    const axis = depth % 2; // 0 : x, 1 : y
    this.root = this.recursiveInsert(
      this.root,
      pos,
      axis,
      minX,
      maxX,
      minY,
      maxY,
      depth,
      parent
    );
  }

  recursiveInsert(node, pos, axis, minX, maxX, minY, maxY, depth, parent) {
    if (!node) {
      return new Node(
        pos.x,
        pos.y,
        axis,
        minX,
        maxX,
        minY,
        maxY,
        depth,
        parent
      );
    }

    const currentAxis = node.axis;
    const posKey = axis === 0 ? pos.x : pos.y;
    const nodeKey = axis === 0 ? node.pos.x : node.pos.y;

    if (posKey < nodeKey) {
      if (axis === 0) {
        node.left = this.recursiveInsert(
          node.left,
          pos,
          (currentAxis + 1) % 2,
          minX,
          node.pos.x,
          minY,
          maxY,
          depth + 1,
          node
        );
      } else {
        node.left = this.recursiveInsert(
          node.left,
          pos,
          (currentAxis + 1) % 2,
          minX,
          maxX,
          minY,
          node.pos.y,
          depth + 1,
          node
        );
      }
    } else {
      if (axis === 0) {
        node.right = this.recursiveInsert(
          node.right,
          pos,
          (currentAxis + 1) % 2,
          node.pos.x,
          maxX,
          minY,
          maxY,
          depth + 1,
          node
        );
      } else {
        node.right = this.recursiveInsert(
          node.right,
          pos,
          (currentAxis + 1) % 2,
          minX,
          maxX,
          node.pos.y,
          maxY,
          depth + 1,
          node
        );
      }
    }

    return node;
  }

  traverseAllNodes(node, action) {
    if (node) {
      this.traverseAllNodes(node.left, action);
      action(node);
      this.traverseAllNodes(node.right, action);
    }
  }

  display() {
    if (this.root) {
      this.root.display();
      this.root.displayVertices();
    }
  }
}
