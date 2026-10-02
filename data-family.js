// Race family trees. A node is {id} for a race on the site, or {p} for a people or group without its own page.
// e = label on the line from the parent: how this branch came about.
window.FAMILIES = [
 {t:'Made by the titans', wide:1,
  d:"The titans built servants of stone and metal to shape the world. The Old Gods' Curse of Flesh slowly turned many of them into mortal, fleshy beings.",
  root:{p:'Titan-forged', c:[
    {id:'earthen', c:[{id:'dwarves', e:'Curse of Flesh', c:[{id:'darkiron', e:'a rival clan'}]}]},
    {p:'Titan-forged mechagnomes', c:[{id:'gnomes', e:'Curse of Flesh', c:[{id:'mechagnomes', e:'rebuilt with machines'}]}]},
    {id:'vrykul', c:[{id:'humans', e:'Curse of Flesh', c:[
      {id:'kultirans', e:'island kingdom'},
      {id:'worgen', e:'worgen curse'},
      {id:'forsaken', e:'plague of undeath'}]}]}]}},
 {t:'Trolls and elves', wide:1,
  d:"The haranir say both trolls and elves descend from haranir who stayed on the surface. Trolls changed by the Well of Eternity became the night elves, and every other elf branches from them.",
  root:{id:'haranir', c:[{p:'Ancient trolls', e:'stayed on the surface', c:[
    {id:'zandalari', e:'first tribe'},
    {id:'trolls', e:'Darkspear tribe'},
    {id:'nightelves', e:'Well of Eternity', c:[
      {id:'nightborne', e:'the Nightwell'},
      {id:'bloodelves', e:'exiled Highborne', c:[{id:'voidelves', e:'touched by the Void'}]},
      {id:'naga', e:"N'Zoth's pact"}]}]}]}},
 {t:'From Argus',
  d:"The eredar who accepted Sargeras became demons. Those who fled with Velen became the draenei.",
  root:{id:'eredar', c:[{id:'draenei', e:'refused Sargeras', c:[{id:'lightforged', e:'infused with Light'}]}]}},
 {t:'From Draenor',
  d:"Draenor's native peoples. The Mag'har are orcs who never drank demon blood.",
  root:{p:'Draenor', c:[
    {id:'orcs', c:[{id:'maghar', e:'never corrupted'}]},
    {p:'Gronn giants', c:[{id:'ogres', e:'descendants'}]}]}},
 {t:'Dragonkind',
  d:"The titans empowered five dragons as Aspects. Neltharion later created the dracthyr from dragon essence.",
  root:{p:'Proto-dragons', c:[{id:'dragons', e:'blessed by the titans', c:[{id:'dracthyr', e:"Neltharion's creation"}]}]}},
 {t:'The tauren',
  d:"Highmountain's tauren split from their kin long ago and carry Cenarius's blessing.",
  root:{p:'Ancient tauren', c:[{id:'tauren'}, {id:'highmountain', e:"Huln's tribe"}]}},
 {t:'The Aqir',
  d:"An insect empire that served the Old Gods, then broke into three peoples.",
  root:{id:'aqir', c:[{p:'Nerubians', e:'Northrend'}, {p:'Qiraji', e:'Silithus'}, {p:'Mantid', e:'Pandaria'}]}}
];
window.FAMILY_LONERS = {
  t:'Peoples of their own',
  d:"No known ancestry shared with the other races.",
  ids:['pandaren', 'goblins', 'vulpera', 'ethereals']
};
window.FAMILY_TIES = [
  ['worgen', 'nightelves', 'The worgen curse began with night elf druids.'],
  ['goblins', 'zandalari', 'Goblins were slaves of the Zandalari.'],
  ['humans', 'bloodelves', 'High elves taught humans magic in the Troll Wars.'],
  ['forsaken', 'bloodelves', 'Some Forsaken, Sylvanas among them, were elves.'],
  ['maghar', 'orcs', "The playable Mag'har come from the alternate Draenor."]
];
