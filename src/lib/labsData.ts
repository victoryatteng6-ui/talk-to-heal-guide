// Curated seed data for Nigerian diagnostic labs (illustrative, can be replaced
// by a live API in Phase 2). Coordinates approximate.
export interface Lab {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  tests: ("Malaria" | "Typhoid" | "HIV" | "Blood Sugar" | "Cholesterol" | "COVID-19")[];
  phone: string;
  whatsapp?: string;
  priceFromNGN: number;
}

export const LABS: Lab[] = [
  {
    id: "synlab-vi", name: "Synlab Nigeria — Victoria Island", city: "Lagos",
    address: "Plot 1681, Sanusi Fafunwa St, Victoria Island", lat: 6.4308, lng: 3.4218,
    tests: ["Malaria", "Typhoid", "HIV", "Blood Sugar", "Cholesterol", "COVID-19"],
    phone: "+2348000000001", whatsapp: "2348000000001", priceFromNGN: 3500,
  },
  {
    id: "clina-lancet", name: "Clina-Lancet Laboratories — Ikoyi", city: "Lagos",
    address: "5 Babatunde Jose St, Ikoyi", lat: 6.4549, lng: 3.4346,
    tests: ["Malaria", "Typhoid", "HIV", "Blood Sugar", "Cholesterol"],
    phone: "+2348000000002", whatsapp: "2348000000002", priceFromNGN: 4000,
  },
  {
    id: "afriglobal-ikeja", name: "Afriglobal Medicare — Ikeja", city: "Lagos",
    address: "1 Adeyemo Akapo St, Omole Phase 1", lat: 6.6353, lng: 3.3614,
    tests: ["Malaria", "Typhoid", "Blood Sugar", "COVID-19"],
    phone: "+2348000000003", whatsapp: "2348000000003", priceFromNGN: 3000,
  },
  {
    id: "echolab-yaba", name: "EchoScan Diagnostics — Yaba", city: "Lagos",
    address: "11 Commercial Ave, Yaba", lat: 6.5066, lng: 3.3735,
    tests: ["Malaria", "Typhoid", "HIV"],
    phone: "+2348000000004", priceFromNGN: 2500,
  },
  {
    id: "medbury-lekki", name: "Medbury Medical — Lekki", city: "Lagos",
    address: "5b Admiralty Way, Lekki Phase 1", lat: 6.4441, lng: 3.4720,
    tests: ["Malaria", "Typhoid", "Cholesterol", "COVID-19"],
    phone: "+2348000000005", whatsapp: "2348000000005", priceFromNGN: 4500,
  },
  {
    id: "synlab-abuja", name: "Synlab Nigeria — Wuse 2", city: "Abuja",
    address: "Plot 234 Aminu Kano Cres, Wuse 2", lat: 9.0820, lng: 7.4870,
    tests: ["Malaria", "Typhoid", "HIV", "Blood Sugar"],
    phone: "+2348000000006", whatsapp: "2348000000006", priceFromNGN: 3500,
  },
  {
    id: "med-plus-abuja", name: "MedPlus Diagnostics — Garki", city: "Abuja",
    address: "Area 11 Garki, Abuja", lat: 9.0330, lng: 7.4900,
    tests: ["Malaria", "Typhoid", "Cholesterol"],
    phone: "+2348000000007", priceFromNGN: 3000,
  },
  {
    id: "union-diag-ph", name: "Union Diagnostics — Port Harcourt", city: "Port Harcourt",
    address: "12 Aba Rd, Port Harcourt", lat: 4.8156, lng: 7.0498,
    tests: ["Malaria", "Typhoid", "HIV", "Blood Sugar", "Cholesterol"],
    phone: "+2348000000008", whatsapp: "2348000000008", priceFromNGN: 2800,
  },
];

export const ALL_TESTS = ["Malaria", "Typhoid", "HIV", "Blood Sugar", "Cholesterol", "COVID-19"] as const;
