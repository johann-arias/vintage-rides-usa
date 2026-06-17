export interface DestinationFAQ {
  q: string;
  a: string;
}

export interface DestinationStat {
  label: string;
  value: string;
}

export interface DestinationRoute {
  name: string;
  miles: string;
  ridingTime: string;
  highlights: string;
  description: string;
}

export interface Destination {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;

  // Hero
  heroImage: string;
  eyebrow: string;
  h1: string;
  h1Accent: string;
  intro: string;

  // Stats strip
  stats: DestinationStat[];

  // Why this destination on a Himalayan
  whyHimalayan: {
    title: string;
    body: string;
    bullets: string[];
  };

  // Routes
  routesTitle: string;
  routes: DestinationRoute[];

  // What to know
  knowBefore: {
    title: string;
    items: { label: string; value: string }[];
  };

  // FAQ
  faq: DestinationFAQ[];

  // Internal link suggestions to other destinations
  relatedSlugs: string[];
}

export const DESTINATIONS: Record<string, Destination> = {
  "black-hills-motorcycle-rental": {
    slug: "black-hills-motorcycle-rental",
    metaTitle: "Black Hills Motorcycle Rental — Royal Enfield Himalayan 450 | Vintage Rides USA",
    metaDescription:
      "Rent a 2025 Royal Enfield Himalayan 450 in Rapid City and ride the Black Hills loop — Needles Highway, Iron Mountain Road, Custer State Park. $130/day, May–September.",
    ogImage: "/hero-bike-outdoor.jpg",
    heroImage: "/hero-bike-outdoor.jpg",
    eyebrow: "Black Hills Motorcycle Rental",
    h1: "Ride the",
    h1Accent: "Black Hills",
    intro:
      "The Black Hills are why riders come to South Dakota. Granite spires, switchback canyons, pigtail bridges, lakes hidden in pine forests — and roads built for motorcycles. From our Rapid City base, the entire region is in your reach: pick up your Himalayan 450 at 9 AM and you're carving the Needles Highway by 10.",
    stats: [
      { label: "Distance from base", value: "10–60 mi" },
      { label: "Best season", value: "May–September" },
      { label: "Recommended duration", value: "1–3 days" },
      { label: "Bike included", value: "Royal Enfield Himalayan 450" },
    ],
    whyHimalayan: {
      title: "Why a Royal Enfield Himalayan in the Black Hills",
      body:
        "The Black Hills aren't a Harley playground in disguise. The roads twist tight through Custer State Park, the elevation changes constantly, and the gravel forest service roads beg for a real adventure bike. The Himalayan 450 is built for this exact terrain — light enough for the switchbacks, planted enough for the highway, with long-travel suspension that makes the Iron Mountain pigtails feel like a video game.",
      bullets: [
        "452cc liquid-cooled DOHC single — relaxed at Black Hills speeds (45–65 mph)",
        "200mm front / 210mm rear travel — handles forest gravel and Custer washboard",
        "196 kg kerb weight — agile through Needles Highway tunnels and pigtails",
        "Full tank = ~400 mi range — one fill-up covers the full loop",
        "Adjustable 825mm seat — comfortable for full-day riding",
      ],
    },
    routesTitle: "Best Black Hills routes from Rapid City",
    routes: [
      {
        name: "The Black Hills Loop (classic)",
        miles: "~250 mi",
        ridingTime: "Full day or 2-day relaxed",
        highlights: "Mount Rushmore · Iron Mountain Road · Needles Highway · Custer State Park · Wildlife Loop",
        description:
          "The non-negotiable. Rapid City → US-16 to Keystone → Iron Mountain Road (pigtail bridges + tunnels framing Mount Rushmore) → Custer State Park Wildlife Loop (bison, pronghorn, donkeys at the road) → Needles Highway → Sylvan Lake → return via Hill City. Plan at least one stop at Sylvan Lake.",
      },
      {
        name: "Spearfish Canyon + Northern Hills",
        miles: "~180 mi",
        ridingTime: "Full day",
        highlights: "Spearfish Canyon · Roughlock Falls · Lead · Deadwood",
        description:
          "Underrated. Rapid City → I-90 to Spearfish → US-14A south through Spearfish Canyon (waterfalls every few miles, sheer canyon walls) → Lead → historic Deadwood (gold rush downtown, 1876 cemetery) → return via Sturgis. Less crowded than the southern loop, equally scenic.",
      },
      {
        name: "Devils Tower extension",
        miles: "~280 mi roundtrip",
        ridingTime: "Long day or overnight",
        highlights: "Bear Lodge Mountains · Devils Tower National Monument · Wyoming high plains",
        description:
          "Cross into Wyoming for the iconic monolith. Rapid City → Sundance, WY → Devils Tower (allow 2h on site) → return via Belle Fourche or push north to Bear Lodge for an overnight. Adds Wyoming roads + a National Monument to your trip.",
      },
    ],
    knowBefore: {
      title: "What to know before you ride",
      items: [
        { label: "Pickup", value: "9:00 AM at 1715 Samco Rd, Rapid City, SD" },
        { label: "Daily rate", value: "$130 + 11.9% SD tax" },
        { label: "Park passes", value: "Custer State Park + Black Hills NF passes included" },
        { label: "Best months", value: "Late May to mid-September (June and September are quietest)" },
        { label: "Avoid", value: "First two weeks of August (Sturgis Rally, traffic and lodging insane)" },
        { label: "License", value: "Valid motorcycle endorsement (M-class) or IDP for international riders" },
      ],
    },
    faq: [
      {
        q: "How long does it take to ride the Black Hills loop?",
        a: "The classic loop (Mount Rushmore + Iron Mountain Road + Needles Highway + Custer State Park) is about 250 miles. You can do it in one full day, but two days at a relaxed pace lets you stop for the Wildlife Loop, Sylvan Lake, and a slow Needles Highway. We recommend a 2-3 day rental for the full Black Hills experience.",
      },
      {
        q: "Is the Black Hills good for beginner motorcyclists?",
        a: "The main highways are easy. Needles Highway and Iron Mountain Road are technical — narrow lanes, tight switchbacks, single-vehicle tunnels with sharp curves at exit. We recommend at least 1 year of riding experience and basic comfort with twisties before tackling the full loop. The Royal Enfield Himalayan 450 is forgiving, but the roads aren't.",
      },
      {
        q: "When is the best time to rent a motorcycle in the Black Hills?",
        a: "June and September. Weather is mild (60-80°F daytime), wildlife is active, the loops are open, and crowds are thin. Avoid the first two weeks of August unless you're going for the Sturgis Rally — every road and every campground is packed. May and October work too, but check our season — we operate May 1 to September 30 only.",
      },
      {
        q: "What's the difference between renting in Rapid City vs Sturgis?",
        a: "Rapid City is the strategic base — 30 min from Mount Rushmore, 1h from Sturgis, 1h from the Badlands, 30 min from Custer State Park. From our shop at 1715 Samco Rd you have direct access to every Black Hills highlight without backtracking. Sturgis-based shops only make sense during Rally week.",
      },
      {
        q: "Can I do the Black Hills loop in one day?",
        a: "Yes, ~250 miles is doable in 8-10 hours of riding with stops. But you'll skip the wildlife loop, the Sylvan Lake hike, and the Custer State Park needle viewpoints. Two days is the sweet spot — pickup 9 AM Day 1, ride Iron Mountain + Custer + overnight in Custer or Hill City, ride Needles + Spearfish Canyon Day 2, return 9 AM Day 3.",
      },
    ],
    relatedSlugs: [
      "needles-highway-motorcycle-tour",
      "mount-rushmore-motorcycle-rental",
      "sturgis-motorcycle-rental",
    ],
  },

  "sturgis-motorcycle-rental": {
    slug: "sturgis-motorcycle-rental",
    metaTitle: "Sturgis Motorcycle Rental — Royal Enfield Himalayan 450 | Vintage Rides USA",
    metaDescription:
      "Rent a Royal Enfield Himalayan 450 in Rapid City for the Sturgis Motorcycle Rally. 30 minutes from downtown Sturgis. Adventure bike alternative to the Harley parade. $130/day.",
    ogImage: "/hero-bike-outdoor.jpg",
    heroImage: "/fleet-lineup-wall.jpg",
    eyebrow: "Sturgis Motorcycle Rental",
    h1: "Ride the",
    h1Accent: "Sturgis Rally",
    intro:
      "Sturgis is the world's biggest motorcycle gathering, averaging around 500,000 bikes every August in a town of 7,000. During rally week the paved roads run two-wide for a hundred miles in every direction. Most rentals there are Harleys. We're the alternative: a brand-new 2025 Royal Enfield Himalayan 450, 30 minutes south in Rapid City, ready to slip off the pavement and onto the trails, where the Black Hills are almost yours alone.",
    stats: [
      { label: "Distance to Sturgis", value: "30 min from base" },
      { label: "Rally dates 2026", value: "Aug 1–10" },
      { label: "Daily rate", value: "$130 + tax" },
      { label: "Why us", value: "Adventure bike, not a Harley" },
    ],
    whyHimalayan: {
      title: "Why a Himalayan during Sturgis week",
      body:
        "With around 500,000 bikes packing the paved roads two-wide for a hundred miles in every direction, most of the rally crowd never leaves Main Street, Buffalo Chip, and the Hwy-34 to Mount Rushmore corridor. The riders who slip onto the trails leave the roar of American steel behind and get the entire Black Hills almost to themselves. The Himalayan 450 is the perfect tool: nimble for the gravel forest roads the Harleys can't touch, comfortable for the 200-mile day, and standout-different from every other bike at the campground.",
      bullets: [
        "Slip onto the gravel and leave the roar of American steel behind; the trails stay empty all rally week",
        "Nimble enough for Spearfish Canyon at sunrise before the crowd wakes",
        "ADV geometry handles the gravel forest service roads (Harley territory: paved only)",
        "Royal Enfield brand presence at Sturgis is growing — turn heads at the Buffalo Chip",
        "Quieter than a V-twin — actually hear the wildlife in Custer State Park",
        "Lower seat (825mm) than most ADV bikes — accessible to a wider range of riders",
      ],
    },
    routesTitle: "Sturgis Rally rides from Rapid City",
    routes: [
      {
        name: "Escape the Main Street parade",
        miles: "~150 mi",
        ridingTime: "Full day",
        highlights: "Spearfish Canyon · Roughlock Falls · Lead · Deadwood (back roads)",
        description:
          "Leave Rapid City early via I-90 north, exit at Spearfish, run US-14A through the canyon (waterfalls, sheer cliffs), continue to Lead and Deadwood via the historic mining roads. Return via Sturgis on backroads (skip Main Street unless you want the chaos). The route most rally locals quietly ride.",
      },
      {
        name: "Black Hills Backcountry Discovery",
        miles: "~200 mi",
        ridingTime: "Full day",
        highlights: "Forest service roads · Mickelson Trail crossings · Hidden lakes",
        description:
          "Adventure bike territory — gravel roads through Black Hills National Forest that no Harley will touch. We share the GPX. Includes Crystal Cave Park, Pactola Reservoir, Pringle, and the dirt sections of the BDR-style south-Black Hills trace.",
      },
      {
        name: "Sturgis-to-Devils Tower",
        miles: "~250 mi roundtrip",
        ridingTime: "Long day",
        highlights: "Spearfish · Sundance, WY · Devils Tower",
        description:
          "Stretch across into Wyoming for the iconic Devils Tower. From Rapid City take I-90 west, hit Spearfish for breakfast, push to Sundance and Devils Tower, return via Belle Fourche. Quieter than the southern Hills during rally week.",
      },
    ],
    knowBefore: {
      title: "Sturgis Rally rental tips",
      items: [
        { label: "Book early", value: "Reserve 3-6 months ahead for August dates — rally week books out" },
        { label: "Pickup", value: "1715 Samco Rd, Rapid City, SD — 30 min south of Sturgis on I-90" },
        { label: "Lodging", value: "Camping in Sturgis is the experience. Book Buffalo Chip, Pappy Hoel, or Glencoe months in advance" },
        { label: "Roads to avoid (during rally)", value: "Main Street, US-385 between Hill City and Custer mid-day, Mount Rushmore parking 10 AM–4 PM" },
        { label: "Roads to ride (during rally)", value: "Spearfish Canyon at sunrise, Needles Highway after 6 PM, all forest gravel anytime" },
        { label: "Helmet law", value: "South Dakota: no helmet required for adults. Bring one anyway." },
      ],
    },
    faq: [
      {
        q: "When is the Sturgis Motorcycle Rally?",
        a: "The official rally runs early August each year — typically the first or second week. Rally 2026 is August 1–10. Crowds start arriving 5-7 days before the official kickoff and linger for 3-4 days after. If you want to experience the rally, book for those dates. If you want to ride the Black Hills with elbow room, come in June, July, or September.",
      },
      {
        q: "Why rent in Rapid City instead of Sturgis itself?",
        a: "Rapid City is 30 minutes south on I-90 — close enough to commute to the rally daily, but far enough to escape the noise and find lodging. Sturgis itself only has rental shops during rally week, prices spike, and reservations close fast. Our base in Rapid City is open all season at the same $130/day rate.",
      },
      {
        q: "Can I ride to Sturgis on a Royal Enfield Himalayan?",
        a: "Absolutely. The Himalayan is happy on the highway between Rapid City and Sturgis — about 30 minutes on I-90 — and shines in the Black Hills surrounding the town. The rally has been almost entirely cruiser-dominated for decades, but adventure bikes are a growing presence and Royal Enfield has had an official presence at Sturgis since 2018.",
      },
      {
        q: "Is the Sturgis Rally too crowded to enjoy?",
        a: "The rally itself (Main Street, downtown Sturgis) is intense — that's the point. The surrounding Black Hills are still rideable if you go early or late and avoid the obvious tourist corridors. Spearfish Canyon at 6 AM is empty. Needles Highway after sunset is empty. Forest gravel is empty year-round. Pick your routes and you'll have the best riding of your life.",
      },
      {
        q: "How much does motorcycle rental cost during Sturgis?",
        a: "Vintage Rides USA charges the same $130/day during rally week as the rest of the season — no surge pricing. Most local Harley rental shops 2x or 3x their rates for early August. Book us early; rally-week dates fill 3-6 months in advance.",
      },
    ],
    relatedSlugs: [
      "black-hills-motorcycle-rental",
      "needles-highway-motorcycle-tour",
      "mount-rushmore-motorcycle-rental",
    ],
  },

  "badlands-motorcycle-rental": {
    slug: "badlands-motorcycle-rental",
    metaTitle: "Badlands Motorcycle Rental — Royal Enfield Himalayan 450 | Vintage Rides USA",
    metaDescription:
      "Rent a Royal Enfield Himalayan 450 in Rapid City to ride the Badlands National Park loop. 1h from base. Adventure bike for an alien landscape. $130/day, May–September.",
    ogImage: "/hero-bike-outdoor.jpg",
    heroImage: "/bike-outdoor-cliff.jpg",
    eyebrow: "Badlands Motorcycle Rental",
    h1: "Ride the",
    h1Accent: "Badlands",
    intro:
      "The Badlands feel like another planet — eroded spires, striped clay, prairie grass disappearing into canyons. SD-240 (the Badlands Loop) is one of the most scenic 39 miles of road in North America, and on a motorcycle it's a different experience entirely. From our Rapid City base, you're at the western park entrance in under an hour.",
    stats: [
      { label: "Distance from base", value: "60 mi (~1h)" },
      { label: "Park entry", value: "$15 motorcycle (1 rider)" },
      { label: "Recommended duration", value: "Half-day or full day" },
      { label: "Best months", value: "May–June, September" },
    ],
    whyHimalayan: {
      title: "Why a Himalayan in the Badlands",
      body:
        "The Badlands park itself is paved (SD-240 Loop Road is good asphalt), but the magic is the gravel BLM and forest roads connecting it to the surrounding grasslands. Sage Creek Rim Road, Sheep Mountain Table, and the Buffalo Gap National Grassland tracks are all gravel-dirt. A cruiser is fine for the loop, painful for everything else. The Himalayan handles both.",
      bullets: [
        "Light enough for Sage Creek Rim Road's washboard gravel",
        "Long-travel suspension absorbs the prairie heat-cracked tarmac",
        "Compact size makes the Pinnacles overlooks a quick park-and-shoot",
        "Tank range (~400 mi) means no fuel stress on a 250-mi day",
      ],
    },
    routesTitle: "Best Badlands rides from Rapid City",
    routes: [
      {
        name: "Badlands Loop classic",
        miles: "~150 mi roundtrip",
        ridingTime: "Half-day",
        highlights: "SD-240 Loop · Pinnacles · Yellow Mounds · Wall Drug",
        description:
          "Rapid City → I-90 east to Wall (Wall Drug if you must) → SD-240 Pinnacles entrance → full Badlands Loop Road past Yellow Mounds, Pinnacles Overlook, Big Badlands Overlook → exit at Cactus Flat → return via I-90. The classic. Doable in 4-5 hours.",
      },
      {
        name: "Badlands + Sage Creek gravel",
        miles: "~200 mi",
        ridingTime: "Full day",
        highlights: "Sage Creek Rim Road · Robert's Prairie Dog Town · Bison herds",
        description:
          "Same start, but instead of the paved loop, branch off at the Pinnacles entrance onto Sage Creek Rim Road — gravel for ~25 miles through the bison-heavy backcountry. Park policy says give bison 100 yards. The Himalayan ADV setup makes this section possible without a separate dual-sport.",
      },
      {
        name: "Badlands + Black Hills (epic day)",
        miles: "~300 mi",
        ridingTime: "Long day or 2 days",
        highlights: "Badlands Loop · Wall · Rapid City · Mount Rushmore · Iron Mountain Road",
        description:
          "Combine both icons in one trip. Morning: Badlands Loop. Lunch: Wall. Afternoon: Black Hills via Mount Rushmore + Iron Mountain Road. Doable in one long summer day with the Himalayan's 400-mile tank range, more comfortable as a 2-day rental.",
      },
    ],
    knowBefore: {
      title: "Badlands rental tips",
      items: [
        { label: "Park entry fee", value: "$15 per motorcycle (single rider) — not included in rental" },
        { label: "Pickup", value: "1715 Samco Rd, Rapid City, SD — 1h to park west entrance" },
        { label: "Best time of day", value: "Sunrise (6-8 AM) or late afternoon (4-7 PM) — light is everything" },
        { label: "Avoid", value: "Mid-day July/August — surface temps on the formations can hit 130°F" },
        { label: "Water", value: "Carry 2L+. No services inside the park between Pinnacles and Cactus Flat." },
        { label: "Wildlife", value: "Bison, pronghorn, prairie dogs, rattlesnakes. Stay on roads, give bison 100 yards." },
      ],
    },
    faq: [
      {
        q: "How far is the Badlands from Rapid City?",
        a: "About 60 miles (~1 hour) on I-90 east to Wall, then south on SD-240 to the Pinnacles entrance. From our base at 1715 Samco Rd, you can be inside the park before 10 AM if you pick up your bike at 9.",
      },
      {
        q: "Can you ride a motorcycle through Badlands National Park?",
        a: "Yes. SD-240 (the Badlands Loop Road) is a paved 39-mile scenic byway open to motorcycles year-round (weather permitting). Park admission is $15 per motorcycle. Speed limits are 35-45 mph — slow enough to actually look around. There are 14+ named overlooks; Pinnacles, Yellow Mounds, and Big Badlands are the must-stops.",
      },
      {
        q: "Is one day enough for the Badlands?",
        a: "For the paved loop, yes — half a day is plenty. For the full experience (Sage Creek Rim Road, Roberts Prairie Dog Town, Sheep Mountain Table, sunrise + sunset light), plan a full day. Most riders combine Badlands with the Black Hills in a 2-3 day rental.",
      },
      {
        q: "Are the Badlands ridable on any motorcycle?",
        a: "The paved Loop Road, yes — including cruisers. For Sage Creek Rim Road and the gravel grassland tracks, you want an adventure or dual-sport bike. The Royal Enfield Himalayan 450 handles both without compromise.",
      },
      {
        q: "What should I bring for a Badlands ride?",
        a: "Water (2L minimum — there are no services between Pinnacles and Cactus Flat), sunscreen, sunglasses, a wind/dust layer (the prairie wind is real), and your camera. Don't bring food into the park if you'll stop near prairie dog towns — they're aggressive.",
      },
    ],
    relatedSlugs: [
      "black-hills-motorcycle-rental",
      "mount-rushmore-motorcycle-rental",
      "sturgis-motorcycle-rental",
    ],
  },

  "needles-highway-motorcycle-tour": {
    slug: "needles-highway-motorcycle-tour",
    metaTitle: "Needles Highway Motorcycle Tour — Royal Enfield Himalayan 450 | Vintage Rides USA",
    metaDescription:
      "Ride the Needles Highway on a 2025 Royal Enfield Himalayan 450. The most spectacular 14 miles in South Dakota. Rent in Rapid City, $130/day, May–September.",
    ogImage: "/hero-bike-outdoor.jpg",
    heroImage: "/bike-outdoor-cliff.jpg",
    eyebrow: "Needles Highway Motorcycle Tour",
    h1: "Ride the",
    h1Accent: "Needles Highway",
    intro:
      "The Needles Highway (SD-87) is the single most spectacular 14 miles of motorcycle road in South Dakota. Granite spires that look hand-stacked, single-vehicle tunnels carved through stone (the famous Needle's Eye is 8'9\" wide), tight switchbacks at the cathedral spires, and Sylvan Lake at the north end. Built in 1922, it was specifically designed to be a scenic drive — modern engineers wouldn't approve, riders love it for that.",
    stats: [
      { label: "Distance", value: "14 mi (one-way)" },
      { label: "Riding time", value: "1h with stops" },
      { label: "Tunnels", value: "3 (narrowest 8'9\")" },
      { label: "Park", value: "Custer State Park" },
    ],
    whyHimalayan: {
      title: "Why the Himalayan owns the Needles",
      body:
        "The Needles Highway is the test case for why an adventure bike beats a cruiser in the Black Hills. The 8'9\" Needle's Eye tunnel is wider than your bike but the lane through it is single-vehicle — you stop, wait, ride through. The pigtail switchbacks at the cathedral spires are tight enough that big tourers crab through them. The Himalayan eats this terrain.",
      bullets: [
        "196 kg kerb weight — lean angle through the pigtails feels natural",
        "825mm seat height — you flat-foot at the Needle's Eye stop",
        "USD forks + 200mm travel — the unevenly cracked tunnel approaches don't matter",
        "Naked-bike riding position — you actually see the spires above",
      ],
    },
    routesTitle: "How to ride the Needles Highway",
    routes: [
      {
        name: "Needles Highway only (south to north)",
        miles: "~14 mi",
        ridingTime: "1–1.5h with stops",
        highlights: "Cathedral Spires · Needle's Eye Tunnel · Sylvan Lake",
        description:
          "Enter Custer State Park from US-16A south of Custer, take SD-87 north (the Needles Highway). Stop at Cathedral Spires Overlook, ride through the Needle's Eye tunnel, exit at Sylvan Lake. Park, walk the lake, photo. Total 1.5h with stops. Pair with the rest of Custer State Park for a half-day.",
      },
      {
        name: "The full Custer State Park loop",
        miles: "~70 mi",
        ridingTime: "Half-day",
        highlights: "Needles Highway · Wildlife Loop · Iron Mountain Road · Stockade Lake",
        description:
          "Better day. Needles Highway south-to-north → Sylvan Lake → SD-89 to the Wildlife Loop (bison, pronghorn, friendly donkeys at the road) → Iron Mountain Road south to north (pigtail bridges + tunnels framing Mount Rushmore) → return through Custer. The full Custer State Park experience.",
      },
      {
        name: "Black Hills loop (Needles included)",
        miles: "~250 mi",
        ridingTime: "Full day or 2 days",
        highlights: "Mount Rushmore · Iron Mountain Road · Needles · Wildlife Loop · Hill City",
        description:
          "The full classic. Rapid City → US-16 to Keystone → Iron Mountain Road → Custer State Park Wildlife Loop → Needles Highway → Sylvan Lake → return via Hill City. The Needles is the highlight; everything else makes it a complete day.",
      },
    ],
    knowBefore: {
      title: "Needles Highway tips",
      items: [
        { label: "Park entry", value: "Custer State Park entrance pass — INCLUDED with your rental" },
        { label: "Tunnel widths", value: "Needle's Eye 8'9\" / Iron Creek 9'8\" / Hood 10'7\"" },
        { label: "Direction", value: "South-to-north (US-16A → Sylvan Lake) is the more scenic ride" },
        { label: "Best time", value: "Early morning (7-9 AM) or evening (after 5 PM) — empty road" },
        { label: "Closed in winter", value: "October to early May — snow closes the highway" },
        { label: "Speed limit", value: "25 mph posted, but realistic average is 20 mph with stops" },
      ],
    },
    faq: [
      {
        q: "How long does it take to ride the Needles Highway?",
        a: "The road itself is 14 miles. Pure riding: 30-45 minutes at the 25 mph speed limit. With stops at Cathedral Spires Overlook and Sylvan Lake (both worth it), plan 1-1.5 hours. Most riders pair it with Iron Mountain Road and the Wildlife Loop for a half-day in Custer State Park.",
      },
      {
        q: "Is the Needle's Eye Tunnel scary on a motorcycle?",
        a: "It's tight but bike-friendly. The tunnel is 8'9\" wide and 12'3\" tall — your Himalayan is around 35\" wide at the bars. The lane is single-vehicle in both directions, so you stop at the entrance, wait if oncoming, then ride through. The approach is the trickiest part: tight, downhill switchback right before. Take it at 10 mph and you'll be fine.",
      },
      {
        q: "Can a beginner motorcyclist ride the Needles Highway?",
        a: "It's challenging but doable for a confident beginner. The road is 25 mph, the curves are tight but not technical, and traffic enforces a slow pace. The single-vehicle tunnels require comfortable low-speed riding. We recommend at least one full season of street riding before tackling it.",
      },
      {
        q: "When is the Needles Highway open?",
        a: "Early May through October (weather permitting). The South Dakota Department of Transportation closes SD-87 when snow accumulates. We recommend May to September for the best riding — exactly the season Vintage Rides USA operates.",
      },
      {
        q: "Do I need a permit or pass for the Needles Highway?",
        a: "The Needles Highway is inside Custer State Park, which charges $25 per motorcycle for a 7-day entrance pass. Vintage Rides USA includes the Custer State Park pass with every rental — you don't pay anything extra at the gate.",
      },
    ],
    relatedSlugs: [
      "black-hills-motorcycle-rental",
      "mount-rushmore-motorcycle-rental",
      "badlands-motorcycle-rental",
    ],
  },

  "mount-rushmore-motorcycle-rental": {
    slug: "mount-rushmore-motorcycle-rental",
    metaTitle: "Mount Rushmore Motorcycle Rental — Royal Enfield Himalayan 450 | Vintage Rides USA",
    metaDescription:
      "Rent a Royal Enfield Himalayan 450 in Rapid City and ride to Mount Rushmore via the iconic Iron Mountain Road. 30 minutes from base. $130/day, May–September.",
    ogImage: "/hero-bike-outdoor.jpg",
    heroImage: "/bike-studio.jpg",
    eyebrow: "Mount Rushmore Motorcycle Rental",
    h1: "Ride to",
    h1Accent: "Mount Rushmore",
    intro:
      "Mount Rushmore is the iconic shot, but the road getting there is the real ride. Iron Mountain Road (US-16A) is the 17-mile masterpiece: pigtail bridges that loop back over themselves, three single-vehicle tunnels each precisely framing the four faces, and tight switchbacks through ponderosa pine. From our Rapid City base it's a 30-minute warm-up to the most photographed ride in the Black Hills.",
    stats: [
      { label: "Distance from base", value: "30 mi (~30 min direct)" },
      { label: "Better route", value: "60 mi via Iron Mountain Road" },
      { label: "Park entry", value: "Free (Mt Rushmore is free; parking $10)" },
      { label: "Recommended duration", value: "Half-day to full-day" },
    ],
    whyHimalayan: {
      title: "Why a Himalayan to Mount Rushmore",
      body:
        "Anyone can ride to Mount Rushmore. Locals have been doing it on cruisers for 80 years. The reason to do it on a Himalayan: the routes worth riding aren't the direct ones. Iron Mountain Road, Norbeck Memorial Highway, Centennial Trail crossings — these are tight, technical, and best on a bike that turns. The Himalayan's 196 kg + ADV ergonomics make every photo stop a pleasure.",
      bullets: [
        "Light + tall = the pigtail switchbacks feel natural",
        "Centerstand makes parking at every overlook quick",
        "ADV riding position = visibility through the tunnels",
        "Single-cylinder = quiet enough for the Mount Rushmore evening lighting ceremony",
      ],
    },
    routesTitle: "Best Mount Rushmore rides from Rapid City",
    routes: [
      {
        name: "Iron Mountain Road (the must-ride approach)",
        miles: "~60 mi roundtrip",
        ridingTime: "Half-day",
        highlights: "Iron Mountain Road · 3 tunnels · 2 pigtail bridges · Mount Rushmore",
        description:
          "Skip US-16. Take US-16A south from Keystone or US-16A north from Custer onto Iron Mountain Road. 17 miles of engineered-for-tourism perfection: three single-vehicle tunnels each cut at the exact angle that frames the four faces, two wood pigtail bridges that loop back over themselves, two switchback sections through ponderosa pine. Built 1933 — Peter Norbeck specifically designed it to be a scenic motoring experience. It still works.",
      },
      {
        name: "Mount Rushmore + Custer State Park loop",
        miles: "~120 mi",
        ridingTime: "Full day",
        highlights: "Iron Mountain Road · Mount Rushmore · Custer State Park · Needles Highway",
        description:
          "Better day. Rapid City → Keystone → Iron Mountain Road → Mount Rushmore (allow 1h on site) → continue south into Custer State Park → Wildlife Loop → Needles Highway → Sylvan Lake → return via Hill City. Hits the four big icons of the southern Black Hills in one ride.",
      },
      {
        name: "Mount Rushmore evening lighting ceremony",
        miles: "~70 mi",
        ridingTime: "Half-day evening",
        highlights: "Iron Mountain at sunset · Lighting ceremony · Night ride home",
        description:
          "Memorial Day to mid-August only. Ride out late afternoon via Iron Mountain Road (golden hour through the pines is unreal). Arrive Mount Rushmore by 8 PM. Lighting ceremony at 9 PM. Ride home in the cool night air via the direct route (US-16). One of the best evenings you'll have on a bike.",
      },
    ],
    knowBefore: {
      title: "Mount Rushmore rental tips",
      items: [
        { label: "Distance from base", value: "30 min direct, or 1h scenic via Iron Mountain Road" },
        { label: "Memorial admission", value: "Free. Parking is $10 (good for the year)." },
        { label: "Best route", value: "Iron Mountain Road (US-16A) — never the direct US-16" },
        { label: "Avoid", value: "9 AM–4 PM peak summer (parking lot fills, traffic crawls)" },
        { label: "Best time", value: "First hour after opening (8 AM) or for the evening lighting ceremony" },
        { label: "Tunnel widths on Iron Mountain", value: "Doane Robinson 13'2\" / Scovel Johnson 12'5\" / C.C. Gideon 12'9\"" },
      ],
    },
    faq: [
      {
        q: "How far is Mount Rushmore from Rapid City?",
        a: "About 30 miles (~30 minutes direct) via US-16. But the better ride is via Iron Mountain Road (US-16A) — about 60 miles total, doubling the distance for triple the experience. Iron Mountain Road is the reason riders come to the Black Hills.",
      },
      {
        q: "Can you ride to Mount Rushmore on a motorcycle?",
        a: "Absolutely — Mount Rushmore has a dedicated motorcycle parking area. Memorial admission is free; parking is $10 (good for the calendar year). Most riders combine the visit with Iron Mountain Road on the way in, plus Custer State Park on the way back, making it a half-to-full-day ride.",
      },
      {
        q: "What is Iron Mountain Road?",
        a: "Iron Mountain Road is the 17-mile section of US-16A between Keystone and Custer State Park, designed in 1933 by Peter Norbeck specifically as a scenic motoring experience. It features 314 curves, 14 switchbacks, three single-vehicle tunnels (each precisely framing the Mount Rushmore faces), and two wood pigtail bridges. It's universally considered the most engineered-for-pleasure motorcycle road in the Midwest.",
      },
      {
        q: "Is the evening lighting ceremony at Mount Rushmore worth it?",
        a: "Yes, especially on a motorcycle. The 30-minute ranger talk + lighting at 9 PM (Memorial Day to mid-August) is genuinely moving. Crowd disperses fast after. The ride home in cool night air is the perfect end. Bring a layer — temperature drops 15°F after sunset in the Hills.",
      },
      {
        q: "How much time do I need at Mount Rushmore?",
        a: "1-2 hours for the visit itself: amphitheater photo, the Avenue of Flags, the Sculptor's Studio, the brief Presidential Trail walk. Combined with Iron Mountain Road both ways, plan a half-day. Combined with Custer State Park afterwards, plan a full day. The two are 30 minutes apart and pair perfectly.",
      },
    ],
    relatedSlugs: [
      "black-hills-motorcycle-rental",
      "needles-highway-motorcycle-tour",
      "sturgis-motorcycle-rental",
    ],
  },
};

export const DESTINATION_SLUGS = Object.keys(DESTINATIONS);
