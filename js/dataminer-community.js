// WORST. JAVASCRIPT. EVER.
( function() {

var app = null; // app is global? are you stupid?

// chart defaults
Chart.defaults.color = '#FFF';
Chart.defaults.elements.line.backgroundColor = '#41A34F'; // cogmind green is actually #3EC952
Chart.defaults.elements.line.borderColor = '#41A34F';
Chart.defaults.elements.bar.backgroundColor = '#41A34F';
Chart.defaults.elements.bar.borderColor = '#41A34F';
Chart.defaults.elements.point.radius = 0;
Chart.pie_colors = [ // you should not be adding stuff in like this. 
	'#2fa533', // green
	'#26bfc7', // cyan
	'#1c5d8b', // dull blue
	'#6d22aa', // aubergine
	'#df81d8', // pinkish
	'#aa1b36', // red
	'#dba434', // orange
	'#dbe72a', // yellow 
	'#583411', // brown 
	'#c9c9c9', // grey
	'#111111', // blackish
	'#6ea81d', // whatever
	'#0c2fb4',
	'#b31ab1',
	'#ff00fe',
	'#3a856c',
	'#853a70',
	'#867f66',
	'#152d69',
	'#57391f',
];
Chart.colors_by_key = {
	win: '#41A34F',
	wins: '#41A34F',
	a0: '#000000',
	command: '#2671b9',
	access: '#EEEEEE', 
	research: '#BB1199', 
	factory: '#888', 
	materials: '#CC9966',
	power: '#dfd239',
	propulsion: '#418d4f',
	utility: '#1e66a7',
	weapon: '#aa1b36',
	terminals: '#41A34F',
	fabricators: '#314cad',
	repairStations: '#972217',
	recyclingUnits: '#ebe53e',
	garrisonAccess: '#dfdfdf',
	scanalyzers: '#c228bc',
	spotted: '#ebe53e',
	squadsDispatched: '#d35d94',
	mostBotsTracking: '#7e187d',
	distressSignals: '#ff8a00',
	haulersReinforced: '#8bdb5d',
	constructionImpeded: '#0a8524',
	trapsTriggered: '#bb2324',
	signalsJammed: '#2379bb',
	core: '#5bc2c9',
	flight: '#ffbfc0',
	hover: '#8a1997',
	legs: '#1E66A7',
	leg: '#1E66A7',
	wheels: '#238628',
	wheel: '#238628',
	treads: '#f19700',
	reactor: '#7810B3',
	engine: '#418d4f',
	device: '#AAA',
	processor: '#54BBE4',
	artifact: '#42D484',
	storage: '#145583',
	hackware: '#F590DE',
	protection: '#222',
	thermal: 'rgba(255,158,0,1)', 
	energyGun: 'rgb(255,158,0)',
	energyCannon: 'rgb(255,100,0)',
	kinetic: 'rgba(55,123,196,1)', 
	ballisticCannon: 'rgb(20,80,135)',
	ballisticGun: 'rgb(55,123,196)',
	launcher: 'rgb(219,41,41)',
	explosions: 'rgba(219,41,41,1)',
	slashing: 'rgba(214,221,17,1)', 
	slashingWeapon: 'rgba(214,221,17,1)',
	melee: 'rgba(214,221,17,1)', 
	piercing: 'rgba(192,55,196,1)', 
	piercingWeapon: 'rgba(192,55,196,1)',
	impact: 'rgba(240,240,240,1)',
	impactWeapon: 'rgba(240,240,240,1)',
	specialWeapon: '#999',
	specialMeleeWeapon: '#42D484',
	special: '#42D484',
	phasic: '#00744a',
	phasicWeapon: '#DD4499',
	entropic: '#ff6ab6', 
	entropicWeapon: '#ff6ab6',
	electromagnetic: 'rgba(59,221,17,1)', 
	explosive: 'rgba(219,41,41,1)', 
	allies: '#73d0ff',	
	gun: '#89a784', 
	guns: '#89a784', 
	cannon: '#5647a2', 
	cannons: '#5647a2', 
	ramming: '#FFF'
};

Chart.SortPieData = function ( data, labels, colors=null ) { // coupled arrays
	let couples = [];
	for ( let i=0; i < data.length; i++ ) {
		couples.push([ data[i], labels[i], (colors ? colors[i] : null) ]);
	}
	couples = couples.sort( (a,b) => b[0] - a[0] );
	for ( let i=0; i < data.length; i++ ) {
		data[i] = couples[i][0];	
		labels[i] = couples[i][1];
		if ( colors ) {
			colors[i] = couples[i][2];
		}
	}
}

function Undatafy() { 
	return this
		// .replace(/((?<!^)[A-Z](?![A-Z]))(?=\S)/g, ' $1') // doesn't work on iOS :-(
        .replace(/[^a-zA-Z0-9]+/g, '~')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1~$2')
        .replace(/([a-z])([A-Z])/g, '$1~$2')
        .replace(/([0-9])([^0-9])/g, '$1~$2')
        .replace(/([^0-9])([0-9])/g, '$1~$2')
        .replace(/~+/g, ' ')
		.replace('0 b 10','0b10')
		.replace('Mainc','Main.C')
		.replace(/\bTh\b/,'TH')
		.replace(/\bKi\b/,'KI')
		.replace(/\bEx\b/,'EX')
		.replace(/\bEm\b/,'EM')
		.replace(/\bLe\b/,'LE')
		.replace(/\bEn\b/,'EN')
		.replace(/\bRif\b/,'RIF')
        .replace(/([AR]) ([0-9])/, '$1$2')
		.replace(/^./, s => s.toUpperCase() );
}
String.prototype.Undatafy = Undatafy; // you're bad for doing this

// this provides configuration that ties together HTTP requests for data
// with charts and graphs that need to be updated. Then you can just queue
// updates by name and the configuration here does all the stuff.
let notOverall = x => !x.label.match(/overall$/);
let updatesConfig = {
	runsByDay: {
		requests: [
			'runsByDay'
		],
		draw: function () {
			if ( !app.settings.player && app.stats.data.runsByDay?.length ) {
				app.charts.push( DrawRunsByDayChart( 
					app.stats.data.runsByDay.map( x => ({x:x.date, y:x.num}) )
					) );
			}		
		}		
	},
	playerRuns: {
		requests: [
			'playerRuns'
		],
		draw: function () {
			if ( app.settings.player && app.stats.data.playerRuns?.length ) {
				app.charts.push( DrawPlayerRunsChart( 
					app.stats.data.playerRuns.map( x => ({ x:x.date, y:x.score }) ),
					app.stats.data.playerRuns.map( x => {
						if ( x.win ) return Chart.colors_by_key['win'];
						else if ( x.final_depth < -7 ) return Chart.colors_by_key['materials'];
						else if ( x.final_depth < -3 ) return Chart.colors_by_key['factory'];
						else if ( x.final_depth < -1 ) return Chart.colors_by_key['research'];
						else if ( x.final_map == 'COM' ) return Chart.colors_by_key['command'];
						else if ( x.final_map == 'AC0' ) return Chart.colors_by_key['a0'];
						return Chart.colors_by_key['access'];
					} ),
				) );
			}	
		}		
	},
	winloss: {
		requests: [ 'winloss' ],
		draw: function () {
			// console.log('theoretically we have winloss data now',app.stats);
			app.charts.push( DrawWinLossPieChart( 
				[	app.stats.data.winloss.wins, 
					app.stats.data.winloss.access,
					app.stats.data.winloss.research,
					app.stats.data.winloss.factory,
					app.stats.data.winloss.materials,
				], 
				['Wins','Access','Research','Factory','Materials']
				) 
			);	
		}		
	},
	wintypes: {
		requests: [ 'wintypes' ],
		draw: function () {
				app.charts.push( DrawWinTypesPieChart( 
					app.stats.data.wintypes.filter( x => x.value >= 0 ).map( x => x.num ),
					app.stats.data.wintypes.filter( x => x.value >= 0 ).map( x => 'W' + x.value )
					) );
			
		}		
	},
	runtimesChartData: {
		requests: [ 'runtimesChartData' ],
		draw: function () {
			app.charts.push( DrawPlaytimeChart( 
				app.stats.data.runtimesChartData.filter( x => x.minutes < 500 ).map( x => ({x:x.minutes, y:x.num}) )
			) );		
		}		
	},
	spacesMoved: {
		requests: [ 'spacesMoved' ],
		draw: function () {
			let spacesMoved = app.stats.data.spacesMoved.filter( x => x.label != 'stats.exploration.spacesMoved.overall' );
			app.charts.push( DrawGenericChart(
				spacesMoved.map( x => x.sum ),
				spacesMoved.map( x => x.label.replace('stats.exploration.spacesMoved.','') ),
				'spacesMovedPieChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'left', aspectRatio:1.75 }
				) );	
		}		
	},
	machinesAccessed: {
		requests: [ 'machinesAccessed' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.machinesAccessed.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.machinesAccessed.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'machinesAccessChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'top', aspectRatio:1, chartType: 'doughnut' }
				) );			
		}		
	},
	machinesHacked: {
		requests: [ 'machinesHacked' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.machinesHacked.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.machinesHacked.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'machinesHackedChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'top', aspectRatio:1, chartType: 'doughnut' }
				) );			
		}		
	},
	terminalHacks: {
		requests: [ 'terminalHacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.terminalHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.terminalHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'terminalHacksChart',
				{ sort:true,  undatafy: true, addpct:true, legend:false, aspectRatio:0.75, flipAxes:true, chartType: 'bar' }
				) );			
		}		
	},
	fabricatorHacks: {
		requests: [ 'fabricatorHacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.fabricatorHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.fabricatorHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'fabricatorHacksChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', aspectRatio:2, chartType: 'pie' }
				) );			
		}		
	},
	repairStationHacks: {
		requests: [ 'repairStationHacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.repairStationHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.repairStationHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'repairStationHacksChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', aspectRatio:2, chartType: 'pie' }
				) );			
		}		
	},
	recyclingUnitHacks: {
		requests: [ 'recyclingUnitHacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.recyclingUnitHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.recyclingUnitHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'recyclingUnitHacksChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', aspectRatio:2, chartType: 'pie' }
				) );			
		}		
	},
	scanalyzerHacks: {
		requests: [ 'scanalyzerHacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.scanalyzerHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.scanalyzerHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'scanalyzerHacksChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', aspectRatio:2, chartType: 'pie' }
				) );			
		}		
	},
	garrisonAccessHacks: {
		requests: [ 'garrisonAccessHacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.garrisonAccessHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.garrisonAccessHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'garrisonAccessHacksChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', aspectRatio:2, chartType: 'pie' }
				) );			
		}		
	},
	unauthorizedHacks: {
		requests: [ 'unauthorizedHacks' ],
		draw: function () {
			// this chart gets special colors
			app.charts.push( DrawGenericChart( 
				app.stats.data.unauthorizedHacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.unauthorizedHacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'unauthorizedHacksChart',
				{ sort:true,  undatafy: true, addpct:true, legend:false, aspectRatio:1, flipAxes:true, chartType: 'bar', colors:
					app.stats.data.unauthorizedHacks.filter(notOverall).map( x => { 
						if ( x.label.match(/terminals/) ) { return Chart.colors_by_key['terminals'] } 
						if ( x.label.match(/fabricators/) ) { return Chart.colors_by_key['fabricators'] } 
						if ( x.label.match(/repairStations/) ) { return Chart.colors_by_key['repairStations'] } 
						if ( x.label.match(/scanalyzers/) ) { return Chart.colors_by_key['scanalyzers'] } 
						if ( x.label.match(/garrisonAccess/) ) { return Chart.colors_by_key['garrisonAccess'] } 
						if ( x.label.match(/recyclingUnits/) ) { return Chart.colors_by_key['recyclingUnits'] } 
						return Chart.colors_by_key['terminals'];
					}) 
				} ) );			
		}		
	},
	robotsHacked: {
		requests: [ 'robotsHacked' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.robotsHacked.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.robotsHacked.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'robotsHackedChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', aspectRatio:2, chartType: 'pie' }
				) );			
		}		
	},
	bothacks: {
		requests: [ 'bothacks' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.bothacks.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.bothacks.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'bothacksChart',
				{ sort:true, undatafy: true, addpct:true, legend:false, aspectRatio:0.6, flipAxes:true, chartType: 'bar' }
				) );			
		}		
	},
	attacksByWeaponType: {
		requests: [ 'attacksByWeaponType' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.attacksByWeaponType.map( x => x.sum ) ,
				app.stats.data.attacksByWeaponType.map( x => x.label.replace(/^.*\./,'').replace('overall','melee') ),
				'attacksByWeaponTypeChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'top', aspectRatio:1 }
				) );			
		}		
	},
	attacksByDamageType: {
		requests: [ 'attacksByDamageType' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.attacksByDamageType.map( x => x.sum ) ,
				app.stats.data.attacksByDamageType.map( x => x.label.replace(/^.*\./,'') ),
				'attacksByDamageTypeChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'top', aspectRatio:1 }
				) );			
		}		
	},
	damageByWeaponType: {
		requests: [ 'damageByWeaponType' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.damageByWeaponType.map( x => x.sum ) ,
				app.stats.data.damageByWeaponType.map( x => x.label.replace(/^.*\./,'') ),
				'damageByWeaponTypeChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'top', aspectRatio:1 }
				) );			
		}		
	},
	damageByDamageType: {
		requests: [ 'damageByDamageType' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.damageByDamageType.map( x => x.sum ) ,
				app.stats.data.damageByDamageType.map( x => x.label.replace(/^.*\./,'') ),
				'damageByDamageTypeChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'top', aspectRatio:1 }
				) );			
		}		
	},
	classesDestroyed: {
		requests: [ 'classesDestroyed' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.classesDestroyed.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.classesDestroyed.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'botsDestroyedChart',
				{ sort:true, colors: 'pie', undatafy: true, addpct:true, legend:false, aspectRatio:0.5, flipAxes:true, chartType:'bar' }
				) );			
		}		
	},
	squadsDispatched: {
		requests: [ 'squadsDispatched' ],
		draw: function () {
			app.charts.push( DrawGenericChart( 
				app.stats.data.squadsDispatched.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.squadsDispatched.filter(notOverall).map( x => x.label.replace(/^.*\./,'') ),
				'squadsDispatchedChart',
				{ sort:true, colors: 'pie', undatafy: true, addpct:true, legendPos:'left', aspectRatio:1.75 }
				) );			
		}		
	},
	alertLevels: {
		requests: [ 'alertLevels' ],
		draw: function () {
			// app.stats.data.alertLevels.sort( (a,b) => b.sorting - a.sorting );
			app.charts.push( DrawGenericChart( 
				app.stats.data.alertLevels.filter(notOverall).map( x => x.sum ) ,
				app.stats.data.alertLevels.filter(notOverall).map( x => x.label.replace(/^.*\./,'').replace('lowSecurityPercent','lowSecurity') ),
				'alertLevelsChart',
				{ sort:true, colors: 'pie', undatafy: true, addpct:true, legendPos:'left', aspectRatio:1.75 }
				) );			
		}		
	},	
	metadata: {
		requests: [ 'metadata' ],
		draw: function () {
			// unwrap multiple keyed data structures we got from server
			for ( let k in app.stats.data.metadata ) {
				app.stats.data[k] = app.stats.data.metadata[k];
			}
			delete(app.stats.data.metadata);
		}		
	},	
}

