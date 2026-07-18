"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "leaflet/dist/leaflet.css";

import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { isUsableAtlasBounds, organizationIdsInBounds } from "@/lib/atlas/viewport";
import type { AtlasBounds, AtlasOrganization } from "@/types/atlas";

const sourceId = "published-organizations";
const mapColors = {
  cluster: "#1e2320",
  marker: "#1f5a43",
  selected: "#d65f4c",
  outline: "#ffffff"
};
const canadaBounds = {
  southWest: [40, -141] as [number, number],
  northEast: [75, -50] as [number, number]
};

function organizationCoordinates(organizations: AtlasOrganization[]) {
  return organizations.flatMap((organization) => {
    const location = organization.primaryLocation;
    if (location?.longitude === null || location?.longitude === undefined || location.latitude === null || location.latitude === undefined) {
      return [];
    }
    return [[location.longitude, location.latitude] as [number, number]];
  });
}

function mapStyle(): maplibregl.StyleSpecification | string {
  const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  const mapTilerMapId = process.env.NEXT_PUBLIC_MAPTILER_MAP_ID?.trim() || "dataviz-light";
  if (mapTilerKey) {
    return `https://api.maptiler.com/maps/${encodeURIComponent(mapTilerMapId)}/style.json?key=${encodeURIComponent(mapTilerKey)}`;
  }

  return {
    version: 8,
    sources: {
      openStreetMap: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors"
      }
    },
    layers: [
      {
        id: "openStreetMap",
        type: "raster",
        source: "openStreetMap",
        paint: {
          "raster-saturation": -0.9,
          "raster-brightness-min": 0.42,
          "raster-brightness-max": 1,
          "raster-contrast": -0.14,
          "raster-opacity": 0.82
        }
      }
    ]
  };
}

function featureCollection(organizations: AtlasOrganization[]) {
  return {
    type: "FeatureCollection" as const,
    features: organizations.flatMap((organization) => {
      const location = organization.primaryLocation;
      if (location?.longitude === null || location?.longitude === undefined || location.latitude === null || location.latitude === undefined) {
        return [];
      }
      return [
        {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [location.longitude, location.latitude]
          },
          properties: {
            id: organization.id,
            slug: organization.slug,
            name: organization.name,
            location: location.name,
            entityKind: organization.entityKind
          }
        }
      ];
    })
  };
}

