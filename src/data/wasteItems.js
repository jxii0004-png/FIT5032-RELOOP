export const wasteItems = [
  {
    id: 1,
    names: ["tv", "television"],
    displayName: "Television",
    category: "Electronic waste",
    options: {
      working: "Donate or sell the television so it can be reused.",
      repairable: "Take it to an electronics repair service.",
      broken: "Take it to an approved e-waste collection point.",
    },
  },
  {
    id: 2,
    names: ["phone", "mobile phone", "smartphone"],
    displayName: "Mobile Phone",
    category: "Electronic waste",
    options: {
      working: "Donate, sell or pass the phone to another user.",
      repairable: "Repair the phone to extend its useful life.",
      broken: "Recycle it through an approved e-waste collection service.",
    },
  },
  {
    id: 3,
    names: ["clothes", "clothing", "shirt", "jacket"],
    displayName: "Clothing",
    category: "Textiles",
    options: {
      working: "Donate or sell clean clothing for reuse.",
      repairable: "Repair, alter or upcycle the clothing.",
      broken: "Use a textile recycling service where available.",
    },
  },
  {
    id: 4,
    names: ["battery", "batteries"],
    displayName: "Battery",
    category: "Hazardous waste",
    options: {
      working: "Continue using the battery until it is depleted.",
      repairable: "Do not attempt to repair damaged batteries.",
      broken: "Take it to a battery recycling collection point.",
    },
  },
  {
    id: 5,
    names: ["chair", "table", "furniture"],
    displayName: "Furniture",
    category: "Household item",
    options: {
      working: "Donate, sell or give the furniture to another person.",
      repairable: "Repair or restore the furniture before replacing it.",
      broken: "Check local hard-waste or material recycling services.",
    },
  },
];