function CurrentCacheSignature(label) {
	return app.settings.difficulty + 
	'-' + app.settings.mode + 
	'-' + app.settings.version + 
	'-' + app.settings.player + 
	'-' + app.settings.winsonly;
}

function RequestIsCached(label) {
	$sig = CurrentCacheSignature();
	if ( app.cache_signatures.get(label) ) $sig
}

// returns a promise you can chain
function QueueUpdate(name) {
	let is_cached = CurrentCacheSignature() === app.cache_signatures.get(name);
	
	// if cached, just redraw if needed, wrapped in promise
	if ( is_cached ) {
		return new Promise( (resolveFn, rejectFn) => {
			if ( updatesConfig.hasOwnProperty(name) ) {
				updatesConfig[name]?.draw();
			}
			resolveFn(true);
		});
	}
	
	// otherwise mark as cached for future hits
	if ( !is_cached ) {
		app.cache_signatures.set(name, CurrentCacheSignature());
	}
	
	app.spinners[name] = true; 
	
	// get a configured query, likely something that needs to draw a chart
	if ( updatesConfig.hasOwnProperty(name) ) {
		return Promise.all( updatesConfig[name].requests.map( 
			reqname => LoadStatsFromServer( reqname, data => {
				if ( data ) { 
					app.stats.data[reqname] = data;
				}
			}, false )
		) )
		.then( _ => { 
			app.spinners[name] = false; 
			updatesConfig[name].draw();
	 	});
	}
	// skip the config and just get raw data, usually for tabular output
	else {
		return LoadStatsFromServer( name, data => {
			if ( data ) { 
				app.stats.data[name] = data;
			}
		} , false )
		.then( _ => { 
			app.spinners[name] = false; 
	 	});		
	}
}



