// Employee roster extracted from the uploaded Google Form question
// ("ID, Name and Position") and cross-referenced with the weekly Excel
// report for sector/department. Used only to seed Firestore the first time
// (see scripts/seedFirestore.js). Admins can add/edit/remove employees
// afterwards from the Admin > Employees screen.

export const SECTOR = "Facility Management";
export const DIVISION = "NHQ - Building Maintenance and Property Management Division";

// Loaded into Firestore with one click via the "Load starter roster" button
// on Admin → Employees (see src/pages/AdminEmployees.jsx). Not required —
// admins can also add employees one by one from that same screen.
// Default annual leave entitlement (days/year) used only when seeding.
// Admins should adjust this per employee to match HR's actual figure.
export const DEFAULT_ANNUAL_ENTITLEMENT = 20;

export const seedEmployees = [
  { id: "001467", fullName: "Kassahun Tadesse Kassaye", position: "Manager - New H.Q. Building Comprehensive Management", department: "Comprehensive Management" },
  { id: "040908", fullName: "Feven Tamrat Abdi", position: "Team Leader - General Control", department: "General Control" },
  { id: "70699", fullName: "Alehegn Shiferaw Ashebr", position: "Museum and Library Guide", department: "Comprehensive Management" },
  { id: "70691", fullName: "Mesele Awulachew Zimbele", position: "Museum and Library Guide", department: "Comprehensive Management" },
  { id: "70696", fullName: "Temesgen Alemu Yadesa", position: "Museum and Library Guide", department: "Comprehensive Management" },
  { id: "70596", fullName: "Wondwosen Gudeta Geresu", position: "Supervisor - General Control", department: "General Control" },
  { id: "70695", fullName: "Zelalem Belay Mekonen", position: "Museum and Library Guide", department: "Comprehensive Management" },
  { id: "037920", fullName: "Getasew Lamesgin Demese", position: "Internal Controller - Banking Operation", department: "Banking Operation" },
  { id: "28758", fullName: "Lema Asefa Keneni", position: "Team Leader - Commercial Building Administration", department: "Commercial Building Administration" },
  { id: "26795", fullName: "Biniam Teklay Hadush", position: "Lease Officer", department: "Lease Administration" },
  { id: "31176", fullName: "Tizita Girma Bekele", position: "Lease Officer", department: "Lease Administration" },
  { id: "70534", fullName: "Yalemzewd Abere Mulu", position: "Supervisor - Commercial Building", department: "Commercial Building Administration" },
  { id: "056029", fullName: "Mangude Awulachew Habtemariam", position: "Admin Assistant II", department: "Comprehensive Management" },
  { id: "028761", fullName: "Martha Teka Midekissa", position: "Team Leader - General Control", department: "General Control" },
  { id: "070533", fullName: "Shambel Ayalew Kelkay", position: "Supervisor - General Control", department: "General Control" },
  { id: "40911", fullName: "Messay Delelegn Masresha", position: "Technical - Engineering Team Leader", department: "Engineering" },
  { id: "70532", fullName: "Yosef Tadesse Kudama", position: "Supervisor - General Control", department: "General Control" },
  { id: "034527", fullName: "Nebiat Getachew Demissie", position: "Accounts Operation Officer", department: "Accounts Operation" },
  { id: "40904", fullName: "Samrawit Kassa Mekonnen", position: "Team Leader - General Control", department: "General Control" },
  { id: "70578", fullName: "Alemayehu Kinfu Woldesilasse", position: "Supervisor - General Control", department: "General Control" },
  { id: "40900", fullName: "Shalom Kebede Tesema", position: "Team Leader - Tower Building", department: "Tower Building" },
  { id: "70542", fullName: "Alemayehu Yirga Bonger", position: "Supervisor - Sky Deck", department: "Sky Deck" },
  { id: "070559", fullName: "Betselot Kebede Bogale", position: "Supervisor - Sky Deck", department: "Sky Deck" },
  { id: "32178", fullName: "Biruktawit Atklit W/Selassie", position: "Lease Officer", department: "Lease Administration" },
  { id: "040896", fullName: "Sintayehu Terefe Tadesse", position: "Team Leader - Basements Building", department: "Basements Building" },
  { id: "70531", fullName: "Amanuel Zerfu Muka", position: "Supervisor - Basements Building", department: "Basements Building" },
  { id: "70545", fullName: "Mesfin Mamuye Abebe", position: "Supervisor - Basements Building", department: "Basements Building" },
  { id: "040906", fullName: "Tsegabirhan Haileselassie Woldeabyezghi", position: "Team Leader - Conference Building", department: "Conference Building" },
  { id: "70535", fullName: "Dereje Bekele Anteneh", position: "Supervisor - Conference Building", department: "Conference Building" },
].map((e) => ({
  ...e,
  sector: SECTOR,
  division: DIVISION,
  annualEntitlement: DEFAULT_ANNUAL_ENTITLEMENT,
  status: "active",
}));
