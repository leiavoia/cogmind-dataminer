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
Chart.propulsion_colors = [ // no really, you are being very bad 
	'#dfd239', // power
	'#418d4f', // prop
	'#1e66a7', // utility
	'#aa1b36', // weapon
];
Chart.green_colors = [ // i can do what i want!
	'#7fc97d',
	'#67d164',
	'#4ac546',
	'#33a52f',
	'#268623',
	'#1b6b18',
	'#11520e',
	'#093507',
	'#012000',
];
Chart.yellow_colors = [ // you're not the boss of me!
	'#f0ed9e',
	'#e6e066',
	'#d4cd2d',
	'#beb717',
	'#9c960e',
	'#726d08',
	'#4b4705',
	'#1b1a00',
];
Chart.blue_colors = [
	'#87adf5',
	'#608fe9',
	'#3c74e0',
	'#2160da',
	'#0e43aa',
	'#093486',
	'#0a275e',
	'#061a3f',
];
Chart.red_colors = [
	'#ffa9a9',
	'#dd6161',
	'#e03b3b',
	'#e60d0d',
	'#ca0c0c',
	'#ad0b0b',
	'#990a0a',
	'#860808',
	'#700606',
	'#5a0404',
	'#420202',
];
Chart.colors_by_key = {
	power: '#dfd239',
	propulsion: '#418d4f',
	utility: '#1e66a7',
	weapon: '#aa1b36',
	terminals: '#62C462',
	fabricators: '#314cad',
	repairStations: '#972217',
	recyclingUnits: '#ebe53e',
	garrisonAccess: '#dfdfdf',
	scanalyzers: '#c228bc',
	spotted: '#ebe53e',
	squadsDispatches: '#d35d94',
	mostBotsTracking: '#7e187d',
	distressSignals: '#ff8a00',
	haulersReinforced: '#8bdb5d',
	constructionImpeded: '#0a8524',
	trapsTriggered: '#bb2324',
	signalsJammed: '#2379bb',
		
				
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



// ======== NOW LETS ACTUALLY GET SOME WORK DONE ==========

// set up Vue
app = new Vue({
	el: '#app',
	data: { 
		scoresheet: null, // populates when request for JSON succeeds
		pane: null, // dont set to 'overview' by default. graphs need to be prompted to draw
		ChangePane,
		charts: [],
		error_msg: null
	}
})
ChangePane('input');

// var urlParams = new URLSearchParams(window.location.search);
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
let urlpart = window.location.search.trim().replace('?','').replace('hash=','').replace(/&.+/,'');
// let file = `data/${urlpart}`;
if ( urlpart.match(/^[A-Za-z0-9]{17,18}$/) ) {
	// file = 'https://cogmind-api.gridsagegames.com/scoresheets/' + urlpart + '.json';
	file = 'proxy.php?' + urlpart;
}
else { file = null; }

// request data and get the party started
if ( file ) {
	ChangePane('loading');
	fetch( file ).then( rsp => {
		if ( !rsp.ok ) {
			ChangePane('input');
			app.error_msg = 'Networking is having a bad day. It happens.';
		}
		if ( !rsp.body ) {
			ChangePane('input');
			app.error_msg = 'Server returned nothing. Maybe not a real file. Maybe nothing is real. I don\'t know.';
		}		
		return rsp.json();
	})
	.then( data => {
		AnalyzeScoresheet(data);
		app.scoresheet = data;
		ChangePane('overview');
	})
	.catch(error => {
		app.error_msg = 'Error when trying to get file: ' + error;
		ChangePane('input');
	});
}

function AnalyzeScoresheet( data ) {

	data.meta.source_file_txt = 'https://cogmind-api.gridsagegames.com/scoresheets/' + urlpart;
	data.meta.source_file_json = 'https://cogmind-api.gridsagegames.com/scoresheets/' + urlpart + '.json';

	data.flatstats = TabularizeData(data.stats);
	
	// precompute some stuff
	data.charts = {
		turns_chart_data: [],
		hacks_chart_data: [],
		support_chart_data: [],
		weight_chart_data: [],
		inventory_chart_data: [],
		kills_chart_data: [],
		greenbot_kills_chart_data: [],
		neutral_kills_chart_data: [],
		alert_chart_data: [],
		chart_map_labels: [],
		core_chart_data: [],
		damage_received_chart_data: [],
		damage_chart_data: {}, // by type
		stealth_chart_data: { // by type
			spotted: [],
			squadsDispatches: [],
			mostBotsTracking: [],
			distressSignals: [],
			haulersReinforced: [],
			constructionImpeded: [],
			trapsTriggered: [],
			signalsJammed: []
		},
		route_data: [], // { depth: int, maps: [strings] }
		}
	for ( map of data.route.entries ) {
		// map labels
		map.location.mapname = map.location.map.replace('MAP_','');
		map.location.mapname = (map_names[map.location.mapname] || map.location.mapname);
		data.charts.chart_map_labels.push( map.location.depth + '/' + map.location.mapname );
		
		// influence
		data.charts.alert_chart_data.push(map.stats.alert.peakInfluence.overall);
		
		// damage inflicted by weapon type
		// note: not all indexes are present for every map area, so iterate over the "overall" list instead
		for ( let k in data.stats.combat.damageInflicted ) {
			if ( typeof(data.charts.damage_chart_data[k]) === 'undefined' ) { data.charts.damage_chart_data[k] = []; }
			data.charts.damage_chart_data[k].push( map.stats.combat.damageInflicted[k] || 0 );
		}
		// damage from allies
		if ( typeof(data.charts.damage_chart_data['allies']) === 'undefined' ) { data.charts.damage_chart_data['allies'] = []; }
		data.charts.damage_chart_data['allies'].push( map.stats.allies.allyAttacks.totalDamage || 0 );
		
		// stealth actions
		data.charts.stealth_chart_data.spotted.push( map.stats.stealth.timesSpotted.overall );
		data.charts.stealth_chart_data.squadsDispatches.push( map.stats.alert.squadsDispatched.overall );
		data.charts.stealth_chart_data.mostBotsTracking.push( map.stats.stealth.timesSpotted.peakTrackingTotal );
		data.charts.stealth_chart_data.distressSignals.push( map.stats.stealth.distressSignals );
		data.charts.stealth_chart_data.haulersReinforced.push( map.stats.alert.haulersReinforced );
		data.charts.stealth_chart_data.constructionImpeded.push( map.stats.alert.constructionImpeded );
		data.charts.stealth_chart_data.trapsTriggered.push( map.stats.traps.trapsTriggered.overall );
		data.charts.stealth_chart_data.signalsJammed.push( map.stats.stealth.communicationsJammed.overall );
		
		// combat kills
		data.charts.kills_chart_data.push(map.stats.kills.combatHostilesDestroyed.overall);
		// getting non-combat bot kills is more tricky
		let total_bots_killed = 0;
		let green_bots_killed = 0;
		for ( let k in map.stats.kills.classesDestroyed ) {
			if ( ["worker", "builder", "hauler", "recycler", "mechanic"].indexOf(k) > -1 ) {
				green_bots_killed += map.stats.kills.classesDestroyed[k];
			}
			if ( k != 'overall' ) {
				total_bots_killed += map.stats.kills.classesDestroyed[k]; 
			}
		}
		data.charts.greenbot_kills_chart_data.push( green_bots_killed );
		data.charts.neutral_kills_chart_data.push( Math.max( 0, 
			total_bots_killed - 
			( green_bots_killed +  map.stats.kills.combatHostilesDestroyed.overall )
		) );
		
		// inventory size
		data.charts.inventory_chart_data.push( map.stats.build.largestInventoryCapacity.overall );
		
		// weight
		data.charts.weight_chart_data.push( map.stats.build.heaviestBuild.overall );
		
		// support
		data.charts.support_chart_data.push( map.stats.build.heaviestBuild.greatestSupport );
		
		// hacks
		data.charts.hacks_chart_data.push( map.stats.hacking.totalHacks.successfull );
		
		// turns
		data.charts.turns_chart_data.push( map.stats.actions.total.overall );
		
		// damage received
		data.charts.damage_received_chart_data.push( map.stats.combat.damageTaken.overall );
		
		// core
		// data.charts.core_chart_data.push( map.stats.combat.coreRemainingPercent || 100 ); //BUG in stat tracking. branches record zero?
		
		// route
		let last_route = data.charts.route_data.length ? data.charts.route_data[ data.charts.route_data.length-1 ] : null;
		if ( !last_route || last_route.depth != map.location.depth ) {
			last_route = { 
				depth: map.location.depth, 
				maps: [  ]
			};
			data.charts.route_data.push( last_route );
		}
		last_route.maps.push( map.location.mapname );
									
	}
	
	// dishout ratio
	data.stats.dishoutRatio = data.stats.combat.damageTaken.overall 
		? ( data.stats.combat.damageInflicted.overall / data.stats.combat.damageTaken.overall )
		: -1; // indicates "perfect"
	
	// reverse the routes for familiarity
	// data.charts.route_data.reverse();
	data.charts.route_data.shift();
	
	// class distribution
	data.charts.class_distro_chart_data = [];
	data.charts.class_distro_chart_labels = [];
	for ( let c of data.classDistribution.classes ) {
		data.charts.class_distro_chart_data.push( c.percent );
		data.charts.class_distro_chart_labels.push( c.name );
	}
			
	// overall damage types
	data.charts.overall_damage_data = {}
	for ( let k in data.stats.combat.damageInflicted ) {
		if ( typeof(data.charts.overall_damage_data[k]) === 'undefined' ) { data.charts.overall_damage_data[k] = []; }
		data.charts.overall_damage_data[k].push( data.stats.combat.damageInflicted[k] );
	}
	// damage from allies
	if ( typeof(data.charts.overall_damage_data['allies']) === 'undefined' ) { data.charts.overall_damage_data['allies'] = []; }
	data.charts.overall_damage_data['allies'].push( data.stats.allies.allyAttacks.totalDamage || 0 );
			
	// killed bot types
	data.charts.kill_types_chart_labels = [];
	data.charts.kill_types_chart_data = [];
	for ( let k in data.stats.kills.classesDestroyed ) {
		if ( k != 'overall' ) { 
			data.charts.kill_types_chart_labels.push(k);
			data.charts.kill_types_chart_data.push( data.stats.kills.classesDestroyed[k] );
		}
	}
	
	// bothacks
	data.charts.bothacks_chart_labels = [];
	data.charts.bothacks_chart_data = [];
	data.charts.num_bothacks = 0;
	for ( let k in data.stats.bothacking.robotHacksApplied ) {
		if ( k != 'overall' ) { 
			data.charts.bothacks_chart_labels.push(k.Undatafy());
			data.charts.bothacks_chart_data.push( data.stats.bothacking.robotHacksApplied[k] );
			data.charts.num_bothacks +=  data.stats.bothacking.robotHacksApplied[k];
		}
	}
	
	// actions
	data.charts.actions_chart_labels = [];
	data.charts.actions_chart_data = [];
	for ( let k in data.stats.actions.total ) {
		if ( k != 'overall' ) { 
			data.charts.actions_chart_labels.push(k.Undatafy());
			data.charts.actions_chart_data.push( data.stats.actions.total[k] );
		}
	}
	
	// hacks per machine
	data.charts.hacks_per_machine_chart_data = [
		data.stats.hacking.totalHacks.terminals,
		data.stats.hacking.totalHacks.fabricators,
		data.stats.hacking.totalHacks.repairStations,
		data.stats.hacking.totalHacks.scanalyzers,
		data.stats.hacking.totalHacks.recyclingUnits,
		data.stats.hacking.totalHacks.garrisonAccess,
	];
	data.charts.hacks_per_machine_chart_labels = ['terminals','fabricators','repairStations','scanalyzers','recyclingUnits','garrisonAccess'];
		
	// furthest map reached
	data.game.finalMapReached = 
		data.route.entries[ data.route.entries.length-1 ].location.depth
		+ '/' +
		data.route.entries[ data.route.entries.length-1 ].location.map.replace('MAP_','');
	
	// turn cadence (factor out WAITs)
	let timeParts = data.game.runTime.split(':');
	let playtimeInMinutes = parseInt(timeParts[1]) + (parseInt(timeParts[0])*60);
	data.stats.actions.cadence = (data.stats.actions.total.overall - data.stats.actions.total.wait) / playtimeInMinutes;
	
	// parts attached
	data.charts.parts_attached_chart_data = [
		data.stats.build.partsAttached.power.overall,
		data.stats.build.partsAttached.propulsion.overall,
		data.stats.build.partsAttached.utility.overall,
		data.stats.build.partsAttached.weapon.overall,
	];
	data.charts.parts_attached_chart_labels = ['power','propulsion','utility','weapon'];
	
	// parts attached by type
	data.charts.parts_attached_power_chart_data = Object.entries(data.stats.build.partsAttached.power) .filter( x => x[0] != 'overall' );
	data.charts.parts_attached_power_chart_labels = data.charts.parts_attached_power_chart_data.map( x => x[0] );
	data.charts.parts_attached_power_chart_data = data.charts.parts_attached_power_chart_data.map( x => x[1] );
	data.charts.parts_attached_propulsion_chart_data = Object.entries(data.stats.build.partsAttached.propulsion) .filter( x => x[0] != 'overall' );
	data.charts.parts_attached_propulsion_chart_labels = data.charts.parts_attached_propulsion_chart_data.map( x => x[0] );
	data.charts.parts_attached_propulsion_chart_data = data.charts.parts_attached_propulsion_chart_data.map( x => x[1] );
	data.charts.parts_attached_utility_chart_data = Object.entries(data.stats.build.partsAttached.utility) .filter( x => x[0] != 'overall' );
	data.charts.parts_attached_utility_chart_labels = data.charts.parts_attached_utility_chart_data.map( x => x[0] );
	data.charts.parts_attached_utility_chart_data = data.charts.parts_attached_utility_chart_data.map( x => x[1] );
	data.charts.parts_attached_weapon_chart_data = Object.entries(data.stats.build.partsAttached.weapon) .filter( x => x[0] != 'overall' );
	data.charts.parts_attached_weapon_chart_labels = data.charts.parts_attached_weapon_chart_data.map( x => x[0] );
	data.charts.parts_attached_weapon_chart_data = data.charts.parts_attached_weapon_chart_data.map( x => x[1] );
					
	// parts lost
	data.charts.parts_lost_chart_data = [
		data.stats.build.partsLost.power,
		data.stats.build.partsLost.propulsion,
		data.stats.build.partsLost.utility,
		data.stats.build.partsLost.weapon,
	];
	data.charts.parts_lost_chart_labels = ['power','propulsion','utility','weapon'];
				
	// direct hacks
	data.charts.hack_labels = [];
	data.charts.hack_data = [];
	data.charts.hack_colors = [];
	data.charts.hack_data.push( ...Object.entries(data.stats.hacking.terminalHacks).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.hack_data.push( ...Object.entries(data.stats.hacking.fabricatorHacks).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.hack_data.push( ...Object.entries(data.stats.hacking.repairStationHacks).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.hack_data.push( ...Object.entries(data.stats.hacking.scanalyzer).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.hack_data.push( ...Object.entries(data.stats.hacking.garrisonAccessHacks).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.hack_data.push( ...Object.entries(data.stats.hacking.recyclingUnitHacks).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.hack_labels.push( ...Object.entries(data.stats.hacking.terminalHacks).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.hack_labels.push( ...Object.entries(data.stats.hacking.fabricatorHacks).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.hack_labels.push( ...Object.entries(data.stats.hacking.repairStationHacks).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.hack_labels.push( ...Object.entries(data.stats.hacking.scanalyzer).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.hack_labels.push( ...Object.entries(data.stats.hacking.garrisonAccessHacks).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.hack_labels.push( ...Object.entries(data.stats.hacking.recyclingUnitHacks).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.hack_colors.push( ...Object.entries(data.stats.hacking.terminalHacks).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['terminals'] ) );
	data.charts.hack_colors.push( ...Object.entries(data.stats.hacking.fabricatorHacks).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['fabricators'] ) );
	data.charts.hack_colors.push( ...Object.entries(data.stats.hacking.repairStationHacks).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['repairStations'] ) );
	data.charts.hack_colors.push( ...Object.entries(data.stats.hacking.scanalyzer).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['scanalyzers'] ) );
	data.charts.hack_colors.push( ...Object.entries(data.stats.hacking.garrisonAccessHacks).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['garrisonAccess'] ) );
	data.charts.hack_colors.push( ...Object.entries(data.stats.hacking.recyclingUnitHacks).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['recyclingUnits'] ) );
	data.charts.num_directhacks = data.charts.hack_data.filter(x=>x).length;
					
	// unauthorized hacks
	data.charts.uhack_data = [];
	data.charts.uhack_labels = [];
	data.charts.uhack_colors = [];
	data.charts.uhack_data.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.terminals).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.uhack_data.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.fabricators).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.uhack_data.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.repairStations).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.uhack_data.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.scanalyzers).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.uhack_data.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.garrisonAccess).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.uhack_data.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.recyclingUnits).filter(x => x[0] != 'overall').map( x => x[1] ) );
	data.charts.uhack_labels.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.terminals).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.uhack_labels.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.fabricators).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.uhack_labels.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.repairStations).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.uhack_labels.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.scanalyzers).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.uhack_labels.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.garrisonAccess).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.uhack_labels.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.recyclingUnits).filter(x => x[0] != 'overall').map( x => x[0].Undatafy() ) );
	data.charts.uhack_colors.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.terminals).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['terminals'] ) );
	data.charts.uhack_colors.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.fabricators).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['fabricators'] ) );
	data.charts.uhack_colors.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.repairStations).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['repairStations'] ) );
	data.charts.uhack_colors.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.scanalyzers).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['scanalyzers'] ) );
	data.charts.uhack_colors.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.garrisonAccess).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['garrisonAccess'] ) );
	data.charts.uhack_colors.push( ...Object.entries(data.stats.hacking.unauthorizedHacks.recyclingUnits).filter(x => x[0] != 'overall').map( x => Chart.colors_by_key['recyclingUnits'] ) );
	data.charts.num_uhacks = data.charts.uhack_data.filter(x=>x).length;
							
	// Badges
	CalculateBadges(data);
}

