import fs from 'fs';

// 1. FILL THIS ARRAY WITH YOUR POINTS
// game - player's in-game coordinates (Player::Position)
// image - map click coordinates from console (via logImagePxAt)
const userPoints = [
  {
    name: "Example: bridge near Whiterun",
    game: { x: 35953.765625, y: -17015.822265625 }, // Replace with actual values
    image: { x: 9148.73, y: 8574.90 }     // Replace with actual values
  },
  {
    name: "Example: Winterhold crossroad",
    game: {
      "x": 135118.578125,
      "y": 24003.27734375
    },
    image: { x: 12294.67, y: 7265.01 }
  },
  {
    name: "Example: Solitude",
    game: {
      "x": -73601.828125,
      "y": 99793.796875,
    },
    image: { x: 5678.47, y: 4874.01 }
  },
  {
    name: "Example: Helgen",
    game: {
      "x": 21598.603515625,
      "y": -79461.5703125,
    },
    image: { x: 8674.54, y: 10561.52 }
  },
  {
    name: "Example: Falkreath",
    game: {
      "x": -35937.32421875,
      "y": -91640.890625,
    },
    image: { x: 6868.88, y: 10937.46 }
  },
  {
    name: "Example: Morthal",
    game: {
      "x": -34417.1171875,
      "y": 57495.39453125,
    },
    image: { x: 6913.54, y: 6211.00 }
  },
  {
    name: "Example: Markarth",
    game: {
      "x": -165146.9375,
      "y": 3783.79052734375,
    },
    image: { x: 2892.84, y: 7931.24 }
  },
  {
    name: "Example: Riften",
    game: {
      "x": 159862.953125,
      "y": -106736.1328125,
    },
    image: { x: 13084.15, y: 11421.51 }
  }
  // ADD 3-4 MORE POINTS (5-8 POINTS TOTAL, EVENLY SPREAD ACROSS THE MAP)
];

// --- Calculation logic below ---

const projection = JSON.parse(fs.readFileSync('./src/pages/map/data/tamrielProjection.json', 'utf8'));

// Convert game coordinates to "raw" FWMF projection coordinates (before correction)
function getRawFwmf(p) {
  const b = projection.bounds;
  const u = (p.x - b.minX) / (b.maxX - b.minX);
  const v = (b.maxY - p.y) / (b.maxY - b.minY);
  return {
    x: u * projection.imageWidth,
    y: v * projection.imageHeight
  };
}

// Matrix solver
function solve(A, b) {
  const n = b.length;
  const aug = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(aug[r][c]) > Math.abs(aug[p][c])) p = r;
    [aug[c], aug[p]] = [aug[p], aug[c]];
    const d = aug[c][c];
    if (Math.abs(d) < 1e-12) return Array(n).fill(NaN);
    for (let j = c; j <= n; j++) aug[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = aug[r][c];
      for (let j = c; j <= n; j++) aug[r][j] -= f * aug[c][j];
    }
  }
  return aug.map(r => r[n]);
}

function ls(X, y) {
  const m = X[0].length;
  const N = Array.from({ length: m }, () => Array(m).fill(0));
  const rhs = Array(m).fill(0);
  X.forEach((row, i) => {
    for (let a = 0; a < m; a++) {
      rhs[a] += row[a] * y[i];
      for (let b = 0; b < m; b++) N[a][b] += row[a] * row[b];
    }
  });
  return solve(N, rhs);
}

if (userPoints.length < 3) {
  console.error("Need at least 3 points for calculation!");
  process.exit(1);
}

const X = userPoints.map(pt => {
  const raw = getRawFwmf(pt.game);
  return [raw.x, raw.y, 1];
});
const fx = ls(X, userPoints.map(pt => pt.image.x));
const fy = ls(X, userPoints.map(pt => pt.image.y));

const M = {
  a: fx[0], c: fx[1], e: fx[2],
  b: fy[0], d: fy[1], f: fy[2]
};

console.log("New IMAGE_CORRECTION object:\n");
console.log(JSON.stringify(M, null, 2));
console.log("\nCopy this object into useMapProjection.ts");
