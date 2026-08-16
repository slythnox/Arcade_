# Engine Mathematics & Geometric Reference

This reference documents the mathematical foundations, formal derivations, coordinate systems, and collision geometry implemented across the **ARCADE_** core library (`core/math/`).

---

## 1. 2D Vector Kinematics (`core/math/vector.ts`)

The `Vector2` class represents 2D Cartesian vectors $(x, y)$ used throughout physics simulation, AI steering, and projectile trajectories.

### Magnitude & Squared Magnitude
$$\|\mathbf{v}\| = \sqrt{x^2 + y^2}, \quad \|\mathbf{v}\|^2 = x^2 + y^2$$
*Optimization:* Where possible (e.g. radius proximity checks), `sqrMagnitude()` and `sqrDistance()` are used to avoid the computationally expensive square root calculation.

### Normalization
$$\hat{\mathbf{v}} = \begin{cases} \frac{\mathbf{v}}{\|\mathbf{v}\|} & \text{if } \|\mathbf{v}\| > 0 \\ \mathbf{0} & \text{otherwise} \end{cases}$$

### Dot Product
$$\mathbf{a} \cdot \mathbf{b} = a_x b_x + a_y b_y = \|\mathbf{a}\| \|\mathbf{b}\| \cos \theta$$
Used for projecting vectors, testing field-of-view, and measuring alignment between entities.

### 2D Scalar Cross Product
$$\mathbf{a} \times \mathbf{b} = a_x b_y - a_y b_x$$
The sign indicates the orientation of $\mathbf{b}$ relative to $\mathbf{a}$:
- $> 0$: $\mathbf{b}$ is counter-clockwise from $\mathbf{a}$
- $< 0$: $\mathbf{b}$ is clockwise from $\mathbf{a}$
- $= 0$: $\mathbf{a}$ and $\mathbf{b}$ are collinear

### Vector Reflection off Surface Normal
$$\mathbf{R} = \mathbf{V} - 2(\mathbf{V} \cdot \hat{\mathbf{N}})\hat{\mathbf{N}}$$

```typescript
public reflect(normal: Vector2): Vector2 {
  const n = normal.normalize();
  const d = this.dot(n);
  return this.sub(n.scale(2 * d));
}
```
*Applied in:* `Breakout` (brick rebounds), `Pong` (wall bouncing), `Ricochet` (laser reflection).

### Vector Projection
$$\operatorname{proj}_{\mathbf{u}}(\mathbf{v}) = \frac{\mathbf{v} \cdot \mathbf{u}}{\|\mathbf{u}\|^2} \mathbf{u}$$

### Perpendicular Vector (90° CCW Rotation)
$$\mathbf{v}^{\perp} = (-y, x)$$

### Rotation by Angle $\theta$
$$\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix}$$

---

## 2. Geometric Collision & Bounding Volumes (`core/math/geometry.ts`)

### Axis-Aligned Bounding Box (AABB) Intersection
An intersection between box $A$ and box $B$ exists if and only if they overlap on both Cartesian axes:

$$\text{Overlap}_x = (A_x < B_x + B_w) \land (A_x + A_w > B_x)$$
$$\text{Overlap}_y = (A_y < B_y + B_h) \land (A_y + A_h > B_y)$$
$$\text{Intersect}(A, B) = \text{Overlap}_x \land \text{Overlap}_y$$

### Circle-to-AABB Intersection & Contact Normal Resolution
To test collision between a circle $C$ with center $(C_x, C_y)$ and radius $r$, and a box $R$:

1. Clamp circle center to box bounds to find the closest point $P$:
$$P_x = \operatorname{clamp}(C_x, R_x, R_x + R_w)$$
$$P_y = \operatorname{clamp}(C_y, R_y, R_y + R_h)$$

2. Calculate displacement vector $\mathbf{d} = C - P$:
$$\|\mathbf{d}\|^2 = (C_x - P_x)^2 + (C_y - P_y)^2$$

3. If $\|\mathbf{d}\|^2 < r^2$, a collision has occurred:
$$\hat{\mathbf{N}} = \frac{\mathbf{d}}{\|\mathbf{d}\|}, \quad \text{Penetration Depth } p = r - \|\mathbf{d}\|$$

```typescript
export function circleIntersectsAABB(
  circle: Circle,
  rect: Rectangle
): { hit: boolean; normal: Vector2; penetration: number } {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= circle.radius * circle.radius) {
    return { hit: false, normal: Vector2.zero(), penetration: 0 };
  }

  const dist = Math.sqrt(distSq);
  if (dist === 0) {
    return { hit: true, normal: Vector2.up(), penetration: circle.radius };
  }

  return {
    hit: true,
    normal: new Vector2(dx / dist, dy / dist),
    penetration: circle.radius - dist,
  };
}
```

---

## 3. 2D Linear Transformations & Matrix Rotation (`core/math/matrix.ts`)

### 2x2 Matrix Definition
$$\mathbf{M} = \begin{pmatrix} a & c \\ b & d \end{pmatrix}, \quad \det(\mathbf{M}) = ad - bc$$

### Discrete Matrix Rotation (Tetris SRS)
In grid puzzle games, rotating an $N \times N$ discrete grid 90° clockwise is computed by transposing the matrix and reversing each row:

$$R_{\text{CW}}(\mathbf{M})_{i, j} = \mathbf{M}_{N - 1 - j, \, i}$$
$$R_{\text{CCW}}(\mathbf{M})_{i, j} = \mathbf{M}_{j, \, N - 1 - i}$$

