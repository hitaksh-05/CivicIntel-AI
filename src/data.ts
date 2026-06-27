import { SubsystemStatus, LiveKPI, IncidentMarker, KanbanTicket, MaintenanceItem } from "./types";

export const IMAGES = {
  bridgeWireframe: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPVXE2dH0bipn8xGcKTkl9vVIlSrw-s9YJmSUnV2hL6DeOG3qEsolIT01E_tzLKrT1Qc0gBuTTzBrrkhLBScL3FvaCNQbRHS-nX36i6pSdD5B1A8WhuvafyibKrLVSff7iNumcRdyZFng4qKJIjO704cKwsEHWgRwN3uFC_cr08IgXGVWP6jbF6qFH1Z5NI3L4veB8Za_BjLLqIS5-mvoC4Q8lRk38xY1U_CLyBoCHobPlTgxg-iWiSmEjlp_LAKl5e7EJCn-3v7I",
  spatialHeatmap: "https://lh3.googleusercontent.com/aida-public/AB6AXuBL2RTrJTlSp9CQvx9zQHjrSwTnKyE7-dWj90Rz9jplnYajewGEbLDPegze02HjY9EpzgWXppcFcNjd-A1oUuJRL2PDg5iZIWg__t1RrqTwV-orGjChhWK-0bfMV3yHooqOhGRdDiMF8Cv-2P1dqpcixLal26ccHdH_OpgACJK6FS1AdgxZKDEjBnaVvgxeP6dy1IuqzaeWJHFvdGAO06FJSqR2lBCaWQOYMS7APSlOfMshqju1bJxt_MCFZnVrOXUzLOpJShPw0qw",
  cityMapBg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyS1hhox1UtVZltKJxFQog-oCnbvOwXx_uNRKvpjG12WgjQFsKo9iz9Xsj1Z4mi1hVX82k4bnWZfuylqclVPGbq4pc9bX-ksTsnvlXf49jlnBMKvYyAy_TRdbFtedC0lXzSBK36VqUv0yoX-KcAPS1UNmjyKslWLw1OLf2YLqO-W7WJwImor1xfPKPwImB8XGnJfdysUFMZaDEno982Q9paUm4LmFEjkUkx9zFeCTk0J35aMrOqcCGsVAFsuhv-G0vFG-ZarWaAjc",
  bridgeCrack: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwZOQxZvbqsqgMy6n65pKLe0QQQf-du-4Cv_ur6CV1in6RFKF6pbv8uNAozOM3hnmOCzYVaVUkfhsboDSFKhFuNpFBVR1JuVuq9WBOdGLq-ccD5RpogalRGyhEi71WfWRa8zmDI5kDXycR7aRhOgLGf0pGBbFv_1dnUVOE5i3GUQythhD8VLq3QTlywMnzegd0YoLH2C2qepxm9zRsuMHX8b6UHl8gnvbRihOLmShXKNHKbE0gO6FoQToLIL7zmLJqhoSas3ohe4I",
  locatorMap: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV_5Zy5XUET23v0D4HuEubNjEChfzwnOo_Tr5SSjd9wtyfkL27UkwAlaOB4CeA85PLC6tZOXf9bbwdh9Hgmpzm-DER1PKWVUabIxlmgyDqU0B3xjQZAA8WNhpHDCWAMSy43pj25cDdAlt6Qzencg0kyiRrO_iFfauCdhSkmmGtENiOOUgBsXv9B7mJjUlA3VwTGnBHPIHEB4ZGtkjtRz3AZ_GzAsVEJu1C8lIUQT7gZYPxN2InPgbzGj-mHQxrBs7JxFGH_mPtxOk",
  adminHeadshot: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxNR_SNWXsqne4vAmXZ_uKoqJzJhD3HaIHF480vOPwViZUpNyMGNDU8SNLfQA3-4TRD4myQ5G0XlUwVinMKGF0Q2-jXkA5UKAE77fEZqBXF7AqvAToliafO3OiX6In0TAYXVqVcVkij6rVWmRPBVReBrK1YhKPY4XzCkF43UZOOBfoWSgeGm7-D7zjsrCIHn-0dHfzo4vkPn94DjoExkGDRimAsUJrCYxJHKzd0nwZYON6Lk-YwuEhTy17-uVWzwLweZed5ku7F-4",
  sysAdminProfile: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQo0Ol63_sBLQ4uQCBE-WYSkIzAGs4zRB0ChvPNaD2DZ4nvX1B9guNTCtUY4E79Fr77eX-PXWrgbAnQqo8X0TJDZouEDUaESKm1jbpI_5QTYFD6plqDe2tQzuUJsUrWwUuZ5dUfJphCdaLhz2dQIR4rpAxrasTPbhOYjg_EaZDN3e_o7EDA4e4N4-TAuu6PKMQ2FzgKHx4s5kJmomR8hcy0rNi5m1amTqeRUuaM6FN8vzuHNdUBQYvYVVjDadvZIDF5izxesU1_XE",
  directorVance: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHblEiP4xEgXQDDwjDH5xn4VUU1p2_PaQiC4Z33COiJiPG-KZWwwFiyJCxRRGBlcd8irgtdRdLjJxq4br6fp2LtqeryT34sK8YhALzOUJUlDzMLc4LGwct_4M2qkIUNSnd0QwTffOcpfeGcD0ECdqxCZ8m7W8lR1GAU5wZWAWyfecefq3t2mn6OEmkZkdfr5HtCyGxLt0_plnHzkEoB0e1vCwZsun8pA6Aee98Q-lAxt_pz3k9E6UJrwCDwRxjipiAv3fHCj_MvzU",
  workerAvatar1: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8O7yBXOtDhUZDmKrlbpy_JkPFSOsYw8ojBVxdU1eUdf8Mv0Eeyy3P2TYqowcIkis0mDV1TXrZrYCIS_O-5Th78qV2gZiAtYffeklGtQGfEwQqbmPQPgy7xFj4-p1H1uwASadbmOQiBkrl0PHRRPhZFwCib0CFcVWQdrKH0xzUXFJn1Y33pw7qIlfQPdUyoxT2xs2kNCjswLgxvdk_MP7sWNfy5VHpdA4Mi9-8MVKR7Y4lyYPrWjT0A936cWfWnzvE2J6qIRSEF4A",
  workerAvatar2: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtMNWHiTL7whJAZVH3fDtieWVG-xnQ-VSfLLNDiRQ59SFFiVVQp7zRGfoc_7aQYZZCT_yQggSJMomRV3oG36YqzvDQOed1XDsiHGyo0Yb73NeOJNMlLijkNN8jQM3eK8brTG45sznwiIQzhGnWi0Yh2HNQ3BJ693uB7g_YFQxcqhhZppO8qwiTZz19J0YlRkNTrtY1FtRUup642vEEu3nrwm3wgQveYajxwDNzZELMjIwjEdeJOS-jESGPAVfw9OvKO6ENI4ZGsHo"
};