// ======== NOW LETS ACTUALLY GET SOME WORK DONE ==========

// URL query string params
const urlSearchParams = new URLSearchParams(window.location.search);
const qsparams = Object.fromEntries(urlSearchParams.entries());

// set up Vue
app = new Vue({
	el: '#app',
	data: { 
		analysis: null, // populates when request for JSON succeeds
		pane: null, // dont set to 'overview' by default. graphs need to be prompted to draw
		stats: { // to be populated by server later, however we need some hooks for vue.js up front
			data: { 
				num_runs:0,
				runtimeAvg:0,
				playerRuns:[],
				versions:[],
				difficulties:[],
				modes:[],
				players:[],
				highscores:[],
				causeOfDeath:[],
				itemOfDeath:[],
				'favorites.power.overall': [],
				'favorites.power.engine': [],
				'favorites.power.powerCore': [],
				'favorites.power.reactor': [],
				'favorites.propulsion.overall': [],
				'favorites.propulsion.treads': [],
				'favorites.propulsion.leg': [],
				'favorites.propulsion.wheel': [],
				'favorites.propulsion.hoverUnit': [],
				'favorites.propulsion.flightUnit': [],
				'favorites.utility.overall': [],
				'favorites.utility.device': [],
				'favorites.utility.storage': [],
				'favorites.utility.processor': [],
				'favorites.utility.hackware': [],
				'favorites.utility.protection': [],
				'favorites.utility.artifact': [],
				'favorites.weapon.overall': [],
				'favorites.weapon.energyGun': [],
				'favorites.weapon.energyCannon': [],
				'favorites.weapon.ballisticGun': [],
				'favorites.weapon.ballisticCannon': [],
				'favorites.weapon.launcher': [],
				'favorites.weapon.specialWeapon': [],
				'favorites.weapon.impactWeapon': [],
				'favorites.weapon.slashingWeapon': [],
				'favorites.weapon.piercingWeapon': [],
				'favorites.weapon.specialMeleeWeapon': [],
			} 
		}, 
		ChangePane,
		QueueUpdate,
		UpdateStats,
		selectStatLookup,
		toggleSettingsMenu,
		validateLookupFilter,
		selectedStatLookup: null,
		statLookupFilter: '',
		selectedStatData: null,
		showSettingsMenu: false,
		showStatLookupFilter: false,
		charts: [],
		error_msg: null,
		cache_signatures: new Map(),
		// add `label`:true to make a spinner appear, remove afterward 
		// TECHNICAL: vue.js needs all options to be present upfront to maintain reactivity 
		spinners: {
			runsByDay:false,
			playerRuns:false,
			winloss:false,
			wintypes:false,
			runtimesChartData:false,
			spacesMoved:false,
			machinesAccessed:false,
			machinesHacked:false,
			terminalHacks:false,
			fabricatorHacks:false,
			repairStationHacks:false,
			recyclingUnitHacks:false,
			scanalyzerHacks:false,
			garrisonAccessHacks:false,
			unauthorizedHacks:false,
			robotsHacked:false,
			bothacks:false,
			attacksByWeaponType:false,
			attacksByDamageType:false,
			damageByWeaponType:false,
			damageByDamageType:false,
			classesDestroyed:false,
			squadsDispatched:false,
			alertLevels:false,
			metadata:false,		
		}, 
		settings: {
			num: 50,
			difficulty: (qsparams.difficulty || ''),
			mode: (qsparams.mode || (qsparams.player ? '' : 'SPECIAL_MODE_NONE')),
			version: (qsparams.version || (qsparams.player ? '' : 'Beta 14.x')),
			player: (qsparams.player || ''),
			winsonly: (qsparams.winsonly ? 1 : 0),
			skipcache: (qsparams.skipcache ? 1 : 0),
			label: (qsparams.label || ''),
			sort: (qsparams.sort || 'desc'),
			difficulties: [],
			versions: [],
			players: [],
			modes:[]
		},
		settingsForm: {
			num: 50,
			difficulty: (qsparams.difficulty || ''),
			mode: (qsparams.mode || (qsparams.player ? '' : 'SPECIAL_MODE_NONE')),
			version: (qsparams.version || (qsparams.player ? '' : 'Beta 14.x')),
			player: (qsparams.player || ''),
			winsonly: (qsparams.winsonly ? 1 : 0),
			skipcache: (qsparams.skipcache ? 1 : 0),
			label: (qsparams.label || ''),
			sort: (qsparams.sort || 'desc')
		}
	}
})

