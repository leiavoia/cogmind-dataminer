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
	lowSecurityPercent:'#1c5d8b',
	lowSecurity:'#1c5d8b',
	level1:'#26bfc7',
	level2:'#2fa533',
	level3:'#dbe72a',
	level4:'#dba434',
	level5:'#aa1b36',
	highSecurity:'#FFF',
	maxSecurity:'#000',
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
	ramming: '#FFF',
    Burn: '#dba434',
    Meltdown: '#aa1b36',
    Destroy: 'rgba(55,123,196,1)',
    Blast: '#324',
    Corrupt: 'rgba(59,221,17,1)',
    Smash: 'rgba(240,240,240,1)',
    Sever: 'rgba(214,221,17,1)',
    Puncture: 'rgba(192,55,196,1)',
    Detonate: '#ff6ab6',
	Sunder: '#999',
	Intensity: '#73d0ff',
	Phase: '#00744a',
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
	recoilReduction: 		{ min: 0,	max: 10,	record: 14,		ok: 0,	good: 0,	excl: 0 },
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
	JUN: 'Junkyard',
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
		.replace(/\bLe\b/,'LE')
		.replace(/\bEn\b/,'EN')
		.replace(/\bRif\b/,'RIF')
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
		ForceComparisonToStandardSet
	}
})

// check URL for a file hash - we dont care about the URL itself, just the hashy part
let hash = window.location.search.trim().replace('?','').replace(/\s+/,'').replace('hash=','').replace(/&.+/,'');
if ( hash ) { LoadScoresheet(hash); }
else { ChangePane('input'); }

function ForceComparisonToStandardSet() {
	ChangePane('loading');
	CreateFlatStats(app.scoresheet); // have to rebuild these
	DownloadDataminerDataAnalysis( app, true ).then( _ => { 
		app.scoresheet.header.analysisNote = 'Forcing comparison to standard dataset.';
		ChangePane('overview');
	} );
}
				
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