function Undatafy() { 
	return this
		.replace(/((?<!^)[A-Z](?![A-Z]))(?=\S)/g, ' $1')
		.replace(/^./, s => s.toUpperCase() );
}
String.prototype.Undatafy = Undatafy; // you're bad for doing this

const map_names = {
	FAC: 'Factory',
	MIN: 'Mines',
	LOW: 'Lower Caves',
	UPP: 'Upper Caves',
	SCR: 'Scrap',
	RES: 'Research',
	ACC: 'Access',
	COM: 'Command',
	AC0: 'A0',
	LAB: 'Lab',
	SEC: 'Section 7',
	ZIO: 'Zion',
	DEE: 'ZDC',
	TES: 'Testing',
	QUA: 'Quarantine',
	PRO: 'Proxy Caves',
	ZHI: 'Zhirov',
	DAT: 'Dataminer',
	WAR: 'Warlord',
	EXI: 'Exiles',
	MAT: 'Materials',
	EXT: 'Extension',
	ARC: 'Archives',
	CET: 'Cetus',
	HUB: 'Hub',
	REC: 'Recycling',
	STO: 'Storage',
	ARM: 'Armory',
	WAS: 'Waste',
	GAR: 'Garrison'
};

function ChangePane(pane) {
	if ( app.pane == pane ) { return false; }
	// cleanup current page
	for ( let chart of app.charts ) {
		chart.destroy();
	}
	app.charts = [];
	// switch panes
	app.pane = pane;
	// draw charts that need the rendered HTML to be present first
	Vue.nextTick( _ => {
		
		if ( pane === 'overview' ) {
			app.charts.push( DrawAlertChart( 
				app.scoresheet.charts.alert_chart_data, 
				app.scoresheet.charts.chart_map_labels
				) );
			app.charts.push( DrawTurnsTakenChart( 
				app.scoresheet.charts.turns_chart_data, 
				app.scoresheet.charts.chart_map_labels
				) );
			app.charts.push( DrawActionsChart( 
				app.scoresheet.charts.actions_chart_data, 
				app.scoresheet.charts.actions_chart_labels
				) );
			// app.charts.push( DrawCoreChart( 
			// 	app.scoresheet.charts.core_chart_data, 
			// 	app.scoresheet.charts.chart_map_labels
			// 	) );
		}
		
		else if ( pane === 'input' ) {
			let el = document.getElementById('jsonfile');
			if ( el ) {
				el.addEventListener('change', event => {
					var reader = new FileReader();
					reader.onload = e => {
						let json = JSON.parse(e.target.result);
						// smells like a scoresheet?
						if ( typeof(json)==='object' && json.header && json.header.playerName ) { 
							AnalyzeScoresheet(json);
							app.scoresheet = json;
							return ChangePane('overview');
						}
						else {
							app.error_msg = 'Not a Cogmind JSON scoresheet file. Make sure it has a .json extension.';
						}
					};
					reader.readAsText(event.target.files[0]);
				});
			}
		}
		
		else if ( pane === 'build' ) {
			app.charts.push( DrawClassDistroChart(
				app.scoresheet.charts.class_distro_chart_data, 
				app.scoresheet.charts.class_distro_chart_labels
				) );
			app.charts.push( DrawPartsAttachedPieChart(
				app.scoresheet.charts.parts_attached_chart_data, 
				app.scoresheet.charts.parts_attached_chart_labels
				) );
			app.charts.push( DrawPowerAttachedPieChart(
				app.scoresheet.charts.parts_attached_power_chart_data, 
				app.scoresheet.charts.parts_attached_power_chart_labels
				) );
			app.charts.push( DrawPropulsionAttachedPieChart(
				app.scoresheet.charts.parts_attached_propulsion_chart_data, 
				app.scoresheet.charts.parts_attached_propulsion_chart_labels
				) );
			app.charts.push( DrawUtilityAttachedPieChart(
				app.scoresheet.charts.parts_attached_utility_chart_data, 
				app.scoresheet.charts.parts_attached_utility_chart_labels
				) );
			app.charts.push( DrawWeaponAttachedPieChart(
				app.scoresheet.charts.parts_attached_weapon_chart_data, 
				app.scoresheet.charts.parts_attached_weapon_chart_labels
				) );
			app.charts.push( DrawPartsLostPieChart(
				app.scoresheet.charts.parts_lost_chart_data, 
				app.scoresheet.charts.parts_lost_chart_labels
				) );
			app.charts.push( DrawWeightChart( {
				support_chart_data: app.scoresheet.charts.support_chart_data,
				weight_chart_data: app.scoresheet.charts.weight_chart_data,
				}, app.scoresheet.charts.chart_map_labels
				) );
			app.charts.push( DrawInventoryChart( app.scoresheet.charts.inventory_chart_data, app.scoresheet.charts.chart_map_labels ) );
		}
		
		else if ( pane === 'combat' ) {
			app.charts.push( DrawKillTypesChart(app.scoresheet.charts.kill_types_chart_data, app.scoresheet.charts.kill_types_chart_labels) );
			app.charts.push( DrawDamageInflictedChart(app.scoresheet.charts.damage_chart_data, app.scoresheet.charts.chart_map_labels) );
			app.charts.push( DrawDamageTypesChart(app.scoresheet.charts.overall_damage_data) );
			app.charts.push( DrawWeaponTypesChart(app.scoresheet.charts.overall_damage_data) );	
			app.charts.push( DrawDamageReceivedChart(app.scoresheet.charts.damage_received_chart_data, app.scoresheet.charts.chart_map_labels) );
			app.charts.push( DrawKillsChart( {
				combatbots: app.scoresheet.charts.kills_chart_data,
				greenbots: app.scoresheet.charts.greenbot_kills_chart_data,
				other: app.scoresheet.charts.neutral_kills_chart_data,
			}, app.scoresheet.charts.chart_map_labels) );	
		}
		
		else if ( pane === 'stealth' ) {
			app.charts.push( DrawStealthChart(app.scoresheet.charts.stealth_chart_data, app.scoresheet.charts.chart_map_labels) );
		}
		
		else if ( pane === 'hacking' ) {
			if ( app.scoresheet.charts.num_bothacks ) {
				app.charts.push( DrawBothackingChart(app.scoresheet.charts.bothacks_chart_data, app.scoresheet.charts.bothacks_chart_labels) );
			}
			app.charts.push( DrawHacksPerMachineChart(
				app.scoresheet.charts.hacks_per_machine_chart_data, 
				app.scoresheet.charts.hacks_per_machine_chart_labels
			) );
			if ( app.scoresheet.charts.num_directhacks ) {
				app.charts.push( DrawIndvMachineHacksChart( app.scoresheet.charts.hack_data, app.scoresheet.charts.hack_labels, app.scoresheet.charts.hack_colors, 'direct' ) );
			}
			if ( app.scoresheet.charts.num_uhacks ) {
				app.charts.push( DrawIndvMachineHacksChart( app.scoresheet.charts.uhack_data, app.scoresheet.charts.uhack_labels, app.scoresheet.charts.uhack_colors, 'unauthorized' ) );
			}

		}
		
	});
}