function supportsMapLibre() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function AtlasMap({
  organizations,
  selectedOrganizationId,
  onSelect,
  onViewportChange
}: {
  organizations: AtlasOrganization[];
  selectedOrganizationId: string | null;
  onSelect: (organizationId: string) => void;
  onViewportChange: (viewport: { bounds: AtlasBounds; organizationIds: string[] }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const leafletLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletModuleRef = useRef<typeof import("leaflet") | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const viewportTimerRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  const onViewportChangeRef = useRef(onViewportChange);
  const organizationsRef = useRef(organizations);
  const selectedIdRef = useRef(selectedOrganizationId);

  organizationsRef.current = organizations;
  selectedIdRef.current = selectedOrganizationId;

  function publishLeafletViewport() {
    const map = leafletMapRef.current;
    const container = containerRef.current;
    if (!map || !container || container.clientWidth < 2 || container.clientHeight < 2) return;
    const current = map.getBounds();
    const bounds = {
      west: current.getWest(),
      south: current.getSouth(),
      east: current.getEast(),
      north: current.getNorth()
    };
    if (!isUsableAtlasBounds(bounds)) return;
    onViewportChangeRef.current({ bounds, organizationIds: organizationIdsInBounds(organizationsRef.current, bounds) });
  }

  function publishMapLibreViewport(map: MapLibreMap) {
    const container = containerRef.current;
    if (!container || container.clientWidth < 2 || container.clientHeight < 2) return;
    const current = map.getBounds();
    const bounds = {
      west: current.getWest(),
      south: current.getSouth(),
      east: current.getEast(),
      north: current.getNorth()
    };
    if (!isUsableAtlasBounds(bounds)) return;
    onViewportChangeRef.current({ bounds, organizationIds: organizationIdsInBounds(organizationsRef.current, bounds) });
  }

  function scheduleLeafletViewport(delay = 180) {
    if (viewportTimerRef.current !== null) window.clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = window.setTimeout(() => publishLeafletViewport(), delay);
  }

  function scheduleMapLibreViewport(map: MapLibreMap, delay = 180) {
    if (viewportTimerRef.current !== null) window.clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = window.setTimeout(() => publishMapLibreViewport(map), delay);
  }

  function drawLeafletPoints() {
    const L = leafletModuleRef.current;
    const layer = leafletLayerRef.current;
    const map = leafletMapRef.current;
    if (!L || !layer || !map) return;
    layer.clearLayers();
    const points = organizationsRef.current.flatMap((organization) => {
      const location = organization.primaryLocation;
      if (location?.latitude === null || location?.latitude === undefined || location.longitude === null || location.longitude === undefined) return [];
      return [{ organization, location, projected: map.project([location.latitude, location.longitude], map.getZoom()) }];
    });
    const groups: Array<typeof points> = [];
    for (const point of points) {
      const nearby = groups.find((group) => {
        const centre = group.reduce((total, item) => total.add(item.projected), L.point(0, 0)).divideBy(group.length);
        return centre.distanceTo(point.projected) <= 64;
      });
      if (nearby) nearby.push(point);
      else groups.push([point]);
    }

    groups.forEach((group) => {
      if (group.length > 1) {
        const bounds = L.latLngBounds(group.map(({ location }) => [location.latitude!, location.longitude!] as [number, number]));
        const centre = bounds.getCenter();
        const label = document.createElement("div");
        const count = document.createElement("strong");
        const instruction = document.createElement("span");
        count.textContent = `${group.length} organizations`;
        instruction.textContent = "Click to zoom in";
        instruction.className = "block text-[11px]";
        label.append(count, instruction);
        L.marker(centre, {
          icon: L.divIcon({
            className: "atlas-leaflet-cluster-icon",
            html: `<span>${group.length}</span>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21]
          }),
          keyboard: true,
          title: `${group.length} organizations. Click to zoom in.`
        })
          .bindTooltip(label, { direction: "top" })
          .on("click", () => {
            if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
              map.setView(centre, Math.min(map.getZoom() + 2, 12), { animate: true });
            } else {
              map.fitBounds(bounds, { padding: [54, 54], maxZoom: Math.min(map.getZoom() + 3, 12), animate: true });
            }
          })
          .addTo(layer);
        return;
      }

      const { organization, location } = group[0];
      const selected = selectedIdRef.current === organization.id;
      const tooltip = document.createElement("div");
      const tooltipName = document.createElement("strong");
      const tooltipMeta = document.createElement("span");
      tooltipName.textContent = organization.name;
      tooltipMeta.textContent = `${organization.entityKind.replaceAll("_", " ")} · ${location.name}`;
      tooltipMeta.className = "block text-[11px] capitalize";
      tooltip.append(tooltipName, tooltipMeta);

      L.circleMarker([location.latitude!, location.longitude!], {
        radius: selected ? 10 : 8,
        color: mapColors.outline,
        weight: 3,
        fillColor: selected ? mapColors.selected : mapColors.marker,
        fillOpacity: 0.96
      })
        .bindTooltip(tooltip, { direction: "top" })
        .on("click", () => onSelectRef.current(organization.id))
        .addTo(layer);
    });
  }

  function frameLeafletResults() {
    const L = leafletModuleRef.current;
    const map = leafletMapRef.current;
    if (!L || !map) return;
    const coordinates = organizationCoordinates(organizationsRef.current);
    if (coordinates.length === 0) {
      map.fitBounds(L.latLngBounds(canadaBounds.southWest, canadaBounds.northEast), { padding: [24, 24], animate: false });
      return;
    }
    if (coordinates.length === 1) {
      const [longitude, latitude] = coordinates[0];
      map.setView([latitude, longitude], 5, { animate: false });
      return;
    }
    map.fitBounds(
      L.latLngBounds(coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])),
      { padding: [48, 48], maxZoom: 6, animate: false }
    );
  }

  function frameMapLibreResults(map: MapLibreMap) {
    const coordinates = organizationCoordinates(organizationsRef.current);
    if (coordinates.length === 0) {
      map.fitBounds(
        [
          [canadaBounds.southWest[1], canadaBounds.southWest[0]],
          [canadaBounds.northEast[1], canadaBounds.northEast[0]]
        ],
        { padding: 24, duration: 0 }
      );
      return;
    }
    if (coordinates.length === 1) {
      map.jumpTo({ center: coordinates[0], zoom: 5 });
      return;
    }
    const bounds = coordinates.reduce(
      (result, coordinate) => result.extend(coordinate),
      new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
    );
    map.fitBounds(bounds, { padding: 48, maxZoom: 6, duration: 0 });
  }

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || leafletMapRef.current) return;
    let cancelled = false;

    async function initializeLeafletFallback() {
      const module = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      leafletModuleRef.current = module;
      const map = module.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        zoomSnap: 0.25,
        maxBounds: module.latLngBounds([38, -145], [85, -45]),
        minZoom: 2,
        maxZoom: 14
      });
      const mapTilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
      const mapTilerMapId = process.env.NEXT_PUBLIC_MAPTILER_MAP_ID?.trim() || "dataviz-light";
      module
        .tileLayer(
          mapTilerKey
            ? `https://api.maptiler.com/maps/${encodeURIComponent(mapTilerMapId)}/256/{z}/{x}/{y}.png?key=${encodeURIComponent(mapTilerKey)}`
            : "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: mapTilerKey ? "© MapTiler © OpenStreetMap contributors" : "© OpenStreetMap contributors",
            maxZoom: 19
          }
        )
        .addTo(map);
      module.control.zoom({ position: "bottomright" }).addTo(map);
      leafletMapRef.current = map;
      leafletLayerRef.current = module.layerGroup().addTo(map);
      map.on("moveend", () => scheduleLeafletViewport());
      map.on("zoomend", drawLeafletPoints);
      drawLeafletPoints();
      frameLeafletResults();
      window.requestAnimationFrame(() => scheduleLeafletViewport(0));
    }

    if (!supportsMapLibre()) {
      void initializeLeafletFallback();
      return () => {
        cancelled = true;
        if (viewportTimerRef.current !== null) window.clearTimeout(viewportTimerRef.current);
        leafletMapRef.current?.remove();
        leafletMapRef.current = null;
        leafletLayerRef.current = null;
        leafletModuleRef.current = null;
      };
    }

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle(),
        center: [-96.5, 57.2],
        zoom: 2.45,
        minZoom: 2,
        maxZoom: 14,
        maxBounds: [
          [-145, 38],
          [-45, 85]
        ],
        attributionControl: false
      });
    } catch {
      void initializeLeafletFallback();
      return () => {
        cancelled = true;
        if (viewportTimerRef.current !== null) window.clearTimeout(viewportTimerRef.current);
        leafletMapRef.current?.remove();
        leafletMapRef.current = null;
        leafletLayerRef.current = null;
        leafletModuleRef.current = null;
      };
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      frameMapLibreResults(map);
      map.addSource(sourceId, {
        type: "geojson",
        data: featureCollection(organizationsRef.current),
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 64
      });

      map.addLayer({
        id: "organization-clusters",
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": mapColors.cluster,
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 50, 28],
          "circle-stroke-color": mapColors.outline,
          "circle-stroke-width": 3,
          "circle-opacity": 0.94
        }
      });

      map.addLayer({
        id: "organization-cluster-count",
        type: "symbol",
        source: sourceId,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"]
        },
        paint: { "text-color": "#ffffff" }
      });

      map.addLayer({
        id: "organization-points",
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", ["==", ["get", "id"], selectedIdRef.current ?? ""], mapColors.selected, mapColors.marker],
          "circle-radius": ["case", ["==", ["get", "id"], selectedIdRef.current ?? ""], 10, 8],
          "circle-stroke-color": mapColors.outline,
          "circle-stroke-width": 3
        }
      });

      map.on("click", "organization-clusters", async (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ["organization-clusters"] })[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        const source = map.getSource(sourceId) as GeoJSONSource;
        if (!Number.isFinite(clusterId) || feature?.geometry.type !== "Point") return;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = feature.geometry.coordinates as [number, number];
        map.easeTo({ center: coordinates, zoom });
      });

      map.on("click", "organization-points", (event) => {
        const id = String(event.features?.[0]?.properties?.id ?? "");
        if (!id) return;
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
        onSelectRef.current(id);
      });

      map.on("mouseenter", "organization-points", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const name = String(feature.properties?.name ?? "Organization");
        const entityKind = String(feature.properties?.entityKind ?? "organization").replaceAll("_", " ");
        const location = String(feature.properties?.location ?? "Location under review");
        const label = document.createElement("div");
        const labelName = document.createElement("strong");
        const labelMeta = document.createElement("span");
        labelName.textContent = name;
        labelMeta.textContent = `${entityKind} · ${location}`;
        label.append(labelName, labelMeta);
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: "atlas-marker-label"
        })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(label)
          .addTo(map);
      });
      map.on("mouseleave", "organization-points", () => {
        map.getCanvas().style.cursor = "";
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      });
      map.on("mouseenter", "organization-clusters", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (feature?.geometry.type !== "Point") return;
        const pointCount = Number(feature.properties?.point_count ?? 0);
        const label = document.createElement("div");
        const labelCount = document.createElement("strong");
        const labelInstruction = document.createElement("span");
        labelCount.textContent = `${pointCount} organizations`;
        labelInstruction.textContent = "Click to zoom in";
        label.append(labelCount, labelInstruction);
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 22,
          className: "atlas-marker-label"
        })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(label)
          .addTo(map);
      });
      map.on("mouseleave", "organization-clusters", () => {
        map.getCanvas().style.cursor = "";
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
      });

      map.once("idle", () => publishMapLibreViewport(map));
    });
    map.on("moveend", () => scheduleMapLibreViewport(map));

    mapRef.current = map;
    return () => {
      cancelled = true;
      if (viewportTimerRef.current !== null) window.clearTimeout(viewportTimerRef.current);
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      map.remove();
      mapRef.current = null;
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      leafletLayerRef.current = null;
      leafletModuleRef.current = null;
    };
    // Map initialization is intentionally one-time; source updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawLeafletPoints();
    frameLeafletResults();
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const source = map.getSource(sourceId) as GeoJSONSource | undefined;
    source?.setData(featureCollection(organizations));
    frameMapLibreResults(map);
    map.once("idle", () => publishMapLibreViewport(map));
  }, [organizations]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth < 2 || container.clientHeight < 2) return;
      mapRef.current?.resize();
      leafletMapRef.current?.invalidateSize({ animate: false });
      if (mapRef.current) scheduleMapLibreViewport(mapRef.current, 0);
      if (leafletMapRef.current) scheduleLeafletViewport(0);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    drawLeafletPoints();
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer("organization-points")) return;
    map.setPaintProperty("organization-points", "circle-color", [
      "case",
      ["==", ["get", "id"], selectedOrganizationId ?? ""],
      mapColors.selected,
      mapColors.marker
    ]);
    map.setPaintProperty("organization-points", "circle-radius", [
      "case",
      ["==", ["get", "id"], selectedOrganizationId ?? ""],
      10,
      8
    ]);

    if (!selectedOrganizationId) return;
    const selected = organizationsRef.current.find((organization) => organization.id === selectedOrganizationId);
    const location = selected?.primaryLocation;
    if (location?.longitude === null || location?.longitude === undefined || location.latitude === null || location.latitude === undefined) return;
    map.easeTo({ center: [location.longitude, location.latitude], duration: 300 });
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (!selectedOrganizationId) return;
    const selected = organizationsRef.current.find((organization) => organization.id === selectedOrganizationId);
    const location = selected?.primaryLocation;
    if (location?.longitude === null || location?.longitude === undefined || location.latitude === null || location.latitude === undefined) return;
    leafletMapRef.current?.panTo([location.latitude, location.longitude], { animate: true, duration: 0.3 });
  }, [selectedOrganizationId]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[290px] w-full bg-[var(--atlas-surface-muted)] sm:min-h-[330px] lg:min-h-[350px]"
      role="region"
      aria-label={`Map showing ${organizations.length} published ${organizations.length === 1 ? "organization" : "organizations"}. Numbered groups can be selected to zoom in and separate nearby organizations. The synchronized results list provides the same organizations without requiring the map.`}
    />
  );
}