export const INITIAL_SUBSYSTEMS: SubsystemStatus[] = [
  { id: "s1", name: "Public Safety", health: 98.2, status: "Optimal", category: "Safety" },
  { id: "s2", name: "Transportation", health: 88.5, status: "Active Sync", category: "Transit" },
  { id: "s3", name: "Utility Management", health: 74.2, status: "Action Required", category: "Energy" },
  { id: "s4", name: "Environment", health: 96.0, status: "In Compliance", category: "Water" },
  { id: "s5", name: "Comms Network", health: 100.0, status: "Optimal", category: "Comms" },
];

export const INITIAL_KPIS: LiveKPI[] = [
  { label: "Power Grid Load", value: "412.8", unit: "MW", status: "normal", change: "Stable · Trending Down" },
  { label: "Water PSI Level", value: "74.2", unit: "PSI", status: "warning", change: "Nominal · High Pressure" },
  { label: "Traffic Flow Rate", value: "88.5", unit: "k/h", status: "normal", change: "Efficient · Open Lanes" },
];

export const INITIAL_INCIDENTS: IncidentMarker[] = [
  {
    id: "m1",
    ticketId: "#CIV-88341",
    title: "Active Water Main Break",
    category: "Water & Sewage",
    coords: [32, 42],
    latitude: 23.0225,
    longitude: 72.5714,
    severity: "High",
    status: "Repairing",
    pressureLoss: "-42 PSI",
    affectedUnits: "2,480+",
    unitEnRoute: "Repair Unit 402 (ETA: 12m)",
    description: "A major failure in the 24-inch cast iron main at the intersection of Market and 5th. Pressure drops detected in surrounding grid."
  },
  {
    id: "m2",
    ticketId: "#CIV-88342",
    title: "Substation Thermal Spikes",
    category: "Electricity",
    coords: [58, 60],
    latitude: 23.0315,
    longitude: 72.5463,
    severity: "Moderate",
    status: "Investigating",
    description: "Phase imbalance detected. Thermal variance exceeding safe threshold by +12%. Automated cooling initiated."
  },
  {
    id: "m3",
    ticketId: "#CIV-88343",
    title: "Traffic Light Sync Lag",
    category: "Roads & Traffic",
    coords: [75, 25],
    latitude: 23.0278,
    longitude: 72.5667,
    severity: "Low",
    status: "Repairing",
    description: "Minor signal latency reported at Central Corridor intersection."
  },
  {
    id: "m4",
    ticketId: "#CIV-88344",
    title: "Secondary Pump Inspection",
    category: "Water & Sewage",
    coords: [20, 70],
    latitude: 23.0150,
    longitude: 72.5804,
    severity: "Moderate",
    status: "Investigating",
    description: "Pressure drop detected in non-residential zone. Investigating potential valve leak."
  }
];