function CalculateBadges(data) {
	data.badges = []; // list of strings
	
	// win type
	if ( data.header.win ) {
		let winbadge = 'W' + data.game.winType;
		if ( data.bonus.destroyedArchitect ) winbadge += '+';
		if ( data.bonus.destroyedMainc ) winbadge += '+';
		data.badges.unshift(winbadge);
		if ( data.game.winTotal === 1 ) { 
			data.badges.push('First Win!');
		}
	}
	
	// bonuses (that we know about)
	if ( data.bonus.destroyedArchitect ) { data.badges.push('-Arch'); }
	if ( data.bonus.destroyedMainc ) { data.badges.push('-MC'); }
	if ( data.bonus.destroyedZimprinter ) { data.badges.push('-Z'); }
	if ( data.bonus.destroyedA2 ) { data.badges.push('-A2'); }
	if ( data.bonus.destroyedA3 ) { data.badges.push('-A3'); }
	if ( data.bonus.destroyedA4 ) { data.badges.push('-A4'); }
	if ( data.bonus.destroyedA5 ) { data.badges.push('-A5'); }
	if ( data.bonus.destroyedA6 ) { data.badges.push('-A6'); }
	if ( data.bonus.destroyedA7 ) { data.badges.push('-A7'); }
	if ( data.bonus.destroyedA8 ) { data.badges.push('-A8'); } // are there more?
	if ( data.bonus.destroyedRevision17 ) { data.badges.push('-R17'); }
	if ( data.bonus.alignedWithFarcom) { data.badges.push('FarCom'); }
	if ( data.bonus.wasImprinted) { data.badges.push('Imprinted'); }
	if ( data.bonus.networkHubsDisabled/* ==1600 */) { data.badges.push('404'); }
	if ( data.bonus.builtEnhancedGrunts ) { data.badges.push('G-00'); }
	if ( data.bonus.usedRifInstaller ) { data.badges.push('RIF'); }
	if ( data.bonus.usedCoreResetMatrix ) { data.badges.push('CRM'); }
	if ( data.bonus.triggeredHighSecurity ) { data.badges.push('HighSec'); }
	if ( data.bonus.triggeredMaxSecurity ) { data.badges.push('MaxSec'); }
	if ( data.bonus.hackedProtoVariant ) { data.badges.push('Protovariant'); }
	if ( data.bonus.destroyedMaincGuards ) { data.badges.push('DoCo'); }
	if ( data.bonus.noSalvage ) { data.badges.push('NoSalvage'); }
	if ( data.bonus.pureCore ) { data.badges.push('PureCore'); }
	if ( data.bonus.scavenger ) { data.badges.push('Scavenger'); }
	if ( data.bonus.simpleHacker ) { data.badges.push('H4XX0R'); }
	if ( data.bonus.pacifist ) { data.badges.push('Pacifist'); }
	if ( data.bonus.usedDataConduit ) { data.badges.push('DC'); }
	if ( data.bonus.exposedGolemChamber ) { data.badges.push('GOLEM'); }
	if ( data.bonus.a7ReachedMainframe ) { data.badges.push('A7Mainframe'); }
	if ( data.bonus.metR17AtCetus ) { data.badges.push('R17Cetus'); }
	if ( data.bonus.readDecrypteArchives ) { data.badges.push('Decrypto'); }
	if ( data.bonus.decryptedA0Command ) { data.badges.push('DecryptoA0'); }
	if ( data.bonus.metR17AtResearch ) { data.badges.push('R17Research'); }
	if ( data.bonus.metWarlordAtResearch ) { data.badges.push('WarlordResearch'); }
	if ( data.bonus.hackedGodMode ) { data.badges.push('GodMode'); }
	if ( data.bonus.activateExoskeleton ) { data.badges.push('Exoskeleton'); }
	if ( data.bonus.deliveredSgemp ) { data.badges.push('SGEMP'); }
	if ( data.bonus.escapedWithSigix ) { data.badges.push('SpaceBuddy'); }
	if ( data.bonus.escapedWithExosigix ) { data.badges.push('SpaceBuddy'); }
	if ( data.bonus.hackedMainc ) { data.badges.push('MCH4XX0RED'); }
	if ( data.bonus.zhirovDestroyedMainc ) { data.badges.push('ZhirovsRevenge'); }
	if ( data.bonus.used0b10Conduit ) { data.badges.push('ConduitH4XX0RED'); }
	
	
	
			
	// places of interest
	let regular_places = ['MAT','FAC','RES','ACC','COM'].map( m => map_names[m] || m );
	for ( let x of data.route.entries ) {
		// notable places visited
		let mapname = x.location.map.replace('MAP_','');
		let nicename = map_names[mapname] || mapname;
		if ( ['SCR','MAT','UPP','FAC','LOW','RES','ACC','PRO','MIN'].indexOf(mapname) === -1 ) {
			data.badges.push( nicename );
		}
		// furthest regular location
		else if ( regular_places.indexOf(nicename) !== -1 ) {
			data.badges = data.badges.filter( x => regular_places.indexOf(x) === -1 );
			data.badges.push( nicename );
		}
	}
	
	// botnets good or bad?
	let botnets = data.stats.hacking.unauthorizedHacks?.terminals?.botnet;
	let unauthed_hacks = data.stats.hacking.unauthorizedHacks?.overall;
	let terminal_hacks = data.stats.hacking.terminalHacks?.overall;
	if ( botnets >= 4 && botnets / (unauthed_hacks+terminal_hacks) >= 0.20  ) {
		data.badges.push('BotnetGood');
	}
	else if ( unauthed_hacks > 10 && botnets <= 2 && (unauthed_hacks+terminal_hacks) <= 0.05  ) {
		data.badges.push('BotnetBad');
	}
	
	// remove duplicates
	data.badges = [...new Set(data.badges)]	
}

