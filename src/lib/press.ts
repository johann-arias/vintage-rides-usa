// Press coverage of the Royal Enfield × Vintage Rides partnership, August 2026.
//
// Two things to know before editing this file.
//
// 1. The Royal Enfield page below is not press, it is the manufacturer
//    describing the exact rental we sell — Rapid City, the Himalayan 450 fleet,
//    the Black Hills Blast, the park passes, Mike & Wendy by name. It is the
//    strongest proof we have and it is what every "Official Partner" badge on
//    the site links to. Keep it separate from the coverage list.
//
// 2. Nine of the ten pickups are the same Royal Enfield press release rewritten,
//    and most of them cover the *guided tours* launching in the US rather than
//    the Rapid City rental. So `quote` carries original reporting only, never a
//    line lifted from the release and republished — that would be quoting
//    ourselves through someone else's masthead. Outlets we could not read
//    first-hand (bot protection / paywall) live in ALSO_COVERED_BY with no
//    headline attributed to them.

// Royal Enfield's own page about the Rapid City operation.
export const ROYAL_ENFIELD_PARTNER_URL =
  "https://www.royalenfield.com/us/en/our-world/vintage-rides-usa/";

export type PressItem = {
  outlet: string;
  headline: string;
  url: string;
  date: string;
  /** Original reporting only. Null when the piece runs the release verbatim. */
  quote: string | null;
  /**
   * A syndication of the same piece. Kept as a secondary line rather than its
   * own entry: Yahoo runs RideApart's article verbatim, so listing it twice
   * reads as padding even though the link is real. This way the recognisable
   * masthead still appears and the list stays honest.
   */
  alsoAt?: { outlet: string; url: string };
};

// Ordered by what a cold US rider actually recognises and cares about.
export const PRESS_COVERAGE: PressItem[] = [
  {
    outlet: "RideApart",
    headline:
      "Royal Enfield Wants To Prove You Don't Need A Giant Bike To Tour America",
    url: "https://www.rideapart.com/news/804882/royal-enfield-vintage-rides-partnership-sturgis-2026/",
    date: "August 17, 2026",
    quote: null,
    alsoAt: {
      outlet: "Yahoo Autos",
      url: "https://autos.yahoo.com/new-vehicles-and-reviews/articles/royal-enfield-wants-prove-don-120200603.html",
    },
  },
  {
    outlet: "Cycle News",
    headline: "Royal Enfield Partners With Vintage Rides",
    url: "https://www.cyclenews.com/2026/08/article/royal-enfield-partners-with-vintage-rides/",
    date: "August 11, 2026",
    quote: null,
  },
  {
    outlet: "ADV Pulse",
    headline: "Royal Enfield Announces Launch Of Adventure Tours In The U.S.",
    url: "https://www.advpulse.com/adv-news/royal-enfield-announces-launch-of-adventure-tours-in-the-u-s/",
    date: "August 12, 2026",
    quote: null,
  },
  {
    outlet: "SportBikes Inc Magazine",
    headline: "Royal Enfield Vintage Rides Tours Launch in the Black Hills",
    url: "https://sportbikesincmag.com/royal-enfield-vintage-rides-black-hills-2026/",
    date: "August 10, 2026",
    quote:
      "Vintage Rides' North American fleet is based in the Black Hills, stocked with travel-prepared Royal Enfields available for rental.",
  },
  {
    outlet: "Total Motorcycle",
    headline:
      "Royal Enfield North America Partners With Vintage Rides To Launch Motorcycle Tours In The United States",
    url: "https://www.totalmotorcycle.com/royal-enfield-north-america-partners-with-vintage-rides-to-launch-motorcycle-tours-in-the-united-states/",
    date: "August 13, 2026",
    quote: null,
  },
];

// Covered the announcement too. Listed by name only: their sites block us, so we
// have not read the pieces ourselves and will not put words in their mouths.
export const ALSO_COVERED_BY: { outlet: string; url: string }[] = [
  {
    outlet: "ADV Rider",
    url: "https://www.advrider.com/royal-enfield-launches-us-adv-tours-in-partnership-with-vintage-rides/",
  },
  {
    outlet: "Cycle Trader",
    url: "https://www.cycletrader.com/blog/2026/08/10/royal-enfield-launches-u-s-motorcycle-tours-with-vintage-rides/",
  },
  {
    outlet: "Motorcycle & Powersports News",
    url: "https://www.motorcyclepowersportsnews.com/royal-enfield-north-america-vintage-rides-motorcycle-tours-us/",
  },
];

// The line that does conversion work, not just credibility work: the only real
// objection a US rider has in front of a 450 in Harley country is whether it is
// enough bike. RideApart answers it in a headline, so it leads every surface.
export const PRESS_PULL_QUOTE = {
  text: "Royal Enfield wants to prove you don't need a giant bike to tour America.",
  outlet: "RideApart",
  date: "August 2026",
  url: "https://www.rideapart.com/news/804882/royal-enfield-vintage-rides-partnership-sturgis-2026/",
} as const;

// Short strip shown on the homepage and in the /book rail. Deliberately four
// names, not ten: a US rider knows these, and the trade titles behind them
// dilute rather than reinforce. The full list lives on /press.
export const FEATURED_OUTLETS = [
  "ADV Rider",
  "RideApart",
  "Cycle News",
  "Yahoo Autos",
] as const;
