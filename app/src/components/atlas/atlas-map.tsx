"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "leaflet/dist/leaflet.css";

import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { organizationIdsInBounds } from "@/lib/atlas/viewport";
import type { AtlasBounds, AtlasOrganization } from "@/types/atlas";

const sourceId = "published-organizations";
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
          "raster-saturation": -0.72,
          "raster-brightness-min": 0.2,
          "raster-brightness-max": 0.98,
          "raster-contrast": -0.06
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
            location: location.name
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
  onViewportChange,
  active = true
}: {
  organizations: AtlasOrganization[];
  selectedOrganizationId: string | null;
  onSelect: (organizationId: string) => void;
  onViewportChange: (viewport: { bounds: AtlasBounds; organizationIds: string[] }) => void;
  active?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const leafletMapRef = useRef<import("leaflet").Map | null>(null);
  const leafletLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletModuleRef = useRef<typeof import("leaflet") | null>(null);
  const onSelectRef = useRef(onSelect);
  const onViewportChangeRef = useRef(onViewportChange);
  const organizationsRef = useRef(organizations);
  const selectedIdRef = useRef(selectedOrganizationId);

  organizationsRef.current = organizations;
  selectedIdRef.current = selectedOrganizationId;

  function publishLeafletViewport() {
    const map = leafletMapRef.current;
    if (!map) return;
    const current = map.getBounds();
    const bounds = {
      west: current.getWest(),
      south: current.getSouth(),
      east: current.getEast(),
      north: current.getNorth()
    };
    onViewportChangeRef.current({ bounds, organizationIds: organizationIdsInBounds(organizationsRef.current, bounds) });
  }

  function publishMapLibreViewport(map: MapLibreMap) {
    const current = map.getBounds();
    const bounds = {
      west: current.getWest(),
      south: current.getSouth(),
      east: current.getEast(),
      north: current.getNorth()
    };
    onViewportChangeRef.current({ bounds, organizationIds: organizationIdsInBounds(organizationsRef.current, bounds) });
  }

  function drawLeafletPoints() {
    const L = leafletModuleRef.current;
    const layer = leafletLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    organizationsRef.current.forEach((organization) => {
      const location = organization.primaryLocation;
      if (location?.latitude === null || location?.latitude === undefined || location.longitude === null || location.longitude === undefined) return;
      const selected = selectedIdRef.current === organization.id;
      L.circleMarker([location.latitude, location.longitude], {
        radius: selected ? 10 : 8,
        color: "#ffffff",
        weight: 3,
        fillColor: selected ? "#f79009" : "#0756d9",
        fillOpacity: 0.96
      })
        .bindTooltip(`<strong>${organization.name}</strong><br>${location.name}`, { direction: "top" })
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
      map.on("moveend", publishLeafletViewport);
      drawLeafletPoints();
      frameLeafletResults();
    }

    if (!supportsMapLibre()) {
      void initializeLeafletFallback();
      return () => {
        cancelled = true;
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
        clusterMaxZoom: 9,
        clusterRadius: 46
      });

      map.addLayer({
        id: "organization-clusters",
        type: "circle",
        source: sourceId,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0756d9",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 22, 50, 28],
          "circle-stroke-color": "#ffffff",
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
          "circle-color": ["case", ["==", ["get", "id"], selectedIdRef.current ?? ""], "#f79009", "#0756d9"],
          "circle-radius": ["case", ["==", ["get", "id"], selectedIdRef.current ?? ""], 10, 8],
          "circle-stroke-color": "#ffffff",
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
        if (id) onSelectRef.current(id);
      });

      ["organization-clusters", "organization-points"].forEach((layer) => {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      });

      publishMapLibreViewport(map);
    });
    map.on("moveend", () => publishMapLibreViewport(map));

    mapRef.current = map;
    return () => {
      cancelled = true;
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
  }, [organizations]);

  useEffect(() => {
    if (!active) return;
    mapRef.current?.resize();
    leafletMapRef.current?.invalidateSize({ animate: false });
  }, [active]);

  useEffect(() => {
    drawLeafletPoints();
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer("organization-points")) return;
    map.setPaintProperty("organization-points", "circle-color", [
      "case",
      ["==", ["get", "id"], selectedOrganizationId ?? ""],
      "#f79009",
      "#0756d9"
    ]);
    map.setPaintProperty("organization-points", "circle-radius", [
      "case",
      ["==", ["get", "id"], selectedOrganizationId ?? ""],
      10,
      8
    ]);
  }, [selectedOrganizationId]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[290px] w-full bg-[#dcefff] sm:min-h-[330px] lg:min-h-[350px]"
      role="region"
      aria-label={`Map showing ${organizations.length} published organizations. Use the accessible table for complete results.`}
    />
  );
}