// start by showing the loading screen
ChangePane('loading');

// get the basic metadata that we need to show the menus, then display the overview
QueueUpdate('metadata').then( _ => ChangePane('overview') );

// run this function when a menu selection changes. update settings and
// refresh the content of the currently displayed pane
function UpdateStats() {
	let temp = app.pane;
	ChangePane('loading');
	// copy the selected settings from the form into the application settings
	for ( let k in app.settingsForm ) {
		app.settings[k] = app.settingsForm[k];
	}
	app.showSettingsMenu = false;
	// reacquire the data from the server for the pane we were just on
	ChangePane( temp );
}

function LoadStatsFromServer( requestFunction='community', callback, autoChangePanes=true ) {

	this.error_msg = null;
	
	let file = `dataminer.php?f=${requestFunction}&winsonly=${app.settings.winsonly}&mode=${app.settings.mode}&difficulty=${app.settings.difficulty}&version=${app.settings.version}&player=${app.settings.player}&skipcache=${app.settings.skipcache}&label=${app.settings.label}&num=${app.settings.num}&sort=${app.settings.sort}`;
	
	if ( autoChangePanes ) { ChangePane('loading'); }
	
	return fetch( file )
	.then( rsp => {
		if ( !rsp.ok || !rsp.body || String(rsp.status).match(/^(4|5)/) ) {
			if ( autoChangePanes ) { ChangePane('overview'); }
			app.error_msg = 'Server statistics not available. Could not lock coordinates for planetary alignment matrix transform, or possibly server is busted.';
			return false;
		}		
		return rsp.json();
	})
	.then( callback )
	.catch( error => {
		app.error_msg = 'Error when trying to get file: ' + error;
		if ( autoChangePanes ) { ChangePane('overview'); }
	});
}

