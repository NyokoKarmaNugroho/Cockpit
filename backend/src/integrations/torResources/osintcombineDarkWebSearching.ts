/**
 * Structured investigator reference derived from OSINT Combine’s article
 * “Dark Web Searching” (updated Mar 25, 2025).
 *
 * Use for agent context only — not legal advice. Verify .onion addresses over time;
 * phishing clones are common. Original: https://www.osintcombine.com/post/dark-web-searching
 */

export const OSINT_COMBINE_DARK_WEB_SEARCHING = {
  source: {
    title: "Dark Web Searching",
    publisher: "OSINT Combine",
    author: "Chris Poulter",
    url: "https://www.osintcombine.com/post/dark-web-searching",
    note: "Summarized capabilities for Cockpit agents; read the primary source for full detail and disclaimers.",
  },

  terminology: {
    darknet:
      "Network infrastructure (e.g. Tor, I2P) versus dark web as the content layer accessed via special tools.",
  },

  dark_nets: [
    {
      name: "Tor",
      summary: "Onion routing; supports .onion and clearnet via Tor Browser.",
      access: "https://www.torproject.org/",
      download: "https://www.torproject.org/download/",
    },
    {
      name: "I2P",
      summary: "Garlic routing; peer-to-peer; can be slow.",
      access: "https://geti2p.net/en/",
    },
    {
      name: "Hyphanet (formerly Freenet)",
      summary: "Anonymous publishing; peer bandwidth/storage sharing.",
      access: "https://www.hyphanet.org/pages/download.html",
    },
    {
      name: "Zeronet",
      summary: "Decentralised sites using Bitcoin crypto and BitTorrent-style distribution.",
      access: "https://zeronet.io/",
    },
  ],

  safe_browsing_patterns: [
    "Cloud VM (e.g. AWS WorkSpaces, GCP, Azure VDI, Paperspace) with Tor/darknet client on the VM; optional VPN.",
    "Local VM (e.g. VirtualBox, Trace Labs-style images) + VPN on host; Tor inside VM.",
    "Dedicated research device or Tails-style boot OS + VPN; lower attribution than everyday workstation.",
  ],

  /** Finding current search-engine onions when links rot */
  onion_link_finders_clearnet: ["https://onion.live/", "https://tor.link"],

  directories_and_lists: [
    {
      name: "Tor Taxi",
      role: "Curated links and uptime-style monitoring; darknet events journal.",
      onion: "http://tortaxi2dev6xjwbaydqzla77rrnth7yn2oqzjfmiuwn5h6vsk2a4syd.onion/",
    },
    {
      name: "Dark Fail (onion)",
      role: "Verified links; PGP verification emphasis per article — still verify independently.",
      onion: "http://darkfailenbsdla5mal2mxn2uz66od5vtzd5qozslagrfzachha3f3id.onion/",
      clearnet_mirror_note: "Also discussed: https://dark.fail/ — treat as untrusted until cross-verified.",
    },
  ],

  search_engines: [
    {
      name: "Ahmia",
      summary: "Open-source Tor HS search; clearnet mirror and abuse stance per project.",
      onion: "http://juhanurmihxlp77nkq76byazcldy2hlmovfu2epvl5ankdibsot4csyd.onion",
      clearnet: "https://ahmia.fi/",
    },
    {
      name: "Haystack (Haystak)",
      summary: "Privacy-advocate–oriented crawler; claims broad coverage — coverage varies.",
      onion: "http://haystak5njsmn2hqkewecpaxetahtwhsbsa64jom2k22z5afxhnpxfid.onion",
    },
    {
      name: "Tor66",
      summary: "Homepage-focused indexing per article; may limit depth.",
      onion: "http://tor66sewebgixwhcqfnp5inzp5x5uohhdy3kvtnyfxc2e5mxiuh34iid.onion",
    },
    {
      name: "Torch",
      summary: "Long-running engine; large claimed index; staleness possible.",
      onion: "http://xmh57jrknzkhv6y3ls3ubitzfqnkrwxhopf5aygthi7d6rplyvk3noyd.onion",
    },
    {
      name: "OnionLand",
      summary: "Tor hidden services and I2P eepsites.",
      onion: "http://3bbad7fauom4d6sgppalyqddsqbf5u5p56b5k5uk2zxsy3d6ey2jobad.onion",
    },
  ],

  onion_watching: [
    {
      name: "DarkWebSitesLinks",
      onion: "http://darkwev6xtagl7742tqu24v2j4namr5ocfsfpha74a5nh4bwyp27a3ad.onion",
      summary: "Tools/marketplace-oriented overview content per article.",
    },
    {
      name: "Tor Links",
      onion: "http://torlinksge6enmcyyuxjpjkoouw4oorgdgeo7ftnq3zodj7g2zxi3kyd.onion",
      summary: "Metadata-rich .onion index (language, title, description).",
    },
    {
      name: "Tor66 Fresh Onions",
      onion: "http://tor66sewebgixwhcqfnp5inzp5x5uohhdy3kvtnyfxc2e5mxiuh34iid.onion/fresh",
      summary: "Rolling new .onion list; article warns explicit/illicit material may appear — legal/ethical boundaries apply.",
      caution: "High risk of disturbing or illegal content; organizational policy and law come first.",
    },
  ],

  investigation_concepts: {
    information_slippage:
      "Linking dark-web activity to clearnet via reused usernames, PGP keys, crypto addresses, or metadata — attribution often from weak OPSEC; false positives are common.",
    multi_engine_strategy:
      "No single engine indexes all Tor content; compare engines and specialize queries where appropriate.",
  },

  safety_and_legal: [
    "Dark-web content may be illegal or harmful; follow law, policy, and ethics.",
    "TOR2WEB-style clearnet proxies for onion content are called out as risky for attribution in the article.",
    "Anything rendered may leave local caches — plan retention and legal review accordingly.",
  ],
} as const;