// returns a Map object
function FlattenData(data) {
	flatdata = new Map();
	let Flattener = (data,prefix='') => {
		for ( let k in data ) {
			let v = data[k];
			flatkey = prefix + (prefix ? ':' : '') + k; 
			if ( typeof(v) === 'number' || typeof(v) === 'boolean' || typeof(v) === 'string' ) {
				flatdata.set(flatkey,v);
			}
			else if ( Array.isArray(v) ) {
				// skip
			}
			else if ( typeof(v) === 'object' && v ) {
				Flattener(v,flatkey);
			}
		}
	}
	Flattener(data);
	return flatdata;			
}

// returns array of [ truncated_key, value, depth ] where value may be null	
function TabularizeData(data) {
	flatdata = [];
	let Flattener = (data,prefix='',depth=0) => {
		for ( let k in data ) {
			let v = data[k];
			flatkey = prefix + (prefix ? ':' : '') + k; 
			if ( typeof(v) === 'number' || typeof(v) === 'boolean' || typeof(v) === 'string' ) {
				// flatdata.push([flatkey,v,depth]);
				flatdata.push([k,v,depth]);
			}
			else if ( Array.isArray(v) ) {
				// skip
			}
			else if ( typeof(v) === 'object' && v ) {
				flatdata.push([k,null,depth]);
				Flattener(v,flatkey,depth+1);
			}
		}
	}
	Flattener(data);
	return flatdata;			
}