export const INITIAL_KANBAN: KanbanTicket[] = [
  {
    id: "k1",
    ticketNumber: "#CI-4012",
    title: "Smart Grid Outage - Zone 4",
    department: "Energy",
    priority: "Critical",
    status: "todo",
    timeLogged: "2h ago",
    assignee: IMAGES.workerAvatar1
  },
  {
    id: "k2",
    ticketNumber: "#CI-4015",
    title: "Public Wi-Fi Latency",
    department: "Comms",
    priority: "Moderate",
    status: "todo",
    timeLogged: "5h ago",
    assignee: IMAGES.workerAvatar2
  },
  {
    id: "k3",
    ticketNumber: "#CI-3982",
    title: "Water Main Leak - Ave 5",
    department: "Utilities",
    priority: "High",
    status: "in_progress",
    timeLogged: "2h 12m ago",
    assignee: IMAGES.workerAvatar1
  },
  {
    id: "k4",
    ticketNumber: "#CI-3891",
    title: "Transit Sensor Calibration",
    department: "Transport",
    priority: "Moderate",
    status: "review",
    timeLogged: "14m ago",
    assignee: IMAGES.workerAvatar2
  },
  {
    id: "k5",
    ticketNumber: "#CI-3750",
    title: "Mainframe Cooling Leak",
    department: "Utilities",
    priority: "High",
    status: "completed",
    timeLogged: "4h ago",
    assignee: IMAGES.workerAvatar1
  },
  {
    id: "k6",
    ticketNumber: "#CI-3910",
    title: "Traffic Signal Sync",
    department: "Transport",
    priority: "Low",
    status: "completed",
    timeLogged: "5h 45m ago",
    assignee: IMAGES.workerAvatar2
  }
];

export const INITIAL_MAINTENANCE: MaintenanceItem[] = [
  { id: "mt1", assetName: "Relay Module TR-404", code: "T-minus 4h", timeRemaining: "4.2 hours", urgency: "urgent" },
  { id: "mt2", assetName: "Water Pump P-92", code: "T-minus 18h", timeRemaining: "18 hours", urgency: "normal" },
  { id: "mt3", assetName: "Comm Satellite S-12", code: "T-minus 1h", timeRemaining: "55 mins", urgency: "critical" },
];