```typescript
export function rotateMatrixCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  if (n === 0) return [];
  const m = matrix[0].length;
  const result: T[][] = Array.from({ length: m }, () => new Array(n));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}
```

---

## 4. Deterministic Pseudo-Random Number Generation (`core/math/random.ts`)

### Mulberry32 Algorithm
ARCADE_ avoids `Math.random()` completely. All procedural elements use Mulberry32, a 32-bit state PRNG with excellent statistical distribution:

$$\begin{aligned}
t_0 &= (\text{state} + \text{\texttt{0x6D2B79F5}}) \pmod{2^{32}} \\
t_1 &= (t_0 \oplus (t_0 \gg 15)) \times (t_0 \mid 1) \\
t_2 &= t_1 \oplus \left(t_1 + (t_1 \oplus (t_1 \gg 7)) \times (t_1 \mid 61)\right) \\
\text{Output} &= \frac{(t_2 \oplus (t_2 \gg 14)) \gg 0}{2^{32}}
\end{aligned}$$

```typescript
export class RandomSource {
  private state: number;

  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
```

### Deterministic Seed from Date String
Daily challenges generate a consistent 32-bit integer seed from a date string (`YYYY-MM-DD`):

```typescript
export function seedFromDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // 32-bit integer conversion
  }
  return Math.abs(hash) || 1337;
}
```

---

## 5. Seeded Gradient Value Noise (`core/math/noise.ts`)

The `ValueNoise` engine generates continuous, non-repeating 1D and 2D procedural gradients for terrain generation, cave layouts, and moss growth:

### 2D Value Noise Equation
For point $(x, y)$ with integer lattice coordinates $(x_i, y_i) = (\lfloor x \rfloor, \lfloor y \rfloor)$ and fractional offsets $(u, v) = (\operatorname{smoothstep}(x - x_i), \operatorname{smoothstep}(y - y_i))$:

$$\begin{aligned}
x_1 &= (1 - u) V(x_i, y_i) + u V(x_i + 1, y_i) \\
x_2 &= (1 - u) V(x_i, y_i + 1) + u V(x_i + 1, y_i + 1) \\
\text{Noise}(x, y) &= (1 - v) x_1 + v x_2
\end{aligned}$$

---

## 6. Interpolation & Easing Curves (`core/math/interpolation.ts`, `easing.ts`)

### Linear Interpolation
$$\operatorname{lerp}(a, b, t) = a + (b - a)t$$

### Inverse Lerp
$$\operatorname{invLerp}(a, b, v) = \operatorname{clamp}\left(\frac{v - a}{b - a}, 0, 1\right)$$

### Smoothstep (Hermite Cubic)
$$S(t) = t^2 (3 - 2t), \quad t \in [0, 1]$$

### Smootherstep (Ken Perlin's Quintic)
$$S_5(t) = t^3 \left(t (6t - 15) + 10\right), \quad t \in [0, 1]$$

### Easing Functions:
- **Ease-Out Cubic:** $f(t) = (t - 1)^3 + 1$
- **Ease-Out Back (Overshoot):** $f(t) = (t - 1)^2 \left((s + 1)(t - 1) + s\right) + 1, \quad s \approx 1.70158$
- **Ease-Out Bounce:** Piecewise quadratic decay simulating elastic surface bounces.

---

## 7. Distance Metrics (`core/math/distance.ts`)

| Metric | Formula | Best Suited For |
|---|---|---|
| **Manhattan ($L_1$)** | $\|x_1 - x_2\| + \|y_1 - y_2\|$ | 4-directional grid movement (Snake, Maze Runner, Pac-style) |
| **Euclidean ($L_2$)** | $\sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$ | Continuous 2D distance (Shooters, Orbiters, Boids) |
| **Chebyshev ($L_\infty$)** | $\max(\|x_1 - x_2\|, \|y_1 - y_2\|)$ | 8-directional Moore grids (Minesweeper clues, Chess Kings) |

---

## 8. Vector Tire Kinematics & Spline Parametrization (`games/hotlap/`)

### Vector Velocity Decomposition
The vehicle velocity vector $\mathbf{v}$ is decomposed into local longitudinal ($\hat{\mathbf{h}}$) and lateral ($\hat{\mathbf{n}}$) orthogonal bases:
$$v_{\text{long}} = \mathbf{v} \cdot \hat{\mathbf{h}}, \quad v_{\text{lat}} = \mathbf{v} \cdot \hat{\mathbf{n}}$$
$$\mathbf{v} = v_{\text{long}}\hat{\mathbf{h}} + v_{\text{lat}}\hat{\mathbf{n}}$$

### Lateral Friction Decay & Slip
Surface grip coefficient $\mu$ dampens lateral velocity over time step $\Delta t$:
$$v_{\text{lat}}' = v_{\text{lat}} \cdot \max(0, 1 - \mu \cdot k \cdot \Delta t)$$
When $|v_{\text{lat}}| > v_{\text{slip}}$, oversteer power-slides and tire smoke particle emissions are triggered.

### Catmull-Rom Track Spline Projection
Centerline progress $t \in [0, 1]$ is evaluated by minimizing the squared Euclidean distance to the closed $C^1$-continuous spline:
$$t = \operatorname{argmin}_{u \in [0, 1]} \|\mathbf{P} - \mathbf{C}(u)\|^2$$

