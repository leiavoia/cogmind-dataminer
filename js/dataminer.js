// WORST. JAVASCRIPT. EVER.
( function() {

// turn this on if you want to search for "?filename.json" in local /data directory
var use_local_dev = false;

var app = null; // app is global? are you stupid?
var filehash = null; // you fool!

// chart defaults
Chart.defaults.color = '#FFF';
Chart.defaults.elements.line.backgroundColor = '#41A34F'; // cogmind green is actually #3EC952
Chart.defaults.elements.line.borderColor = '#41A34F';
Chart.defaults.elements.bar.backgroundColor = '#41A34F';
Chart.defaults.elements.bar.borderColor = '#41A34F';
Chart.defaults.elements.point.radius = 0;
// add this if you want pie chart labels
// Chart.register(ChartDataLabels);
// Chart.defaults.plugins.datalabels = {
// 	// display: 'auto',
// 	formatter: (val, ctx) => {
// 		return ctx.chart.data.labels[ctx.dataIndex];
// 	},
// 	backgroundColor: function(context) {
// 		return context.dataset.backgroundColor;
// 	},			
// 	color: '#fff',
// 	// backgroundColor: '#404040',
// 	borderRadius: 3,
// 	borderColor: '#3A3F44',
// 	borderWidth:1,
// 	padding: { top:3, bottom:2, left:5, right:5 },
// 	anchor: 'end',
// 	// clamp:true,
// 	// clip:false
// 	}
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
	wheels: '#238628',
	treads: '#f19700',
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

// this has indexes for everything in scoresheet.bestStates
// plus our analysis of 400 actual games from Beta 11 X7,
// sprinkled with lev's personal judgement and inaccuracies.
// NOTE: we don't have values for ok/good/excl yet, so just using a percent system for now.
const metrics = {
	heatDissipation: 		{ min: 10,	max: 100,	record: 292,	ok: 18,	good: 30,	excl: 50 },
	energyGeneration: 		{ min: 10,	max: 100,	record: 169,	ok: 20,	good: 50,	excl: 80 },
	energyCapacity: 		{ min: 100,	max: 1500,	record: 3400,	ok: 300,good: 500,	excl: 1000 },
	matterStores: 			{ min: 300,	max: 1000,	record: 1800,	ok: 100,good: 250,	excl: 500 }, // not sure about min here
	matterCapacity: 		{ min: 300,	max: 1000,	record: 1800,	ok: 0,	good: 0,	excl: 0 }, // or here
	sightRange: 			{ min: 8,	max: 24,	record: 24,		ok: 0,	good: 0,	excl: 0 },
	robotScanRange: 		{ min: 0,	max: 20,	record: 20,		ok: 0,	good: 0,	excl: 0 }, 
	terrainScanDensity: 	{ min: 0,	max: 500,	record: 2210,	ok: 0,	good: 0,	excl: 0 }, // Huge jump: Adv.=200, Exp.=1000
	ecmStrength: 			{ min: 0,	max: 4, 	record: 4, 		ok: 0,	good: 0,	excl: 0 },
	armorCoverage: 			{ min: 0,	max: 2000,	record: 7650,	ok: 0,	good: 0,	excl: 0 },
	coreShielding: 			{ min: 0,	max: 40,	record: 40,		ok: 0,	good: 0,	excl: 0 },
	evasion: 				{ min: 0,	max: 100,	record: 100,	ok: 0,	good: 0,	excl: 0 },
	recoilReduction: 		{ min: 0,	max: 14,	record: 14,		ok: 0,	good: 0,	excl: 0 },
	terrainScanRange: 		{ min: 0,	max: 30,	record: 30,		ok: 0,	good: 0,	excl: 0 },
	powerAmplification: 	{ min: 0,	max: 150,	record: 150,	ok: 0,	good: 0,	excl: 0 },
	additionalMassSupport: 	{ min: 0,	max: 25,	record: 25,		ok: 0,	good: 0,	excl: 0 },
	propulsionShielding: 	{ min: 0,	max: 90,	record: 90,		ok: 0,	good: 0,	excl: 0 },
	utilityShielding: 		{ min: 0,	max: 90,	record: 90,		ok: 0,	good: 0,	excl: 0 },
	meleeSpeedBoost: 		{ min: 0,	max: 50,	record: 50,		ok: 0,	good: 0,	excl: 0 },
	phaseShifting: 			{ min: 0,	max: 20,	record: 20,		ok: 0,	good: 0,	excl: 0 },
	targetAnalysis: 		{ min: 0,	max: 12,	record: 12,		ok: 0,	good: 0,	excl: 0 },
	coreAnalysis: 			{ min: 0,	max: 15,	record: 15,		ok: 0,	good: 0,	excl: 0 },
	armorIntegrityAnalysis:	{ min: 0,	max: 90,	record: 90,		ok: 0,	good: 0,	excl: 0 },
	matterFiltering: 		{ min: 0,	max: 50,	record: 50,		ok: 0,	good: 0,	excl: 0 },
	offensiveHacking: 		{ min: 0,	max: 60,	record: 90,		ok: 0,	good: 0,	excl: 0 },
	defensiveHacking: 		{ min: 0,	max: 60,	record: 65,		ok: 0,	good: 0,	excl: 0 },
	coolantPotential: 		{ min: 0,	max: 300,	record: 320,	ok: 0,	good: 0,	excl: 0 },
	jammingRange: 			{ min: 0,	max: 22,	record: 22,		ok: 0,	good: 0,	excl: 0 },
	targetingAccuracy: 		{ min: 0,	max: 40,	record: 48,		ok: 0,	good: 0,	excl: 0 },
	kinecelleration: 		{ min: 0,	max: 50,	record: 50,		ok: 0,	good: 0,	excl: 0 },
	resistanceEm: 			{ min: 0,	max: 100,	record: 100,	ok: 0,	good: 0,	excl: 0 },
	cloakStrength: 			{ min: 0,	max: 5, 	record: 5, 		ok: 0,	good: 0,	excl: 0 },
	resistanceKi: 			{ min: 0,	max: 40,	record: 40,		ok: 0,	good: 0,	excl: 0 },
	resistanceTh: 			{ min: 0,	max: 75,	record: 75,		ok: 0,	good: 0,	excl: 0 },
	powerShielding: 		{ min: 0,	max: 90,	record: 90,		ok: 0,	good: 0,	excl: 0 },
	weaponShielding: 		{ min: 0,	max: 100,	record: 100,	ok: 0,	good: 0,	excl: 0 },
	pointDefenseRating: 	{ min: 0,	max: 500,	record: 720,	ok: 0,	good: 0,	excl: 0 },
	launcherAccuracy: 		{ min: 0,	max: 100,	record: 100,	ok: 0,	good: 0,	excl: 0 },
	salvageTargeting: 		{ min: 0,	max: 6, 	record: 6, 		ok: 0,	good: 0,	excl: 0 },
	weaponCycling: 			{ min: 0,	max: 30,	record: 30,		ok: 0,	good: 0,	excl: 0 },
	particleCharging: 		{ min: 0,	max: 50,	record: 50,		ok: 0,	good: 0,	excl: 0 },
	stasisCanceling: 		{ min: 0,	max: 4, 	record: 2, 		ok: 0,	good: 0,	excl: 0 },
	energyFiltering: 		{ min: 0,	max: 50,	record: 50,		ok: 0,	good: 0,	excl: 0 },
	corruptionPrevention: 	{ min: 0,	max: 40,	record: 40,		ok: 0,	good: 0,	excl: 0 },
	resistanceEx: 			{ min: 0,	max: 90,	record: 90,		ok: 0,	good: 0,	excl: 0 },
	resistanceI: 			{ min: 0,	max: 30,	record: 30,		ok: 0,	good: 0,	excl: 0 },
	resistanceS: 			{ min: 0,	max: 30,	record: 30,		ok: 0,	good: 0,	excl: 0 },
	resistanceP: 			{ min: 0,	max: 30,	record: 30,		ok: 0,	good: 0,	excl: 0 },
	overloadAmplification: 	{ min: 0,	max: 100,	record: 100,	ok: 0,	good: 0,	excl: 0 },
	heatShielding: 			{ min: 0,	max: 100,	record: 100,	ok: 0,	good: 0,	excl: 0 },
	overloadRegulation: 	{ min: 0,	max: 80,	record: 80,		ok: 0,	good: 0,	excl: 0 },
	meleeAccuracy: 			{ min: 0,	max: 60,	record: 60,		ok: 0,	good: 0,	excl: 0 },
	forceBoost: 			{ min: 0,	max: 5, 	record: 5, 		ok: 0,	good: 0,	excl: 0 },
	thermalConversion: 		{ min: 0,	max: 60,	record: 60,		ok: 0,	good: 0,	excl: 0 },
	reclamationEfficiency: 	{ min: 0,	max: 25,	record: 25,		ok: 0,	good: 0,	excl: 0 },
	emShielding: 			{ min: 0,	max: 4, 	record: 4, 		ok: 0,	good: 0,	excl: 0 },
	baseTemperature: 		{ min: 0,	max: 200,	record: 200,	ok: 0,	good: 0,	excl: 0 },
};

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
	GAR: 'Garrison',
	DSF: 'DSF', 35: 'DSF', // bug for Beta11-X8 data format not updated yet
};

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
        .replace(/([AR]) ([0-9])/, '$1$2')
		.replace(/^./, s => s.toUpperCase() );
}
String.prototype.Undatafy = Undatafy; // you're bad for doing this

