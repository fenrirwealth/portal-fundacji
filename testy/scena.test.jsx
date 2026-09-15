import React from "react";
import { it, expect, vi } from "vitest";
import { create } from "@react-three/test-renderer";
import { List, Czasteczki, Skrytka } from "../app/ui/ScenaKoperty";

it("mounts the actual R3F scene with React 19.3 and animates the flap", async () => {
  const original = HTMLCanvasElement.prototype.getContext;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (type, ...args) {
    if (type === "2d") return { fillStyle: "", fillRect() {} };
    return original.call(this, type, ...args);
  });
  const scene = await create(<><Skrytka otwarta={false} /><List otwarta={false} przechyl={null} /><Czasteczki /></>);
  expect(scene.toGraph().length).toBeGreaterThan(0);
  await scene.advanceFrames(2, .016);
  const flap = scene.scene.findByProps({ name: "klapa" }).instance;
  const before = flap.rotation.x;
  await scene.update(<><Skrytka otwarta /><List otwarta przechyl={{ x:.5, y:.2 }} /><Czasteczki /></>);
  await scene.advanceFrames(120, .016);
  expect(flap.rotation.x).toBeLessThan(before - 1);
  expect(scene.scene.findByProps({ name: "drzwi-skrytki" }).instance.rotation.x).toBeGreaterThan(1);
  await scene.unmount();
});