function toggleSettingsMenu() {
	// copy settings into the form
	if ( !app.showSettingsMenu ) {
		for ( k in app.settingsForm ) {
			app.settingsForm[k] = app.settings[k];
		}
	}
	app.showSettingsMenu = !app.showSettingsMenu;
}

function validateLookupFilter() {
	// make sure the thing typed into the search box actually exists
	let i = app.stats.data.stat_labels.map(x => x.label).indexOf( app.statLookupFilter );
	if ( i > -1 ) {
		app.selectedStatLookup = app.stats.data.stat_labels[i];
		app.statLookupFilter = '';
		app.showStatLookupFilter = false;
	}
	else {
		// app.selectedStatLookup = null;
	}
}

function selectStatLookup() {
	if ( !app.selectedStatLookup ) { return false; }
	app.settings.label = app.selectedStatLookup.label;
	app.settings.num = 100;
	app.selectedStatData = 'loading';
	// if the data is numeric, get the top30 list
	if ( app.selectedStatLookup.type !== 'string' ) {
		LoadStatsFromServer( 'topx', data => {
			if ( data ) { 
				app.selectedStatData = data;
				ChangePane('lookup');
			}
		}, false);	
	}
	else {
		// if its a string, we want a frequency count instead
		LoadStatsFromServer( 'strfreq', data => {
			if ( data ) { 
				app.selectedStatData = data;
				ChangePane('lookup');
			}
		}, false);	
	}
	
}

