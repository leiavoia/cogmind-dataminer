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
// 	display: 'auto',
// 	// formatter: (val, ctx) => {
// 	// 	return ctx.chart.data.labels[ctx.dataIndex];
// 	// },
// 	formatter: (val, ctx) => {
// 		console.log(ctx);
// 		return /* ctx.dataIndex + ': ' +  */ Math.round(val*100) + '%';
// 	}	,
// 	// backgroundColor: function(context) {
// 	// 	return context.dataset.backgroundColor;
// 	// },			
// 	color: '#fff',
// 	backgroundColor: '#00000055',
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
	slashing: 'rgba(214,221,17,1)', 
	slashingWeapon: 'rgba(214,221,17,1)',
	piercing: 'rgba(192,55,196,1)', 
	piercingWeapon: 'rgba(192,55,196,1)',
	impact: 'rgba(240,240,240,1)',
	impactWeapon: 'rgba(240,240,240,1)',
	specialWeapon: '#999',
	specialMeleeWeapon: '#42D484',
	phasic: '#00744a',
	phasicWeapon: '#DD4499',
	entropic: '#ff6ab6', 
	entropicWeapon: '#ff6ab6',
	electromagnetic: 'rgba(59,221,17,1)', 
	explosive: 'rgba(219,41,41,1)', 
	allies: '#73d0ff',
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
		analysis: null, // populates when request for JSON succeeds
		pane: null, // dont set to 'overview' by default. graphs need to be prompted to draw
		ChangePane,
		charts: [],
		error_msg: null,
	}
})

ChangePane('loading');
LoadStatsFromServer();

function LoadStatsFromServer() {

	this.error_msg = null;
	
	// let difficulty = 'DIFFICULTY_ROGUE';
	let difficulty = '';
	// let mode = 'SPECIAL_MODE_NONE';
	let mode = '';
	let version = '';
	// let player = 'aoemica';
	let player = 'leiavoia';
	let winsonly = 0;
	let skipcache = 1;
	let file = `dataminer.php?f=community&winsonly=${winsonly}&mode=${mode}&difficulty=${difficulty}&version=${version}&player=${player}&skipcache=${skipcache}`;
	
	ChangePane('loading');
	
	fetch( file ).then( rsp => {
		if ( !rsp.ok || !rsp.body || String(rsp.status).match(/^(4|5)/) ) {
			ChangePane('input');
			app.error_msg = 'Server statistics not available. Could not lock coordinates for planetary alignment matrix transform, or possibly server is busted.';
			return false;
		}		
		return rsp.json();
	})
	.then( data => {
		if ( data ) { 
			app.stats = data;
			ChangePane('overview');
		}
	})
	.catch(error => {
		app.error_msg = 'Error when trying to get file: ' + error;
		ChangePane('input');
	});
}

function DownloadDataminerDataAnalysis( app ) {
	// TODO: don't re-download if categories are the same as what we have already
	url = window.location.href
		.replace( window.location.search, '' ) 
		.replace( /#.*/, '' ) 
		.replace('.html','')
		+ 'dataminer.php'
		+ `?version=${app.scoresheet.header.version}`
		+ `&difficulty=${app.scoresheet.header.difficulty}`
		+ `&mode=${app.scoresheet.header.specialMode}`
		;
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
				// clean the name up to be more readable
				let name = arr[3].split('.').slice(1);
				if ( name[0].match(/(combat|build|resources|hacking|exploration|intel|machines|traps|bothacking|stealth|alert|allies)/) ) { name.shift(); }
				if ( name[1] && name[1].match('total') ) { name.splice(1,1); } // actions.total
				if ( name[ name.length-1 ].match('overall') ) { name.pop(); }
				name = name.map( _ => _.Undatafy() ).join(': ');
				return {
					name: name,
					value: arr[1],
					diff: arr[8]
				};
			};
			// note: filtering out single-event items that tend to be uninteresting when the average is near zero.
			app.scoresheet.hilites = app.scoresheet.flatstats.filter( i => i[7] > 0 && i[1] > 1 ).sort( (a,b) => b[7] - a[7] ).slice( 0, 19 ).map( mapper );
			app.scoresheet.lowlites = app.scoresheet.flatstats.filter( i => i[7] < 0  ).sort( (a,b) => a[7] - b[7] ).slice( 0, 19 ).map( mapper );
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
		
		if ( pane === 'build' ) {
			let spacesMoved = app.stats.data.spacesMoved.filter( x => x.label != 'stats.exploration.spacesMoved.overall' );
			app.charts.push( DrawGenericPieChart(
				spacesMoved.map( x => x.sum ),
				spacesMoved.map( x => x.label.replace('stats.exploration.spacesMoved.','') ),
				'spacesMovedPieChart',
				{ sort:true, colors: 'indexed', undatafy: true, addpct:true, legendPos:'left' }
				) );
		}
		
		else if ( pane === 'overview' ) {
			app.charts.push( DrawWinLossPieChart( 
				[	app.stats.data.winloss.wins, 
					// app.stats.data.winloss.losses,
					app.stats.data.winloss.access,
					app.stats.data.winloss.research,
					app.stats.data.winloss.factory,
					app.stats.data.winloss.materials,
				], 
				['Wins','Access','Research','Factory','Materials']
				) );
			app.charts.push( DrawWinTypesPieChart( 
				app.stats.data.wintypes.map( x => x.num ),
				app.stats.data.wintypes.map( x => 'W' + x.value )
				) );
			app.charts.push( DrawPlaytimeChart( 
				app.stats.data.runtimesChartData.filter( x => x.minutes < 500 ).map( x => ({x:x.minutes, y:x.num}) ), 
				// app.stats.data.runtimesChartData.map( x => x.num ), 
				// app.stats.data.runtimesChartData.map( x => x.minutes ) 
			) );			
		}
		
		
	});
}


function DrawPlaytimeChart( data ) {

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


function DrawWinLossPieChart( data, labels ) {
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

function DrawGenericPieChart( data, labels, elementID, options ) {
	if ( options.sort ) { 
		Chart.SortPieData(data,labels); 
	}
	let bgcolors = Chart.pie_colors;
	if ( options.colors == 'indexed' ) {
		bgcolors = labels.map( k => Chart.colors_by_key[k] );
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
		// label: '', 
		data, 
		backgroundColor: bgcolors,
		borderWidth: 0,
		fill: true,
	}];
	const config = {
		type: 'doughnut',
		data: { labels, datasets },
		options: {
			// maintainAspectRatio: false,
			aspectRatio: 1.75,
			responsive: true,			
			interaction: {
				intersect: false,
			},					
			plugins: {
				legend: { position: options.legendPos || 'top', display: true, },
				title: { display: false, }
			}
				
		},
	};
	return new Chart( document.getElementById(elementID), config );
}

			
}())