// All 30 NBA teams. `tricode` matches Basketball-Reference's codes (BRK/CHO/PHO).
// `nbaId` is the official NBA.com team id (used for CDN logos).
export type Conference = 'East' | 'West';
export type Division =
  | 'Atlantic' | 'Central' | 'Southeast'
  | 'Northwest' | 'Pacific' | 'Southwest';

export interface Team {
  tricode: string;
  nbaId: number;
  city: string;
  name: string;
  conference: Conference;
  division: Division;
  primary: string;
  secondary: string;
}

export const TEAMS: Team[] = [
  { tricode: 'ATL', nbaId: 1610612737, city: 'Atlanta', name: 'Hawks', conference: 'East', division: 'Southeast', primary: '#E03A3E', secondary: '#26282A' },
  { tricode: 'BOS', nbaId: 1610612738, city: 'Boston', name: 'Celtics', conference: 'East', division: 'Atlantic', primary: '#007A33', secondary: '#BA9653' },
  { tricode: 'BRK', nbaId: 1610612751, city: 'Brooklyn', name: 'Nets', conference: 'East', division: 'Atlantic', primary: '#000000', secondary: '#FFFFFF' },
  { tricode: 'CHO', nbaId: 1610612766, city: 'Charlotte', name: 'Hornets', conference: 'East', division: 'Southeast', primary: '#1D1160', secondary: '#00788C' },
  { tricode: 'CHI', nbaId: 1610612741, city: 'Chicago', name: 'Bulls', conference: 'East', division: 'Central', primary: '#CE1141', secondary: '#000000' },
  { tricode: 'CLE', nbaId: 1610612739, city: 'Cleveland', name: 'Cavaliers', conference: 'East', division: 'Central', primary: '#860038', secondary: '#FDBB30' },
  { tricode: 'DAL', nbaId: 1610612742, city: 'Dallas', name: 'Mavericks', conference: 'West', division: 'Southwest', primary: '#00538C', secondary: '#002B5E' },
  { tricode: 'DEN', nbaId: 1610612743, city: 'Denver', name: 'Nuggets', conference: 'West', division: 'Northwest', primary: '#0E2240', secondary: '#FEC524' },
  { tricode: 'DET', nbaId: 1610612765, city: 'Detroit', name: 'Pistons', conference: 'East', division: 'Central', primary: '#C8102E', secondary: '#1D42BA' },
  { tricode: 'GSW', nbaId: 1610612744, city: 'Golden State', name: 'Warriors', conference: 'West', division: 'Pacific', primary: '#1D428A', secondary: '#FFC72C' },
  { tricode: 'HOU', nbaId: 1610612745, city: 'Houston', name: 'Rockets', conference: 'West', division: 'Southwest', primary: '#CE1141', secondary: '#000000' },
  { tricode: 'IND', nbaId: 1610612754, city: 'Indiana', name: 'Pacers', conference: 'East', division: 'Central', primary: '#002D62', secondary: '#FDBB30' },
  { tricode: 'LAC', nbaId: 1610612746, city: 'LA', name: 'Clippers', conference: 'West', division: 'Pacific', primary: '#C8102E', secondary: '#1D428A' },
  { tricode: 'LAL', nbaId: 1610612747, city: 'Los Angeles', name: 'Lakers', conference: 'West', division: 'Pacific', primary: '#552583', secondary: '#FDB927' },
  { tricode: 'MEM', nbaId: 1610612763, city: 'Memphis', name: 'Grizzlies', conference: 'West', division: 'Southwest', primary: '#5D76A9', secondary: '#12173F' },
  { tricode: 'MIA', nbaId: 1610612748, city: 'Miami', name: 'Heat', conference: 'East', division: 'Southeast', primary: '#98002E', secondary: '#F9A01B' },
  { tricode: 'MIL', nbaId: 1610612749, city: 'Milwaukee', name: 'Bucks', conference: 'East', division: 'Central', primary: '#00471B', secondary: '#EEE1C6' },
  { tricode: 'MIN', nbaId: 1610612750, city: 'Minnesota', name: 'Timberwolves', conference: 'West', division: 'Northwest', primary: '#0C2340', secondary: '#236192' },
  { tricode: 'NOP', nbaId: 1610612740, city: 'New Orleans', name: 'Pelicans', conference: 'West', division: 'Southwest', primary: '#0C2340', secondary: '#C8102E' },
  { tricode: 'NYK', nbaId: 1610612752, city: 'New York', name: 'Knicks', conference: 'East', division: 'Atlantic', primary: '#006BB6', secondary: '#F58426' },
  { tricode: 'OKC', nbaId: 1610612760, city: 'Oklahoma City', name: 'Thunder', conference: 'West', division: 'Northwest', primary: '#007AC1', secondary: '#EF3B24' },
  { tricode: 'ORL', nbaId: 1610612753, city: 'Orlando', name: 'Magic', conference: 'East', division: 'Southeast', primary: '#0077C0', secondary: '#C4CED4' },
  { tricode: 'PHI', nbaId: 1610612755, city: 'Philadelphia', name: '76ers', conference: 'East', division: 'Atlantic', primary: '#006BB6', secondary: '#ED174C' },
  { tricode: 'PHO', nbaId: 1610612756, city: 'Phoenix', name: 'Suns', conference: 'West', division: 'Pacific', primary: '#1D1160', secondary: '#E56020' },
  { tricode: 'POR', nbaId: 1610612757, city: 'Portland', name: 'Trail Blazers', conference: 'West', division: 'Northwest', primary: '#E03A3E', secondary: '#000000' },
  { tricode: 'SAC', nbaId: 1610612758, city: 'Sacramento', name: 'Kings', conference: 'West', division: 'Pacific', primary: '#5A2D81', secondary: '#63727A' },
  { tricode: 'SAS', nbaId: 1610612759, city: 'San Antonio', name: 'Spurs', conference: 'West', division: 'Southwest', primary: '#C4CED4', secondary: '#000000' },
  { tricode: 'TOR', nbaId: 1610612761, city: 'Toronto', name: 'Raptors', conference: 'East', division: 'Atlantic', primary: '#CE1141', secondary: '#000000' },
  { tricode: 'UTA', nbaId: 1610612762, city: 'Utah', name: 'Jazz', conference: 'West', division: 'Northwest', primary: '#002B5C', secondary: '#00471B' },
  { tricode: 'WAS', nbaId: 1610612764, city: 'Washington', name: 'Wizards', conference: 'East', division: 'Southeast', primary: '#002B5C', secondary: '#E31837' },
];

export const TEAM_BY_TRICODE: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.tricode, t]),
);
