import { Quaternion, Vector3 } from "three";

export function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}

export function lerpVec3(a: Vector3, b: Vector3, t: number) {
  return new Vector3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
}

export function lerpQuaternion(a: Quaternion, b: Quaternion, t: number) {
  const q = new Quaternion();
  q.slerpQuaternions(a, b, t);
  return q;
}

type Window = [[number, number, number], [number, number, number]];
export function lerpWindow(a: Window, b: Window, t: number) {
  return [
    [
      lerp(a[0][0], b[0][0], t),
      lerp(a[0][1], b[0][1], t),
      lerp(a[0][2], b[0][2], t),
    ],
    [
      lerp(a[1][0], b[1][0], t),
      lerp(a[1][1], b[1][1], t),
      lerp(a[1][2], b[1][2], t),
    ],
  ] as Window;
}