// returns array of [ truncated_key, value, depth ]  			
function ConvertFlattenedArrayToTabularData( data ) {
	return [...data.entries()].map( entry => {
		let segments = entry[0].split(':');
		let depth = segments.length - 1;
		return [ entry[0], entry[1], depth ];
	});
}


function DrawStealthChart( data, labels ) {
	datasets = [];
	for ( let k in data ) {
		datasets.push( {
			label: k.Undatafy(),
			backgroundColor: Chart.colors_by_key[k],
			borderColor: Chart.colors_by_key[k],
			fill: true,
			data: data[k]
		});
	}
	
	const config = {
		type: 'bar',
		data: { labels, datasets },
		options: {
			responsive: true,
			scales: {
				x: { stacked: true, },
				y: { stacked: true }
			},					
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: false,
					text: 'Stealth'
				}
			}
		},
	};
	return new Chart( document.getElementById('stealthChart'), config );
}
			
function DrawDamageInflictedChart( data, labels, include_allies=true ) {
	datasets = [];
	let colors = {
		kinetic: 'rgba(55,123,196,1)', 
		thermal: 'rgba(255,158,0,1)', 
		electromagnetic: 'rgba(59,221,17,1)', 
		explosive: 'rgba(219,41,41,1)', 
		entropic: '#ff6ab6', 
		slashing: 'rgba(214,221,17,1)', 
		piercing: 'rgba(192,55,196,1)', 
		impact: 'rgba(240,240,240,1)',
		phasic: '#00744a',
		allies: '#73d0ff',
	};
	
	// damage data
	for ( let k in colors ) {
		if ( typeof(data[k]) !== 'undefined' && ( k!=='allies' || include_allies ) ) {
			datasets.push( {
				label: k.Undatafy(),
				backgroundColor: colors[k],
				borderColor: colors[k],
				fill: true,
				data: data[k] 
			});
		}
	}
	
	const config = {
		type: 'bar',
		data: { labels, datasets },
		options: {
			responsive: true,
			scales: {
				x: { stacked: true, },
				y: { stacked: true }
			},					
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: false,
					text: 'Damage Inflicted'
				}
			}
		},
	};
	return new Chart( document.getElementById('damageInflictedChart'), config );
}
			