function ChangePane(pane) {

	showSettingsMenu = false;
	
	if ( app.pane == pane ) { 
		return false; 
	}
	window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); 
	// cleanup current page
	for ( let chart of app.charts ) {
		if ( chart ) chart.destroy();
	}
	app.charts = [];
	// switch panes
	app.pane = pane;
	// draw charts that need the rendered HTML to be present first
	Vue.nextTick( _ => {
		QueueUpdate('num_runs'); // needs to update on every page
		if ( pane === 'build' ) {
			QueueUpdate('spacesMoved').then( _ => {
				QueueUpdate('favorites.propulsion.overall');
				QueueUpdate('favorites.propulsion.treads');
				QueueUpdate('favorites.propulsion.leg');
				QueueUpdate('favorites.propulsion.wheel');
				QueueUpdate('favorites.propulsion.hoverUnit');
				QueueUpdate('favorites.propulsion.flightUnit');
			}).then( _ => {
				QueueUpdate('favorites.weapon.overall');
				QueueUpdate('favorites.weapon.energyGun');
				QueueUpdate('favorites.weapon.energyCannon');
				QueueUpdate('favorites.weapon.ballisticGun');
				QueueUpdate('favorites.weapon.ballisticCannon');
				QueueUpdate('favorites.weapon.launcher');
				QueueUpdate('favorites.weapon.specialWeapon');
				QueueUpdate('favorites.weapon.impactWeapon');
				QueueUpdate('favorites.weapon.slashingWeapon');
				QueueUpdate('favorites.weapon.piercingWeapon');
				QueueUpdate('favorites.weapon.specialMeleeWeapon');		
			}).then( _ => {
				QueueUpdate('favorites.power.overall');
				QueueUpdate('favorites.power.engine');
				QueueUpdate('favorites.power.powerCore');
				QueueUpdate('favorites.power.reactor');
			}).then( _ => {
				QueueUpdate('favorites.utility.overall');
				QueueUpdate('favorites.utility.device');
				QueueUpdate('favorites.utility.storage');
				QueueUpdate('favorites.utility.processor');
				QueueUpdate('favorites.utility.hackware');
				QueueUpdate('favorites.utility.protection');
				QueueUpdate('favorites.utility.artifact');
			});
		}
		else if ( pane === 'overview' ) {
			Promise.all( [
				app.settings.player ? QueueUpdate('playerRuns') : QueueUpdate('runsByDay'),
				QueueUpdate('runtimeAvg'),
				QueueUpdate('winloss'),
				QueueUpdate('wintypes'),
			]).then( _ => { 
				QueueUpdate('runtimesChartData');
				QueueUpdate('causeOfDeath');
				QueueUpdate('itemOfDeath');
				QueueUpdate('highscores');
			});
		}
		else if ( pane === 'hacking' ) {
			Promise.all( [
				QueueUpdate('machinesAccessed'),
				QueueUpdate('machinesHacked'),
			]).then( _ => { 
				QueueUpdate('terminalHacks');
			}).then( _ => { 
				QueueUpdate('fabricatorHacks');
				QueueUpdate('repairStationHacks');
				QueueUpdate('recyclingUnitHacks');
				QueueUpdate('scanalyzerHacks');
				QueueUpdate('garrisonAccessHacks');
			}).then( _ => { 
				QueueUpdate('unauthorizedHacks');
				QueueUpdate('robotsHacked');
				QueueUpdate('bothacks');
			});
		}
		else if ( pane === 'combat' ) {
			QueueUpdate('alertLevels').then( _ => {
				QueueUpdate('squadsDispatched');
				QueueUpdate('attacksByWeaponType');
				QueueUpdate('attacksByDamageType');
				QueueUpdate('damageByWeaponType');
				QueueUpdate('damageByDamageType');
				QueueUpdate('classesDestroyed');
			});
		}
	});
}


