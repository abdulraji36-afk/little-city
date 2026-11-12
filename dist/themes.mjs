export const THEMES = {
 modern: {name:'Modern',sky:['#9fbca0','#728f78'],land:['#91af79','#94b37b','#89a773','#9bb981','#92b079'],water:['#5c9caa','#64a5b1','#70aeba'],edge:['#6c8c60','#5e7f56']},
 cozy: {name:'Cozy',sky:['#ede5cc','#d9dfc6'],land:['#bccb91','#c3ce99','#b7c48c','#c8d29f','#c0cb93'],water:['#92bcb5','#9fc6bd','#a8cbc1'],edge:['#a8b980','#98aa72']},
 midnight: {name:'Midnight',sky:['#193d49','#0b1b2c'],land:['#426c66','#466f68','#3d655f','#4a746c','#416a64'],water:['#27677e','#2d7186','#357a8b'],edge:['#294f50','#24474d']},
 retro: {name:'Retro',sky:['#63876b','#3b5c4b'],land:['#7b9d60','#81a466','#729458','#88aa6d','#7d9f61'],water:['#467d8b','#4e8895','#59939b'],edge:['#527744','#476b3e']}
};
export function resolveTheme(name) {return Object.hasOwn(THEMES,name)?name:'modern';}
const nightWindows=new Set(['#5f817e','#6c8987','#91a29a','#6f9393','#779994','#72918d','#7d8d79','#8d9b92','#829b91','#748f86','#859a8b','#829282']);
const nightCache=new Map();
export function paint(color,theme) {
 if(theme!=='midnight'||typeof color!=='string'||!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color))return color;
 if(nightWindows.has(color))return '#f7d798';
 if(nightCache.has(color))return nightCache.get(color);
 const rgb=[1,3,5].map((offset,i)=>Math.round(parseInt(color.slice(offset,offset+2),16)*.64+[23,48,69][i]*.36));
 const result='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('')+color.slice(7);
 nightCache.set(color,result);return result;
}
