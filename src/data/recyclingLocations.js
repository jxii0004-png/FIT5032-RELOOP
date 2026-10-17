// Addresses/materials verified against council pages on 16 October 2026.
// Coordinates are resolved through Mapbox at runtime, not guessed or persisted.
export const recyclingLocations = [
  {
    id: "boroondara", name: "Boroondara Recycling and Waste Centre",
    address: "648 Riversdale Road, Camberwell VIC 3124, Australia",
    materials: ["Electronics", "Batteries", "Cardboard", "Paper", "Glass", "Cans"],
    notes: "Small and medium e-waste accepted with exclusions. Fees apply to some items. Check Sunday restrictions, opening times and material limits before visiting.",
    source: "https://www.boroondara.vic.gov.au/services/waste-and-recycling/waste-drop/boroondara-recycling-and-waste-centre",
  },
  {
    id: "kew", name: "Kew Depot Recycling Drop-off Centre",
    address: "31 Hutchinson Drive, Kew VIC 3101, Australia",
    materials: ["Cardboard", "Paper", "Glass", "Cans"],
    notes: "General recyclables only. Flatten cardboard and remove tape. No e-waste, batteries or furniture. Closed on public holidays; check the council page for current hours.",
    source: "https://www.boroondara.vic.gov.au/services/waste-and-recycling/waste-drop/kew-depot-recycling-drop-centre",
  },
];