function DrawDamageReceivedChart( data, labels ) {
	datasets = [ { 
		label: 'Damage Received', 
		data, 
		backgroundColor: '#b93f3f',
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'bar',
		data: { labels, datasets },
		options: {
			responsive: true,		
			aspectRatio: 3,	
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
					display:false
				},
				title: {
					display: false,
					text: 'Damage Received'
				}
			}
		},
	};
	return new Chart( document.getElementById('damageReceivedChart'), config );
}
			
function DrawDamageTypesChart( data ) {
	let color_labels = {
		kinetic: 'rgba(55,123,196,1)', 
		thermal: 'rgba(255,158,0,1)', 
		electromagnetic: 'rgba(59,221,17,1)', 
		explosive: 'rgba(219,41,41,1)', 
		entropic: '#ff6ab6', 
		slashing: 'rgba(214,221,17,1)', 
		piercing: 'rgba(192,55,196,1)', 
		impact: 'rgba(240,240,240,1)',
		phasic: '#00744a',
	};
	
	let labels = [];
	let chartdata = [];
	let colors = [];
	let entries = Object.entries(data)
		.filter( entry => typeof(color_labels[entry[0]]) !== 'undefined' && entry[1] )
		.sort( (a,b) => b[1] - a[1] );
	for ( let v of entries ) {
		labels.push(v[0].Undatafy());
		chartdata.push(v[1]);
		colors.push( color_labels[v[0]] );
	}
	datasets = [ { 
		label: 'Damage Types Inflicted', 
		data:chartdata, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	
	const config = {
		type: 'pie',
		data: { labels, datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: false,
					text: 'Damage Types Inflicted'
				}
			}
		},
	};
	return new Chart( document.getElementById('damageTypesChart'), config );
}

			
function DrawWeaponTypesChart( data ) {
	let color_labels = {
		melee: 'rgba(214,221,17,1)', 
		guns: '#89a784', 
		cannons: '#5647a2', 
		ramming: '#FFF', 
		explosions: 'rgba(219,41,41,1)'
	};
	let labels = [];
	let chartdata = [];
	let colors = [];
	let entries = Object.entries(data)
		.filter( entry => typeof(color_labels[entry[0]]) !== 'undefined' )
		.sort( (a,b) => b[1] - a[1] );
	for ( let v of entries ) {
		labels.push(v[0].Undatafy());
		chartdata.push(v[1]);
		colors.push( color_labels[v[0]] );
	}
	datasets = [ { 
		label: 'Weapon Type Damage', 
		data:chartdata, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: false,
					text: 'Weapon Type Damage'
				}
			}
		},
	};
	return new Chart( document.getElementById('weaponTypesChart'), config );
}
			