// ======== NOW LETS ACTUALLY GET SOME WORK DONE ==========

// set up Vue
app = new Vue({
	el: '#app',
	data: { 
		scoresheet: null, // populates when request for JSON succeeds
		analysis: null, // populates when request for JSON succeeds
		pane: null, // dont set to 'overview' by default. graphs need to be prompted to draw
		inputbox_mode: 'url',
		ChangePane,
		LoadScoresheet,
		metrics,
		charts: [],
		error_msg: null,
		filehash: filehash,
		recentlyViewed: GetScoresheetList(),
		ClearScoresheetList,
	}
})

// check URL for a file hash - we dont care about the URL itself, just the hashy part
let hash = window.location.search.trim().replace('?','').replace(/\s+/,'').replace('hash=','').replace(/&.+/,'');
if ( hash ) { LoadScoresheet(hash); }
else { ChangePane('input'); }

function LoadScoresheet( hash ) {

	this.error_msg = null;
	
	// look for the app's bound data from form input if nothing supplied manually from function param
	hash = String( hash || this.filehash || '' );
	hash = decodeURIComponent(hash.trim()).replace(/^.*\//,'').replace(/\..+$/,'');
	
	// development-only switch for handling local files:
	if ( use_local_dev ) {
		file = hash ? ('data/' + hash + '.json') : null;
		app.filehash = null; 
	}
	else { 
		if ( hash.match(/^[A-Za-z0-9]{9,18}$/) ) {
			app.filehash = hash;
			// if we're on gridsagegames now, okay to just get the file directly
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSMissingAllowOrigin
			if ( window.location.hostname.match('gridsagegames.com') ) {
				file = 'https://cogmind-api.gridsagegames.com/scoresheets/' + hash + '.json';
			}
			// otherwise we need to use a local php proxy because kyz doesnt know how to set CORS yet. 
			else { file = 'proxy.php?' + hash; }
		}
		else {
			this.error_msg = 'Not a recognized file hash. Try something else.';
			app.filehash = null;
			file = null; 
		}
	}
	
	// check to see if we already have it cached in localStorage
	let data = localStorage.getItem(hash);
	if ( data ) {
		data = JSON.parse(data);
		data.meta.source_file_txt = 'https://cogmind-api.gridsagegames.com/scoresheets/' + hash;
		data.meta.source_file_json = 'https://cogmind-api.gridsagegames.com/scoresheets/' + hash + '.json';
		data.meta.permalink = window.location.href
			.replace( window.location.search, '' ) 
			.replace( /#.*/, '' ) 
			+ '?' + hash;
		AnalyzeScoresheet(data);
		app.scoresheet = data;
		DownloadDataminerDataAnalysis( app ).then( _ => { 
			ChangePane('overview');
			UpdateURLWhenNewScoresheetLoaded(hash, data);
		} );
	}
	
	// request data from server and get the party started
	else if ( file ) {
		ChangePane('loading');
		fetch( file ).then( rsp => {
			if ( !rsp.ok || !rsp.body || String(rsp.status).match(/^(4|5)/) ) {
				ChangePane('input');
				app.error_msg = 'Couldnt get scoresheet. Maybe a typo. Maybe not a real file. Maybe nothing is real. I don\'t know.';
				return false;
			}		
			return rsp.json();
		})
		.then( data => {
			if ( data ) { 
				// NOTE: this info not available from manual file uploads. (Hash is not stored in file itself) 
				data.meta.source_file_txt = 'https://cogmind-api.gridsagegames.com/scoresheets/' + hash;
				data.meta.source_file_json = 'https://cogmind-api.gridsagegames.com/scoresheets/' + hash + '.json';
				data.meta.permalink = window.location.href
					.replace( window.location.search, '' ) 
					.replace( /#.*/, '' ) 
					+ '?' + hash;
				SaveScoresheetToList( hash, data );
				AnalyzeScoresheet(data);
				app.scoresheet = data;
				DownloadDataminerDataAnalysis( app ).then( _ => { 
					ChangePane('overview');
					UpdateURLWhenNewScoresheetLoaded(hash, data);
				} );
			}
		})
		.catch(error => {
			app.error_msg = 'Error when trying to get file: ' + error;
			ChangePane('input');
		});
	}
}

function DownloadDataminerDataAnalysis( app ) {
	// TODO: don't re-download if categories are the same as what we have already
	$url = window.location.href
		.replace( window.location.search, '' ) 
		.replace( /#.*/, '' ) 
		.replace('.html','')
		+ 'dataminer.php'
		+ `?version=${app.scoresheet.header.version}`
		+ `&difficulty=${app.scoresheet.header.difficulty}`
		+ `&mode=${app.scoresheet.header.specialMode}`
		;
	return fetch( $url ).then( rsp => {
		if ( !rsp.ok || !rsp.body || String(rsp.status).match(/^(4|5)/) ) {
			app.error_msg = 'Could not get dataminer comps. Does this look right to you? ' + url;
			return false;
		}		
		return rsp.json();
	})
	.then( data => {
		if ( data ) { 
			app.analysis = data;
			// Analyze comps
			if ( app.scoresheet.flatstats ) {
				for ( let i of app.scoresheet.flatstats ) {
					if ( i[3] && app.analysis[i[3]] ) {
						// [ truncated_key, value, depth, full_key, avg, min, max, diff, formatted_diff, diffclass ]
						let diff = (i[1] && app.analysis[i[3]].avg) ? (100* (i[1] - app.analysis[i[3]].avg) / app.analysis[i[3]].avg) : 0;
						let diffclass = 'avg';
						if ( diff > 400 ) { diffclass = 'plus400'; }
						else if ( diff > 200 ) { diffclass = 'plus200'; }
						else if ( diff > 100 ) { diffclass = 'plus100'; }
						else if ( diff > 50 ) { diffclass = 'plus50'; }
						else if ( diff < -90 ) { diffclass = 'minus90'; }
						else if ( diff < -75 ) { diffclass = 'minus75'; }
						else if ( diff < -50 ) { diffclass = 'minus50'; }
						else if ( diff < -25 ) { diffclass = 'minus25'; }
						i.push( (app.analysis[i[3]].avg || 0).toLocaleString(undefined, {minimumFractionDigits:0,maximumFractionDigits:(app.analysis[i[3]].avg >= 100 ? 0 : 2)}) );
						i.push( (app.analysis[i[3]].min || 0).toLocaleString(undefined, {minimumFractionDigits:0,maximumFractionDigits:(app.analysis[i[3]].min >= 100 ? 0 : 2)}) );
						i.push( (app.analysis[i[3]].max || 0).toLocaleString(undefined, {minimumFractionDigits:0,maximumFractionDigits:(app.analysis[i[3]].max >= 100 ? 0 : 2)}) );
						i.push( diff );
						i.push( (diff > 0 ? '+' : '') + diff.toLocaleString(undefined, {minimumFractionDigits:0,maximumFractionDigits:2}) + '%' );
						i.push( diffclass );
					}
				}
			}
			// sort the comps for interesting hilites
			let mapper = function ( arr ) {
				return {
					name: arr[3].split('.').slice(1).map( _ => _.Undatafy() ).join(' > '),
					value: arr[1],
					diff: arr[8]
				};
			};
			// note: filtering out single-event items that tend to be uninteresting when the average is near zero.
			app.scoresheet.hilites = app.scoresheet.flatstats.filter( i => i[7] > 0 && i[1] > 1 ).sort( (a,b) => b[7] - a[7] ).slice( 0, 19 ).map( mapper );
			app.scoresheet.lowlites = app.scoresheet.flatstats.filter( i => i[7] < 0  ).sort( (a,b) => a[7] - b[7] ).slice( 0, 19 ).map( mapper );
		}
	})
	.catch(error => {
		app.error_msg = 'Error when trying to get file: ' + error;
	});	
}

function AnalyzeScoresheet( data ) {

	// remove junk we don't need
	if ( data.header.specialMode != 'SPECIAL_MODE_PLAYER2' ) { delete data.stats.player2; }
	if ( data.header.specialMode != 'SPECIAL_MODE_RPGLIKE' ) { delete data.stats.rpglike; }	
	
	// precompute single values
	
	// digging luck
	data.stats.exploration.diggingLuck = 100 * ( 1 - ( (data.stats.exploration.spacesMoved.caveInsTriggered || 0) 
		/ (data.stats.exploration.spacesDug || 1) ) );
	
	// collateral dmg pct
	data.stats.combat.collateralDamagePct = 100 * data.performance.valueDestroyed.count 
		/ ( data.stats.combat.damageInflicted.overall || 1 );
	
	// dishout ratio % - be careful if player took zero damage
	data.stats.combat.dishoutRatio = 100 * data.stats.combat.damageInflicted.overall 
		/ ( data.stats.combat.damageTaken.overall || 1 );
	
	// failed hacks
	data.stats.hacking.failed = data.stats.hacking.totalHacks.overall - data.stats.hacking.totalHacks.successful;
	
	// hacking skill %
	data.stats.hacking.hackingSkill = 100 * data.stats.hacking.totalHacks.successful 
		/ (data.stats.hacking.totalHacks.overall || 1);
	
	// accuracy %
	data.stats.combat.accuracy = 100 * data.stats.combat.shotsHitRobots.overall
		/ ( (data.stats.combat.shotsFired.overall + data.stats.combat.meleeAttacks.overall) || 1);
		
	// shots per volley						
	data.stats.combat.shotsPerVolley = data.stats.combat.shotsFired.overall 
		/ (data.stats.combat.volleysFired.overall|| 1);
						
	// critical hit %
	data.stats.combat.criticalHitPercent = 100 *
		( data.stats.combat.shotsHitRobots?.criticalStrikes?.overall ||
			data.stats.combat.shotsHitRobots?.criticalHits || 0 )
		/ ( (data.stats.combat.meleeAttacks.overall + data.stats.combat.shotsFired.overall) || 1 );						
	
	// overflow damage %
	data.stats.combat.overflowDamagePercent = 100 * data.stats.combat.overflowDamage.overall
		/ (data.stats.combat.damageInflicted.overall || 1);
		
	// melee followup %
	data.stats.combat.meleeFollowupPercent = 100 * data.stats.combat.meleeAttacks.followUpAttacks
		/ (data.stats.combat.meleeAttacks.overall || 1);
		
	// turn cadence (actions per minute; factor out WAITs)
	let timeParts = data.game.runTime.split(':');
	let playtimeInMinutes = parseInt(timeParts[1]) + (parseInt(timeParts[0])*60);
	data.stats.actions.cadence = ( data.stats.actions.total.overall - data.stats.actions.total.wait ) / playtimeInMinutes;
	
	// precompute chart data
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
		// build_chart_data: [],
		damage_received_chart_data: [],
		avg_speed_data: [],
		minmax_speed_data: [], // pairs of [min,max]
		prop_chart_data: {}, // by type
		damage_chart_data: {}, // by type
		stealth_chart_data: { // by type
			spotted: [],
			squadsDispatched: [],
			mostBotsTracking: [],
			distressSignals: [],
			haulersReinforced: [],
			constructionImpeded: [],
			trapsTriggered: [],
			signalsJammed: []
		},
		fabbed_stuff: [], // [{ map, name, qty }]
		schematics: [], // [{ map, name }]
		route_data: [], // { depth: int, maps: [strings] }
		}
	for ( map of data.route.entries ) {
		// map labels
		map.location.mapname = typeof(map.location.map)=='string' ? map.location.map.replace('MAP_','') : (map.location.map==35 ? 'DSF' : 'Unknown Map');
		map.location.mapname = (map_names[map.location.mapname] || map.location.mapname);
		data.charts.chart_map_labels.push( map.location.depth + '/' + map.location.mapname );
		
		// critical hits changed in Beta 11 and don't use the old stat.
		data.stats.combat.criticalHitPercent = 100*(
			( data.stats.combat.shotsHitRobots?.criticalHits || data.stats.combat.shotsHitRobots?.criticalStrikes?.overall || 0 )
			/ ( (data.stats.combat.meleeAttacks.overall + data.stats.combat.shotsFired.overall) || 1 ) );						
														
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
		data.charts.stealth_chart_data.squadsDispatched.push( map.stats.alert.squadsDispatched.overall );
		data.charts.stealth_chart_data.mostBotsTracking.push( map.stats.stealth.timesSpotted.peakTrackingTotal );
		data.charts.stealth_chart_data.distressSignals.push( map.stats.stealth.distressSignals );
		data.charts.stealth_chart_data.haulersReinforced.push( map.stats.alert.haulersReinforced );
		data.charts.stealth_chart_data.constructionImpeded.push( map.stats.alert.constructionImpeded );
		data.charts.stealth_chart_data.trapsTriggered.push( map.stats.traps.trapsTriggered.overall );
		data.charts.stealth_chart_data.signalsJammed.push( map.stats.stealth.communicationsJammed.overall );
		
		// propulsion
		// note: not all indexes are present for every map area, so iterate over the "overall" list instead
		for ( let k of ['core','flight','hover','legs','wheels','treads'] ) {
			if ( typeof(data.charts.prop_chart_data[k]) === 'undefined' ) { data.charts.prop_chart_data[k] = []; }
			data.charts.prop_chart_data[k].push( map.stats.exploration.spacesMoved[k] || 0 );
		}
		// combat kills
		data.charts.kills_chart_data.push(map.stats.kills.combatHostilesDestroyed.overall);
		// getting non-combat bot kills is more tricky
		let total_bots_killed = 0;
		let green_bots_killed = 0;
		for ( let k in map.stats.kills.classesDestroyed ) {
			if ( ["engineer", "worker", "builder", "hauler", "recycler", "mechanic"].indexOf(k) > -1 ) {
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
		
		// build quality
		// data.charts.build_chart_data.push( map.peakState.rating );
		
		// speed
		data.charts.avg_speed_data.push( map.stats.exploration.spacesMoved.averageSpeed );
		data.charts.minmax_speed_data.push( [
			map.stats.exploration.spacesMoved.slowestSpeed,
			map.stats.exploration.spacesMoved.fastestSpeed 
		] );

		// hacks
		data.charts.hacks_chart_data.push( map.stats.hacking.totalHacks.successfull );
		
		// turns
		data.charts.turns_chart_data.push( map.stats.actions.total.overall );
		
		// damage received
		data.charts.damage_received_chart_data.push( map.stats.combat.damageTaken.overall );
		
		// core
		// data.charts.core_chart_data.push( map.stats.combat.coreRemainingPercent || 100 ); //BUG in stat tracking. branches record zero?
		
		// stuff we got
		if ( map.fabricatedObjects ) {
			data.charts.fabbed_stuff.push( ...map.fabricatedObjects.map( x => ({
				map: (map.location.depth + '/' + map.location.mapname),
				name: x.name,
				qty: x.count
			})));
		}
		if ( map.obtainedSchematics ) {
			data.charts.schematics.push( ...map.obtainedSchematics.map( x => ({
				map: (map.location.depth + '/' + map.location.mapname),
				name: x.name,
				qty: x.count
			})));
		}

		// history decoration - color coded messages
		for ( row of map.historyEvents ) { 
			if ( row.event.match(/(lost|released all parts|locked|lockdown|assault|sterilization system|crushed|destroyed by|self destr|core integrity fell|corruption reached|assimilated all)/i) ) { row.class = 'bad'; }
			else if ( row.event.match(/(learned|destroyed|killed|installed|found|Aligned with FarCom|given|expanded rif|repaired|fabricated|Loaded intel|hub disabled)/i) ) { row.class = 'good'; }
			else if ( row.event.match(/(discovered|identified|build established|Accompanied by)/i) ) { row.class = 'info'; }
			else if ( row.event.match(/(entered|evolved)/i) ) { row.class = 'notice'; }
			else if ( row.event.match(/(triggered|spotted|evacuate|Garrison activated|warn|convoy interrupted|squad dispatched|Detected by scanners)/i) ) { row.class = 'warning'; }
			else { row.class = ''; }
		}
		
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
		
	// propulsion pie chart
	data.charts.prop_pie_chart_data = [];
	data.charts.prop_pie_chart_labels = [];
	for ( let k of ['core','flight','hover','legs','wheels','treads'] ) {
		data.charts.prop_pie_chart_data.push( data.stats.exploration.spacesMoved[k] || 0 );
		data.charts.prop_pie_chart_labels.push(k);
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
	let final_map = data.route.entries[ data.route.entries.length-1 ].location;
	data.game.finalMapReached = final_map.depth + '/' +
		(typeof(final_map.map)=='string' ? final_map.map.replace('MAP_','') : (final_map.map==35 ? 'DSF' : '???'));
	
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
					
	// builds for display
	data.charts.final_build = {};
	for ( let groupname in data.parts ) {
		if ( groupname == 'rating' ) { continue; }
		data.charts.final_build[groupname] = data.parts[groupname].parts ?? [];
		for ( let n = data.charts.final_build[groupname].length; n < data.parts[groupname].slots; n++ ) {
			data.charts.final_build[groupname].push('-');
		}
	}
	data.charts.peak_build = {};
	for ( let groupname in data.peakState ) {
		if ( groupname == 'rating' ) { continue; }
		data.charts.peak_build[groupname] = data.peakState[groupname].parts ?? [];
		for ( let n = data.charts.peak_build[groupname].length; n < data.peakState[groupname].slots; n++ ) {
			data.charts.peak_build[groupname].push('-');
		}
	}		
	
	// performance judgement
	data.metricPerformance = {};
	for ( let k in metrics ) {
		let m = metrics[k];
		let pct = 100 * ((Math.min( m.max, (data.bestStates[k] || 0) ) - m.min) / (m.max - m.min));
		// we want to display a little red nub if they have zero
		pct = Math.max( pct, 3 );
		let classname = 'poor';
		if ( pct >= 100 ) { classname = 'best'; }
		else if ( pct > 70 ) { classname = 'excl'; }
		else if ( pct >= 40 ) { classname = 'good'; }
		else if ( pct >= 20 ) { classname = 'avg'; }
		data.metricPerformance[k] = { pct, classname, val:(data.bestStates[k]||0) };
	}

	// mysql date
	data.header.date = '20' + data.header.runEndDate.replace(/(\d\d)(\d\d)(\d\d)/g,"$1-$2-$3") + ' '
		+ data.header.runEndTime.replace(/(\d\d)(\d\d)(\d\d)/g,"$1:$2:$3");
		
	// [!]HACK for GJ
	if ( data.meta.playerId == 209397991 ) {
		data.header.playerName = 'GJ';
	}
								
	// Badges
	CalculateBadges(data);
	
	// flatten data into something we can iterate over as table rows.
	// NOTE: this copies the format returned by the Dataminer analysis file
	// so you can make easy 1:1 comparisons
	data.flatstats = [].concat( 
		TabularizeData(data.stats, 'stats'),
		TabularizeData({performance: data.performance} ),
		TabularizeData({bonus: data.bonus} ),
		TabularizeData({bestStates: data.bestStates} ),
		TabularizeData({classDistribution: data.classDistribution} )
	);
	
	// update window & meta description
    document.title = `Dataminer : ${data.header.playerName} : Game #${data.game.gameNumber}`;
	let desc = 	(data.header.win ? 'ASCENDED! ' : 'DEFEAT! ') + data.header.runResult;
	document.querySelector('meta[name="description"]').setAttribute("content", desc);
	
}

function ChangePane(pane) {

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
				
			if ( app.analysis ) {
				app.charts.push( DrawSparkChart(
					'turnsSparkChart',
					app.analysis['stats.exploration.turnsPassed']?.chartdata,
					app.scoresheet.stats.exploration.turnsPassed
					) );
				app.charts.push( DrawSparkChart(
					'cadenceSparkChart',
					app.analysis['stats.actions.cadence']?.chartdata,
					app.scoresheet.stats.actions.cadence
					) );
				app.charts.push( DrawSparkChart(
					'avgSpeedSparkChart',
					app.analysis['stats.exploration.spacesMoved.averageSpeed']?.chartdata,
					app.scoresheet.stats.exploration.spacesMoved.averageSpeed
					) );
				app.charts.push( DrawSparkChart(
					'regionsVisitedSparkChart',
					app.analysis['performance.regionsVisited.count']?.chartdata,
					app.scoresheet.performance.regionsVisited.count
					) );
				app.charts.push( DrawSparkChart(
					'botsDestroyedSparkChart',
					app.analysis['performance.robotsDestroyed.count']?.chartdata,
					app.scoresheet.performance.robotsDestroyed.count
					) );
				app.charts.push( DrawSparkChart(
					'alienTechsUsedSparkChart',
					app.analysis['performance.alienTechUsed.count']?.chartdata,
					app.scoresheet.performance.alienTechUsed.count
					) );
				app.charts.push( DrawSparkChart(
					'NPCsMurduredSparkChart',
					app.analysis['stats.kills.uniquesNpcsDestroyed']?.chartdata,
					app.scoresheet.stats.kills.uniquesNpcsDestroyed
					) );
				app.charts.push( DrawSparkChart(
					'alliesSparkChart',
					app.analysis['stats.allies.totalAllies.overall']?.chartdata,
					app.scoresheet.stats.allies.totalAllies.overall
					) );
				app.charts.push( DrawSparkChart(
					'largestArmySparkChart',
					app.analysis['stats.allies.totalAllies.largestGroup']?.chartdata,
					app.scoresheet.stats.allies.totalAllies.largestGroup
					) );
				app.charts.push( DrawSparkChart(
					'mostCorruptionSparkChart',
					app.analysis['stats.combat.highestCorruption.overall']?.chartdata,
					app.scoresheet.stats.combat.highestCorruption.overall
					) );
				app.charts.push( DrawSparkChart(
					'peakBuildSparkChart',
					app.analysis['peakState.rating']?.chartdata,
					app.scoresheet.peakState.rating
					) );
			}
			
			// app.charts.push( DrawCoreChart( 
			// 	app.scoresheet.charts.core_chart_data, 
			// 	app.scoresheet.charts.chart_map_labels
			// 	) );
		}
		
		else if ( pane === 'input' ) {
			app.scoresheet = null;
			app.filehash = null;
			// update list of recent games
			app.recentlyViewed = GetScoresheetList();
			// listen for file uploads
			let el = document.getElementById('jsonfile');
			if ( el ) {
				el.addEventListener('change', event => {
					var reader = new FileReader();
					reader.onload = e => {
						let json = JSON.parse(e.target.result);
						// smells like a scoresheet?
						if ( typeof(json)==='object' && json.header && json.header.playerName ) { 
							SaveScoresheetToList( json.meta.runId, json ); // no file hash available so use "runId" instead
							AnalyzeScoresheet(json);
							app.scoresheet = json;
							DownloadDataminerDataAnalysis( app ).then( _ => {
								UpdateURLWhenNewScoresheetLoaded(json.meta.runId, json);
								return ChangePane('overview');
							});
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
			app.charts.push( DrawPropPieChart(
				app.scoresheet.charts.prop_pie_chart_data, 
				app.scoresheet.charts.prop_pie_chart_labels
			) );
			app.charts.push( DrawPropGraph(
				app.scoresheet.charts.prop_chart_data, 
				app.scoresheet.charts.chart_map_labels
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
			app.charts.push( DrawSpeedGraph( {
				avg_speed_data: app.scoresheet.charts.avg_speed_data,
				minmax_speed_data: app.scoresheet.charts.minmax_speed_data,
				}, app.scoresheet.charts.chart_map_labels
			) );
			app.charts.push( DrawInventoryChart( 
				app.scoresheet.charts.inventory_chart_data, 
				app.scoresheet.charts.chart_map_labels 
			) );
			// app.charts.push( DrawBuildChart( 
			// 	app.scoresheet.charts.build_chart_data, 
			// 	app.scoresheet.charts.chart_map_labels 
			// ) );
		}
		
		else if ( pane === 'combat' ) {
		
			if ( app.analysis ) {
				app.charts.push( DrawSparkChart(
					'volleysSparkChart',
					app.analysis['stats.combat.volleysFired.overall']?.chartdata,
					app.scoresheet.stats.combat.volleysFired.overall
					) );
				app.charts.push( DrawSparkChart(
					'shotsFiredSparkChart',
					app.analysis['stats.combat.shotsFired.overall']?.chartdata,
					app.scoresheet.stats.combat.shotsFired.overall
					) );
				app.charts.push( DrawSparkChart(
					'accuracySparkChart',
					app.analysis['stats.combat.accuracy']?.chartdata,
					app.scoresheet.stats.combat.accuracy
					) );
				app.charts.push( DrawSparkChart(
					'shotsPerVolleySparkChart',
					app.analysis['stats.combat.shotsPerVolley']?.chartdata,
					app.scoresheet.stats.combat.shotsPerVolley
					) );
				// NOTE: scoresheet format change in Beta11 makes this data unavailable. Provide interesting substitute.
				if ( app.scoresheet.stats.combat.criticalHitPercent ) {
					app.charts.push( DrawSparkChart(
						'criticalHitPctSparkChart',
						app.analysis['stats.combat.criticalHitPercent']?.chartdata,
						app.scoresheet.stats.combat.criticalHitPercent
						) );
				}
				else {
					app.charts.push( DrawSparkChart(
						'criticalHitPctSparkChart',
						app.analysis['stats.combat.shotsHitRobots.criticalKills']?.chartdata,
						app.scoresheet.stats.combat.shotsHitRobots.criticalKills
						) );
				}
				app.charts.push( DrawSparkChart(
					'overflowDamageSparkChart',
					app.analysis['stats.combat.overflowDamagePercent']?.chartdata,
					app.scoresheet.stats.combat.overflowDamagePercent
					) );
				app.charts.push( DrawSparkChart(
					'totalDamageInflictedSparkChart',
					app.analysis['stats.combat.damageInflicted.overall']?.chartdata,
					app.scoresheet.stats.combat.damageInflicted.overall
					) );
				app.charts.push( DrawSparkChart(
					'totalDamageReceivedSparkChart',
					app.analysis['stats.combat.damageTaken.overall']?.chartdata,
					app.scoresheet.stats.combat.damageTaken.overall
					) );
				app.charts.push( DrawSparkChart(
					'dishOutSparkChart',
					app.analysis['stats.combat.dishoutRatio']?.chartdata,
					app.scoresheet.stats.combat.dishoutRatio
					) );
				app.charts.push( DrawSparkChart(
					'combatBotsDestroyedSparkChart',
					app.analysis['stats.kills.combatHostilesDestroyed.overall']?.chartdata,
					app.scoresheet.stats.kills.combatHostilesDestroyed.overall
					) );
				app.charts.push( DrawSparkChart(
					'killStreakSparkChart',
					app.analysis['stats.kills.bestKillStreak.overall']?.chartdata,
					app.scoresheet.stats.kills.bestKillStreak.overall
					) );
				app.charts.push( DrawSparkChart(
					'mostKillsInOneTurnSparkChart',
					app.analysis['stats.kills.maxKillsInSingleTurn.overall']?.chartdata,
					app.scoresheet.stats.kills.maxKillsInSingleTurn.overall
					) );
				app.charts.push( DrawSparkChart(
					'botsCorruptedSparkChart',
					app.analysis['stats.combat.robotsCorrupted.overall']?.chartdata,
					app.scoresheet.stats.combat.robotsCorrupted.overall
					) );
				app.charts.push( DrawSparkChart(
					'botsMeltedSparkChart',
					app.analysis['stats.combat.robotsMelted.overall']?.chartdata,
					app.scoresheet.stats.combat.robotsMelted.overall
					) );
				app.charts.push( DrawSparkChart(
					'botsCrushedSparkChart',
					app.analysis['stats.combat.targetsRammed.crushed']?.chartdata,
					app.scoresheet.stats.combat.targetsRammed.crushed
					) );
					
				app.charts.push( DrawSparkChart(
					'meleeFollowupSparkChart',
					app.analysis['stats.combat.meleeFollowupPercent']?.chartdata,
					app.scoresheet.stats.combat.meleeFollowupPercent
					) );
				app.charts.push( DrawSparkChart(
					'botsRammedSparkChart',
					app.analysis['stats.combat.targetsRammed.overall']?.chartdata,
					app.scoresheet.stats.combat.targetsRammed.overall
					) );
				app.charts.push( DrawSparkChart(
					'sneakAttacksSparkChart',
					app.analysis['stats.combat.meleeAttacks.sneakAttacks.overall']?.chartdata,
					app.scoresheet.stats.combat.meleeAttacks.sneakAttacks.overall
					) );
				app.charts.push( DrawSparkChart(
					'powerChainReactionsSparkChart',
					app.analysis['stats.combat.powerChainReactions']?.chartdata,
					app.scoresheet.stats.combat.powerChainReactions
					) );
				app.charts.push( DrawSparkChart(
					'siegesSparkChart',
					app.analysis['stats.combat.siegeActivations.overall']?.chartdata,
					app.scoresheet.stats.combat.siegeActivations.overall
					) );
				app.charts.push( DrawSparkChart(
					'hottestTempSparkChart',
					app.analysis['stats.combat.highestTemperature.overall']?.chartdata,
					app.scoresheet.stats.combat.highestTemperature.overall
					) );
				app.charts.push( DrawSparkChart(
					'overheatingIssuesSparkChart',
					app.analysis['stats.combat.highestTemperature.effects.overall']?.chartdata,
					app.scoresheet.stats.combat.highestTemperature.effects.overall
					) );
				app.charts.push( DrawSparkChart(
					'gunslingsSparkChart',
					app.analysis['stats.combat.shotsFired.secondaryTargets.overall']?.chartdata,
					app.scoresheet.stats.combat.shotsFired.secondaryTargets.overall
					) );
				app.charts.push( DrawSparkChart(
					'machinesDisabledSparkChart',
					app.analysis['stats.machines.machinesDisabled.overall']?.chartdata,
					app.scoresheet.stats.machines.machinesDisabled.overall
					) );
				app.charts.push( DrawSparkChart(
					'collateralDamageSparkChart',
					app.analysis['performance.valueDestroyed.count']?.chartdata,
					app.scoresheet.performance.valueDestroyed.count
					) );
				app.charts.push( DrawSparkChart(
					'attacksByAlliesSparkChart',
					app.analysis['stats.allies.allyAttacks.kills']?.chartdata,
					app.scoresheet.stats.allies.allyAttacks.kills
					) );
			}
		
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
			if ( app.analysis ) {
				app.charts.push( DrawSparkChart(
					'maxAlertSparkChart',
					app.analysis['stats.alert.peakInfluence.overall']?.chartdata,
					app.scoresheet.stats.alert.peakInfluence.overall
					) );
				app.charts.push( DrawSparkChart(
					'spottedSparkChart',
					app.analysis['stats.stealth.timesSpotted.overall']?.chartdata,
					app.scoresheet.stats.stealth.timesSpotted.overall
					) );
				app.charts.push( DrawSparkChart(
					'squadsDispatchedSparkChart',
					app.analysis['stats.alert.squadsDispatched.overall']?.chartdata,
					app.scoresheet.stats.alert.squadsDispatched.overall
					) );
				app.charts.push( DrawSparkChart(
					'mostBotsTrackingSparkChart',
					app.analysis['stats.stealth.timesSpotted.peakTrackingTotal']?.chartdata,
					app.scoresheet.stats.stealth.timesSpotted.peakTrackingTotal
					) );
				app.charts.push( DrawSparkChart(
					'retreatsSparkChart',
					app.analysis['stats.stealth.timesSpotted.tacticalRetreats']?.chartdata,
					app.scoresheet.stats.stealth.timesSpotted.tacticalRetreats
					) );
				app.charts.push( DrawSparkChart(
					'distressSignalsSparkChart',
					app.analysis['stats.stealth.distressSignals']?.chartdata,
					app.scoresheet.stats.stealth.distressSignals
					) );
				app.charts.push( DrawSparkChart(
					'signalsJammedSparkChart',
					app.analysis['stats.stealth.communicationsJammed.overall']?.chartdata,
					app.scoresheet.stats.stealth.communicationsJammed.overall
					) );
				app.charts.push( DrawSparkChart(
					'haulersDistressedSparkChart',
					app.analysis['stats.alert.haulersReinforced']?.chartdata,
					app.scoresheet.stats.alert.haulersReinforced
					) );
				app.charts.push( DrawSparkChart(
					'engineersDistressedSparkChart',
					app.analysis['stats.alert.constructionImpeded']?.chartdata,
					app.scoresheet.stats.alert.constructionImpeded
					) );
				app.charts.push( DrawSparkChart(
					'trapsTriggeredSparkChart',
					app.analysis['stats.traps.trapsTriggered.overall']?.chartdata,
					app.scoresheet.stats.traps.trapsTriggered.overall
					) );
				app.charts.push( DrawSparkChart(
					'logsRecoveredSparkChart',
					app.analysis['stats.intel.derelictLogsRecovered']?.chartdata,
					app.scoresheet.stats.intel.derelictLogsRecovered
					) );
				app.charts.push( DrawSparkChart(
					'botsAnalyzedSparkChart',
					app.analysis['stats.intel.robotAnalysisTotal']?.chartdata,
					app.scoresheet.stats.intel.robotAnalysisTotal
					) );
				app.charts.push( DrawSparkChart(
					'caveInsSparkChart',
					app.analysis['stats.exploration.spacesMoved.caveInsTriggered']?.chartdata,
					app.scoresheet.stats.exploration.spacesMoved.caveInsTriggered
					) );					
				app.charts.push( DrawSparkChart(
					'spacesDugSparkChart',
					app.analysis['stats.exploration.spacesDug']?.chartdata,
					app.scoresheet.stats.exploration.spacesDug
					) );					
				app.charts.push( DrawSparkChart(
					'diggingLuckSparkChart',
					app.analysis['stats.exploration.diggingLuck']?.chartdata,
					app.scoresheet.stats.exploration.diggingLuck
					) );					
			}		
		}
		
		else if ( pane === 'route' ) {
			
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
			if ( app.analysis ) {
				app.charts.push( DrawSparkChart(
					'hackingSkillSparkChart',
					app.analysis['stats.hacking.hackingSkill']?.chartdata,
					app.scoresheet.stats.hacking.hackingSkill
					) );
				app.charts.push( DrawSparkChart(
					'successfullHacksSparkChart',
					app.analysis['stats.hacking.totalHacks.successful']?.chartdata,
					app.scoresheet.stats.hacking.totalHacks.successful
					) );
				app.charts.push( DrawSparkChart(
					'failedHacksSparkChart',
					app.analysis['stats.hacking.totalHacks.failed']?.chartdata,
					(app.scoresheet.stats.hacking.totalHacks.overall
					- app.scoresheet.stats.hacking.totalHacks.successful)
					) );
				app.charts.push( DrawSparkChart(
					'detectionsSparkChart',
					app.analysis['stats.hacking.hackingDetections.overall']?.chartdata,
					app.scoresheet.stats.hacking.hackingDetections.overall
					) );
				app.charts.push( DrawSparkChart(
					'dbLockoutsSparkChart',
					app.analysis['stats.hacking.totalHacks.databaseLockouts']?.chartdata,
					app.scoresheet.stats.hacking.totalHacks.databaseLockouts
					) );
				app.charts.push( DrawSparkChart(
					'partsRepairedSparkChart',
					app.analysis['stats.hacking.partsRepaired.overall']?.chartdata,
					app.scoresheet.stats.hacking.partsRepaired.overall
					) );
				app.charts.push( DrawSparkChart(
					'partsRecycledSparkChart',
					app.analysis['stats.hacking.partsRecycled.overall']?.chartdata,
					app.scoresheet.stats.hacking.partsRecycled.overall
					) );
				app.charts.push( DrawSparkChart(
					'partsScannedSparkChart',
					app.analysis['stats.hacking.partsScanalyzed.overall']?.chartdata,
					app.scoresheet.stats.hacking.partsScanalyzed.overall
					) );
				app.charts.push( DrawSparkChart(
					'numPartSchematicsSparkChart',
					app.analysis['stats.hacking.partSchematicsAcquired.overall']?.chartdata,
					app.scoresheet.stats.hacking.partSchematicsAcquired.overall
					) );
				app.charts.push( DrawSparkChart(
					'partsBuiltSparkChart',
					app.analysis['stats.hacking.partSchematicsAcquired.partsBuilt.overall']?.chartdata,
					app.scoresheet.stats.hacking.partSchematicsAcquired.partsBuilt.overall
					) );
				app.charts.push( DrawSparkChart(
					'numBotSchematicsSparkChart',
					app.analysis['stats.hacking.robotSchematicsAcquired.overall']?.chartdata,
					app.scoresheet.stats.hacking.robotSchematicsAcquired.overall
					) );
				app.charts.push( DrawSparkChart(
					'botsBuiltSparkChart',
					app.analysis['stats.hacking.robotSchematicsAcquired.robotsBuilt.overall']?.chartdata,
					app.scoresheet.stats.hacking.robotSchematicsAcquired.robotsBuilt.overall
					) );
				app.charts.push( DrawSparkChart(
					'rifInstallsSparkChart',
					app.analysis['stats.bothacking.usedRifInstaller.overall']?.chartdata,
					app.scoresheet.stats.bothacking.usedRifInstaller.overall
					) );
				app.charts.push( DrawSparkChart(
					'botsRewiredSparkChart',
					app.analysis['stats.bothacking.robotsRewired']?.chartdata,
					app.scoresheet.stats.bothacking.robotsRewired
					) );
				app.charts.push( DrawSparkChart(
					'botsHackedSparkChart',
					app.analysis['stats.bothacking.robotsHacked.overall']?.chartdata,
					app.scoresheet.stats.bothacking.robotsHacked.overall
					) );
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
		let desc = 'Win!';
		switch ( data.game.winType ) { 
			case 0: { desc = 'Win! Took the Access surface exit'; break; }
			case 1: { desc = 'Win! Beat MAIN.C and took the Command exit'; break; }
			case 2: { desc = 'Win! Used a Core Reset Matrix'; break; }
			case 3: { desc = 'Win! Escaped with Sigix or Sigix Containment Pod'; break; }
			case 4: { desc = 'Win! Hacked the 0b10 Command Conduit'; break; }
			case 5: { desc = 'Win! Completed A0 terminal test sequence'; break; }
			case 6: { desc = 'Win! Escaped from the singularity in A0'; break; }
			case 7: { desc = 'Win! Beat MAIN.C with the help of warlord'; break; }
			case 8: { desc = 'Win! Surrendered to MAIN.C and fought off the assault'; break; }
		}
		data.badges.unshift([winbadge,desc]);
		if ( data.game.winTotal === 1 ) { 
			data.badges.push(['First Win!','First win by any means. Congrats!']);
		}
	}
	
	// bonuses (that we know about)
	if ( data.bonus.destroyedArchitect ) { data.badges.push(['-Arch','Destroyed the Architect']); }
	if ( data.bonus.destroyedMainc ) { data.badges.push(['-MC','Destroyed Main.C']); }
	if ( data.bonus.destroyedZimprinter ) { data.badges.push(['-Z','Destroyed the Z-Imprinter']); }
	if ( data.bonus.destroyedA2 ) { data.badges.push(['-A2','Destroyed A2']); }
	if ( data.bonus.destroyedA3 ) { data.badges.push(['-A3','Destroyed A3']); }
	if ( data.bonus.destroyedA4 ) { data.badges.push(['-A4','Destroyed A4']); }
	if ( data.bonus.destroyedA5 ) { data.badges.push(['-A5','Destroyed A5']); }
	if ( data.bonus.destroyedA6 ) { data.badges.push(['-A6','Destroyed A6']); }
	if ( data.bonus.destroyedA7 ) { data.badges.push(['-A7','Destroyed A7']); }
	if ( data.bonus.destroyedA8 ) { data.badges.push(['-A8','Destroyed A8']); } // are there more?
	if ( data.bonus.destroyedRevision17 ) { data.badges.push(['-R17','Destroyed Revision17. Just because.']); }
	if ( data.bonus.alignedWithFarcom) { data.badges.push(['FarCom','Aligned with FarCom from the Exiles']); }
	if ( data.bonus.wasImprinted) { data.badges.push(['Imprinted','Got imprinted in Zion']); }
	if ( data.bonus.networkHubsDisabled == 800 ) { data.badges.push(['404','Disabled all 4 network hubs']); }
	if ( data.bonus.networkHubsDisabled > 0 && data.bonus.networkHubsDisabled < 800 ) { data.badges.push(['NetworkDown','Disabled a network hub']); }
	if ( data.bonus.builtEnhancedGrunts ) { data.badges.push(['G-00','Fired up the Cetus Manufacturing Module']); }
	if ( data.bonus.usedRifInstaller ) { data.badges.push(['RIF','Used a RIF installer inside a garrison']); }
	if ( data.bonus.usedCoreResetMatrix ) { data.badges.push(['CRM','Ate a Core Reset Matrix']); }
	if ( data.bonus.triggeredHighSecurity ) { data.badges.push(['HighSec','Triggered High-Security']); }
	if ( data.bonus.triggeredMaxSecurity ) { data.badges.push(['MaxSec','Triggered Maximum-Security']); }
	if ( data.bonus.hackedProtoVariant ) { data.badges.push(['Protovariant','Hacked a Protovariant, made a ruckus']); }
	if ( data.bonus.destroyedMaincGuards ) { data.badges.push(['DoCo','Destroyed Main.C guards in the Doom Corridor']); }
	if ( data.bonus.noSalvage ) { data.badges.push(['NoSalvage','Used no salvage']); }
	if ( data.bonus.pureCore ) { data.badges.push(['PureCore','Ran naked on pure core with no parts']); }
	if ( data.bonus.scavenger ) { data.badges.push(['Scavenger','Completed the Scavanger challenge']); }
	if ( data.bonus.simpleHacker ) { data.badges.push(['H4XX0R','Simple hacker challenge']); }
	if ( data.bonus.pacifist ) { data.badges.push(['Pacifist','Pacifist challenge']); }
	if ( data.bonus.usedDataConduit ) { data.badges.push(['DC','Plugged into the Data Conduit']); }
	if ( data.bonus.exposedGolemChamber ) { data.badges.push(['GOLEM','Exposed the GOLEM chamber']); }
	if ( data.bonus.a7ReachedMainframe ) { data.badges.push(['A7Mainframe','Led A7 to the Cetus Mainframe alive']); }
	if ( data.bonus.metR17AtCetus ) { data.badges.push(['R17Cetus','Met Revision17 at Cetus']); }
	if ( data.bonus.readDecryptedArchives ) { data.badges.push(['Decrypto','Decrypted the Archives']); }
	if ( data.bonus.decryptedA0Command ) { data.badges.push(['DecryptoA0','Decrypted the A0 command']); }
	if ( data.bonus.metR17AtResearch ) { data.badges.push(['R17Research','Had a party in Research with Revision17']); }
	if ( data.bonus.metWarlordAtResearch ) { data.badges.push(['WarlordResearch','Met Warlord in Research']); }
	if ( data.bonus.hackedGodMode ) { data.badges.push(['GodMode','Hacked God Mode']); }
	if ( data.bonus.activateExoskeleton ) { data.badges.push(['Exoskeleton','Activated the Exoskeleton']); }
	if ( data.bonus.deliveredSgemp ) { data.badges.push(['SGEMP','Delivered the SGEMP to Zhirov']); }
	if ( data.bonus.escapedWithSigix ) { data.badges.push(['SpaceBuddy','Escaped with the live Sigix']); }
	if ( data.bonus.escapedWithExosigix ) { data.badges.push(['SpaceBuddy+','Escaped with the upgraded live Sigix']); }
	if ( data.bonus.hackedMainc ) { data.badges.push(['MCH4XX0RED','Hacked Main.C']); }
	if ( data.bonus.zhirovDestroyedMainc ) { data.badges.push(['ZhirovsRevenge','Zhirov destroyed Main.C']); }
	if ( data.bonus.used0b10Conduit ) { data.badges.push(['ConduitH4XX0RED','Hacked the 0b10 Conduit']); }
	
	// places of interest
	let regular_places = ['MAT','FAC','RES','ACC','COM'].map( m => map_names[m] || m );
	for ( let x of data.route.entries ) {
		// notable places visited
		let mapname = typeof(x.location.map)=='string' ? x.location.map.replace('MAP_','') : (x.location.map==35 ? 'DSF' : 'Unknown Map');
		let nicename = map_names[mapname] || mapname;
		if ( ['SCR','MAT','UPP','FAC','LOW','RES','ACC','PRO','MIN','Unknown Map'].indexOf(mapname) === -1 ) {
			data.badges.push([ nicename, 'Found ' + nicename]);
		}
		// farthest regular location
		else if ( regular_places.indexOf(nicename) !== -1 ) {
			data.badges = data.badges.filter( x => regular_places.indexOf(x) === -1 );
			data.badges.push([ nicename, 'Made it to ' + nicename]);
		}
	}
	
	// remove duplicates
	let seen = {};
	for ( let i = data.badges.length-1; i >= 0; i-- ) {
		if ( seen[ data.badges[i][0] ] ) {
			data.badges.splice(i,1);
		}
		seen[ data.badges[i][0] ] = 1;
	}
		
	// botnets good or bad?
	let botnets = data.stats.hacking.unauthorizedHacks?.terminals?.botnet || 0;
	let unauthed_hacks = data.stats.hacking.unauthorizedHacks?.overall || 0;
	let terminal_hacks = data.stats.hacking.terminalHacks?.overall || 0;
	if ( unauthed_hacks + terminal_hacks ) { 
		if ( botnets >= 4 && botnets / (unauthed_hacks+terminal_hacks) >= 0.20  ) {
			data.badges.push(['Botnet Good','Botnet fan']);
		}
		else if ( unauthed_hacks > 10 && botnets <= 2 && botnets / (unauthed_hacks+terminal_hacks) <= 0.05  ) {
			data.badges.push(['Botnet Bad','Botnets as a last resort']);
		}
	}
	
	// hacking skills
	if ( unauthed_hacks > 30 && data.stats.hacking.totalHacks.successful / (data.stats.hacking.totalHacks?.overall||1) >= 0.75 ) {
		data.badges.push(['1337H4XX0R','Hacking skill > 75%']);
	}
	
	// shot accuracy
	if ( data.stats.combat.shotsHitRobots.overall / ((data.stats.combat.shotsFired.overall + data.stats.combat.meleeAttacks.overall) || 1) >= 0.75 ) {
		data.badges.push(['Crack Shot','Weapon accuracy > 75%']);
	}
	
	// hottest temp
	if ( data.stats.combat.highestTemperature.overall >= 600 ) {
		data.badges.push(['Spicy!','Fired a volley at over 600 heat. Chill out!']);
	}
	
	// fav propulsion - tag anything over 75pct
	let prop_threshold = 0.75 * Object.values(data.charts.prop_pie_chart_data).reduce( (a=0,x) => a+x );
	for ( let k in data.charts.prop_pie_chart_data ) {
		if ( data.charts.prop_pie_chart_data[k] >= prop_threshold && data.charts.prop_pie_chart_data[k] > 3000 ) {
			data.badges.push(['Team ' + data.charts.prop_pie_chart_labels[k].Undatafy() + '!', data.charts.prop_pie_chart_labels[k].Undatafy() + ' propulsion fan']);
			break;
		}
	}
	
	// high damage inflicted versus received
	if ( data.stats.combat.dishoutRatio > 200 ) {
		data.badges.push(['Punisher',' DishoutRatio 200%+']);
	}
	
	// RIF
	if ( data.stats.bothacking.usedRifInstaller.overall >= 7 ) {
		data.badges.push(['RIF Lord','7+ RIF installs']);
	}
	
	// AlertMonger
	if ( data.stats.alert.peakInfluence.overall > 1500 ) {
		data.badges.push(['Alert Monger',' Max Alert 1500+']);
	}
	
	// Bot Buster
	if ( data.stats.kills.combatHostilesDestroyed.overall > 400 ) {
		data.badges.push(['Bot Buster',' Destroyed 400+ combat bots.']);
	}
	
	// Allies
	if ( data.stats.allies.totalAllies.overall > 50 ) {
		data.badges.push(['Commander','Commanded 50+ allies']);
	}
	
	// Corruption
	if ( data.stats.combat.highestCorruption.overall >= 100 ) {
		data.badges.push(['CoRrUpTeD','Died by corruption. Bow your head in shame.']);
	}
	else if ( data.stats.combat.highestCorruption.overall > 50 ) {
		data.badges.push(['Tipsy','50%+ corruption']);
	}
	
	// Mole
	if ( data.stats.exploration.diggingLuck >= 100 && data.stats.exploration.spacesDug >= 100 ) {
		data.badges.push(['LU-1G1\'s Blessing','No cave-ins after digging 100+ spaces']);
	}
	else if ( data.stats.exploration.diggingLuck < 98 ) {
		data.badges.push(['Unlucky Mole','Less than 98% digging luck']);
	}
	
}

function UpdateURLWhenNewScoresheetLoaded( hash, data ) {
	const url = new URL(window.location);
	url.search = '?' + hash;
	window.history.replaceState({hash}, `${data.header.playerName} : Game #${data.game.gameNumber}`, url);
}

// returns array of [ truncated_key, value, depth, full_key ] where value may be null	
function TabularizeData(data,prefix='') {
	flatdata = [];
	let Flattener = (data,prefix='',depth=0) => {
		for ( let k in data ) {
			let v = data[k];
			flatkey = prefix + (prefix ? '.' : '') + k; 
			if ( typeof(v) === 'number' || typeof(v) === 'boolean' || typeof(v) === 'string' ) {
				// flatdata.push([flatkey,v,depth]);
				flatdata.push([k,v,depth,flatkey]);
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
	Flattener(data,prefix);
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
		

function DrawPropGraph( data, labels ) {
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
					text: 'Mobility'
				}
			}
		},
	};
	return new Chart( document.getElementById('propGraph'), config );
}

function DrawSpeedGraph( data, labels ) {
	let speed_colors = data.avg_speed_data.map( x => {
		if ( x >= 200 ) return '#d41f21';
		if ( x >= 160 ) return '#f08e00';
		if ( x >= 120 ) return '#f0e200';
		if ( x >= 80 ) return '#67f000';
		if ( x >= 40 ) return '#00f0f0';
		return '#3a46ee';
	});
	datasets = [];
		datasets.push( {
			borderColor: '#999',
			pointBackgroundColor: speed_colors,
			fill: false,
			// fill: 'start',
			tension: 0.4,
			data: data.avg_speed_data,
			order: 1,
			borderWidth: 2,
			pointBorderWidth: 0,
			pointRadius:8,
		});
		datasets.push( {
			// backgroundColor: '#666',
			backgroundColor: '#FFFFFF22',
			data: data.minmax_speed_data,
			type: 'bar',
			minBarLength: 10,
			borderWidth: 0,
			order: 2
		});
	
	const config = {
		type: 'line',
		data: { labels, datasets },
		options: {
			responsive: true,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					position: 'top',
					display: false
				},
				title: {
					display: false,
					text: 'Average Speed'
				}
			},
			scales: { y: {
				reverse: true,
				min: 0,
				// max: 600,
				suggestedMax: 200
			}}
		},
	};
	// if any of the values is too high, add a hard cap to keep graph from going wonkey
	let graph_max = 500;
	data.avg_speed_data.forEach( x => graph_max = Math.max(graph_max,x) );
	if ( data.minmax_speed_data.filter( x => x[0] >= graph_max ).length ) {
		config.options.scales.y.max = graph_max;
	}
	return new Chart( document.getElementById('speedGraph'), config );
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
			
function DrawPropPieChart( data, labels ) {
	Chart.SortPieData(data,labels);
	let colors = labels.map( x => Chart.colors_by_key[x] );
	datasets = [ { 
		label: 'Propulsion', 
		data, 
		backgroundColor: colors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'pie',
		data: { labels: labels.map(x=>x.Undatafy()), datasets },
		options: {
			aspectRatio: 1.75,	
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: 'left', display: true, },
				title: {
					display: false,
				}
			}
		},
	};
	return new Chart( document.getElementById('propPieChart'), config );
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
		labels: 'Actions Taken', 
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

// function DrawBuildChart( data, labels ) {
// 	const chartdata = {
// 		labels: labels,
// 		datasets: [{
// 			label: 'Build Quality',
// 			borderWidth: 1,
// 			fill: true,
// 			tension: 0.4,
// 			data: data,
// 		}]
// 	};
// 	const config = {
// 		type: 'line',
// 		data: chartdata,
// 		options: {
// 			aspectRatio: 4,
// 			responsive: true,
// 			interaction: {
// 				intersect: false,
// 			},					
// 			plugins: {
// 				legend: {
// 					display: false,
// 					position: 'top',
// 				},
// 				title: {
// 					display: false,
// 				}
// 			}
// 		},
// 	};
// 	return new Chart( document.getElementById('buildQualityChart'), config );
// }

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

function DrawSparkChart( canvasID, data, myval ) {
	if ( !data || data.length <= 1 ) { 
		console.log("No data for spark chart " + canvasID);
		return false; 
	}
	// let least = data[0][0];
	let seglen = data[1][0] - data[0][0];
	// get rid of non-participating zeros that make graph hard to read
	if ( data.length && !data[0][0] /* && !data[0][1] */ ) {
		data.shift();
	}
	let colors = data.map( x => x[0] >= myval && myval > (x[0] - seglen) ? '#62C462' : '#515960' );
	// if the data is literally off the chart, add a token to the last column
	if ( myval >= data[ data.length-1 ][0] + seglen ) {
		data[ data.length-1 ][1]++;
		colors[ colors.length-1 ] = '#62C462';
	}
	const chartdata = {
		labels: data.map( x => x[0] ),
		datasets: [{
			// categoryPercentage: 0.9,
			// barPercentage: 1,	
			backgroundColor: colors,
			borderWidth: 0,
			fill: true,
			tension: 0.0,
			data: data.map( x => x[1] ),
			minBarLength: 3
		}]
	};
	const config = {
		type: 'bar',
		data: chartdata,
		options: {
			aspectRatio: 5,
			responsive: true,
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: {
					display: false,
				},
				title: {
					display: false,
				}
			},
			scales: {
				x: { display: false },
				y: { display: false }
			}
			
		},
	};
	return new Chart( document.getElementById(canvasID), config );
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

// returns: [ { hash, name, date, score, win, finalmap } ]
function GetScoresheetList() {
	let list = localStorage.getItem("scoresheet_list");
	if ( list ) { list = JSON.parse(list); }
	return list || [];
}

function SaveScoresheetToList( hash, json ) {
	// final map
	let finalmap = json.route.entries[ json.route.entries.length-1 ].location;
	finalmap = finalmap.depth + '/' +
		(typeof(finalmap.map)=='string' ? finalmap.map.replace('MAP_','') : (finalmap.map==35 ? 'DSF' : '???'));
	// MYSQL style data
	let date = '20' + json.header.runEndDate.replace(/(\d\d)(\d\d)(\d\d)/g,"$1-$2-$3") + ' '
		+ json.header.runEndTime.replace(/(\d\d)(\d\d)(\d\d)/g,"$1:$2:$3");	
	let list = GetScoresheetList() || [];
	let i = list.findIndex( x => x.hash == hash );
	if ( i >= 0 ) { list.splice( i, 1 ); }
	list.unshift({
		hash,
		name: ( json.meta.playerId == 209397991 ? 'GJ' : json.header.playerName ), // [!]HACK for GJ
		gameNumber: json.game.gameNumber,
		date,
		win: json.header.win,
		finalmap,
		score: json.performance.totalScore
	});
	if ( list.length > 10 ) { 
		localStorage.removeItem( list.pop().hash );
	}
	localStorage.setItem("scoresheet_list",JSON.stringify(list));
	// save file itself
	localStorage.setItem(hash,JSON.stringify(json));
}

function ClearScoresheetList() {
	localStorage.clear();
	this.recentlyViewed = GetScoresheetList();
}

}())