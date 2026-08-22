// Employee roster + HR leave balances. Roster fields (name/position/dept)
// came from the uploaded Google Form. Balance fields — netAccrualTillNow and
// leaveExpiringDec31 — came from HR's exported balance report and are the
// authoritative starting point for each employee's leave balance:
//
//   netAccrualTillNow  = total leave days accrued and unused, as of HR's export
//   leaveExpiringDec31 = the portion of that balance that is LOST if unused
//                        by December 31 this year (no carry-over policy).
//                        The rest of netAccrualTillNow (the part NOT in this
//                        bucket) is safe and carries forward.
//
// Any leave submitted through this app after the export date reduces the
// balance further (see computeAnnualBalance in utils/leaveEngine.js), and is
// applied against the expiring bucket first since that's the leave most at
// risk of being lost.
//
// Used only to seed Supabase the first time (Admin → Employees → "Load
// starter roster"). Admins can add/edit/remove employees and re-import
// updated HR balances afterwards from that same screen.

export const SECTOR = "Facility Management";
export const DIVISION = "NHQ - Building Maintenance and Property Management Division";
export const DEPARTMENT = "Comprehensive Management";

export const seedEmployees = [
  { id: "001467", fullName: "Kassahun Tadesse Kassaye", position: "Manager - New H.Q. Building Comprehensive Management", department: DEPARTMENT, netAccrualTillNow: 125, leaveExpiringDec31: 55 },
  { id: "040908", fullName: "Feven Tamrat Abdi", position: "Team Leader - General Control", department: DEPARTMENT, netAccrualTillNow: 47, leaveExpiringDec31: 12 },
  { id: "70699", fullName: "Alehegn Shiferaw Ashebr", position: "Museum and Library Guide", department: DEPARTMENT, netAccrualTillNow: 14, leaveExpiringDec31: 0 },
  { id: "70691", fullName: "Mesele Awulachew Zimbele", position: "Museum and Library Guide", department: DEPARTMENT, netAccrualTillNow: 21, leaveExpiringDec31: 0 },
  { id: "70696", fullName: "Temesgen Alemu Yadesa", position: "Museum and Library Guide", department: DEPARTMENT, netAccrualTillNow: 25, leaveExpiringDec31: 0 },
  { id: "70596", fullName: "Wondwosen Gudeta Geresu", position: "Supervisor - General Control", department: DEPARTMENT, netAccrualTillNow: 26, leaveExpiringDec31: 0 },
  { id: "70695", fullName: "Zelalem Belay Mekonen", position: "Museum and Library Guide", department: DEPARTMENT, netAccrualTillNow: 14, leaveExpiringDec31: 0 },
  { id: "037920", fullName: "Getasew Lamesgin Demese", position: "Internal Controller - Banking Operation", department: DEPARTMENT, netAccrualTillNow: 54, leaveExpiringDec31: 19 },
  { id: "28758", fullName: "Lema Asefa Keneni", position: "Team Leader - Commercial Building Administration", department: DEPARTMENT, netAccrualTillNow: 63, leaveExpiringDec31: 25 },
  { id: "26795", fullName: "Biniam Teklay Hadush", position: "Lease Officer", department: DEPARTMENT, netAccrualTillNow: 64, leaveExpiringDec31: 26 },
  { id: "31176", fullName: "Tizita Girma Bekele", position: "Lease Officer", department: DEPARTMENT, netAccrualTillNow: 64, leaveExpiringDec31: 22 },
  { id: "70534", fullName: "Yalemzewd Abere Mulu", position: "Supervisor - Commercial Building", department: DEPARTMENT, netAccrualTillNow: 19, leaveExpiringDec31: 0 },
  { id: "056029", fullName: "Mangude Awulachew Habtemariam", position: "Admin Assistant II", department: DEPARTMENT, netAccrualTillNow: 0, leaveExpiringDec31: 0 },
  { id: "028761", fullName: "Martha Teka Midekissa", position: "Team Leader - General Control", department: DEPARTMENT, netAccrualTillNow: 39, leaveExpiringDec31: 2 },
  { id: "070533", fullName: "Shambel Ayalew Kelkay", position: "Supervisor - General Control", department: DEPARTMENT, netAccrualTillNow: 9, leaveExpiringDec31: 0 },
  { id: "40911", fullName: "Messay Delelegn Masresha", position: "Technical - Engineering Team Leader", department: DEPARTMENT, netAccrualTillNow: 35, leaveExpiringDec31: 0 },
  { id: "70532", fullName: "Yosef Tadesse Kudama", position: "Supervisor - General Control", department: DEPARTMENT, netAccrualTillNow: 34, leaveExpiringDec31: 7 },
  { id: "034527", fullName: "Nebiat Getachew Demissie", position: "Accounts Operation Officer", department: DEPARTMENT, netAccrualTillNow: 64, leaveExpiringDec31: 28 },
  { id: "40904", fullName: "Samrawit Kassa Mekonnen", position: "Team Leader - General Control", department: DEPARTMENT, netAccrualTillNow: 34, leaveExpiringDec31: 0 },
  { id: "70578", fullName: "Alemayehu Kinfu Woldesilasse", position: "Supervisor - General Control", department: DEPARTMENT, netAccrualTillNow: 29, leaveExpiringDec31: 3 },
  { id: "40900", fullName: "Shalom Kebede Tesema", position: "Team Leader - Tower Building", department: DEPARTMENT, netAccrualTillNow: 55, leaveExpiringDec31: 20 },
  { id: "70542", fullName: "Alemayehu Yirga Bonger", position: "Supervisor - Sky Deck", department: DEPARTMENT, netAccrualTillNow: 37, leaveExpiringDec31: 10 },
  { id: "070559", fullName: "Betselot Kebede Bogale", position: "Supervisor - Sky Deck", department: DEPARTMENT, netAccrualTillNow: 29, leaveExpiringDec31: 2 },
  { id: "32178", fullName: "Biruktawit Atklit W/Selassie", position: "Lease Officer", department: DEPARTMENT, netAccrualTillNow: 60, leaveExpiringDec31: 24 },
  { id: "040896", fullName: "Sintayehu Terefe Tadesse", position: "Team Leader - Basements Building", department: DEPARTMENT, netAccrualTillNow: 57, leaveExpiringDec31: 21 },
  { id: "70531", fullName: "Amanuel Zerfu Muka", position: "Supervisor - Basements Building", department: DEPARTMENT, netAccrualTillNow: 20, leaveExpiringDec31: 0 },
  { id: "70545", fullName: "Mesfin Mamuye Abebe", position: "Supervisor - Basements Building", department: DEPARTMENT, netAccrualTillNow: 32, leaveExpiringDec31: 6 },
  { id: "040906", fullName: "Tsegabirhan Haileselassie Woldeabyezghi", position: "Team Leader - Conference Building", department: DEPARTMENT, netAccrualTillNow: 57, leaveExpiringDec31: 22 },
  { id: "70535", fullName: "Dereje Bekele Anteneh", position: "Supervisor - Conference Building", department: DEPARTMENT, netAccrualTillNow: 25, leaveExpiringDec31: 0 },
  // Present in HR's balance export but not in the original roster form —
  // added here with balances intact; please confirm/update their position.
  { id: "70595", fullName: "Bitew Bikale Woldetsadik", position: "Unassigned - please update", department: DEPARTMENT, netAccrualTillNow: 41, leaveExpiringDec31: 15 },
  { id: "55950", fullName: "Yemisrach Teklu Abebe", position: "Unassigned - please update", department: DEPARTMENT, netAccrualTillNow: 51, leaveExpiringDec31: 20 },
].map((e) => ({
  ...e,
  sector: SECTOR,
  division: DIVISION,
  status: "active",
}));
