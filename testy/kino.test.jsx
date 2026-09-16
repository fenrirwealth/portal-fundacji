import React from "react";
import { describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import KinoweWejscie from "../app/ui/KinoweWejscie";
import UdostepnijMarzenie from "../app/listy/[id]/UdostepnijMarzenie";
import LancuchDobra from "../app/ui/LancuchDobra";
import HeroMagia from "../app/ui/HeroMagia";
import ArchiwumListow from "../app/ui/ArchiwumListow";
import { normalizujLicznik } from "../lib/licznik-widok.mjs";

vi.mock("../app/ui/Toast", () => ({ useToast: () => vi.fn() }));
vi.mock("next/link", () => ({ default: ({ children, prefetch, ...props }) => <a {...props}>{children}</a> }));
vi.mock("motion/react", () => ({
  useReducedMotion: () => true,
  useInView: () => true,
  animate: () => ({ stop() {} }),
  motion: { span: ({ animate, initial, transition, ...p }) => <span {...p} data-scale={animate?.scaleX} /> },
}));

describe("Intro", () => {
  it("opens once, lasts 3.6 seconds and restores scroll", () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<KinoweWejscie />);
    expect(container.querySelector("dialog").open).toBe(true);
    act(() => vi.advanceTimersByTime(3600));
    expect(container.querySelector("dialog").open).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
    unmount();
    const second = render(<KinoweWejscie />);
    expect(second.container.querySelector("dialog").open).toBe(false);
  });
  it("can be skipped immediately", () => {
    render(<KinoweWejscie />);
    fireEvent.click(screen.getByText(/Pomiń animację/));
    expect(document.querySelector("dialog").open).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
  });
  it("does not open for reduced motion", () => {
    window.matchMedia.mockReturnValueOnce({ matches: true });
    render(<KinoweWejscie />);
    expect(document.querySelector("dialog").open).toBe(false);
  });
});

describe("Hero integration", () => {
  it("links to existing letter routes without creating a reservation", () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    const request = vi.fn(); vi.stubGlobal("fetch", request);
    const { container } = render(<HeroMagia saListy etykieta="Akcja trwa" termin={null} />);
    expect(screen.getByText("Zostań Mikołajem tego listu").getAttribute("href")).toBe("/listy");
    expect(screen.getByText("Niech list wybierze mnie").getAttribute("href")).toBe("/listy/losowy");
    fireEvent.click(screen.getByRole("button", { name: /Otwórz magiczną kopertę/ }));
    expect(screen.getByRole("button", { name: /Schowaj list w kopercie/ })).toBeTruthy();
    expect(container.querySelector(".koperta-prezentacja-otwarta")).toBeTruthy();
    expect(container.querySelector(".koperta-list-obraz")).toBeTruthy();
    expect(container.querySelector(".koperta-reveal-copy")).toBeNull();
    expect(screen.queryByText(/Zatrzymaj śnieg/)).toBeNull();
    expect(request).not.toHaveBeenCalled();
  });
  it("uses the explanation section when no letters are published", () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    render(<HeroMagia saListy={false} etykieta="Wkrótce" termin={null} />);
    expect(screen.getByText("Poznaj akcję").getAttribute("href")).toBe("#jak-to-dziala");
    expect(screen.queryByText("Niech list wybierze mnie")).toBeNull();
  });
});

describe("Archive gallery", () => {
  it("shows all nine letters and opens a focused preview", () => {
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
    render(<ArchiwumListow />);
    expect(screen.getAllByRole("button", { name: /Powiększ list/ })).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: "Powiększ list 1" }));
    expect(screen.getByRole("button", { name: "Zamknij podgląd listu" })).toBeTruthy();
  });
});

describe("Stories preview", () => {
  it("loads actual PNG before allowing a fresh share gesture", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ "Content-Type": "image/png" }), blob: async () => new Blob(["png"], { type: "image/png" }) });
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:story-test"); URL.revokeObjectURL = vi.fn();
    Object.defineProperty(navigator, "canShare", { configurable: true, value: vi.fn(() => true) });
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
    render(<UdostepnijMarzenie listId="test-123" imie="Test" wolny />);
    fireEvent.click(screen.getByText("Udostępnij marzenie"));
    await screen.findByAltText(/Karta marzenia/);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/listy/test-123/story");
    expect(navigator.share).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Udostępnij kartę/ }));
    expect(navigator.share).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Zamknij podgląd"));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:story-test");
  });
  it("shows recoverable server errors without pretending success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<UdostepnijMarzenie listId="test" imie="Test" wolny />);
    fireEvent.click(screen.getByText("Udostępnij marzenie"));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Udostępnij kartę/ })).toBeNull();
    fireEvent.click(screen.getByText("Zamknij podgląd"));
  });
});

describe("Live chain", () => {
  it("rejects corrupt events and preserves exact zero", () => {
    expect(normalizujLicznik({ wszystkie: 10, wolne: 11 })).toBeNull();
    expect(normalizujLicznik({ wszystkie: "10", wolne: 3 })).toBeNull();
    expect(normalizujLicznik({ wszystkie: 10, wolne: 10 }).procent).toBe(0);
  });
  it("updates from the SSE endpoint and cleans up", async () => {
    let source;
    class Events { constructor(url) { this.url = url; source = this; } close = vi.fn(); }
    vi.stubGlobal("EventSource", Events);
    const { unmount, container } = render(<LancuchDobra poczatkowy={{ wszystkie: 10, wolne: 10 }} />);
    expect(source.url).toBe("/api/licznik");
    expect(container.querySelector("[data-scale]").getAttribute("data-scale")).toBe("0");
    act(() => source.onmessage({ data: JSON.stringify({ wszystkie: 10, wolne: 6 }) }));
    await waitFor(() => expect(container.querySelector("[data-scale]").getAttribute("data-scale")).toBe("0.4"));
    act(() => source.onerror());
    expect(screen.getByText(/Ponawiamy połączenie/)).toBeTruthy();
    unmount(); expect(source.close).toHaveBeenCalled();
  });
});
