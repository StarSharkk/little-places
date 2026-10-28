// Shared illustration palette: the same cream, candy colours and charcoal
// used by the Sakura café. Geometry and printed artwork resolve these roles.
const common = {
  trim: '#F7F3E9', ink: '#252525', tile: '#C7E5D7', concrete: '#E4DCCB',
  red: '#EF745F', redDark: '#BE5145', steel: '#A9C8BA', glass: '#91B7EB',
  glassLight: '#E8F1FA', dark: '#455875', blue: '#91B7EB', yellow: '#F6C445',
  green: '#9AD5B6', leaf: '#71B18D', soil: '#70604F', wood: '#D5AB77',
  bottle: '#6CA887', paper: '#F7F3E9', asphalt: '#A8B3C8', curb: '#FBF7EB',
  line: '#F7F3E9', orange: '#EF745F', roof: '#9AD5B6',
};
export const themes = [
  { ...common, name: 'Butter yellow', label: '奶油黄', wall: '#F6C445' },
  { ...common, name: 'Pistachio', label: '薄荷绿', wall: '#9AD5B6', roof: '#91B7EB' },
  { ...common, name: 'Rose milk', label: '樱花粉', wall: '#EFA8C4', roof: '#91B7EB', green: '#B8DDD0' },
  { ...common, name: 'Blue hour', label: '天空蓝', wall: '#91B7EB', roof: '#9AD5B6', red: '#F6C445', redDark: '#B98C34' },
  { ...common, name: 'Terracotta', label: '珊瑚红', wall: '#EF745F', roof: '#9AD5B6', red: '#9AD5B6', redDark: '#4D8D73' },
];

const groups = {
  trim: ['#e7e3ce','#e7dfc7','#dfc2a7','#e4e2d2','#eee6d2','#e4ddc7','#efead8','#e4e4d2','#e9e9cc','#e8e7d8','#e0e4d8','#e1dfcf','#e5e2cb','#dcdcc5','#e6e3c1','#d1d6cc','#e9e2c9','#dcded2','#ddd3aa','#ded3ab','#d9c59e','#dad1ae','#e7dcc0','#e6dfc6','#ebe1be','#d8dfc0','#e4dfc9','#e3dfc8','#e9e5cc','#d7e0d7','#d6ddd1','#e2d4a2','#d9c780','#d8ad80','#b9ad80','#e5ddaa','#f6e9cf','#d8dfc0','#d8dfc9'],
  ink: ['#394140','#64685c','#6e776f','#383d3c','#595941','#443c30','#55482f','#734d34','#414440','#887b51','#3a4638','#788880','#52665f','#73877c','#4b6a62','#5a6e5d','#786953','#92814e','#394d37','#4d5b4d','#424638','#39423e','#3a5544','#475d50','#4f7151','#9b9d91','#9e9d91','#a89f91'],
  red: ['#a8493c','#a9483c','#a24738','#b55349','#8b4339','#b35c4c'],
  redDark: ['#923f37','#913f38','#9a4a3d','#9d4b3e'],
  green: ['#69816e','#647d63','#8a9b6c','#4e6245','#4c7151','#66844d','#507a6b','#b4c4a4','#738457','#6c6746','#566541'],
  blue: ['#526f80','#49687b','#426c85','#4d697b','#9dbbb0','#60838a'],
  yellow: ['#c4b465','#c6a351','#be9b51','#d1bc63','#c4ae64','#c6924b','#cfb75b','#b8ad5d','#caa24e','#a17c45'],
  wood: ['#b3a17d'],
  bottle: ['#6a5f39'],
  dark: ['#293b40','#4b5146','#3d4c4c','#74867d','#4c5853'],
};
const roles = new Map(Object.entries(groups).flatMap(([role,colours])=>colours.map(colour=>[colour,role])));
const fixed = {'#b6c2be':'#C7DAED','#839591':'#91AEC9','#cfd5c9':'#E8F1FA','#384f5a':'#455875','#555d55':'#455875','#4e625e':'#455875','#737c7c':'#A8B3C8','#c5d0c5':'#F7F3E9','#9dbbb0':'#9AD5B6'};
export function atlasColour(colour, theme) {
  const value = colour.toLowerCase();
  return fixed[value] || theme[roles.get(value)] || colour;
}
