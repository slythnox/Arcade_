import React from "react";
import { Metadata } from "next";
import { constructSiteMetadata } from "@/lib/seo/metadata";
import { BreadcrumbTrail } from "@/components/marketing/BreadcrumbTrail";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export const metadata: Metadata = constructSiteMetadata({
  title: "Tetris SRS Matrix Rotations & Wall Kicks — ARCADE_",
  description:
    "Mathematical implementation of discrete 2D matrix coordinate rotations, transposition algorithms, and SRS offset test sequences.",
  path: "/case-studies/tetris-matrix-rotations",
});

export default function TetrisMatrixRotationsStudy() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-16)" }}>
      <BreadcrumbTrail
        items={[
          { label: "CASE STUDIES", href: "/case-studies" },
          { label: "TETRIS MATRIX ROTATIONS" },
        ]}
      />

      <article style={{ maxWidth: "840px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--arcade-yellow)",
                backgroundColor: "rgba(255, 216, 77, 0.12)",
                border: "1px solid rgba(255, 216, 77, 0.3)",
                padding: "3px 10px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              ENGINE STUDY #02
            </span>
            <span style={{ color: "var(--color-text-muted)" }}>•</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-text-dim)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
              <Clock size={14} /> 7 min read
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(22px, 3.5vw, 34px)",
              fontWeight: 900,
              color: "#FFFFFF",
              marginBottom: "14px",
              lineHeight: 1.25,
            }}
          >
            TETRIS SRS MATRIX ROTATIONS & WALL KICKS
          </h1>

          <p style={{ fontSize: "16px", color: "var(--color-text-dim)", lineHeight: 1.6 }}>
            Applying discrete 2D linear algebra, orthogonal coordinate transposition, and prioritized 5-offset translation tables to implement the official Super Rotation System.
          </p>
        </div>

        {/* Deep Dive Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "15px", color: "var(--color-text)", lineHeight: 1.75 }}>
          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              1. 2D Coordinate Permutations for Discrete Matrix Rotation
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              In continuous 2D space, a point $(x, y)$ is rotated by angle $\theta$ using the rotation matrix:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(255, 216, 77, 0.3)", borderRadius: "6px", padding: "14px 18px", marginBottom: "14px" }}>
              <code style={{ color: "var(--arcade-yellow)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                R(90°) = [ cos(90°) -sin(90°) ; sin(90°) cos(90°) ] = [ 0 -1 ; 1 0 ]
              </code>
            </div>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              In discrete grid indices of an $N \times N$ matrix, this corresponds to transposing the matrix across its main diagonal, followed by reversing each row horizontally. Element $(r, c)$ maps directly to $(c, N - 1 - r)$:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(77, 232, 232, 0.3)", borderRadius: "6px", padding: "16px 20px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--arcade-cyan)", lineHeight: 1.55 }}>
                <code>{`export function rotateMatrixCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  const result: T[][] = Array.from({ length: n }, () => new Array(n));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}`}</code>
              </pre>
            </div>
          </section>

          <section
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "8px",
              padding: "24px 28px",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "14px" }}>
              2. The SRS Wall Kick Offset Pipeline
            </h2>
            <p style={{ color: "var(--color-text-dim)", marginBottom: "14px" }}>
              When a rotation causes a piece to overlap wall boundaries or locked blocks, the rotation is not cancelled immediately. Instead, the engine evaluates a prioritized sequence of 5 translation vectors $(\Delta x, \Delta y)$:
            </p>
            <div style={{ backgroundColor: "#070b14", border: "1px solid rgba(255, 92, 138, 0.3)", borderRadius: "6px", padding: "16px 20px", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--arcade-pink)", lineHeight: 1.55 }}>
                <code>{`// Official J, L, S, T, Z 0 -> 90° Kick Table
const SRS_KICKS_0_TO_R: readonly [number, number][] = [
  [0, 0],   // Test 1: Basic rotation
  [-1, 0],  // Test 2: 1 unit left
  [-1, 1],  // Test 3: 1 unit left, 1 unit up
  [0, -2],  // Test 4: 2 units down
  [-1, -2], // Test 5: 1 unit left, 2 units down
];

for (const [dx, dy] of kicks) {
  if (this.isValidPosition(newGrid, pieceX + dx, pieceY + dy)) {
    this.currentPiece.x += dx;
    this.currentPiece.y += dy;
    this.currentPiece.matrix = newGrid;
    return true; // Kick succeeded!
  }
}`}</code>
              </pre>
            </div>
          </section>
        </div>

        {/* Back Link */}
        <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--color-surface-border)" }}>
          <Link
            href="/case-studies"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--arcade-cyan)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO ALL CASE STUDIES</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
