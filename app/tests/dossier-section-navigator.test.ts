// @vitest-environment jsdom
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { DossierSectionNavigator } from "@/components/atlas/dossier-section-navigator";

it("returns the active index to the first section when scrolling back above the dossier", async () => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  let observe: IntersectionObserverCallback;
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { observe = callback; }
    observe() {} disconnect() {}
  });
  const container = document.createElement("div");
  const first = document.createElement("section"); first.id = "capabilities";
  const later = document.createElement("section"); later.id = "operating-context";
  document.body.append(container, first, later);
  const root = createRoot(container);
  try {
    await act(async () => root.render(React.createElement(DossierSectionNavigator, {
      sections: [{id:first.id,label:"Capabilities"},{id:later.id,label:"Operating context"}]
    })));
    const visibleRect = new DOMRect(0, 160, 300, 400);
    await act(async () => observe([{isIntersecting:true,target:later,boundingClientRect:visibleRect,intersectionRect:visibleRect,intersectionRatio:1,rootBounds:null,time:0}], {} as IntersectionObserver));
    expect(container.querySelector('[aria-current="location"]')?.getAttribute("href")).toBe("#operating-context");
    vi.spyOn(first, "getBoundingClientRect").mockReturnValue({top:575} as DOMRect);
    await act(async () => { window.dispatchEvent(new Event("scroll")); });
    expect(container.querySelector('[aria-current="location"]')?.getAttribute("href")).toBe("#capabilities");
  } finally {
    await act(async () => root.unmount());
    container.remove(); first.remove(); later.remove();
    vi.unstubAllGlobals(); vi.restoreAllMocks();
  }
});
