// Timeline. Years follow Blizzard's official dating, where Year 0 is the opening of the Dark Portal.
// Each era: id, name, span, blurb, games[], events[{y, t, d, c:[character ids], rel}]
window.ERAS = [
{id:'cosmos',name:'Before Time',span:'Undated',
 blurb:"The universe is built from six forces in three opposed pairs. The Titans guard order and life; the Void wants to consume everything; the Burning Legion wants to burn it all down first.",
 forces:[['Light','Void'],['Order (Arcane)','Disorder (Fel)'],['Life (Nature)','Death']],
 games:[],
 events:[
  {y:'Undated',t:'The First Ones and the Shadowlands',d:"Mysterious First Ones shape the cosmos. The realm of Death, the Shadowlands, is ruled by the Eternal Ones, and one of them, the Arbiter, judges where each soul goes. Zovaal, the first Arbiter, is later locked in the Maw for trying to remake reality.",c:['jailer','arbiter','winterqueen','denathrius']},
  {y:'Undated',t:'The Titan Pantheon',d:"Titans are world-souls that have woken. The Pantheon travels the stars to find and protect sleeping world-souls, with Sargeras as its champion.",c:['amanthul','aggramar','eonar','sargeras']},
  {y:'Undated',t:'Sargeras falls and the Legion is born',d:"Sargeras learns the Void lords plan to corrupt a world-soul into a dark titan. He decides the only answer is to burn all life and founds the Burning Legion. Later he destroys the Pantheon's bodies.",c:['sargeras','amanthul','aggramar']},
  {y:'Undated',t:'The Old Gods land on Azeroth',d:"The Void lords seed Old Gods into the planet to corrupt the world-soul. Their Black Empire spreads across the surface. Xal'atath, a rival Void being, tries to seize it and is sealed inside a dagger.",c:['cthun','yogg','nzoth','yshaarj','xalatath','azeroth']},
  {y:'Undated',t:'The Titans order Azeroth',d:"The titans chain the Old Gods underground, tearing Y'Shaarj apart in the process. They leave Keepers in charge. Ages later, at the Keeper Tyr's urging, five dragons are made Aspects to watch over the world.",c:['amanthul','eonar','yshaarj','ghuun','alexstrasza','deathwing','nozdormu','ysera','malygos']},
  {y:'\u2248 \u221213,000',t:'The Eredar fall',d:"On Argus, Kil'jaeden and Archimonde accept Sargeras's offer and become demons. Velen refuses, and the naaru help him and his followers escape. They become the draenei.",c:['kiljaeden','archimonde','velen','sargeras','xera']}
 ]},
{id:'ancients',name:'The War of the Ancients',span:'\u221210,000',
 blurb:"The night elf empire's reckless use of the Well of Eternity draws the Legion's eye, and the war that follows breaks the world apart.",
 games:[],
 events:[
  {y:'Before \u221210,000',t:'The empire of the Highborne',d:"Night elves rise around the Well of Eternity under Queen Azshara. Her Highborne court grows obsessed with its power.",c:['azshara','xavius']},
  {y:'\u221210,000',t:'Azshara opens the way',d:"Azshara and her Highborne use the Well to bring the Burning Legion into Azeroth.",c:['azshara','xavius','sargeras','archimonde','mannoroth']},
  {y:'\u221210,000',t:'The night elves fight back',d:"Malfurion, taught by Cenarius, joins the resistance under Lord Kur'talos Ravencrest with Tyrande and his brother Illidan.",c:['malfurion','tyrande','illidan','cenarius']},
  {y:'\u221210,000',t:'Neltharion\u2019s betrayal',d:"Corrupted by the Old Gods, the Earth-Warder forges the Dragon Soul and turns it on the other dragons, becoming Deathwing.",c:['deathwing','nzoth','alexstrasza','malygos','nozdormu','ysera']},
  {y:'\u221210,000',t:'The Sundering',d:"The Well of Eternity implodes and shatters the continent. Azshara sinks under the sea and bargains with N'Zoth, and her people become naga.",c:['azshara','nzoth']},
  {y:'After \u221210,000',t:'Illidan is imprisoned',d:"Illidan creates a new Well atop Mount Hyjal. Malfurion has him locked away underground, with Maiev as his jailer.",c:['illidan','malfurion','maiev']}
 ]},
{id:'kingdoms',name:'Kingdoms of Elves, Men and Dwarves',span:'\u22127,300 to \u22121',
 blurb:"The survivors spread out and new kingdoms form. Far away on Draenor, the Legion prepares its next weapon: the orcs.",
 games:[],
 events:[
  {y:'\u22127,300',t:'The Highborne are exiled',d:"Night elves who kept using arcane magic are banished. They sail east and become the high elves.",c:[]},
  {y:'\u22126,800',t:'Quel\u2019Thalas and the Sunwell',d:"The high elves found Quel'Thalas and create the Sunwell with a vial of water from the old Well of Eternity.",c:[]},
  {y:'\u22122,800',t:'The Troll Wars',d:"Humans of Arathor and the high elves defeat the Amani trolls together. The elves teach humans magic.",c:[]},
  {y:'\u2212975',t:'The War of the Shifting Sands',d:"Night elves and dragons seal C'Thun's qiraji armies behind the Scarab Wall. Fandral Staghelm's son dies in the fighting.",c:['cthun','fandral']},
  {y:'\u2212823',t:'Aegwynn defeats Sargeras\u2019s avatar',d:"The Guardian buries the avatar in the Tomb of Sargeras. His spirit hides inside her, waiting for her son.",c:['aegwynn','sargeras']},
  {y:'\u2212230',t:'War of the Three Hammers',d:"Dwarven clans fight a civil war. The defeated Dark Iron leader, Sorcerer-Thane Thaurissan, accidentally summons Ragnaros, whose arrival destroys their kingdom and raises Blackrock Mountain.",c:['ragnaros']},
  {y:'\u2212200',t:'The draenei reach Draenor',d:"Velen's ship crashes on Draenor, a world shared with the orc clans.",c:['velen']},
  {y:'\u221245',t:'Medivh is born',d:"Aegwynn's son is born with Sargeras hidden inside his soul.",c:['medivh','aegwynn','sargeras']},
  {y:'\u221210 to \u22123',t:'The corruption of the orcs',d:"Kil'jaeden deceives Ner'zhul and makes Gul'dan his tool. The clans drink Mannoroth's blood and slaughter the draenei. Durotan refuses.",c:['kiljaeden','nerzhul','guldan','mannoroth','grom','durotan','velen','blackhand']}
 ]},
{id:'wars',name:'The Great Wars',span:'Year 0 to Year 21',
 blurb:"The strategy games. The Horde invades, two wars follow, and then the Legion returns through the Scourge.",
 games:['Warcraft: Orcs & Humans (1994)','Warcraft II (1995)','Warcraft III (2002)','The Frozen Throne (2003)'],
 events:[
  {y:'Year 0',t:'The Dark Portal opens',d:"Medivh and Gul'dan open the Dark Portal and the Horde pours into the kingdom of Stormwind. The First War begins.",c:['medivh','guldan','blackhand','llane','lothar','khadgar'],rel:'Warcraft: Orcs & Humans, 1994'},
  {y:'Year 3',t:'Stormwind falls',d:"Khadgar and Lothar kill the possessed Medivh. Orgrim kills Blackhand, Garona assassinates King Llane, and Stormwind burns.",c:['medivh','khadgar','lothar','garona','llane','orgrim','blackhand','durotan']},
  {y:'Years 4\u20136',t:'The Alliance of Lordaeron',d:"Lothar leads the refugees north and Terenas forms the Alliance. The Horde enslaves Alexstrasza to use her dragons. Lothar dies at Blackrock and Turalyon wins the war. The orcs end up in internment camps.",c:['terenas','lothar','turalyon','orgrim','alexstrasza','guldan','anasterian','alleria','chogall'],rel:'Warcraft II, 1995'},
  {y:'Year 8',t:'Draenor shatters',d:"Ner'zhul opens portals to other worlds and tears Draenor apart. What remains becomes Outland. Khadgar and most of the Alliance expedition are stranded there, while Turalyon and Alleria vanish into the Twisting Nether.",c:['nerzhul','turalyon','alleria','khadgar'],rel:'Beyond the Dark Portal, 1996'},
  {y:'Year 8',t:'The Lich King is made',d:"Kil'jaeden tears Ner'zhul's spirit from his body and seals it in the Frozen Throne in Northrend.",c:['kiljaeden','nerzhul']},
  {y:'Years 15\u201318',t:'Thrall frees the orcs',d:"Thrall escapes slavery, frees his people from the camps and makes Orgrim's armor his own.",c:['thrall','orgrim','grom']},
  {y:'Year 20',t:'Plague and the Culling of Stratholme',d:"Kel'Thuzad's cult spreads the plague of undeath. Arthas purges Stratholme, and Uther and Jaina walk away from him.",c:['arthas','kelthuzad','malganis','uther','jaina'],rel:'Warcraft III, 2002'},
  {y:'Year 20',t:'Frostmourne and the fall of Lordaeron',d:"Arthas takes Frostmourne in Northrend, murders his father and destroys Quel'Thalas. He raises Sylvanas as a banshee and uses the Sunwell to bring back Kel'Thuzad.",c:['arthas','terenas','muradin','sylvanas','anasterian','kelthuzad','uther']},
  {y:'Year 20',t:'The Horde reaches Kalimdor',d:"Guided by the Prophet, Thrall sails west. Grom drinks demon blood again and kills Cenarius, then redeems himself by killing Mannoroth.",c:['thrall','grom','cenarius','mannoroth','cairne','medivh']},
  {y:'Year 21',t:'The Battle of Mount Hyjal',d:"Humans, orcs and night elves hold the World Tree together, and Malfurion's trap destroys Archimonde.",c:['archimonde','malfurion','tyrande','jaina','thrall','medivh']},
  {y:'Year 21',t:'Kalimdor after the war',d:"Thrall founds Durotar and Jaina founds Theramore. Her father Daelin attacks the Horde and dies.",c:['thrall','jaina','daelin'],rel:'The Frozen Throne, 2003'},
  {y:'Year 21',t:'The Frozen Throne',d:"Illidan escapes Maiev and joins Kael'thas in Outland. Sylvanas frees the Forsaken. Arthas defeats Illidan and puts on the Helm of Domination, merging with Ner'zhul.",c:['illidan','maiev','kaelthas','sylvanas','arthas','nerzhul','anubarak']}
 ]},
{id:'wow',name:'World of Warcraft',span:'2004 to today',
 blurb:"The online game. Each expansion moves the story forward about a year or two in-world.",
 games:[],
 events:[
  {y:'Classic',t:'A world at war with itself',d:"Onyxia rules Stormwind in disguise, Ragnaros and Nefarian lurk in Blackrock, and C'Thun wakes in Ahn'Qiraj. Kel'Thuzad's Naxxramas floats over the Plaguelands.",c:['onyxia','varian','ragnaros','nefarian','cthun','kelthuzad'],rel:'2004'},
  {y:'The Burning Crusade',t:'Return to Outland',d:"The Dark Portal reopens. Illidan falls in the Black Temple and Kael'thas turns to the Legion. Kil'jaeden is driven back at the Sunwell, and Velen uses M'uru's heart to cleanse it.",c:['illidan','maiev','kaelthas','kiljaeden','velen','muru','liadrin'],rel:'2007'},
  {y:'Wrath of the Lich King',t:'Icecrown',d:"The Wrathgate disaster, the madness of Malygos and Yogg-Saron in Ulduar lead to the assault on Icecrown. Arthas dies and Bolvar takes the Helm to keep the dead in check.",c:['arthas','tirion','bolvar','yogg','malygos','darion','sindragosa','anubarak','korialstrasz'],rel:'2008'},
  {y:'Cataclysm',t:'Deathwing returns',d:"Deathwing breaks the world. Garrosh becomes warchief and kills Cairne. Magni turns to diamond. The Aspects spend their power to kill Deathwing.",c:['deathwing','thrall','garrosh','cairne','magni','ragnaros','fandral','chogall','korialstrasz'],rel:'2010'},
  {y:'Mists of Pandaria',t:'The fall of Garrosh',d:"Garrosh destroys Theramore and turns Jaina against the Horde. In Pandaria he takes the heart of Y'Shaarj, and the Horde and Alliance bring him down at the Siege of Orgrimmar.",c:['garrosh','jaina','rhonin','yshaarj','voljin','wrathion','anduin','thrall'],rel:'2012'},
  {y:'Warlords of Draenor',t:'The Iron Horde',d:"Garrosh escapes to an alternate Draenor. Thrall kills him there. Gul'dan takes over the orcs and Archimonde falls in Hellfire Citadel.",c:['garrosh','thrall','grom','yrel','guldan','archimonde','khadgar'],rel:'2014'},
  {y:'Legion',t:'The Burning Legion\u2019s last invasion',d:"Varian and Vol'jin die at the Broken Shore and Sylvanas becomes warchief. Illidan returns, and the war moves to Argus. The Pantheon imprisons Sargeras, who stabs Azeroth with his sword.",c:['varian','voljin','tirion','sylvanas','illidan','guldan','kiljaeden','sargeras','alleria','turalyon','xera','velen','khadgar','ysera','elisande','thalyssra'],rel:'2016'},
  {y:'Battle for Azeroth',t:'Faction war and N\u2019Zoth',d:"Sylvanas burns Teldrassil and the factions go to war over azerite. Saurfang's duel breaks her rule and she disappears. Azshara and then N'Zoth are defeated.",c:['sylvanas','tyrande','nathanos','saurfang','jaina','talanji','ghuun','azshara','nzoth','magni','baine','anduin'],rel:'2018'},
  {y:'Shadowlands',t:'The Jailer',d:"Sylvanas shatters the Helm of Domination and tears open the sky. Heroes enter the realm of Death, free Anduin from the Jailer's control and defeat Zovaal. Sylvanas begins her atonement.",c:['sylvanas','bolvar','jailer','anduin','denathrius','kelthuzad','arbiter','uther','draka','winterqueen','ysera'],rel:'2020'},
  {y:'Dragonflight',t:'The Dragon Isles',d:"The dragons return home, the Aspects regain their powers and the Primalists are driven back. Fyrakk is stopped at the new World Tree, Amirdrassil.",c:['alexstrasza','nozdormu','murozond','fyrakk','wrathion','kalecgos','chromie','tyrande'],rel:'2022'},
  {y:'The War Within',t:'Xal\u2019atath rises',d:"The first chapter of the Worldsoul Saga. Xal'atath lures Dalaran to Khaz Algar and destroys it there. Queen Ansurek dies in Nerub-ar Palace, and heroes side with Xal'atath to defeat Dimensius, whose power she takes.",c:['xalatath','anduin','magni','ansurek','dimensius','alleria','azeroth'],rel:'2024'},
  {y:'Midnight',t:'Light and Shadow over Quel\u2019Thalas',d:"Xal'atath's Void army comes for the Sunwell. Elves of every nation fight together. L'ura falls, but the Sunwell is broken; it is reborn as the Dawnwell. Alleria and Turalyon are lost to the Void at the Voidspire, and Xal'atath escapes through the Darkwell.",c:['xalatath','lura','alleria','turalyon','arator','lorthemar','liadrin','umbric','vereesa','thalyssra','shandris'],rel:'2026'},
  {y:'The Last Titan',t:'Coming next',d:"The last chapter of the Worldsoul Saga, set in Northrend, where the titans return at Ulduar.",c:['azeroth','xalatath'],rel:'Announced for 2027',upcoming:true}
 ]}
];