function DrawPlaytimeChart( data ) {
	if ( !data || data.length <= 1 || !document.getElementById('playtimeChart') ) { 
		// console.log("No data or no canvas: " + 'playtimeChart');
		return false; 
	}
	// we're going to restructure the data into larger blocks of time to make the graph chunkier
	let divisor = 5;
	let = newdata = {};
	for ( let d of data ) {
		let newminutes = ( Math.trunc(d.x / divisor) * divisor ) + divisor;
		newdata[newminutes] = (newdata[newminutes] || 0 ) + d.y;
	}
	
	const chartdata = {
		datasets: [{
			label: 'Play Time',
			borderWidth: 1,
			fill: true,
			data: newdata,
		}]
	};
	const config = {
		type: (data.length > 500 ? 'line' : 'bar' ),
		data: chartdata,
		options: {
			aspectRatio: 3,
			responsive: true,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { display: false },
				title: { display: false }
			},
			scales: {
				x: {
					type: 'linear',
					title: { 
						text: 'Minutes',
						display: true
					}
				},
				y: {
					type: 'linear',
					title: { 
						text: 'Runs',
						display: true
					}
				}
			}
		},
	};
	return new Chart( document.getElementById('playtimeChart'), config );
}


function DrawPlayerRunsChart( data, colors ) {
	if ( !data || data.length <= 1 || !document.getElementById('playerRunsChart') ) { 
		// console.log("No data or no canvas: " + 'playerRunsChart');
		return false; 
	}
	const chartdata = {
		datasets: [{
			borderWidth: 1,
			data: data,
			pointRadius:6,
			showLine: false,
			fill: false,
			backgroundColor: ( colors || 'rgba(65, 163, 79, 0.75)' )
		}]
	};
	const config = {
		type: 'line',
		data: chartdata,
		options: {
			aspectRatio: 3,
			responsive: true,
			interaction: {
				intersect: false,
			},				
				
			plugins: {
				legend: { display: false },
				title: { display: false }
			},
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'month'
					},					
					title: { 
						text: 'Date',
						display: true
					}
				},
				y: {
					// type: 'linear',
					title: { 
						text: 'Score',
						display: true
					}
				}
			}
		},
	};
	return new Chart( document.getElementById('playerRunsChart'), config );
}