function DownloadDataminerDataAnalysis( app, force_standard_set=false ) {
	// TODO: don't re-download if categories are the same as what we have already
	url = window.location.href
		.replace( window.location.search, '' ) 
		.replace( /#.*/, '' ) 
		.replace('index.html','')
		+ 'dataminer.php'
		+ `?version=${app.scoresheet.header.version || 'Beta 11'}`
		+ `&difficulty=${app.scoresheet.header.difficulty || 'DIFFICULTY_ROGUE'}`
		+ `&mode=${app.scoresheet.header.specialMode || 'SPECIAL_MODE_NONE'}`
		;
	if ( force_standard_set ) {
		url = 'dataminer.analysis.standard.b11.json';
	}
	let fetchHandler = data => {
		if ( data ) {
			if ( data['parts.inventory.slots']?.samples < 10 ) {
				throw new Error('Not enough samples in peer group.')
			}
			app.analysis = data;
			// Analyze comps
			if ( app.scoresheet.flatstats ) {
				for ( let i of app.scoresheet.flatstats ) {
					if ( i[3] && app.analysis[i[3]] ) {
						// [ truncated_key, value, depth, full_key, avg, min, max, diff, formatted_diff, diffclass, recordbreaker ]
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
						i.push( i[1] && app.analysis[i[3]].max && i[1] >= app.analysis[i[3]].max && i[5] != i[6] );
					}
				}
			}
			// sort the comps for interesting hilites
			let mapper = function ( arr ) {
				// clean the name up to be more readable
				let name = arr[3].split('.').slice(1);
				if ( name[0].match(/(combat|build|resources|hacking|exploration|intel|machines|traps|bothacking|stealth|alert|allies)/) && name.length > 2 ) { name.shift(); }
				if ( name[1] && name[1].match('total') ) { name.splice(1,1); } // actions.total
				if ( name[ name.length-1 ].match('overall') ) { name.pop(); }
				name = name.map( _ => _.Undatafy() ).join(': ');
				return {
					name: name,
					value: arr[1],
					diff: arr[8],
					recordbreaker: arr[10]
				};
			};
			// note: filtering out single-event items that tend to be uninteresting when the average is near zero.
			app.scoresheet.hilites = app.scoresheet.flatstats.filter( i => i[7] > 0 && i[1] > 1 ).sort( (a,b) => b[7] - a[7] ).slice( 0, 19 ).map( mapper );
			app.scoresheet.lowlites = app.scoresheet.flatstats.filter( i => i[7] < 0  ).sort( (a,b) => a[7] - b[7] ).slice( 0, 19 ).map( mapper );
			app.scoresheet.spotlites = app.scoresheet.flatstats
				.filter( i => i[10] 
					&& i[5] != i[6] 
					&& !i[3].match(/^(bonus|bestStates|performance\.evolutions)/i) 
					&& !i[3].match(/(diggingLuck|mGuard|slotsEvolved|hacking\.failed|maximumAlertLevel)/i) 
					)
				.sort( (a,b) => b[7] - a[7] ).slice( 0, 19 ).map( mapper );
		}
	};		
	return fetch( url ).then( rsp => {
		if ( !rsp.ok || !rsp.body || String(rsp.status).match(/^(4|5|204)/) ) {
			throw new Error('Error when trying to get analysis file.');
		}		
		app.scoresheet.header.analysisFile = url;
		return rsp.json();
	})
	.then( fetchHandler )
	.catch( error => {
		// we couldn't download the live database version. 
		// see if we can fall back to a local static file.
		let static_file = 'dataminer.analysis.standard.b11.json';
		if ( app.scoresheet.header.version.match(/beta 10/) ) {
			static_file = 'dataminer.analysis.standard.b10.json';
		}
		return fetch( static_file ).then( rsp => {
			let json = rsp.json();
			// couldnt get file
			if ( !rsp.ok || !rsp.body || String(rsp.status).match(/^(4|5|204)/) ) {
				app.error_msg = 'Could not get dataminer analysis file. I tried, though. I really did.';
				return false;
			}
			app.scoresheet.header.analysisFile = static_file;
			app.scoresheet.header.analysisNote = 'Using standard comparison analysis file. Exact peer group not available.';
			return json;
		})
		.then( fetchHandler )
		.catch( error => {
			app.error_msg = 'Error when trying to get file: ' + error;
		});
	});	
}

function AnalyzeScoresheet( data ) {

	// remove junk we don't need
	if ( data.header.specialMode != 'SPECIAL_MODE_PLAYER2' ) { delete data.stats.player2; }
	if ( data.header.specialMode != 'SPECIAL_MODE_RPGLIKE' ) { delete data.stats.rpglike; }	
	
	// incomplete scoresheets may be missing data

	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.intel.robotAnalysisTotal = data.stats.intel.robotAnalysisTotal || 0;
	data.stats.intel.derelictLogsRecovered = data.stats.intel.derelictLogsRecovered || 0;
	data.stats.traps.trapsTriggered.overall = data.stats.traps.trapsTriggered.overall || 0;
	data.stats.alert.constructionImpeded = data.stats.alert.constructionImpeded || 0;
	data.stats.alert.haulersReinforced = data.stats.alert.haulersReinforced || 0;
	data.stats.stealth.distressSignals = data.stats.stealth.distressSignals || 0;
	data.stats.stealth.timesSpotted.tacticalRetreats = data.stats.stealth.timesSpotted.tacticalRetreats || 0;
	data.stats.stealth.timesSpotted.peakTrackingTotal = data.stats.stealth.timesSpotted.peakTrackingTotal || 0;
	data.stats.alert.squadsDispatched.overall = data.stats.alert.squadsDispatched.overall || 0;
	data.stats.stealth.timesSpotted.overall = data.stats.stealth.timesSpotted.overall || 0;
	data.stats.alert.peakInfluence.overall = data.stats.alert.peakInfluence.overall || 0;
	data.stats.hacking.partSchematicsAcquired.overall = data.stats.hacking.partSchematicsAcquired.overall || 0;
	data.stats.hacking.totalHacks.databaseLockouts = data.stats.hacking.totalHacks.databaseLockouts || 0;
	data.performance.valueDestroyed.count = data.performance.valueDestroyed.count || 0;
	data.stats.machines.machinesDisabled.overall = data.stats.machines.machinesDisabled.overall || 0;
	data.stats.combat.highestTemperature.overall = data.stats.combat.highestTemperature.overall || 0;
	data.stats.combat.powerChainReactions = data.stats.combat.powerChainReactions || 0;
	data.stats.combat.targetsRammed.overall = data.stats.combat.targetsRammed.overall || 0;
	data.stats.allies.allyAttacks.kills = data.stats.allies.allyAttacks.kills || 0;
	data.stats.allies.allyAttacks.totalDamage = data.stats.allies.allyAttacks.totalDamage || 0;
	data.stats.allies.allyAttacks.overall = data.stats.allies.allyAttacks?.overall || 0;
	data.stats.allies.totalAllies.highestRatedGroup = data.stats.allies.totalAllies?.highestRatedGroup || 0;
	data.stats.combat.targetsRammed.crushed = data.stats.combat.targetsRammed?.crushed || 0;
	data.stats.combat.robotsMelted.overall = data.stats.combat.robotsMelted?.overall || 0;
	data.stats.combat.robotsCorrupted.overall = data.stats.combat.robotsCorrupted?.overall || 0;
	data.stats.kills.bestKillStreak.overall = data.stats.kills.bestKillStreak?.overall || 0;
	data.stats.kills.combatHostilesDestroyed.overall = data.stats.kills.combatHostilesDestroyed?.overall || 0;
	data.stats.combat.shotsHitRobots.coreHits = data.stats.combat.shotsHitRobots?.coreHits || 0;
	data.stats.combat.meleeAttacks.sneakAttacks.overall = data.stats.combat.meleeAttacks.sneakAttacks?.overall || 0;
	data.stats.combat.meleeAttacks.overall = data.stats.combat.meleeAttacks?.overall || 0;
	data.stats.combat.damageTaken.overall = data.stats.combat.damageTaken?.overall || 0;
	data.stats.combat.damageInflicted.overall = data.stats.combat.damageInflicted?.overall || 0;
	data.stats.combat.shotsFired.overall = data.stats.combat.shotsFired?.overall || 0;
	data.stats.combat.volleysFired.overall = data.stats.combat.volleysFired?.overall || 0;
	data.stats.exploration.spacesMoved.slowestSpeed = data.stats.exploration.spacesMoved?.slowestSpeed || 0;
	data.stats.exploration.spacesMoved.fastestSpeed = data.stats.exploration.spacesMoved?.fastestSpeed || 0;
	data.stats.exploration.spacesMoved.averageSpeed = data.stats.exploration.spacesMoved?.averageSpeed || 0;
	data.stats.allies.totalAllies.overall = data.stats.allies.totalAllies?.overall || 0;
	data.performance.robotsDestroyed.count = data.performance.robotsDestroyed?.count || 0;
	data.performance.totalScore = data.performance?.totalScore || 0;
	data.stats.exploration.turnsPassed = data.stats.exploration?.turnsPassed || 0;
	data.stats.hacking.hackingSkill = data.stats.hacking?.hackingSkill || 0;
	data.stats.hacking.totalHacks.successful = data.stats.hacking.totalHacks?.successful || 0;
	data.stats.hacking.totalHacks.overall = data.stats.hacking.totalHacks?.overall || 0;
	data.stats.hacking.hackingDetections.overall = data.stats.hacking.hackingDetections?.overall || 0;
	data.stats.hacking.partsRepaired.overall = data.stats.hacking.partsRepaired?.overall || 0;
	data.stats.hacking.partsRecycled.overall = data.stats.hacking.partsRecycled?.overall || 0;
	data.stats.hacking.partsScanalyzed.overall = data.stats.hacking.partsScanalyzed?.overall || 0;
	data.stats.hacking.partSchematicsAcquired.partsBuilt.overall = data.stats.hacking.partSchematicsAcquired.partsBuilt?.overall || 0;
	data.stats.hacking.robotSchematicsAcquired.robotsBuilt.overall = data.stats.hacking.robotSchematicsAcquired.robotsBuilt?.overall || 0;
	data.stats.hacking.robotSchematicsAcquired.overall = data.stats.hacking.robotSchematicsAcquired?.overall || 0;
	data.stats.bothacking.usedRifInstaller.overall = data.stats.bothacking.usedRifInstaller?.overall || 0;
	data.stats.bothacking.robotsRewired = data.stats.bothacking?.robotsRewired || 0;
	data.stats.bothacking.robotsHacked.overall = data.stats.bothacking?.robotsHacked?.overall || 0;
	data.stats.stealth.communicationsJammed.overall = data.stats.stealth.communicationsJammed?.overall || 0;

	data.stats.exploration.explorationRatePercent.overall = data.stats.exploration.explorationRatePercent.overall || 0;
	data.stats.exploration.explorationRatePercent.regionsVisited.overall = data.stats.exploration.explorationRatePercent.regionsVisited.overall || 0;
	data.stats.exploration.explorationRatePercent.preDiscoveredAreas = data.stats.exploration.explorationRatePercent.preDiscoveredAreas || 0;
	data.stats.exploration.explorationRatePercent.knownExitsTaken = data.stats.exploration.explorationRatePercent.knownExitsTaken || 0;
	data.performance.regionsVisited.count = data.performance.regionsVisited.count || 0;
	data.stats.exploration.scrapSearched = data.stats.exploration.scrapSearched || 0;
	data.performance.prototypesIdentified.count = data.performance.prototypesIdentified.count || 0;
	data.stats.intel.derelictLogsRecovered = data.stats.intel.derelictLogsRecovered || 0;
	data.stats.alert.peakInfluence.averageInfluence = data.stats.alert.peakInfluence.averageInfluence || 0;
	data.peakState.rating = data.peakState.rating || 0;
	data.stats.build.averageSlotUsagePercent.overall = data.stats.build.averageSlotUsagePercent.overall || 0;
	data.stats.allies.totalAllies.largestGroup = data.stats.allies.totalAllies.largestGroup || 0;
	data.stats.allies.allyAttacks.overall = data.stats.allies.allyAttacks.overall || 0;
	data.stats.allies.allyAttacks.kills = data.stats.allies.allyAttacks.kills || 0;
		
	// precompute single values
	
	// digging luck
	data.stats.exploration.diggingLuck = Math.max( 0, 100 * ( 1 - ( (data.stats.exploration.spacesMoved.caveInsTriggered || 0) 
		/ (data.stats.exploration.spacesDug || 1) ) ) );
	
	// collateral dmg pct
	data.stats.combat.collateralDamagePct = Math.min( 100, 100 * data.performance.valueDestroyed.count 
		/ ( data.stats.combat.damageInflicted.overall || 1 ) );
	
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
		
	// shots per volley - AWS autocannons can mess up this stat because they dont count as volleys!
	data.stats.combat.shotsPerVolley = Math.min( 10, data.stats.combat.shotsFired.overall 
		/ (data.stats.combat.volleysFired.overall|| 1) );
						
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
	let playtimeInMinutes = (parseInt(timeParts[1]) + (parseInt(timeParts[0])*60)) || 1;
	data.stats.actions.cadence = ( data.stats.actions.total.overall - data.stats.actions.total.wait ) / playtimeInMinutes;
	
	// final build
	data.cogmind.finalBuild = data.route.entries[ data.route.entries.length-1 ].dominantClass;
	
	// precompute chart data
	data.charts = {
		turns_chart_data: [],
		hacks_chart_data: [],
		support_chart_data: [],
		weight_chart_data: [],
		inventory_chart_data: [],
		inventory_carried_chart_data: [],
		kills_chart_data: [],
		greenbot_kills_chart_data: [],
		neutral_kills_chart_data: [],
		alert_chart_data: [],
		adv_alert_chart_data: {
			lowSecurityPercent:[],
			level1:[],
			level2:[],
			level3:[],
			level4:[],
			level5:[],
			highSecurity:[],
			maxSecurity:[],
			sterilized:[],
			overall:[]
		},
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
		
	// create run heat map  [ truncated_key, value, depth, full_key ]
	// populates with per-map data in the next block...
	data.heatmap = TabularizeData(data.stats, 'stats').map( x => ({
		name: x[0],
		depth: x[2],
		total: x[1],
		k: x[3],
		run: []
	}));
	
	for ( map of data.route.entries ) {
		// map labels
		map.location.mapname = typeof(map.location.map)=='string' ? map.location.map.replace('MAP_','') : (map.location.map==35 ? 'DSF' : 'Unknown Map');
		map.location.mapname = (map_names[map.location.mapname] || map.location.mapname);
		data.charts.chart_map_labels.push( map.location.depth + '/' + map.location.mapname );					
				
		// heatmap data
		let heatdata = TabularizeData(map.stats, 'stats');
		// create a temporary dictionary
		let heatdict = {};
		for ( let x of heatdata ) { heatdict[x[3]] = x[1]; }
		// load into heatmap
		for ( let x of data.heatmap ) { x.run.push( heatdict[x.k] || null ); }
												
		// influence
		data.charts.alert_chart_data.push(map.stats.alert.peakInfluence.overall);
		for ( let k in data.charts.adv_alert_chart_data ) { // iterate over master keys. not all maps hit all levels
			if ( k == 'sterilized'|| k == 'overall' ) { continue; } // save for later
			data.charts.adv_alert_chart_data[k].push( 
				map.stats.alert.peakInfluence.overall * ( map.stats.alert.maximumAlertLevel[k] / 100 )
			);
		}
		// scan history messages for evidence of sterilization. it isn't technically an alert level
		let steri = false;
		if ( map.historyEvents ) { 
			for ( row of map.historyEvents ) { 
				if ( row.event.match(/sterilization/i) ) {
					steri = true; break; 
				}
			}
		}
		data.charts.adv_alert_chart_data['sterilized'].push( steri ? map.stats.alert.peakInfluence.overall : 0 );
		data.charts.adv_alert_chart_data['overall'].push( map.stats.alert.peakInfluence.overall );
		
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
		data.charts.inventory_carried_chart_data.push( map.stats.build.largestInventoryCapacity.averageCarried );
		
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
		if ( map.historyEvents ) { 
			for ( row of map.historyEvents ) { 
				if ( row.event.match(/(lost|released all parts|locked|lockdown|assault|sterilization system|crushed|destroyed by|self destr|core integrity fell|corruption reached|assimilated all|stolen by|self-destructed|Destroyed self|Terminal network hard line cut|core destroyed|activated Command garrisons|Derelicts to an unsafe place|Attacked by the|came to Exiles' defense|came to Zion's defense)/i) ) { row.class = 'bad'; }
				else if ( row.event.match(/(learned|destroyed|killed|installed|found|Aligned with FarCom|given|expanded rif|repaired|fabricated|Loaded intel|hub disabled|Gained derelict followers|Revealed the true nature|received the|redirected|Retrieved Zion|Zion.+teleported in|answering call for help|Disengaged cave|squad redirected|Derelicts to a safe place)/i) ) { row.class = 'good'; }
				else if ( row.event.match(/(discovered|identified|build established|Accompanied by)/i) ) { row.class = 'info'; }
				else if ( row.event.match(/(entered|evolved)/i) ) { row.class = 'notice'; }
				else if ( row.event.match(/(triggered|spotted|evacuate|Garrison activated|warn|convoy interrupted|squad dispatched|Detected by scanners|Attracted the attention|Encountered a Master Thief|Additional patrols routed)/i) ) { row.class = 'warning'; }
				else { row.class = ''; }
			}
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
	
	// normalize and colorize heatmap data
	for ( let x of data.heatmap ) {
		x.colors = [];
		let max = 0;
		let min = 100000000;
		for ( let r of x.run ) {
			// r = parseInt(r||0);
			if ( r > max ) { max = r; } 
			if ( r < min && r !== null ) { min = r; } 
		}
		let range = max - min;
		let steps = Math.min( range + 1, 6 );
		let stepsize = (range / steps) || 1;
		for ( let r of x.run ) {
			r = parseInt(r||0);
			let step = null;
			if ( r ) {
				step = Math.trunc( (r - min) / stepsize ); // css classname c1 .. c5
				step = 'c' + Math.min(step,r,5);
			}
			else { step = 'n'; } // "null"
			x.colors.push(step); 
		}
	}
	// break heatmap up into sections
	let heatmapSections = [];
	for ( x of data.heatmap ) {
		if ( x.depth==0 ) { heatmapSections.push([]); }
		heatmapSections[  heatmapSections.length-1 ].push( x );
	}
	data.heatmap = heatmapSections;
	
	// reverse the routes for familiarity
	// data.charts.route_data.reverse();
	data.charts.route_data.shift();
	
	// class distribution
	data.charts.class_distro_chart_data = [];
	data.charts.class_distro_chart_labels = [];
	if ( data.classDistribution.classes ) {
		for ( let c of data.classDistribution.classes ) {
			data.charts.class_distro_chart_data.push( c.percent );
			data.charts.class_distro_chart_labels.push( c.name );
		}
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
		data.charts.overall_damage_data[k] = data.stats.combat.damageInflicted[k];
	}
	// damage from allies
	data.charts.overall_damage_data['allies'] = data.stats.allies.allyAttacks.totalDamage || 0;
			
	// killed bot types
	data.charts.kill_types_chart_labels = [];
	data.charts.kill_types_chart_data = [];
	for ( let k in data.stats.kills.classesDestroyed ) {
		if ( k != 'overall' ) { 
			data.charts.kill_types_chart_labels.push(k);
			data.charts.kill_types_chart_data.push( data.stats.kills.classesDestroyed[k] );
		}
	}
	
	// critical hits
	data.charts.criticals_pie_chart_labels = [];
	data.charts.criticals_pie_chart_data = [];
	for ( let k in data.stats.combat.shotsHitRobots.criticalStrikes ) {
		if ( k != 'overall' ) { 
			data.charts.criticals_pie_chart_labels.push(k.Undatafy());
			data.charts.criticals_pie_chart_data.push( data.stats.combat.shotsHitRobots.criticalStrikes[k] );
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
	
	// alert levels
	data.charts.alertlevel_chart_labels = [];
	data.charts.alertlevel_chart_data = [];
	for ( let k in data.stats.alert.maximumAlertLevel ) {
		if ( k != 'overall' ) { 
			let label = k.replace(/^.*\./,'').replace('lowSecurityPercent','lowSecurity');
			data.charts.alertlevel_chart_labels.push(label);
			data.charts.alertlevel_chart_data.push(data.stats.alert.maximumAlertLevel[k]);
		}
	}
	
	// squads dispatched
	data.charts.squads_chart_labels = [];
	data.charts.squads_chart_data = [];
	for ( let k in data.stats.alert.squadsDispatched ) {
		if ( k != 'overall' ) { 
			data.charts.squads_chart_labels.push(k);
			data.charts.squads_chart_data.push(data.stats.alert.squadsDispatched[k]);
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
					
	// map lines colorization
	data.map.html = '';
	for ( let l of data.map.lines ) {
		// skip blank lines
		if ( l.match(/^\s+$/) ) { continue; }
		// colorize characters 
		l = l.replace(/([<\*\+\!ZMWGDVzIXitpAKBEblCcnxakweomru?@TFRGYS%hHygs7d#\/=\[\]])/g, (a,b) => {
			let color = null;
			switch ( b ) {
				case '!': { color = 'D4D'; break; }
				case '+': { color = 'f19700'; break; }
				case '/': { color = 'f19700'; break; }
				case '#': { color = 'EEE'; break; }
				case '?': { color = '444'; break; }
				case '@': { color = '39E'; break; }
				case 'X': { color = '41A34F'; break; } // door terminal
				case 'T': { color = '41A34F'; break; }
				case 'F': { color = '314cad'; break; }
				case 'R': { color = '972217'; break; }
				case 'G': { color = 'dfdfdf'; break; }
				case 'Y': { color = 'CC1'; break; }
				case 'S': { color = 'c228bc'; break; }
				case '%': { color = '8a1997'; break; }
				case '[': { color = '1E66A7'; break; }
				case ']': { color = 'FB0'; break; }
				case '=': { color = '238628'; break; }
				case '*': { color = 'D11'; break; }
				case '<': { color = 'D80'; break; } // exit
				// unique NPCs / pink bots
				case 'Z': 
				case 'M': 
				case 'W': 
				case 'G':
				case 'D':
				case 'V': { color = 'FF4EBA'; break; }
				// green bots
				case 'u': 
				case 'm': 
				case 'k': 
				case 'A':
				case 't':
				case 'r': { color = '6C6'; break; }
				// combat bots
				case 'E': // [E]xecutioner, not [E]xit!
				case 'a': 
				case 'e': 
				case '7': 
				case 'i': 
				case 'w': 
				case 'y': 
				case 'g': 
				case 's': 
				case 'f': 
				case 'd': 
				case 'f': 
				case 'c':
				case 'C':
				case 'p': 
				case 'B': 
				case 'h': 
				case 'K': 
				case 'b': 
				case 'l': 
				case 'c': 
				case 'x': 
				case 'z':
				case 'I':
				case 'x':
				case 'o':
				case 'd':
				case 'n':
				case 'h':
				case 'H': { color = 'ebe53e'; break; }
			}
			if ( color ) { 
				// surrounding box for important icons
				if ( b.match(/[<]/) ) { 
					return `<span style="display:inline-block; color: #FFF; background-color:#${color};">${b}</span>`; 
					}
				else return `<span style="color:#${color};">${b}</span>`;
			}
			return b;
		});
		data.map.html = data.map.html + l + '<br/>';
				
	}	
		

	// -------------\/----- ENGAGEMENT -----\/---------------
	
	// attempt to rate engagement by averaging stats over how much of the game was played/explored (the "divisor")
	let engagement_divisor = 0;
	for ( map of data.route.entries ) {
		let mapname = typeof(map.location.map)=='string' ? map.location.map.replace('MAP_','') : (map.location.map==35 ? 'DSF' : 'Unknown Map');
		// large areas get the full effect
		if ( ['FAC','RES','ACC','COM','AC0','ARM','QUA','TES','SEC','STO'].indexOf(mapname) >= 0 ) {
			engagement_divisor += 1.0;
		}
		// midsize areas have less effect on the averages
		else if ( ['MAT','HUB','SEC'].indexOf(mapname) >= 0 ) {
			engagement_divisor += 0.75;
		}
		// small areas
		else if ( ['MIN','CET','EXT','DSF',35,'ARC','DEE'].indexOf(mapname) >= 0 ) {
			engagement_divisor += 0.5;
		}
		// the rest
		else {
			engagement_divisor += 0.5;
		}
	}
	
	// setup for engagement metrics
	data.engagement = {};
	data.engagement.combat = 1.0;
	data.engagement.hacking = 1.0;
	data.engagement.exploration = 1.0;
	data.engagement.stealth = 1.0;
	data.engagement.allies = 1.0;
	data.engagement.build = 1.0;
	
	// GENERALLY: ( effect of stat * (stat / ideal num per map) )
	
	// COMBAT
	data.engagement.combat = 
		(0.3 * ( (data.stats.kills.combatHostilesDestroyed.overall / 20) / engagement_divisor))
		+
		(0.3 * ( (data.stats.combat.damageInflicted.overall / 2000) / engagement_divisor))
		+
		(0.2 * ( ((data.stats.combat.volleysFired.overall + data.stats.combat.meleeAttacks.overall ) / 50) / engagement_divisor))
		;
		
	// HACKING
	// how many types of hacks did we pull off?
	let hack_types = 0;
	for ( k of ['terminalHacks','scanalyzer','repairStationHacks','garrisonAccessHacks','recyclingUnitHacks','fabricatorHacks'] ) {
		if ( typeof(data.stats.hacking[k]) === 'undefined' ) { continue; }
		hack_types += Object.entries(data.stats.hacking[k]).length -1;
	}
	let uhack_types = 0;
	for ( k of ['terminals','scanalyzers','repairStations','garrisonAccess','recyclingUnits','fabricators'] ) {
		if ( typeof(data.stats.hacking.unauthorizedHacks[k]) === 'undefined' ) { continue; }
		uhack_types += Object.entries(data.stats.hacking.unauthorizedHacks[k]).length -1;
	}
	// don't count open door and records hacks. thats cheating.
	let total_hacks = data.stats.hacking?.totalHacks?.overall || 0;
	total_hacks -= data.stats.hacking?.terminalHacks?.openDoor || 0;
	total_hacks -= data.stats.hacking?.terminalHacks?.record || 0;
	data.engagement.hacking = 
		(0.45 * ( (total_hacks / 20) / engagement_divisor))
		+
		(0.20 * (hack_types / 40) )
		+ 
		(0.20 * (uhack_types / 20) )
		+ 
		(0.15 * (( data.stats.hacking.hackingSkill - 50 ) / 30 ) ) // we only care about the common 50-80% range
		;
		
	// EXPLORATION
	// we can't depend on "branchRegions" because the scoresheet doesnt include 
	// DSF, garrisons, or wastes in that number, but we do. Count manually.
	let nonMainRegions = 0;
	for ( map of data.route.entries ) {
		if ( ['MAP_SCR','MAP_MAT','MAP_FAC','MAP_RES','MAP_ACC'].indexOf(map.location.map) < 0 ) {
			nonMainRegions++;
		}
	}
	let branchRegionRatio = nonMainRegions / (data.stats.exploration.explorationRatePercent.regionsVisited.overall  || 1);
	branchRegionRatio = (branchRegionRatio + branchRegionRatio) / 2; // real it in so it doesnt get too swingy
	data.engagement.exploration = 
		(0.22 * ( data.stats.exploration.explorationRatePercent.overall / 120 ) )
		+
		(0.33 * branchRegionRatio )
		+
		(0.05 * (data.stats.exploration.explorationRatePercent.preDiscoveredAreas / (data.performance.regionsVisited.count||1) ) )
		+ 
		(0.1 * (data.stats.exploration.explorationRatePercent.knownExitsTaken / (data.performance.regionsVisited.count||1)) )
		+
		(0.1 * ( (data.stats.exploration.scrapSearched * 1.5 ) / engagement_divisor) )
		+
		(0.1 * ( (data.stats.intel.derelictLogsRecovered * 1.5 ) / engagement_divisor) )
		+
		(0.1 * ( ( data.performance.prototypesIdentified.count / 8 ) / engagement_divisor ) )
		;
	// STEALTH
	let distress_per_floor = (	(data.stats.alert.constructionImpeded * 2) + 
		(data.stats.alert.haulersReinforced * 2) + 
		data.stats.stealth.distressSignals +
		-data.stats.stealth.communicationsJammed.overall
		) / engagement_divisor;
	data.engagement.stealth = 
		( 0.2 * (Math.max( 0, 1200 - data.stats.alert.peakInfluence.overall ) / 1200) )
		+
		( 0.35 * (Math.max( 0, 800 - data.stats.alert.peakInfluence.averageInfluence ) / 800) )
		+
		( 0.15 * (Math.max( 0, 20 - (data.stats.stealth.timesSpotted.overall / engagement_divisor) ) / 20) )
		+
		( 0.15 * (Math.max( 0, 5 - distress_per_floor ) / 5) )
		+
		(0.15 * ( (2*data.stats.stealth.timesSpotted.tacticalRetreats) / (data.stats.stealth.timesSpotted.overall||1)) )
		;
		
	// BUILD
	let curent_depth = data.route.entries.length ? data.route.entries[ data.route.entries.length-1 ].location.depth : -11;
	let levels_ascended = 11 + curent_depth;
	let avg_build_rating = (data.peakState.rating / (( levels_ascended + levels_ascended*0.1 )||1) ) / 20; // 250 is theoretical "pretty decent" build
	let slot_rating = Math.max( 0, data.stats.build.averageSlotUsagePercent.overall - 80 ) / 20; // anything less than 80 is just bad.
	let avg_performance = 0;
	for ( let k in data.metricPerformance ) {
		avg_performance += data.metricPerformance[k].pct;
	}
	avg_performance /= 100 * Object.entries(data.metricPerformance).length;
	avg_performance /= levels_ascended || 1;
	avg_performance *= 20;
	data.engagement.build = 
		( 0.3 * slot_rating )
		+
		( 0.3 * avg_build_rating )
		+
		( 0.4 * avg_performance )
		;
	
	// ALLIES
	data.engagement.allies = 
		(0.35 * ( (data.stats.allies.totalAllies.overall / 4) / engagement_divisor))
		+
		( 0.25 * ( data.stats.allies.totalAllies.largestGroup / 30 ) )
		+
		(0.2 * ( (data.stats.allies.allyAttacks.overall / 16) / engagement_divisor))
		+
		(0.2 * ( (data.stats.allies.allyAttacks.kills / 3) / engagement_divisor))
		;
		
	// format for progress bars
	for ( k in data.engagement ) {
		let pct = Math.max(data.engagement[k],0) * 100;
		let classname = 'poor';
		if ( pct >= 100 ) { classname = 'best'; }
		else if ( pct > 75 ) { classname = 'excl'; }
		else if ( pct >= 50 ) { classname = 'good'; }
		else if ( pct >= 25 ) { classname = 'avg'; }
		data.engagement[k] = { val: pct, classname: classname };
	} 
	
	// -------------/\----- ENGAGEMENT -----/\---------------
	
							
	// Badges
	CalculateBadges(data);
	
	CreateFlatStats(data);
	
	// update window & meta description
    document.title = `Dataminer : ${data.header.playerName} : Game #${data.game.gameNumber}`;
	let desc = 	(data.header.win ? 'ASCENDED! ' : 'DEFEAT! ') + data.header.runResult;
	document.querySelector('meta[name="description"]').setAttribute("content", desc);
	
}

function CreateFlatStats(data) {
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
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.turns_chart_data, 
				app.scoresheet.charts.chart_map_labels,
				'turnsTakenChart',
				{ chartType: 'bar', legend:false, aspectRatio:3 }
				) );				
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.actions_chart_data, 
				app.scoresheet.charts.actions_chart_labels,
				'actionsChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'pie', aspectRatio:2 }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.alert_chart_data, 
				app.scoresheet.charts.chart_map_labels,
				'alertChart',
				{ legend:false, chartType: 'line', tension: 0.4, aspectRatio:2 }
				) );							
			if ( app.analysis ) {
				app.charts.push( DrawSparkChart(
					'scoreSparkChart',
					app.analysis['performance.totalScore']?.chartdata,
					app.scoresheet.performance.totalScore
					) );
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
				// app.charts.push( DrawSparkChart(
				// 	'avgSpeedSparkChart',
				// 	app.analysis['stats.exploration.spacesMoved.averageSpeed']?.chartdata,
				// 	app.scoresheet.stats.exploration.spacesMoved.averageSpeed
				// 	) );
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
			app.charts.push( DrawSparkChart(
				'slotPowerSparkChart',
				app.analysis['parts.power.slots']?.chartdata,
				app.scoresheet.parts.power.slots
				) );
			app.charts.push( DrawSparkChart(
				'slotPropSparkChart',
				app.analysis['parts.propulsion.slots']?.chartdata,
				app.scoresheet.parts.propulsion.slots
				) );
			app.charts.push( DrawSparkChart(
				'slotUtilSparkChart',
				app.analysis['parts.utility.slots']?.chartdata,
				app.scoresheet.parts.utility.slots
				) );
			app.charts.push( DrawSparkChart(
				'slotWeaponSparkChart',
				app.analysis['parts.weapon.slots']?.chartdata,
				app.scoresheet.parts.weapon.slots
				) );
				
			app.charts.push( DrawPropGraph(
				app.scoresheet.charts.prop_chart_data, 
				app.scoresheet.charts.chart_map_labels
			) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.class_distro_chart_data, 
				app.scoresheet.charts.class_distro_chart_labels,
				'classDistroChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'bar', aspectRatio: 4, legend:false }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.prop_pie_chart_data, 
				app.scoresheet.charts.prop_pie_chart_labels,
				'propPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.parts_attached_chart_data, 
				app.scoresheet.charts.parts_attached_chart_labels,
				'partsAttachedPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.parts_attached_power_chart_data, 
				app.scoresheet.charts.parts_attached_power_chart_labels,
				'powerAttachedPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.parts_attached_propulsion_chart_data, 
				app.scoresheet.charts.parts_attached_propulsion_chart_labels,
				'propulsionAttachedPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.parts_attached_utility_chart_data, 
				app.scoresheet.charts.parts_attached_utility_chart_labels,
				'utilityAttachedPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.parts_attached_weapon_chart_data, 
				app.scoresheet.charts.parts_attached_weapon_chart_labels,
				'weaponAttachedPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.parts_lost_chart_data, 
				app.scoresheet.charts.parts_lost_chart_labels,
				'partsLostPieChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
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
				app.scoresheet.charts.inventory_carried_chart_data,
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
					'coreHitsSparkChart',
					app.analysis['stats.combat.shotsHitRobots.coreHits']?.chartdata,
					app.scoresheet.stats.combat.shotsHitRobots.coreHits
					) );
				app.charts.push( DrawSparkChart(
					'meleeFollowupSparkChart',
					app.analysis['stats.combat.meleeFollowupPercent']?.chartdata,
					app.scoresheet.stats.combat.meleeFollowupPercent
					) );
				app.charts.push( DrawSparkChart(
					'sneakAttacksSparkChart',
					app.analysis['stats.combat.meleeAttacks.sneakAttacks.overall']?.chartdata,
					app.scoresheet.stats.combat.meleeAttacks.sneakAttacks.overall
					) );					
				app.charts.push( DrawSparkChart(
					'meleeAttacksSparkChart',
					app.analysis['stats.combat.meleeAttacks.overall']?.chartdata,
					app.scoresheet.stats.combat.meleeAttacks.overall
					) );					
					
				// below the fold optimization
				setTimeout( _ => {
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
						'botsRammedSparkChart',
						app.analysis['stats.combat.targetsRammed.overall']?.chartdata,
						app.scoresheet.stats.combat.targetsRammed.overall
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
						'collateralDamagePctSparkChart',
						app.analysis['stats.combat.collateralDamagePct']?.chartdata,
						app.scoresheet.stats.combat.collateralDamagePct
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
						'bestAllySparkChart',
						app.analysis['stats.allies.totalAllies.highestRatedAlly']?.chartdata,
						app.scoresheet.stats.allies.totalAllies.highestRatedAlly
						) );
					app.charts.push( DrawSparkChart(
						'bestArmySparkChart',
						app.analysis['stats.allies.totalAllies.highestRatedGroup']?.chartdata,
						app.scoresheet.stats.allies.totalAllies.highestRatedGroup
						) );
					app.charts.push( DrawSparkChart(
						'attacksByAlliesSparkChart',
						app.analysis['stats.allies.allyAttacks.overall']?.chartdata,
						app.scoresheet.stats.allies.allyAttacks.overall
						) );
					app.charts.push( DrawSparkChart(
						'allyDamageSparkChart',
						app.analysis['stats.allies.allyAttacks.totalDamage']?.chartdata,
						app.scoresheet.stats.allies.allyAttacks.totalDamage
						) );
					app.charts.push( DrawSparkChart(
						'zioniteDispatchesSparkChart',
						app.analysis['stats.allies.zioniteDispatches.overall']?.chartdata,
						app.scoresheet.stats.allies.zioniteDispatches?.overall || 0
						) );
					app.charts.push( DrawSparkChart(
						'ordersGivenSparkChart',
						app.analysis['stats.allies.totalOrders.overall']?.chartdata,
						app.scoresheet.stats.allies.totalOrders.overall
						) );
					app.charts.push( DrawSparkChart(
						'allyKillsSparkChart',
						app.analysis['stats.allies.allyAttacks.kills']?.chartdata,
						app.scoresheet.stats.allies.allyAttacks.kills
						) );	
						
					// NOTE: scoresheet format change in Beta11 makes this data unavailable.
					if ( app.scoresheet.stats.combat.shotsHitRobots.criticalStrikes ) {
						if ( app.scoresheet.stats.combat.criticalHitPercent ) {
							app.charts.push( DrawSparkChart(
								'criticalHitPctSparkChart',
								app.analysis['stats.combat.criticalHitPercent']?.chartdata,
								app.scoresheet.stats.combat.criticalHitPercent
								) );
						}
						if ( app.scoresheet.stats.combat.shotsHitRobots.criticalStrikes ) {
							app.charts.push( DrawSparkChart(
								'criticalHitsSparkChart',
								app.analysis['stats.combat.shotsHitRobots.criticalStrikes.overall']?.chartdata,
								app.scoresheet.stats.combat.shotsHitRobots.criticalStrikes.overall
								) );
						}					
						else {
							app.charts.push( DrawSparkChart(
								'criticalHitsSparkChart',
								app.analysis['stats.combat.shotsHitRobots.criticalHits']?.chartdata,
								app.scoresheet.stats.combat.shotsHitRobots.criticalHits
								) );
						}					
						app.charts.push( DrawSparkChart(
							'criticalKillsSparkChart',
							app.analysis['stats.combat.shotsHitRobots.criticalKills']?.chartdata,
							app.scoresheet.stats.combat.shotsHitRobots.criticalKills
							) );
					}
						
				}, 2000);				
			}
		
			// below the fold optimization
			setTimeout( _ => {
			
				app.charts.push( DrawGenericChart( 
					app.scoresheet.charts.kill_types_chart_data, 
					app.scoresheet.charts.kill_types_chart_labels,
					'killsTypesChart',
					{ addpct:true, sort:true, undatafy: true, legend:false, chartType: 'bar', aspectRatio:3 }
					) );
				
				app.charts.push( DrawDamageInflictedChart(app.scoresheet.charts.damage_chart_data, app.scoresheet.charts.chart_map_labels) );
				
				if ( app.scoresheet.stats.combat.shotsHitRobots.criticalStrikes ) {
					app.charts.push( DrawGenericChart( 
						app.scoresheet.charts.criticals_pie_chart_data, 
						app.scoresheet.charts.criticals_pie_chart_labels,
						'criticalHitsPieChart',
						{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', aspectRatio:2 , colors:'indexed' }
						) );
				}
				
				app.charts.push( DrawGenericChart( 
					app.scoresheet.charts.damage_received_chart_data, 
					app.scoresheet.charts.chart_map_labels,
					'damageReceivedChart',
					{ legend:false, chartType: 'bar', aspectRatio:3, colors:'#b93f3f' }
					) );
							
				app.charts.push( DrawGenericChart( 
					[
						{
							label: 'Combat Bots',
							color: '#b93f3f',
							data: app.scoresheet.charts.kills_chart_data
						},
						{
							label: 'Green Bots',
							color: '#41A34F',
							data: app.scoresheet.charts.greenbot_kills_chart_data 
						},
						{
							label: 'Unarmed / Watchers',
							color: '#777',
							data: app.scoresheet.charts.neutral_kills_chart_data 
						},
					],
					app.scoresheet.charts.chart_map_labels,
					'killsChart',
					{ legend:true, chartType: 'bar', stacked:true, aspectRatio:3 }
					) );
				
			}, 1000);
			
			// damage types
			let dmg_types = ['kinetic', 'thermal', 'electromagnetic', 'explosive', 'entropic', 'slashing', 'piercing', 'impact', 'phasic'];
			app.charts.push( DrawGenericChart( 
				Object.entries(app.scoresheet.charts.overall_damage_data).filter( x => dmg_types.indexOf(x[0]) >= 0 ).map( x => x[1] ), 
				Object.entries(app.scoresheet.charts.overall_damage_data).filter( x => dmg_types.indexOf(x[0]) >= 0 ).map( x => x[0] ),
				'damageTypesChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
				
			// weapon types
			let weapon_types = ['melee', 'guns', 'cannons', 'ramming', 'explosions'];
			app.charts.push( DrawGenericChart( 
				Object.entries(app.scoresheet.charts.overall_damage_data).filter( x => weapon_types.indexOf(x[0]) >= 0 ).map( x => x[1] ), 
				Object.entries(app.scoresheet.charts.overall_damage_data).filter( x => weapon_types.indexOf(x[0]) >= 0 ).map( x => x[0] ), 
				'weaponTypesChart',
				{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );
				
		}
		
		else if ( pane === 'stealth' ) {
			app.charts.push( DrawStealthChart(app.scoresheet.charts.stealth_chart_data, app.scoresheet.charts.chart_map_labels) );
			app.charts.push( DrawAdvAlertGraph(app.scoresheet.charts.adv_alert_chart_data, app.scoresheet.charts.chart_map_labels) );
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.alertlevel_chart_data,
				app.scoresheet.charts.alertlevel_chart_labels,
				'alertLevelsChart',
				{ sort:false, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'indexed' }
				) );			
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.squads_chart_data,
				app.scoresheet.charts.squads_chart_labels,
				'squadsDispatchedChart',
				{ sort:true, undatafy: true, addpct:false, legend:false, chartType: 'bar', colors:'pie', aspectRatio:3 }
				) );			

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
				app.charts.push( DrawGenericChart( 
					app.scoresheet.charts.bothacks_chart_data,
					app.scoresheet.charts.bothacks_chart_labels,
					'botHacksChart',
					{ sort:true, undatafy: true, addpct:true, legendPos:'left', chartType: 'doughnut', colors:'pie' }
					) );
			}
			app.charts.push( DrawGenericChart( 
				app.scoresheet.charts.hacks_per_machine_chart_data, 
				app.scoresheet.charts.hacks_per_machine_chart_labels,
				'hacksPerMachineChart',
				{ sort:true, undatafy: true, addpct:false, legend:false, chartType: 'bar', colors:'indexed', aspectRatio:3 }
				) );
			if ( app.scoresheet.charts.num_directhacks ) {
				app.charts.push( DrawGenericChart( 
					app.scoresheet.charts.hack_data, 
					app.scoresheet.charts.hack_labels,
					'directHacksChart',
					{ sort:true, undatafy: true, addpct:false, legend:false, chartType: 'bar', colors:app.scoresheet.charts.hack_colors, aspectRatio:2.5 }
					) );
			}
			if ( app.scoresheet.charts.num_uhacks ) {
				app.charts.push( DrawGenericChart( 
					app.scoresheet.charts.uhack_data, 
					app.scoresheet.charts.uhack_labels,
					'unauthorizedHacksChart',
					{ sort:true, undatafy: true, addpct:false, legend:false, chartType: 'bar', colors:app.scoresheet.charts.uhack_colors, aspectRatio:2.5 }
					) );
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
					( app.analysis['stats.hacking.failed']?.chartdata || app.analysis['stats.hacking.totalHacks.failed']?.chartdata),
					app.scoresheet.stats.hacking.failed
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
	
	// millionaire
	if ( data.performance.totalScore > 1000000 ) {
		data.badges.push(['Millionaire','Scored over 1,000,000 points']);
	}
	
	// places of interest
	let regular_places = ['MAT','FAC','RES','ACC','COM'].map( m => map_names[m] || m );
	for ( let x of data.route.entries ) {
		// notable places visited
		let mapname = typeof(x.location.map)=='string' ? x.location.map.replace('MAP_','') : (x.location.map==35 ? 'DSF' : 'Unknown Map');
		let nicename = map_names[mapname] || mapname;
		if ( ['JUN','SCR','MAT','UPP','FAC','LOW','RES','ACC','PRO','MIN','Unknown Map'].indexOf(mapname) === -1 ) {
			data.badges.push([ nicename, 'Found ' + nicename]);
		}
		// farthest regular location
		else if ( regular_places.indexOf(nicename) !== -1 ) {
			data.badges = data.badges.filter( x => regular_places.indexOf(x) === -1 );
			data.badges.push([ nicename, 'Made it to ' + nicename]);
		}
	}

	// history logs snooping
	for ( let map of data.route.entries ) {
		if ( map.historyEvents ) {
			for ( row of map.historyEvents ) { 
				if ( row.event.match(/convoy interrupted/i) ) { data.badges.push(['Yauled','Interrupted a cargo convoy']); }
				else if ( row.event.match(/stolen by Master Thief/i) ) { data.badges.push(['Robbed','Got robbed by a master thief']); }
				else if ( row.event.match(/Stole (three|two) prototypes/i) ) { data.badges.push(['Thief','Stole from Exiles']); }
				else if ( row.event.match(/Assembled infested the area/i) ) { data.badges.push(['Infestation','Encountered assembled infestation in the mines']); }
				else if ( row.event.match(/Assembled emerged from beneath/i) ) { data.badges.push(['Ping','The Assembled came to the rescue']); }
				else if ( row.event.match(/Revealed the true nature of CR-A16/i) ) { data.badges.push(['Stick++','Transformed CR-A16\'s pointy stick']); }
				else if ( row.event.match(/^Warped through subspace/i) ) { 
					if ( row.event.match(/to slip node/i) && map.location.map === 'MAP_ARM' ) {
						data.badges.push(['TeleSkip','Took the Armory magic carpet shortcut']);
					}
					else {		
						data.badges.push(['Teleport','Found a way to teleport through subspace']); 
					}
				}
				else if ( row.event.match(/Opened Warlord's prototype stash/i) ) { data.badges.push(['Stash','Opened Warlord\s stash']); }
				else if ( row.event.match(/Fired Supercharged Sigix Terminator/i) ) { data.badges.push(['SST','Nuked the entire screen']); }
				else if ( row.event.match(/Rescued A7/i) ) { data.badges.push(['A7','Rescued A7']); }
				else if ( row.event.match(/Attacked by the Exiles/i) ) { data.badges.push(['Jerk','Attacked the Exiles']); }
				else if ( row.event.match(/Attacked by Warlord forces/i) ) { data.badges.push(['Traitor','Attacked Warlord']); }
				else if ( row.event.match(/Attacked by Zionites/i) ) { data.badges.push(['Monster','Attacked Zion']); }
				else if ( row.event.match(/Destroyed Zhirov/i) ) { data.badges.push(['-Zh','Destroyed Zhirov']); }
				else if ( row.event.match(/Destroyed Fortress/i) ) { data.badges.push(['-FFF','Destroyed Fortress']); }
				else if ( row.event.match(/Destroyed YI-UF0/i) ) { data.badges.push(['-YI-UF0','Destroyed YI-UF0']); }
				else if ( row.event.match(/Destroyed 8R-AWN/i) ) { data.badges.push(['-8R-AWN','Destroyed 8R-AWN']); }
				else if ( row.event.match(/Destroyed Data Miner/i) ) { data.badges.push(['-DM','Destroyed Data Miner']); }
				else if ( row.event.match(/Destroyed Fake God Mode/i) ) { data.badges.push(['-FGM','Destroyed Fake God Mode']); }
				else if ( row.event.match(/Destroyed God Mode/i) ) { data.badges.push(['-GM','Destroyed God Mode']); }
				else if ( row.event.match(/Destroyed Warlord/i) ) { data.badges.push(['-W','Destroyed Warlord']); }
				else if ( row.event.match(/Destroyed EX-DEC/i) ) { data.badges.push(['-DEC','Destroyed EX-DEC']); }
				else if ( row.event.match(/Destroyed EX-BIN/i) ) { data.badges.push(['-BIN','Destroyed EX-BIN']); }
				else if ( row.event.match(/Destroyed EX-HEX/i) ) { data.badges.push(['-HEX','Destroyed EX-HEX']); }
				else if ( row.event.match(/Integrated with Sigix Exoskeleton/i) ) { data.badges.push(['Exo','Integrated with Sigix Exoskeleton']); }
				else if ( row.event.match(/(Found|Identified) Megatreads/i) ) { data.badges.push(['Megatreads','Wore Megatreads']); }
				else if ( row.event.match(/Sterilization system engaged/i) && map.location.map !== 'MAP_DSF' && map.location.map != 35 ) { // DSF doesnt count!
					data.badges.push(['Sterilized','Activated floor sterilization system']); 
				}
				else if ( row.event.match(/Zion hero teleported in \((.+)\)/i) ) {
					let matches = [ ...row.event.matchAll(/Zion hero teleported in \((.+)\)/gi) ];
					let hero = matches[0][1] || 'Z-Hero';
					data.badges.push([hero,'Hero of Zion came to the rescue']);
					// worth storing for later
					data.stats.allies.zHero = hero;
				}
				else if ( row.event.match(/^(.+) came to (Exiles'|Zion's) defense/i) ) {
					let matches = [ ...row.event.matchAll(/^(.+) came to (Exiles'|Zion's) defense/gi) ];
					let hero = matches[0][1] || 'Z-Hero';
					data.badges.push([hero,'Hero of Zion came to ' + matches[0][2] + ' defense']);
					// not technically an ally, but whatever
					data.stats.allies.zHero = hero; 
				}
			}
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
		
	// final build
	data.badges.push([data.cogmind.finalBuild,'Final build']);
			
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
	if ( data.bonus.metR17AtCetus ) { data.badges.push(['R17','Met Revision17 at Cetus']); }
	if ( data.bonus.readDecryptedArchives ) { data.badges.push(['Decrypted','Decrypted the Archives']); }
	if ( data.bonus.decryptedA0Command ) { data.badges.push(['Decrypted Lab','Decrypted the A0 command']); }
	if ( data.bonus.metR17AtResearch ) { data.badges.push(['R17 Incursion','Had a party in Research with Revision17']); }
	if ( data.bonus.metWarlordAtResearch ) { data.badges.push(['Warlord Raid','Met Warlord in Research']); }
	if ( data.bonus.hackedGodMode ) { data.badges.push(['God Mode','Hacked God Mode']); }
	if ( data.bonus.activateExoskeleton ) { data.badges.push(['ExoWarrior','Activated the Exoskeleton']); }
	if ( data.bonus.deliveredSgemp ) { data.badges.push(['SGEMP','Delivered the SGEMP to Zhirov']); }
	if ( data.bonus.escapedWithSigix ) { data.badges.push(['SpaceBuddy','Escaped with the live Sigix']); }
	if ( data.bonus.escapedWithExosigix ) { data.badges.push(['SpaceBuddy+','Escaped with the upgraded live Sigix']); }
	if ( data.bonus.hackedMainc ) { data.badges.push(['McHacked','Hacked Main.C']); }
	if ( data.bonus.zhirovDestroyedMainc ) { data.badges.push(['Zhirov\'s Revenge','Zhirov destroyed Main.C']); }
	if ( data.bonus.used0b10Conduit ) { data.badges.push(['Conduit','Hacked the 0b10 Conduit']); }
			
	// behemoth killer
	if ( data.stats.kills?.classesDestroyed?.behemoth > 5 ) {
		data.badges.push(['Moth Master','Destroyed 5+ behemoths'])
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
	else if ( data.stats.exploration.diggingLuck < 96 ) {
		data.badges.push(['Unlucky Mole','Less than 96% digging luck']);
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
		

function DrawAdvAlertGraph( data, labels ) {
	datasets = [];
	let counter = 0;
	for ( let k in data ) {
		if ( k == 'sterilized' || k == 'overall' ) { continue; }
		datasets.push( {
			label: k.replace('lowSecurityPercent','lowSecurity').Undatafy(),
			fill: true,
			data: data[k],
			backgroundColor: Chart.colors_by_key[k],
			pointStyle:'rect',		
			order: 2,
		});
	}
	// fake markers for sterilization data
	if ( data['sterilized'].filter( x => x ).length ) { 
		datasets.push( {
			label: 'Sterilized',
			type: 'line',
			data: data['sterilized'],
			pointBorderColor: '#FFF',
			pointBackgroundColor: '#F3F',
			fill: false,
			order: 1,
			borderWidth: 0,
			pointBorderWidth: data['sterilized'].map( x => x ? 2 : 0 ),
			pointRadius: data['sterilized'].map( x => x ? 8 : 0 ),
			pointStyle:'rectRot' // "diamond"
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
					labels: { usePointStyle: true }
				},
				title: {
					display: false,
					text: 'Alert'
				}
			}
		},
	};
	return new Chart( document.getElementById('advAlertChart'), config );
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

function DrawSparkChart( canvasID, data, myval ) {
	if ( !data || data.length <= 1 ) { 
		// console.log("No data for spark chart " + canvasID);
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

function DrawInventoryChart( data, carried_data, labels ) {
	const chartdata = {
		labels: labels,
		datasets: [
			{
				label: 'Inventory Capacity',
				borderWidth: 1,
				fill: true,
				data: data,
				backgroundColor: '#555',
				borderColor: '#555',
				borderWidth: 3,	
				order: 2,
			},
			{
				label: 'Average Carry',
				fill: false,
				tension: 0.2,			
				data: carried_data,		
			}
		]
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
					display: true,
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
				tension: 0.2,
			},
			{
				label: 'Weight',
				fill:false,
				tension: 0.2,
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


function DrawGenericChart( data, labels, elementID, options ) {
	if ( !data || data.length <= 1 || !document.getElementById(elementID) ) { 
		console.log("No data or no canvas: " + elementID);
		return false; 
	}
	
	let bgcolors = Chart.defaults.elements.bar.backgroundColor; //Chart.pie_colors;
	if ( options.colors == 'indexed' ) {
		bgcolors = labels.map( k => Chart.colors_by_key[k] );
	}
	else if ( Array.isArray(options.colors) ) {
		bgcolors = options.colors;
	}
	else if ( options.colors == 'pie' ) {
		bgcolors = Chart.pie_colors
	}
	else if ( options.colors == 'default' ) {
		bgcolors = Chart.defaults.backgroundColor;
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
	
	// if `data` was an array of objects (as opposed to POD), then assume we have multiple series
	// A series can either be an array of POD, or an object with explicit chart.js dataseries properties.
	if ( typeof(data[0]) !== 'object' ) { data = [data]; }
	// if `bgcolors` is an array and we have multiple series, assign one color per series
	let color_counter = 0;
	datasets = data.map( d => ({ 
		data: ('data' in d ? d.data : d ), 
		label: ('label' in d ? d.label : null ), 
		backgroundColor: ( 'color' in d
			? d.color
			: ( (data.length > 1 && bgcolors.length && bgcolors.length > 1) ? bgcolors[color_counter++] : bgcolors)
			),
		borderWidth: (options.chartType == 'line' ? 2 : 0 ),
		fill: ('fill' in d ? (!!d.fill) : true),
		tension: (options.tension || 0),
	}) );
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
	if ( options.stacked || options.stack ) {
		config.options.scales = { x: { stacked: true, }, y: { stacked: true } };
	}
	return new Chart( document.getElementById(elementID), config );
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
	try {
		localStorage.setItem("scoresheet_list",JSON.stringify(list));
		// save file itself
		localStorage.setItem(hash,JSON.stringify(json));
		}
	catch {
		ClearScoresheetList();
	}
}

function ClearScoresheetList() {
	localStorage.clear();
	this.recentlyViewed = GetScoresheetList();
}

}())