"use client";

import { useEffect, useRef } from "react";
import L, { type LatLngExpression, type Map as LeafletMap } from "leaflet";

type GeoLocationPickerProps = {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
};

type LeafletContainer = HTMLDivElement & {
  _leaflet_id?: number;
};

const markerIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 8px 18px rgba(37,99,235,.45)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function GeoLocationPicker({
  latitude,
  longitude,
  onChange,
}: GeoLocationPickerProps) {
  const containerRef = useRef<LeafletContainer | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialCenterRef = useRef<LatLngExpression>([latitude, longitude]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Leaflet stores an internal id on the DOM node. In Next dev/HMR this can
    // survive a remount, so clear it before creating a fresh map instance.
    if (container._leaflet_id) {
      delete container._leaflet_id;
      container.innerHTML = "";
    }

    const center = initialCenterRef.current;
    const map = L.map(container, {
      center,
      zoom: 13,
      scrollWheelZoom: true,
    });
    const marker = L.marker(center, {
      draggable: true,
      icon: markerIcon,
    }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (event) => {
      onChangeRef.current(event.latlng.lat, event.latlng.lng);
    });

    marker.on("dragend", () => {
      const nextPosition = marker.getLatLng();
      onChangeRef.current(nextPosition.lat, nextPosition.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
    };
  }, []);

  useEffect(() => {
    const center: LatLngExpression = [latitude, longitude];
    markerRef.current?.setLatLng(center);
    mapRef.current?.setView(center);
    window.setTimeout(() => mapRef.current?.invalidateSize(), 0);
  }, [latitude, longitude]);

  return <div ref={containerRef} className="h-full w-full" />;
}
