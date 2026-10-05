/**
 * Black Hills ride routes, shown on /black-hills-motorcycle-rides.
 *
 * Distances were recomputed on 2026-09-26 with OpenStreetMap routing (OSRM)
 * from the pickup at 1715 Samco Rd, Rapid City, and rounded. Riding times are
 * with photo and fuel stops, not the routing engine's driving time. Route
 * descriptions come from the destination pages, which Mike wrote; keep the two
 * in sync when a route changes.
 */

export type RideSurface = "Paved" | "Paved + optional gravel" | "Gravel";

export interface Ride {
  id: string;
  name: string;
  /** Rounded distance, and where it is counted from. */
  distance: string;
  time: string;
  surface: RideSurface;
  season: string;
  bestFor: string;
  summary: string;
  steps: string[];
  tips: string[];
  /** Google Maps directions: origin, destination and stops, in riding order. */
  maps: { origin: string; destination: string; waypoints: string[] };
  /** Rental page that matches this ride (internal link). */
  rent: { href: string; label: string };
}

const BASE = "1715 Samco Rd, Rapid City, SD 57702";

export const RIDES: Ride[] = [
  {
    id: "needles-highway",
    name: "Needles Highway (SD-87)",
    distance: "14 mi one way",
    time: "1 to 1.5 h with stops",
    surface: "Paved",
    season: "Early May to October (closed by snow in winter)",
    bestFor: "The single most famous road in the Black Hills",
    summary:
      "Fourteen miles of granite spires, hairpins and three single-lane tunnels through Custer State Park. Ride it south to north and finish at Sylvan Lake.",
    steps: [
      "Enter Custer State Park from US-16A and turn onto SD-87 north.",
      "Stop at Cathedral Spires Overlook.",
      "Ride through the Needle's Eye tunnel (8'9\" wide) and on to Sylvan Lake.",
      "Park, walk the lake, then pair it with the Wildlife Loop for a half-day.",
    ],
    tips: [
      "Go early (7 to 9 AM) or after 5 PM: the road is empty and the light is best.",
      "25 mph posted, 20 mph realistic with stops.",
      "Custer State Park pass is included with your rental.",
    ],
    maps: { origin: "Legion Lake, Custer State Park, SD", destination: "Sylvan Lake, Custer, SD", waypoints: ["Cathedral Spires Trailhead, SD", "Needles Eye Tunnel, SD"] },
    rent: { href: "/needles-highway-motorcycle-tour", label: "Needles Highway motorcycle rental" },
  },
  {
    id: "iron-mountain-road",
    name: "Iron Mountain Road (US-16A)",
    distance: "17 mi (about 100 mi round trip from Rapid City)",
    time: "Half day",
    surface: "Paved",
    season: "Year-round, weather permitting",
    bestFor: "Mount Rushmore framed by tunnels",
    summary:
      "Built in 1933 to be ridden slowly: three single-vehicle tunnels cut to frame the four faces of Mount Rushmore, two wooden pigtail bridges that loop over themselves, and switchbacks through ponderosa pine.",
    steps: [
      "Rapid City to Keystone on US-16.",
      "Take US-16A (Iron Mountain Road) south from Keystone.",
      "Tunnels, pigtail bridges and Norbeck Overlook down to Custer State Park.",
      "Return through Custer and Hill City, or loop back north the same way.",
    ],
    tips: ["Late afternoon light through the pines is the best of the day.", "Pair it with Mount Rushmore (allow 1 hour on site)."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Keystone, SD", "Iron Mountain Road, SD", "Custer, SD", "Hill City, SD"] },
    rent: { href: "/mount-rushmore-motorcycle-rental", label: "Mount Rushmore motorcycle rental" },
  },
  {
    id: "classic-loop",
    name: "The classic: Mount Rushmore and Custer State Park",
    distance: "About 125 mi loop from Rapid City",
    time: "Full day",
    surface: "Paved",
    season: "May to October (Needles Highway closes in winter)",
    bestFor: "First-timers who want the four icons in one day",
    summary:
      "Iron Mountain Road, Mount Rushmore, the Wildlife Loop and the Needles Highway in a single loop: the greatest hits of the southern Black Hills.",
    steps: [
      "Rapid City to Keystone, then Iron Mountain Road.",
      "Mount Rushmore (allow 1 hour).",
      "South into Custer State Park and the Wildlife Loop: bison, pronghorn and burros own the road.",
      "Needles Highway to Sylvan Lake, then home through Hill City.",
    ],
    tips: ["Give bison 100 yards and never ride between two of them.", "The Himalayan's 280-mile range covers the loop on one tank."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Keystone, SD", "Mount Rushmore National Memorial", "Wildlife Loop Road, Custer State Park, SD", "Sylvan Lake, Custer, SD", "Hill City, SD"] },
    rent: { href: "/black-hills-motorcycle-rental", label: "Black Hills motorcycle rental" },
  },
  {
    id: "custer-state-park-loop",
    name: "Custer State Park loop",
    distance: "About 70 mi from Custer (Custer is 50 mi from Rapid City)",
    time: "Half day in the park",
    surface: "Paved",
    season: "May to October",
    bestFor: "Wildlife and the best curves in one park",
    summary:
      "Needles Highway, the Wildlife Loop and Iron Mountain Road, all inside Custer State Park, with Sylvan and Stockade lakes along the way.",
    steps: [
      "Needles Highway south to north, stop at Sylvan Lake.",
      "The Wildlife Loop for bison, pronghorn and the begging burros.",
      "Iron Mountain Road south to north, tunnels framing Mount Rushmore.",
      "Return through Custer.",
    ],
    tips: ["Custer State Park pass is included with your rental.", "Mornings and evenings are the best time for wildlife."],
    maps: { origin: "Custer, SD", destination: "Custer, SD", waypoints: ["Needles Eye Tunnel, SD", "Sylvan Lake, Custer, SD", "Wildlife Loop Road, Custer State Park, SD", "Iron Mountain Road, SD"] },
    rent: { href: "/black-hills-motorcycle-rental", label: "Black Hills motorcycle rental" },
  },
  {
    id: "spearfish-canyon",
    name: "Spearfish Canyon and the Northern Hills",
    distance: "About 125 mi loop from Rapid City",
    time: "Full day",
    surface: "Paved + optional gravel",
    season: "May to October",
    bestFor: "Waterfalls, canyon walls and gold-rush Deadwood, with fewer crowds",
    summary:
      "Underrated and less crowded than the southern loop: a limestone canyon with waterfalls every few miles, then Lead and historic Deadwood, back through Sturgis.",
    steps: [
      "Rapid City to Spearfish on I-90.",
      "US-14A south through Spearfish Canyon Scenic Byway, stop at Roughlock Falls.",
      "Lead and historic Deadwood (gold-rush downtown, 1876 cemetery).",
      "Back through Sturgis. Prefer dirt? The ghost town of Galena is a worthwhile detour.",
    ],
    tips: ["During Rally week, ride the canyon at sunrise: it is empty.", "Galena is gravel: an easy one on the Himalayan."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Spearfish, SD", "Roughlock Falls, SD", "Lead, SD", "Deadwood, SD", "Sturgis, SD"] },
    rent: { href: "/sturgis-motorcycle-rental", label: "Sturgis motorcycle rental" },
  },
  {
    id: "badlands-loop",
    name: "Badlands Loop",
    distance: "About 170 mi round trip from Rapid City",
    time: "Full day",
    surface: "Paved + optional gravel",
    season: "May, June and September are best; avoid mid-day in July and August",
    bestFor: "A landscape that looks like another planet",
    summary:
      "East through the White River Valley into Badlands National Park, the Badlands Loop scenic road past the formations, lunch at Wall Drug, and prairie dog towns on the way home.",
    steps: [
      "Rapid City east on SD-44 through the White River Valley.",
      "Badlands National Park and the Badlands Loop scenic road.",
      "Lunch at Wall Drug.",
      "Easy gravel through prairie dog towns to Scenic, then back to Rapid City.",
    ],
    tips: [
      "Park entry is $15 per motorcycle and is not included.",
      "Carry at least 2 liters of water: no services between Pinnacles and Cactus Flat.",
      "Sunrise or late afternoon: light is everything here.",
    ],
    maps: { origin: BASE, destination: BASE, waypoints: ["Interior, SD", "Badlands National Park", "Wall Drug, Wall, SD", "Scenic, SD"] },
    rent: { href: "/badlands-motorcycle-rental", label: "Badlands motorcycle rental" },
  },
  {
    id: "sage-creek-rim-road",
    name: "Sage Creek Rim Road (gravel)",
    distance: "About 25 mi of gravel inside Badlands National Park",
    time: "Add half a day to the Badlands Loop",
    surface: "Gravel",
    season: "Dry weather only",
    bestFor: "Bison herds and backcountry, on an adventure bike",
    summary:
      "Instead of the paved loop, branch off at the Pinnacles entrance onto Sage Creek Rim Road: gravel through bison country, with Robert's Prairie Dog Town on the way. The Himalayan handles it without a separate dual-sport.",
    steps: ["Ride the Badlands Loop to the Pinnacles entrance.", "Turn onto Sage Creek Rim Road.", "Robert's Prairie Dog Town and the bison flats.", "Back to Rapid City."],
    tips: ["Give bison 100 yards: park rule.", "Skip it after rain, the clay turns to grease."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Pinnacles Overlook, Badlands National Park", "Sage Creek Rim Road, SD", "Wall, SD"] },
    rent: { href: "/badlands-motorcycle-rental", label: "Badlands motorcycle rental" },
  },
  {
    id: "backcountry-gravel",
    name: "Black Hills backcountry gravel",
    distance: "About 200 mi",
    time: "Full day",
    surface: "Gravel",
    season: "May to October",
    bestFor: "Adventure riders: roads no Harley will touch",
    summary:
      "Forest service roads through the Black Hills National Forest, crossing the Mickelson Trail, past Pactola Reservoir, Crystal Cave Park and Pringle, on the dirt sections of the southern Black Hills trace.",
    steps: ["Ask Mike for the GPX at pickup.", "Pactola Reservoir and the forest roads west of Rapid City.", "South toward Pringle on gravel.", "Back on pavement through Hill City."],
    tips: ["Black Hills National Forest pass is included with your rental.", "Tell us your route before you leave: cell coverage is patchy."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Pactola Reservoir, SD", "Pringle, SD", "Hill City, SD"] },
    rent: { href: "/fleet", label: "The Himalayan 450, built for gravel" },
  },
  {
    id: "devils-tower",
    name: "Devils Tower, Wyoming",
    distance: "About 220 mi round trip from Rapid City",
    time: "Long day, or overnight",
    surface: "Paved",
    season: "May to October",
    bestFor: "Adding Wyoming and a national monument to the trip",
    summary:
      "West on I-90 to Spearfish for breakfast, across into Wyoming through Sundance to the monolith of Devils Tower, and home through Belle Fourche. Quieter than the southern Hills during Rally week.",
    steps: ["Rapid City to Spearfish on I-90.", "Sundance, Wyoming.", "Devils Tower National Monument (allow 2 hours on site).", "Back through Belle Fourche."],
    tips: ["Renting for two days? Overnight near Devils Tower and ride back through the Bear Lodge Mountains."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Spearfish, SD", "Sundance, WY", "Devils Tower National Monument", "Belle Fourche, SD"] },
    rent: { href: "/book", label: "Book a two-day rental" },
  },
  {
    id: "rushmore-evening",
    name: "Mount Rushmore evening lighting",
    distance: "About 70 mi round trip from Rapid City",
    time: "Half day, evening",
    surface: "Paved",
    season: "Memorial Day to mid-August (lighting ceremony season)",
    bestFor: "One of the best evenings you will have on a bike",
    summary:
      "Ride out in the late afternoon over Iron Mountain Road, reach Mount Rushmore by 8 PM for the 9 PM lighting ceremony, and ride home in the cool night air on US-16.",
    steps: ["Late afternoon: Rapid City to Keystone.", "Iron Mountain Road at golden hour.", "Mount Rushmore by 8 PM, lighting ceremony at 9 PM.", "Home on US-16."],
    tips: ["Bring a clear visor or glasses for the ride home.", "Watch for deer on the way back."],
    maps: { origin: BASE, destination: BASE, waypoints: ["Keystone, SD", "Iron Mountain Road, SD", "Mount Rushmore National Memorial"] },
    rent: { href: "/mount-rushmore-motorcycle-rental", label: "Mount Rushmore motorcycle rental" },
  },
];

export function mapsUrl(r: Ride): string {
  const q = new URLSearchParams({ api: "1", origin: r.maps.origin, destination: r.maps.destination, travelmode: "driving" });
  if (r.maps.waypoints.length) q.set("waypoints", r.maps.waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${q.toString()}`;
}
