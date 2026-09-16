import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); if (typeof sessionStorage !== "undefined") sessionStorage.clear(); });
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { if (!this.open) return; this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
}
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("next/image", () => ({ default: ({ fill, priority, ...props }) => React.createElement("img", props) }));