function DrawClassDistroChart( data, labels ) {
	datasets = [ { 
		label: 'Class Distribution', 
		data, 
		// backgroundColor: Chart.pie_colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'bar',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,	
			aspectRatio: 4,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
					position: 'top',
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('classDistroChart'), config );
}

function DrawKillTypesChart( data, labels ) {
	Chart.SortPieData(data,labels);
	datasets = [ { 
		label: 'Bot Types Destroyed', 
		data, 
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'bar',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,	
			aspectRatio: 4,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
					position: 'top',
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('killsTypesChart'), config );
}
			
function DrawPartsAttachedPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = labels.map( x => Chart.colors_by_key[x] );
	datasets = [ { 
		label: 'Parts Attached', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
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
	return new Chart( document.getElementById('partsAttachedPieChart'), config );
}
			
function DrawPowerAttachedPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = Chart.pie_colors;
	datasets = [ { 
		label: 'Power Attached', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'top', display: true, },
				title: { display: false, }
			}
		},
	};
	return new Chart( document.getElementById('powerAttachedPieChart'), config );
}
			
function DrawPropulsionAttachedPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = Chart.pie_colors;
	datasets = [ { 
		label: 'Propulsion Attached', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'top', display: true, },
				title: { display: false, }
			}
		},
	};
	return new Chart( document.getElementById('propulsionAttachedPieChart'), config );
}
			
function DrawUtilityAttachedPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = Chart.pie_colors;
	datasets = [ { 
		label: 'Utilities Attached', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'top', display: true, },
				title: { display: false, }
			}
		},
	};
	return new Chart( document.getElementById('utilityAttachedPieChart'), config );
}
			
function DrawWeaponAttachedPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = Chart.pie_colors;
	datasets = [ { 
		label: 'Weapons Attached', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'top', display: true, },
				title: { display: false, }
			}
		},
	};
	return new Chart( document.getElementById('weaponAttachedPieChart'), config );
}
			
function DrawPartsLostPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = labels.map( x => Chart.colors_by_key[x] );
	datasets = [ { 
		label: 'Parts Lost', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
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
	return new Chart( document.getElementById('partsLostPieChart'), config );
}
			
function DrawHacksPerMachineChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = labels.map( x => Chart.colors_by_key[x] );
	datasets = [ { 
		label: 'Hacks Per Machine', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'bar',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			responsive: true,	
			aspectRatio: 3,		
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'right',
					display: false,
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('hacksPerMachineChart'), config );
}
			
function DrawBothackingChart( data, labels ) {
	Chart.SortPieData(data,labels);
	datasets = [ { 
		label: 'Bot Hacks', 
		data, 
		backgroundColor: Chart.pie_colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels, datasets },
		options: {
			responsive: true,	
			aspectRatio: 1.75,		
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'left',
					display: true,
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('botHacksChart'), config );
}
			
function DrawActionsChart( data, labels ) {
	Chart.SortPieData(data,labels);
	datasets = [ { 
		label: 'Actions Taken', 
		data, 
		backgroundColor: Chart.pie_colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels, datasets },
		options: {
			responsive: true,	
			aspectRatio: 1.75,		
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'left',
					display: true,
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('actionsChart'), config );
}

function DrawIndvMachineHacksChart( data, labels, colors, key ) {
	Chart.SortPieData(data,labels,colors);
	datasets = [ { 
		label: (key + ' Hacks'), 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'bar',
		data: { labels, datasets },
		options: {
			responsive: true,	
			aspectRatio: 2.5,		
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'right',
					display: false,
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById(key + 'HacksChart'), config );
}

function DrawAlertChart( data, labels ) {
	const chartdata = {
		labels: labels,
		datasets: [{
			label: 'Alert',
			// backgroundColor: 'rgb(236,156,32)',
			// borderColor: 'rgb(236,156,32)',
			borderWidth: 1,
			fill: true,
			tension: 0.4,
			data: data,
		}]
	};
	const config = {
		type: 'line',
		data: chartdata,
		options: {
			responsive: true,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
					position: 'top',
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('alertChart'), config );
}

function DrawCoreChart( data, labels ) {
	const chartdata = {
		labels: labels,
		datasets: [{
			label: 'Core Remaining',
			// backgroundColor: 'rgb(236,156,32)',
			// borderColor: 'rgb(236,156,32)',
			borderWidth: 1,
			fill: true,
			tension: 0.4,
			data: data,
		}]
	};
	const config = {
		type: 'bar',
		data: chartdata,
		options: {
			aspectRatio: 4,
			responsive: true,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
					position: 'top',
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('coreChart'), config );
}

function DrawTurnsTakenChart( data, labels ) {
	const chartdata = {
		labels: labels,
		datasets: [{
			label: 'Turns Taken',
			// backgroundColor: 'rgb(236,156,32)',
			// borderColor: 'rgb(236,156,32)',
			borderWidth: 1,
			fill: true,
			tension: 0.4,
			data: data,
		}]
	};
	const config = {
		type: 'bar',
		data: chartdata,
		options: {
			aspectRatio: 4,
			responsive: true,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
					position: 'top',
				},
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('turnsTakenChart'), config );
}

function DrawInventoryChart( data, labels ) {
	const chartdata = {
		labels: labels,
		datasets: [{
			label: 'Inventory Capacity',
			// backgroundColor: 'rgb(236,156,32)',
			// borderColor: 'rgb(236,156,32)',
			borderWidth: 1,
			fill: true,
			// tension: 0.4,
			data: data,
		}]
	};
	const config = {
		type: 'line',
		data: chartdata,
		options: {
			responsive: true,
			aspectRatio: 3,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
					position: 'top',
				},
				title: {
					display: false,
				}
			},
			scales: { y: { 
				suggestedMax: 35,
				suggestedMin: 0
			} }
		},
	};
	return new Chart( document.getElementById('inventoryChart'), config );
}

function DrawWeightChart( data, labels ) {

	const chartdata = {
		labels: labels,
		datasets: [
			{
				label: 'Max Support',
				backgroundColor: '#555',
				borderColor: '#555',
				borderWidth: 3,
				fill:true,
				pointRadius:0,
				data: data.support_chart_data,
				order: 2,
				tension: 0.4,
			},
			{
				label: 'Weight',
				// backgroundColor: '#911',
				// borderColor: '#911',
				borderWidth: 3,
				fill:false,
				pointRadius:2,
				tension: 0.4,
				data: data.weight_chart_data,
			},
		]
	};
	
	const config = {
		type: 'line',
		data: chartdata,
		options: {
			responsive: true,
			aspectRatio: 2.5,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
					display:true,
				},
				title: {
					display: false,
					text: 'Weight'
				}
			},
			
			// scales: {
			// 	'y_axis_support': {
			// 		type: 'linear',
			// 		display: false
			// 	},
			// 	'y_axis_weight': {
			// 		type: 'linear',
			// 		display: true
			// 	},
			// },
		}
	};
	
	return new Chart( document.getElementById('weightChart'), config );
}

function DrawKillsChart( data, labels ) {
	datasets = [
		{
			label: 'Combat Bots',
			backgroundColor: '#b93f3f',
			borderColor: '#b93f3f',
			fill: true,
			data: data.combatbots
		},
		{
			label: 'Green Bots',
			backgroundColor: '#41A34F',
			borderColor: '#41A34F',
			fill: true,
			data: data.greenbots 
		},
		{
			label: 'Unarmed / Watchers',
			backgroundColor: '#777',
			borderColor: '#777',
			fill: true,
			data: data.other 
		},
	];
	
	const config = {
		type: 'bar',
		data: { labels, datasets },
		options: {
			responsive: true,
			aspectRatio: 3,
			scales: {
				x: { stacked: true, },
				y: { stacked: true }
			},					
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: false,
					text: 'Bots Killed'
				}
			}
		},
	};
	return new Chart( document.getElementById('killsChart'), config );
}

}())