function DrawRunsByDayChart( data ) {
	if ( !data || data.length <= 1 || !document.getElementById('runsByDayChart') ) { 
		// console.log("No data or no canvas: " + 'runsByDayChart');
		return false; 
	}
	const chartdata = {
		datasets: [{
			label: 'Runs Per Day',
			borderWidth: 1,
			data: data,
			// pointRadius:8,
			// showLine: false,
			fill: true,
			// backgroundColor: 'rgba(65, 163, 79, 0.75)'
		}]
	};
	const config = {
		type: 'line',
		data: chartdata,
		options: {
			aspectRatio: 2,
			responsive: true,
			interaction: {
				intersect: false,
			},				
			plugins: {
				legend: { display: false },
				title: { display: false }
			},
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'month'
					},					
					title: { 
						text: 'Date',
						display: true
					}
				},
				y: {
					// type: 'linear',
					title: { 
						text: 'Runs Completed',
						display: true
					}
				}
			}
		},
	};
	return new Chart( document.getElementById('runsByDayChart'), config );
}


function DrawWinLossPieChart( data, labels ) {
	if ( !data || data.length === 0 || !document.getElementById('winlossPieChart') ) { 
		// console.log("No data or no canvas: " + 'winlossPieChart');
		return false; 
	}
	// Chart.SortPieData(data,labels);
	datasets = [ { 
		label: 'Wins and Losses', 
		data, 
		// backgroundColor: [ Chart.defaults.elements.line.backgroundColor, '#222222' ],
		backgroundColor: [ Chart.defaults.elements.line.backgroundColor, '#EEEEEE', '#BB1199', '#888', '#CC9966' ],
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'doughnut',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'top', display: true, },
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('winlossPieChart'), config );
}

function DrawWinTypesPieChart( data, labels ) {
	if ( !data || data.length === 0 || !document.getElementById('wintypePieChart') ) { 
		// console.log("No data or no canvas: " + 'wintypePieChart');
		return false; 
	}
	Chart.SortPieData(data,labels);
	datasets = [ { 
		label: 'Win Types', 
		data, 
		backgroundColor: Chart.pie_colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'doughnut',
		data: { labels, datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'top', display: true, },
				title: {
					display: false,
				},
				labels: {
					render: 'percentage',
					fontColor: ['green', 'white', 'red'],
					precision: 2
				}
			}
				
		},
	};
	return new Chart( document.getElementById('wintypePieChart'), config );
}

function DrawGenericChart( data, labels, elementID, options ) {
	if ( !data || data.length <= 1 || !document.getElementById(elementID) ) { 
		// console.log("No data or no canvas: " + elementID);
		return false; 
	}
	
	let bgcolors = Chart.pie_colors;
	if ( options.colors == 'indexed' ) {
		bgcolors = labels.map( k => Chart.colors_by_key[k] );
	}
	else if ( Array.isArray(options.colors) ) {
		bgcolors = options.colors;
	}
	else if ( options.colors == 'pie' ) {
		bgcolors = Chart.pie_colors
	}
	else if ( options.colors ) {
		bgcolors = options.colors
	}
	if ( options.sort ) { 
		if ( Array.isArray(options.colors) || options.colors == 'indexed' ) {
			Chart.SortPieData(data,labels,bgcolors);
		}
		else { Chart.SortPieData(data,labels); };
	}
	if ( options.undatafy ) {
		labels = labels.map( x => x.Undatafy() );
	}
	if ( options.addpct ) {
		let total = 0;
		for ( let i of data ) { total += i; }
		if ( total ) {
			for ( let i=0; i < data.length; i++ ) {
				let pct = ( (data[i] / total) * 100 ).toFixed(1);
				labels[i] = `${labels[i]} (${pct}%)`;
			}
		} 
	}
	datasets = [ { 
		data, 
		backgroundColor: bgcolors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: (options.chartType || 'doughnut'),
		data: { labels, datasets },
		options: {
			indexAxis: (options.flipAxes ? 'y' : 'x'),
			aspectRatio: (options.aspectRatio || null),
			maintainAspectRatio: true, // (!!options.aspectRatio),
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { 
					position: options.legendPos || 'top', 
					display: !('legend' in options && !options.legend)
				},
				title: { display: false, }
			}
				
		},
	};
	return new Chart( document.getElementById(elementID), config );
}

			
}())