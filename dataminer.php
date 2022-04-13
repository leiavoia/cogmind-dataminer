<?php

set_time_limit(600);

if ( file_exists(__DIR__ . '/.dataminer.env.php') ) { include_once(__DIR__ . '/.dataminer.env.php'); }

if ( !defined('SCORESHEET_DOWNLOAD_DIR') ) { define('SCORESHEET_DOWNLOAD_DIR', __DIR__ . '/scoresheets/tmp'); }
if ( !defined('SCORESHEET_ARCHIVE_DIR') ) { define('SCORESHEET_ARCHIVE_DIR', __DIR__ . '/scoresheets/archive'); } // set to NULL if you dont want to archive
if ( !defined('CACHE_DIR') ) { define('CACHE_DIR', __DIR__ . '/cache'); } // set to NULL if you dont want to cache
if ( !defined('CACHE_TTL') ) { define('CACHE_TTL', 86400); }
if ( !defined('SCRAPE_FETCH_DELAY') ) { define('SCRAPE_FETCH_DELAY', 2); }
if ( !defined('SCORESHEET_LOOKBEHIND_DAYS') ) { define('SCORESHEET_LOOKBEHIND_DAYS', 365); }
if ( !defined('DATAMINER_DB_SERVER') ) { define('DATAMINER_DB_SERVER', "127.0.0.1"); }
if ( !defined('DATAMINER_DB_USERNAME') ) { define('DATAMINER_DB_USERNAME', "root"); }
if ( !defined('DATAMINER_DB_PASSWORD') ) { define('DATAMINER_DB_PASSWORD', "docker"); }
if ( !defined('DATAMINER_DB_DATABASE') ) { define('DATAMINER_DB_DATABASE', "dataminer"); }
if ( !defined('DATAMINER_IP_WHITELIST') ) { define('DATAMINER_IP_WHITELIST', []); }
	
$force_webmode = isset($_REQUEST['force']) && DATAMINER_IP_WHITELIST && in_array($_SERVER['REMOTE_ADDR'],DATAMINER_IP_WHITELIST);

// CLI mode
if ( php_sapi_name() == "cli" || $force_webmode ) {
	$params = getopt( 'spac', [ 'scrape', 'process', 'analyze', 'chart' ] );
	if ( isset($params['s']) || isset($params['scrape']) || isset($_REQUEST['scrape']) ) { ScrapeScoresheets(); }
	if ( isset($params['p']) || isset($params['process']) || isset($_REQUEST['process']) ) { ProcessScoresheets(); }
	if ( isset($params['a']) || isset($params['analyze']) || isset($_REQUEST['analyze']) ) { AnalyzeDB(); }
	if ( isset($params['c']) || isset($params['chart']) || isset($_REQUEST['chart']) ) { CreateChartData(); }
}

// web mode
else {

	$mode = Sanitize( isset($_REQUEST['mode']) ? $_REQUEST['mode'] : null );
	$difficulty = Sanitize( isset($_REQUEST['difficulty']) && $_REQUEST['difficulty'] ? $_REQUEST['difficulty'] : null );
	$version = Sanitize( isset($_REQUEST['version']) && $_REQUEST['version'] ? $_REQUEST['version'] : null );
	$label = Sanitize( isset($_REQUEST['label']) && $_REQUEST['label'] ? $_REQUEST['label'] : null );
	$player = Sanitize( isset($_REQUEST['player']) && $_REQUEST['player'] ? $_REQUEST['player'] : null );
	$num = SanitizeInt( isset($_REQUEST['num']) && $_REQUEST['num'] ? $_REQUEST['num'] : 30 );
	$winsonly = SanitizeInt( isset($_REQUEST['winsonly']) && $_REQUEST['winsonly'] ? 1 : 0 );
	$skipcache = SanitizeInt( isset($_REQUEST['skipcache']) && $_REQUEST['skipcache'] ? 1 : 0 );
	$f = Sanitize( isset($_REQUEST['f']) && $_REQUEST['f'] ? $_REQUEST['f'] : 'stats' );

	$cache_hash = md5( implode(':',[$f,$mode,$difficulty,$version,$label,$player,$winsonly] ) );
	$cache_file = CACHE_DIR . '/' . $cache_hash . '.json';
	$cache_hit = 0;
	
	$json = null;

	// look for a cached file
	if ( !$skipcache ) {
		if ( is_readable($cache_file) && time() - filemtime($cache_file) < CACHE_TTL ) {
			$json = file_get_contents($cache_file);
			$cache_hit = 1;
		}
	}

	if ( !$json ) {
		$hooks = [];
		$records = [];
		$db = DB();
		
		// graph data	
		if ( $f == 'graph' && $label ) {
			$records = GetGraphData( $label, $mode, $difficulty, $version, $player, $winsonly );
		}
		
		// topX data	
		else if ( $f == 'topx' && $label ) {
			$records = GetTopX( $label, $mode, $difficulty, $version, $player, $winsonly, 30 );
		}
		
		// String statistics frequency. Used for things like cause-of-death frequency chart	
		else if ( $f == 'strfreq' && $label ) {
			$records = GetStringCounts( $label, $mode, $difficulty, $version, $player, $winsonly, 30 );
		}
		
		// Community stats - a compilation of many other stats into one big glob
		else if ( $f == 'community' ) {
			$records = GetCommunityStats( $mode, $difficulty, $version, $player, $winsonly, 30 );
		}
		
		// list all stats for future reference	
		else if ( $f == 'list_stats' ) {
			$records = ListAllStats();
		}
		
		// default numerical stats mode
		else {
			$records = GetNumericalStats( $label, $mode, $difficulty, $version, $player, $winsonly, 30 );
		}
		
		// JSON presto!
		AutoCastNumbers( $records );
		$json = json_encode($records, JSON_UNESCAPED_UNICODE /*| JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK*/ );
	}

	// print output
	if ( $json ) {
		header('Content-Type: application/json');
		header('Content-Security-Policy: upgrade-insecure-requests;');
		header("X-XSS-Protection: 1");
		header("Content-Length: " . strlen($json) );
		header("X-Cache: " . ($cache_hit ? 'HIT' : 'MISS') );
		print $json;
	}
	else {
		header('HTTP/1.1 204 No Content');
	}
	ob_flush();

	// cache the result for future queries
	if ( !$cache_hit && CACHE_DIR && $json ) {
		file_put_contents( $cache_file, $json );	
	}

}



// ================== MAIN FUNCTIONS =========================

function ScrapeScoresheets() {
	PrintWithTS("Scanning for new scoresheets.");
	$urls = GetURLs();
	foreach ( $urls as $url ) { ScrapeURL($url); }
	PrintWithTS("Done scraping.");
}


function ProcessScoresheets() {
	PrintWithTS('Starting scoresheet processing.');
	// Scan files ------------\/-----------------------------------
	$counter = 0;
	$num_scanned = 0;
	$files = glob(SCORESHEET_DOWNLOAD_DIR . '/*.json');
	PrintWithTS(count($files) . ' files to process.');
	foreach ( $files as $file ) {
		print $counter++ . ": $file";
		$str = file_get_contents($file);
		$json = json_decode($str);
		// remove extraneous info to save space
		if ( $json->header->specialMode != 'SPECIAL_MODE_PLAYER2' ) { unset($json->stats->player2); }
		if ( $json->header->specialMode != 'SPECIAL_MODE_RPGLIKE' ) { unset($json->stats->rpglike); }
		unset($json->lastMessages);
		unset($json->map);
		unset($json->route);
		// flatten it into database friendly keys
		$data = FlattenData($json);
		$hash = basename($file,'.json');
		if ( AddRun( $hash, $data ) ) { 
			$num_scanned++; 
			print " [ADDED]\n";
		}
		else {
			print " [SKIPPED]\n";
		}
		// archive the file
		if ( SCORESHEET_ARCHIVE_DIR ) {
			$fileto = SCORESHEET_ARCHIVE_DIR . '/' . basename($file);
			if ( file_exists($fileto) ) { unlink( $file ); }
			else { rename( $file, $fileto ); }
		}
	}
	PrintWithTS("$counter files scanned, $num_scanned runs added");
}


	
function AnalyzeDB() { 

	// set these if you want to limit recalculation to a subset
	// $version = 'Beta 10.2';
	// $difficulty = 'DIFFICULTY_ROGUE';
	// $mode = 'SPECIAL_MODE_NONE';
	// $label = 'stats.exploration.spacesMoved.averageSpeed';
	$version = '';
	$difficulty = '';
	$mode = '';
	$label = '';
	$sigmas = 3; // moved to DB
	$db = DB();

	// print PrintTS() . "Analyzing numeric stats...\n";
	// $result = $db->query("CALL AnalyzeNumericStats();");
	// DBCheckForErrors( $result, $db );

	// print PrintTS() . "Creating sparkchart data\n";
	// $result = $db->query("CALL CreateChartData();");
	// DBCheckForErrors( $result, $db );

	PrintWithTS("Starting DB analysis");

	$result = $db->query("START TRANSACTION;");
	DBCheckForErrors( $result, $db );

	// cleanup 
	if ( $version || $difficulty || $mode ) {
		$result = $db->query("
			DELETE FROM analysis where 1=1
			" . ( $version ? ("AND analysis.version = '" . addslashes($version) . "'") : null ) . "
			" . ( $difficulty ? ("AND analysis.difficulty = '" . addslashes($difficulty) . "'") : null ) . "
			" . ( $mode ? ("AND analysis.mode = '" . addslashes($mode) . "'") : null ) . "
			" . ( $label ? ("AND analysis.stat_id = CRC32('" . addslashes($label) . "')") : null ) . "	
			;");
		
	}
	else { // nukemall
		$result = $db->query(" TRUNCATE analysis; ");
		
	}

	// reanalyze
	$result = $db->query("
		INSERT INTO analysis
		SELECT
			runstats.stat_id,
			runs.version,
			runs.difficulty,
			runs.mode,
			COUNT( runstats.value ) as `samples`,
			COUNT( DISTINCT runstats.value ) as `uniq`,
			MIN( CAST(runstats.value as DECIMAL(24,5)) ) as `min`,
			MAX( CAST(runstats.value as DECIMAL(24,5)) ) as `max`,
			ROUND( AVG( CAST(runstats.value as DECIMAL(24,5)) ), 3) as `avg`,
			ROUND( STD( CAST(runstats.value as DECIMAL(24,5)) ), 3) as `std`,
			0,
			0,
			0,
			0,
			0,
			NULL as chartdata
		FROM
			runs,
			runstats,
			stats
		WHERE runstats.stat_id = stats.id
			AND runstats.run_id = runs.id
			AND stats.type IN ('float','integer')
			" . ( $version ? ("AND runs.version = '" . addslashes($version) . "'") : null ) . "
			" . ( $difficulty ? ("AND runs.difficulty = '" . addslashes($difficulty) . "'") : null ) . "
			" . ( $mode ? ("AND runs.mode = '" . addslashes($mode) . "'") : null ) . "
			" . ( $label ? ("AND stats.id = CRC32('" . addslashes($label) . "')") : null ) . "
		GROUP BY
			stats.id,
			runs.version,
			runs.difficulty,
			runs.mode
--		ORDER BY
--			stats.label,
--			runs.version,
--			runs.difficulty,
--			runs.mode
		;");
	DBCheckForErrors( $result, $db );

	PrintWithTS("Doing secondary-analysis ...");
	$result = $db->query("
		UPDATE analysis
		SET 
			stdmax = IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`),
			stdmin = IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`),
			stdrange = IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`) - IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`),
			-- segments = IF( LEAST( uniq, 20 ) > 0 AND seglen < 1, 1, FLOOR(LEAST( uniq, 20 )) ),
			segments = LEAST( uniq, 20 ),
			seglen = (IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`) - IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`))
				/ LEAST( uniq, 20 )
			;
		");
	DBCheckForErrors( $result, $db );
	
	$result = $db->query("
		UPDATE analysis, stats
		-- SET seglen = IF( seglen < 1, 1, IF( stdrange < 20, 1, ROUND(seglen) ) ),  
		--	-- IF( LEAST( GREATEST(stdrange,uniq), 20 ) > 0 AND seglen < 1, 1, FLOOR(LEAST( GREATEST(stdrange,uniq), 20 )) ),
		--	segments = IF( seglen < 1, LEAST( GREATEST(stdrange,uniq), 20 ), segments )
		SET stdmax = IF( max <= 20, max, stdmax ),
			stdrange = (IF( max <= 20, max, IF( max > `avg` + std*3, `avg` + std*3, max)) - IF( `min` < `avg` + std*-3, `avg` + std*-3, `min`)),
			-- segments = IF( seglen < 1, LEAST( GREATEST(stdrange,uniq), 20 ), segments ),
			-- expands to: 
			segments = IF( IF( seglen < 1, LEAST( GREATEST(stdrange,uniq)+1, 20 ), segments ) < 20 AND IF( seglen < 1, 1, IF( stdrange < 20, 1, ROUND(seglen) ) ) = 1, LEAST( GREATEST(stdrange,uniq), 20 ), IF( seglen < 1, LEAST( GREATEST(stdrange,uniq)+1, 20 ), segments ) ),
			seglen = IF( seglen < 1, 1, IF( stdrange < 20, 1, ROUND(seglen) ) )
		WHERE analysis.stat_id = stats.id
		AND stats.type = 'integer'
		");
	DBCheckForErrors( $result, $db );
	
	$result = $db->query("COMMIT;");
	
	// manual fix for `stats.intel.robotAnalysisTotal` which has 
	// an extreme endpoint when players access Data Conduit
	$result = $db->query("
		UPDATE analysis
		SET seglen = 1, segments = LEAST(max,20)
		WHERE stat_id = 2757541041
		");
			
	PrintWithTS("Analysis finished.");
}

function CreateChartData() {
	// set these if you want to limit recalculation to a subset
	// $version = 'Beta 10.2';
	// $difficulty = 'DIFFICULTY_ROGUE';
	// $mode = 'SPECIAL_MODE_NONE';
	// $label = 'stats.exploration.spacesMoved.averageSpeed';
	$version = '';
	$difficulty = '';
	$mode = '';
	$label = '';
	$min_samples = 1; // moved to DB
	$db = DB();

	// // -------------- SEGMENTS -----------------------------
	
	PrintWithTS("Segmenting numerical stats ...");

	// set up temporary counting table
	// $db->query("FLUSH TABLES WITH READ LOCK;");
	$result = $db->query("CREATE TEMPORARY TABLE nums (n int);");
	
	$result = $db->query("INSERT INTO nums VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);");
	

	$result = $db->query("START TRANSACTION;");
	DBCheckForErrors( $result, $db );

	$result = $db->query("
		CREATE TEMPORARY TABLE segments
		SELECT
			sub.stat_id, 
			sub.version, 
			sub.difficulty, 
			sub.mode,
			sub.segment,
			COUNT( sub.segment ) as num
		FROM (
			SELECT
				analysis.stat_id, 
				analysis.version, 
				analysis.difficulty, 
				analysis.mode,						
				FLOOR( (CAST( runstats.value as DECIMAL(24,5) ) - analysis.stdmin) / IF(analysis.seglen,analysis.seglen,1) ) as segment,
				CAST( runstats.value as DECIMAL(24,5) ) as value
			FROM runstats, analysis, runs, stats
			WHERE runs.id = runstats.run_id
				AND CAST(runstats.value as DECIMAL(24,5)) BETWEEN analysis.stdmin AND analysis.stdmax
				AND analysis.stat_id = runstats.stat_id
				AND analysis.version = runs.version
				AND analysis.difficulty = runs.difficulty
				AND analysis.mode = runs.mode
				AND analysis.stat_id = stats.id
				AND stats.type IN ('float','integer')
				" . ( $version ? ("AND analysis.version = '" . addslashes($version) . "'") : null ) . "
				" . ( $difficulty ? ("AND analysis.difficulty = '" . addslashes($difficulty) . "'") : null ) . "
				" . ( $mode ? ("AND analysis.mode = '" . addslashes($mode) . "'") : null ) . "
				" . ( $label ? ("AND stats.id = CRC32('" . addslashes($label) . "')") : null ) . "
		) as sub
		GROUP BY sub.stat_id, sub.version, sub.difficulty, sub.mode, sub.segment;
	");
	DBCheckForErrors( $result, $db );
	
	$result = $db->query("COMMIT;");
	
	
	// // -------------- SPARKLINE GRAPH DATA -----------------------------

	$result = $db->query("ALTER TABLE segments ADD PRIMARY KEY pkey (stat_id, version, difficulty, mode, segment);");
	DBCheckForErrors( $result, $db );
	
	PrintWithTS("Now creating sparkline graph data...");
	$result = $db->query("
		SELECT
			analysis.stat_id,
			stats.label,
			analysis.version,
			analysis.difficulty,
			analysis.mode,
			analysis.seglen,
			analysis.segments,
			analysis.stdmin,
			-- analysis.max,
			stats.type
		FROM stats, analysis
		WHERE analysis.stat_id = stats.id
		AND stats.type IN ('float','integer')
		AND analysis.samples >= $min_samples
		" . ( $version ? ("AND analysis.version = '" . addslashes($version) . "'") : null ) . "
		" . ( $difficulty ? ("AND analysis.difficulty = '" . addslashes($difficulty) . "'") : null ) . "
		" . ( $mode ? ("AND analysis.mode = '" . addslashes($mode) . "'") : null ) . "
		" . ( $label ? ("AND stats.id = CRC32('" . addslashes($label) . "')") : null ) . "
		;");
	$records = [];
	while ( $row = $result->fetch_assoc() ) {
		$records []= $row;
	}
	
	// create sparkline chart data for... all of them!
	$record_count = 0;
	$total = count($records);
	$result = $db->query("START TRANSACTION;");
	foreach ( $records as $record ) {
		// print "(" . ++$record_count .  "/$total): {$record['label']} {$record['version']} {$record['difficulty']} {$record['mode']} \n";
		$result = $db->query("
			UPDATE analysis
			SET chartdata = (
				SELECT CONCAT('[', GROUP_CONCAT( CONCAT('[',sub3.val,',',sub3.num,']') ), ']') as chartdata
				FROM (
					SELECT nums.n as segment, ROUND({$record['stdmin']} + (nums.n * {$record['seglen']}), 3) as val, COALESCE(segments.num, 0) as num 
					FROM nums LEFT OUTER JOIN segments
					ON nums.n = segments.segment
					AND segments.stat_id = {$record['stat_id']}
					AND segments.version = '{$record['version']}'
					AND segments.difficulty = '{$record['difficulty']}'
					AND segments.mode = '{$record['mode']}'
					WHERE nums.n < {$record['segments']}
					ORDER BY nums.n
				) as sub3
			)
			WHERE analysis.stat_id = {$record['stat_id']}
			AND analysis.version = '{$record['version']}'
			AND analysis.difficulty = '{$record['difficulty']}'
			AND analysis.mode = '{$record['mode']}'
			;");
		DBCheckForErrors( $result, $db );
	}
	$db->query("COMMIT;");
	PrintWithTS("Charting finished.");
}




// ================== UTILITY FUNCTIONS =========================

		
// graph data	
function GetGraphData( $label, $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	$records = [];
	$db = DB();
	$q = "SELECT runstats.value 
		FROM runstats, runs
		WHERE runstats.run_id = runs.id
		AND runstats.stat_id = CRC32('" . addslashes($label) . "') "
		. implode(' ', $hooks)
		; // . ' ORDER BY runstats.value ASC';
	$result = $db->query($q);
	if ( $result->num_rows ) {
		while( $row = $result->fetch_row() ) {
			$records []= $row[0];
		}
		sort($records);
	}
	return $records;
}

// topX data	
function GetTopX( $label, $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false, $num=30 ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	// if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1 "; }
	$sort = 'DESC';
	$limit = $num ? " LIMIT $num " : NULL ;
	$hooks = implode(' ', $hooks);
	$records = [];
	$db = DB();
	$q = "
		SELECT 
			runstats.value as value, 
			runs.filehash, 
			runs.player_name, 
			runs.version, 
			runs.mode, 
			runs.difficulty 
		FROM runstats, runs 
		WHERE runstats.run_id = runs.id
			AND runstats.stat_id = CRC32('" . addslashes($label) . "') 
			$hooks
		ORDER BY CAST(runstats.value as DECIMAL(24,5)) $sort
		$limit
		";
		// print $q; exit;
	$result = $db->query($q);
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
		// sort($records);
	}
	return $records;
}

// String statistics frequency. Used for things like cause-of-death frequency chart	
function GetStringCounts( $label, $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false, $num=30 ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	$sort = 'DESC';
	$limit = $num ? " LIMIT $num " : NULL ;
	$hooks = implode(' ', $hooks);
	$records = [];
	$db = DB();
	$q = "
		SELECT 
			runstats.value as value,
			COUNT(runstats.value) as num
		FROM runstats, runs 
		WHERE runstats.run_id = runs.id
			AND runstats.stat_id = CRC32('" . addslashes($label) . "')
			$hooks
		GROUP BY runstats.value
		ORDER BY num $sort
		$limit
		";
		// print $q; exit;
	$result = $db->query($q);
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
		// sort($records);
	}
	return $records;
}

function GetRunTimesGraphData( $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	$hooks = implode(' ', $hooks);
	$records = [];
	$db = DB();
	$q = "
		SELECT
			ROUND( TIME_TO_SEC(runstats.value) / 60 ) as minutes,
			COUNT( ROUND( TIME_TO_SEC(runstats.value) / 60 ) ) as num
		FROM runstats, runs 
		WHERE runstats.run_id = runs.id
			AND runstats.stat_id = CRC32('game.runTime')
			$hooks
		GROUP BY ROUND( TIME_TO_SEC(runstats.value) / 60 )
		ORDER BY minutes ASC
		";
	$result = $db->query($q);
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}

function GetWinLoss( $mode=null, $difficulty=null, $version=null, $player=null ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " runs.player_name = '" . addslashes($player) . "' "; }
	$hooks = $hooks ? (' WHERE ' . implode(' AND ', $hooks) ) : NULL;
	$records = [];
	$db = DB();
	$q = "
		SELECT 
			COUNT(runs.id) as total,
			SUM(runs.win) as wins,
			COUNT(runs.id) - SUM(runs.win) as losses,
			SUM( IF(runs.win = 0 AND runs.final_depth < -7, 1, 0) ) as materials,
			SUM( IF(runs.win = 0 AND runs.final_depth >= -7 AND runs.final_depth < -3, 1, 0) ) as factory,
			SUM( IF(runs.win = 0 AND runs.final_depth >= -3 AND runs.final_depth < -1, 1, 0) ) as research,
			SUM( IF(runs.win = 0 AND runs.final_depth >= -1, 1, 0) ) access
		FROM runs 
		$hooks
		";
	$result = $db->query($q);
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records[0];
}

// function GetWinTypes( $mode=null, $difficulty=null, $version=null, $player=null ) {
// 	if ( $mode ) { $hooks []= " runs.mode = '" . addslashes($mode) . "' "; }
// 	if ( $difficulty ) { $hooks []= " runs.difficulty = '" . addslashes($difficulty) . "' "; }
// 	if ( $version ) { $hooks []= " runs.version = '" . addslashes($version) . "' "; }
// 	if ( $player ) { $hooks []= " runs.player = '" . addslashes($player) . "' "; }
// 	$hooks []= 'runs.win = 1';
// 	$hooks = $hooks ? (' WHERE ' . implode(' AND ', $hooks) ) : NULL;
// 	$records = [];
// 	$db = DB();
// 	$q = "
// 		SELECT 
// 			runs.final_map as wintype,
// 			COUNT( runs.final_map ) as num
// 		FROM runs 
// 		$hooks
// 		GROUP BY runs.final_map
// 		";
// 	$result = $db->query($q);
// 	if ( $result->num_rows ) {
// 		while( $row = $result->fetch_assoc() ) {
// 			$records []= $row;
// 		}
// 	}
// 	return $records;
// }

function GetNumericalStats( $label=null, $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND analysis.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND analysis.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND analysis.version = '" . addslashes($version) . "' "; }
	if ( $label ) { $hooks []= " AND stats.label = '" . addslashes($label) . "' "; }
	if ( $player ) { $hooks []= " AND analysis.player = '" . addslashes($player) . "' "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	$records = [];
	$db = DB();
	$q = "SELECT 
			stats.label, 
			analysis.version, 
			analysis.difficulty, 
			analysis.mode, 
			analysis.samples, 
			analysis.uniq, 
			analysis.min, 
			analysis.max, 
			analysis.avg, 
			analysis.std, 
			analysis.chartdata 
		FROM stats, analysis
		WHERE stats.id = analysis.stat_id
		" . implode(' ', $hooks);
	$result = $db->query($q);
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$row['chartdata'] = json_decode($row['chartdata'],true); // JSON stored as string in DB
			// set the label as the key if we won't have multiple entries
			if ( $difficulty && $version && $mode ) {
				$k = $row['label'];
				unset($row['label']);
				unset($row['difficulty']);
				unset($row['mode']);
				unset($row['version']);
				$records[$k] = $row;
			}
			// otherwise leave it the way it is
			else {
				$records []= $row;
			}
		}
	}
	return $records;
}

function GetOnTheFlyNumericalStats( $label=null, $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $label ) { 
		if ( is_array($label) ) {
			$labels = array_map( function($x){ return sprintf('%u', crc32($x)); }, $label ); // mysql compatible CRC32
			$hooks []= " AND runstats.stat_id IN (" . implode(',',$labels) . ") ";
		}	
		else if ( strpos($label,'%') !== false ) {
			$hooks []= " AND stats.label LIKE '" . addslashes($label) . "' ";
		}
		else {
			$hooks []= " AND runstats.stat_id = CRC32('" . addslashes($label) . "')";
		}
	}
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	
	$records = [];
	$db = DB();
	$q = "
		SELECT
			stats.label,
			runstats.stat_id,
			SUM( runstats.value ) as `sum` -- ,
			-- COUNT( runstats.value ) as `samples`,
			-- COUNT( DISTINCT runstats.value ) as `uniq`,
			-- MIN( CAST(runstats.value as DECIMAL(24,5)) ) as `min`,
			-- MAX( CAST(runstats.value as DECIMAL(24,5)) ) as `max`,
			-- ROUND( AVG( CAST(runstats.value as DECIMAL(24,5)) ), 3) as `avg`,
			-- ROUND( STD( CAST(runstats.value as DECIMAL(24,5)) ), 3) as `std`
		FROM runs, runstats, stats
		WHERE runstats.stat_id = stats.id
			AND runstats.run_id = runs.id
			AND stats.type IN ('float','integer')
			" . implode(' ', $hooks) . "
		GROUP BY runstats.stat_id;
		"; 
	$result = $db->query($q);
	if ( $result && $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}

function GetRunsByPlayer( $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	
	$records = [];
	$db = DB();
	$q = "
		SELECT
			*
		FROM runs
		WHERE 1=1
			" . implode(' ', $hooks) . "
		ORDER BY date ASC
		;
		"; 
	$result = $db->query($q);
	if ( $result && $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}

function CountRuns( $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	
	$db = DB();
	$q = " SELECT COUNT(*) as num FROM runs WHERE 1=1 " . implode(' ', $hooks) . " ;"; 
	$result = $db->query($q);
	if ( $result && $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			return $row['num'];
		}
	}
	return 0;
}

function GamesPlayedByDay( $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false ) {
	$hooks = [];
	if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
	if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
	if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
	if ( $player ) { $hooks []= " AND runs.player_id = (SELECT player_id FROM runs WHERE player_name = '" . addslashes($player) . "' LIMIT 1) "; }
	if ( $winsonly ) { $hooks []= " AND runs.win = 1"; }
	
	$records = [];
	$db = DB();
	$q = "
		SELECT COUNT(runs.id) as num, DATE(runs.date) as date
		FROM runs 
		WHERE 1=1 " . implode(' ', $hooks) . " 
		GROUP BY DATE(runs.date)
		ORDER BY DATE(runs.date)
		;"; 
	$result = $db->query($q);
	if ( $result && $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}

// list all stats for future reference
function ListAllStats() {
	$db = DB();
	$q = "SELECT * FROM stats ORDER BY label;";
	$result = $db->query($q);
	$records = [];
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}

function ListAllModes() {
	$db = DB();
	$q = "SELECT DISTINCT mode FROM runs ORDER BY mode;";
	$result = $db->query($q);
	$records = [];
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}

// Players can have multiple label identities, so group by player ID instead
function ListAllPlayers() {
	$db = DB();
	$q = "
		SELECT -- IF( player_id = 209397991, 'GJ', player_name) as name, id
			DISTINCT 
			player_name, player_id
		FROM runs 
		-- GROUP BY player_id
		ORDER BY player_name ASC;
		";
	$result = $db->query($q);
	$records = [];
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records[ $row['player_id'] ] = $row; // remove duplicates with different names, i.e. GJ
		}
	}
	// GJ hack
	$records[209397991] = ['player_name'=>'GJ', 'player_id'=>209397991];
	return array_values($records);
}

function ListAllVersions() {
	$db = DB();
	$q = "SELECT DISTINCT version FROM runs ORDER BY version DESC;";
	$result = $db->query($q);
	$records = [];
	if ( $result->num_rows ) {
		while( $row = $result->fetch_assoc() ) {
			$records []= $row;
		}
	}
	return $records;
}
		
function GetCommunityStats( $mode=null, $difficulty=null, $version=null, $player=null, $winsonly=false, $num=30 ) {
	$data = [
		'request' => [
			'mode' => $mode,
			'difficulty' => $difficulty,
			'version' => $version,
			'player' => $player,
			'winsonly' => $winsonly,
			'limit' => $num,
		],
		'data' => [
			'stat_labels' => ListAllStats(),
			'difficulties' => ['DIFFICULTY_ROGUE', 'DIFFICULTY_ADVENTURER', 'DIFFICULTY_EXPLORER'],
			'versions' => ListAllVersions(),
			'players' => ListAllPlayers(),
			'modes' => ListAllModes(),
			
			'num_runs' => CountRuns( $mode, $difficulty, $version, $player, $winsonly ),
			
			'wintypes' => GetStringCounts('game.winType', $mode, $difficulty, $version, $player, true ),
			'winloss' => GetWinLoss( $mode, $difficulty, $version, $player ),
			'highscores' => GetTopX( 'performance.totalScore', $mode, $difficulty, $version, $player, $winsonly, $num ),
			'runtimesChartData' => GetRunTimesGraphData( $mode, $difficulty, $version, $player, $winsonly ),
			'causeOfDeath' => GetStringCounts('header.causeOfDeath', $mode, $difficulty, $version, $player, false, $num ),
			'itemOfDeath' => GetStringCounts('header.itemOfDeath', $mode, $difficulty, $version, $player, false, $num ),
			'favorites.power.overall' => GetStringCounts('favorites.power.overall', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.power.engine' => GetStringCounts('favorites.power.engine', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.power.powerCore' => GetStringCounts('favorites.power.powerCore', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.power.reactor' => GetStringCounts('favorites.power.reactor', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.propulsion.overall' => GetStringCounts('favorites.propulsion.overall', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.propulsion.treads' => GetStringCounts('favorites.propulsion.treads', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.propulsion.leg' => GetStringCounts('favorites.propulsion.leg', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.propulsion.wheel' => GetStringCounts('favorites.propulsion.wheel', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.propulsion.hoverUnit' => GetStringCounts('favorites.propulsion.hoverUnit', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.propulsion.flightUnit' => GetStringCounts('favorites.propulsion.flightUnit', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.overall' => GetStringCounts('favorites.utility.overall', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.device' => GetStringCounts('favorites.utility.device', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.storage' => GetStringCounts('favorites.utility.storage', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.processor' => GetStringCounts('favorites.utility.processor', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.hackware' => GetStringCounts('favorites.utility.hackware', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.protection' => GetStringCounts('favorites.utility.protection', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.utility.artifact' => GetStringCounts('favorites.utility.artifact', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.overall' => GetStringCounts('favorites.weapon.overall', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.energyGun' => GetStringCounts('favorites.weapon.energyGun', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.energyCannon' => GetStringCounts('favorites.weapon.energyCannon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.ballisticGun' => GetStringCounts('favorites.weapon.ballisticGun', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.ballisticCannon' => GetStringCounts('favorites.weapon.ballisticCannon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.launcher' => GetStringCounts('favorites.weapon.launcher', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.specialWeapon' => GetStringCounts('favorites.weapon.specialWeapon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.impactWeapon' => GetStringCounts('favorites.weapon.impactWeapon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.slashingWeapon' => GetStringCounts('favorites.weapon.slashingWeapon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.piercingWeapon' => GetStringCounts('favorites.weapon.piercingWeapon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			'favorites.weapon.specialMeleeWeapon' => GetStringCounts('favorites.weapon.specialMeleeWeapon', $mode, $difficulty, $version, $player, $winsonly, 10 ),
			
			'machinesAccessed' => GetOnTheFlyNumericalStats( 'stats.hacking.machinesAccessed.%', $mode, $difficulty, $version, $player, $winsonly ),
			'terminalHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.terminalHacks.%', $mode, $difficulty, $version, $player, $winsonly ),
			'fabricatorHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.fabricatorHacks.%', $mode, $difficulty, $version, $player, $winsonly ),
			'repairStationHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.repairStationHacks.%', $mode, $difficulty, $version, $player, $winsonly ),
			'recyclingUnitHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.recyclingUnitHacks.%', $mode, $difficulty, $version, $player, $winsonly ),
			'scanalyzerHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.scanalyzer%', $mode, $difficulty, $version, $player, $winsonly ),
			'garrisonAccessHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.garrisonAccessHacks.%', $mode, $difficulty, $version, $player, $winsonly ),
			'unauthorizedHacks' => GetOnTheFlyNumericalStats( 'stats.hacking.unauthorizedHacks.%', $mode, $difficulty, $version, $player, $winsonly ),
			
			'classesDestroyed' => GetOnTheFlyNumericalStats( 'stats.kills.classesDestroyed.%', $mode, $difficulty, $version, $player, $winsonly ),
			
			'alertLevels' => GetOnTheFlyNumericalStats( 'stats.alert.maximumAlertLevel.%', $mode, $difficulty, $version, $player, $winsonly ),
			
			'squadsDispatched' => GetOnTheFlyNumericalStats( 'stats.alert.squadsDispatched.%', $mode, $difficulty, $version, $player, $winsonly ),
			
			'bothacks' => GetOnTheFlyNumericalStats( 'stats.bothacking.robotHacksApplied.%', $mode, $difficulty, $version, $player, $winsonly ),
			'robotsHacked' => GetOnTheFlyNumericalStats( 'stats.bothacking.robotsHacked.%', $mode, $difficulty, $version, $player, $winsonly ),
					
				
			'machinesHacked' => GetOnTheFlyNumericalStats( [
				'stats.hacking.totalHacks.fabricators',
				'stats.hacking.totalHacks.repairStations',
				'stats.hacking.totalHacks.scanalyzers',
				'stats.hacking.totalHacks.recyclingUnits',
				'stats.hacking.totalHacks.terminals',
				'stats.hacking.totalHacks.garrisonAccess',
				], $mode, $difficulty, $version, $player, $winsonly ),
			
			'spacesMoved' => GetOnTheFlyNumericalStats( [
				'stats.exploration.spacesMoved.treads',
				'stats.exploration.spacesMoved.legs',
				'stats.exploration.spacesMoved.wheels',
				'stats.exploration.spacesMoved.hover',
				'stats.exploration.spacesMoved.flight',
				'stats.exploration.spacesMoved.core',
				'stats.exploration.spacesMoved.overall',
				], $mode, $difficulty, $version, $player, $winsonly ),
			
			'attacksByWeaponType' => GetOnTheFlyNumericalStats( [
				'stats.combat.shotsFired.gun',
				'stats.combat.shotsFired.cannon',
				'stats.combat.shotsFired.launcher',
				'stats.combat.shotsFired.special',
				'stats.combat.meleeAttacks.overall',
				], $mode, $difficulty, $version, $player, $winsonly ),
				
			'attacksByDamageType' => GetOnTheFlyNumericalStats( [
				'stats.combat.shotsFired.phasic',
				'stats.combat.shotsFired.kinetic',
				'stats.combat.shotsFired.entropic',
				'stats.combat.shotsFired.thermal',
				'stats.combat.shotsFired.electromagnetic',
				'stats.combat.shotsFired.explosive',
				// 'stats.combat.shotsFired.slashing', // Runia's throwing claymores technically a slashing type
				'stats.combat.meleeAttacks.slashing',
				'stats.combat.meleeAttacks.piercing',
				'stats.combat.meleeAttacks.impact',
				], $mode, $difficulty, $version, $player, $winsonly ),
			
			'damageByWeaponType' => GetOnTheFlyNumericalStats( [
				'stats.combat.damageInflicted.guns',
				'stats.combat.damageInflicted.cannons',
				'stats.combat.damageInflicted.explosions',
				'stats.combat.damageInflicted.melee',
				'stats.combat.damageInflicted.ramming',
				], $mode, $difficulty, $version, $player, $winsonly ),
				
			'damageByDamageType' => GetOnTheFlyNumericalStats( [
				'stats.combat.damageInflicted.phasic',
				'stats.combat.damageInflicted.kinetic',
				'stats.combat.damageInflicted.entropic',
				'stats.combat.damageInflicted.thermal',
				'stats.combat.damageInflicted.electromagnetic',
				'stats.combat.damageInflicted.explosive',
				'stats.combat.damageInflicted.slashing',
				'stats.combat.damageInflicted.piercing',
				'stats.combat.damageInflicted.impact',
				], $mode, $difficulty, $version, $player, $winsonly ),

		]
	];
	
	// play time averages
	$playtime_total_minutes = 0;
	$playtime_total_runs = 0;
	foreach ( $data['data']['runtimesChartData'] as $r ) {
		$playtime_total_minutes += $r['minutes'] * $r['num'];
		$playtime_total_runs += $r['num'];
	}
	$data['data']['runtimeAvg'] = $playtime_total_runs ? round( $playtime_total_minutes / $playtime_total_runs ) : 0;
	
	// special runs list if you ask for a specific player
	if ( $player ) {
		$data['data']['playerRuns'] = GetRunsByPlayer( $mode, $difficulty, $version, $player, $winsonly );
	}
	// otherwise you get runs-per-day
	else {
		$data['data']['runsByDay'] = GamesPlayedByDay( $mode, $difficulty, $version, $player, $winsonly );
	}
	
	return $data;
}
		
function AddRun( $hash, $data ) {
	static $known_stats = []; // caches results when running large batches
	$db = DB();
	
	// check for duplicates
	$result = $db->query("SELECT 1 FROM runs WHERE filehash = '" . addslashes($hash) . "' LIMIT 1;");
	if ( $result && $result->num_rows ) { return false; }
	
	// don't add runs that didn't make it our of scrapyard. Messes up averages.
	if ( $data['cogmind.location.depth'] == '-11' ) { return false; }
	
	$result = $db->query("START TRANSACTION;");
	DBCheckForErrors( $result, $db );
	
	// add run
	$date = preg_replace('/(\d\d)(\d\d)(\d\d)/','20$1-$2-$3',$data['header.runEndDate'])
		. preg_replace('/(\d\d)(\d\d)(\d\d)/',' $1:$2:$3',$data['header.runEndTime']);

	$map = str_replace('MAP_','',$data['cogmind.location.map']);
	$map = $map == 32 ? 'DSF' : $map;
	$map = $map == 1007 ? 'AC0' : $map;
	$map = is_numeric($map)  ? '???' : $map;
	$result = $db->query("INSERT INTO runs SET
		id = {$data['meta.runId']},
		uuid = '" . addslashes($data['meta.runGuid']) . "',
		filehash = '" . addslashes($hash) . "',
		player_name = '" . addslashes($data['header.playerName']) . "',
		player_id = '" . addslashes($data['meta.playerId']) . "',
		score = '" . addslashes( max(0,$data['performance.totalScore']) ) . "',
		result = '" . addslashes($data['header.runResult']) . "',
		final_depth = " . $data['cogmind.location.depth'] . ",
		final_map = '" . addslashes($map) . "',
		tags = '', -- TODO
		version = '" . addslashes($data['header.version']) . "',
		win = " . ($data['game.winType'] > -1 ? 1 : 0) . ",
		date = '" . addslashes($date) . "',
		mode = '" . addslashes($data['header.specialMode']) . "',
		difficulty = '" . addslashes($data['header.difficulty']) . "'
	;"); 
	if ( strpos($db->error,'Duplicate entry') !== false ) { return false; }
	DBCheckForErrors( $result, $db );
	
	// precompute some stuff:
	
	// digging luck
	$data['stats.exploration.diggingLuck'] = max( 0, 100 * ( 1 - ( $data['stats.exploration.spacesMoved.caveInsTriggered'] 
		/ UseIfElse( $data['stats.exploration.spacesDug'], 1 ) ) ) );
	if ( $data['stats.exploration.diggingLuck'] <= 0 ) { unset($data['stats.exploration.diggingLuck']); }
	
	// collateral dmg pct
	$data['stats.combat.collateralDamagePct'] = 100 * $data['performance.valueDestroyed.count'] 
		/ UseIfElse( $data['stats.combat.damageInflicted.overall'], 1 );
	if ( $data['stats.combat.collateralDamagePct'] >= 100 ) { unset($data['stats.combat.collateralDamagePct']); }
	
	// dishout ratio % - be careful if player took low or zero damage
	$data['stats.combat.dishoutRatio'] = $data['stats.combat.damageTaken.overall']
		? min( 1000, 100 * $data['stats.combat.damageInflicted.overall'] / UseIfElse( $data['stats.combat.damageTaken.overall'], 1 ) )
		: 100;
	if ( $data['stats.combat.dishoutRatio'] >= 1000 ) { unset($data['stats.combat.dishoutRatio']); }

	// failed hacks
	$data['stats.hacking.failed'] = $data['stats.hacking.totalHacks.overall'] - $data['stats.hacking.totalHacks.successful'];
	
	// hacking skill %
	$data['stats.hacking.hackingSkill'] = 100 * $data['stats.hacking.totalHacks.successful'] 
		/ UseIfElse($data['stats.hacking.totalHacks.overall'], 1);
	
	// accuracy %
	$data['stats.combat.accuracy'] = 100 * $data['stats.combat.shotsHitRobots.overall']
		/ UseIfElse( ($data['stats.combat.shotsFired.overall'] + $data['stats.combat.meleeAttacks.overall']), 1);
		
	// shots per volley - AWS autocannons can mess up this stat because they dont count as volleys!			
	$data['stats.combat.shotsPerVolley'] = min( 10, $data['stats.combat.shotsFired.overall'] 
		/ UseIfElse($data['stats.combat.volleysFired.overall'], 1 ) );
						
	// critical hit %
	$data['stats.combat.criticalHitPercent'] = 100 *
		( GetIndex($data,'stats.combat.shotsHitRobots.criticalStrikes.overall') ?? GetIndex($data,'stats.combat.shotsHitRobots.criticalHits') ?? 0 )
		/ UseIfElse( ($data['stats.combat.meleeAttacks.overall'] + $data['stats.combat.shotsFired.overall']), 1 );						
	
	// overflow damage %
	$data['stats.combat.overflowDamagePercent'] = 100 * $data['stats.combat.overflowDamage.overall']
		/ UseIfElse($data['stats.combat.damageInflicted.overall'], 1);
		
	// melee followup %
	$data['stats.combat.meleeFollowupPercent'] = 100 * $data['stats.combat.meleeAttacks.followUpAttacks']
		/ UseIfElse($data['stats.combat.meleeAttacks.overall'], 1);
		
	// cadence (actions per minute)
	$timeParts = explode(':', $data['game.runTime'] );
	$playtimeInMinutes = UseIfElse( ($timeParts[1] + ($timeParts[0]*60)), 1);
	$data['stats.actions.cadence'] = ( $data['stats.actions.total.overall'] - $data['stats.actions.total.wait'] ) / $playtimeInMinutes;
		
	// cause of death
	if ( !isset($data['header.win']) ) {
		$WoD = null;
		$CoD = $data['header.runResult'];
		$CoD = preg_replace('/(smashed|destroyed)( by)* /i','',$CoD);
		$parts = preg_split('/\s(via|with)\s/',$CoD);
		if ( count($parts) > 1 ) { 
			$CoD = $parts[0];
			$WoD = $parts[1];
			// assembled have different names
			if ( strpos($CoD,'as-')===0 ) { $CoD = 'Assembled'; }
			else if ( strpos($CoD,'(z)')!==false ) { $CoD = 'Zionite'; }
			else if ( strpos($CoD,'EQ-')!==false ) { $CoD = 'Enhanced Q-Series'; }
			else if ( preg_match('/^Q\d/',$CoD) ) { $CoD = 'Q-Series'; }
			else if ( strpos($CoD,')')!==false ) { $CoD = 'Derelict'; }
		}
		if ( $CoD ) { $data['header.causeOfDeath'] = $CoD; }
		if ( $WoD ) { $data['header.itemOfDeath'] = $WoD; }
	}
		
	// add stats
	foreach ( $data as $k => $v ) {
		if ( !isset($known_stats[$k]) ) {
			$result = $db->query("SELECT 1 FROM stats WHERE id = CRC32('" . addslashes($k) . "') LIMIT 1;");
			if ( $result && !$result->num_rows ) {
				$type = is_numeric($v) ? 'integer' : 'string';
				if ( $type != 'string' ) { $type = FloatOrInt( $k, $v ); }
				$result = $db->query("INSERT INTO stats SET 
					id = CRC32('" . addslashes($k) . "'), 
					label = '" . addslashes($k) . "',
					type = '$type';
					");
				DBCheckForErrors( $result, $db );
			}
			$known_stats[$k] = true;
		}
	}
	
	// add run stats
	$queries = ["INSERT INTO runstats (run_id, stat_id, value) VALUES "];
	foreach ( $data as $k => $v ) {
		$queries []= " ({$data['meta.runId']}, CRC32('" . addslashes($k) . "'), '" . addslashes($v) . "'),";
	}
	$q = rtrim( implode(' ', $queries), ',');
	$result = $db->query( $q );
	if ( $result !== true ) { print $q; }
	DBCheckForErrors( $result, $db );
	
	$result = $db->query("COMMIT;");
	DBCheckForErrors( $result, $db );
	
	return true;
}

function FlattenData($data) {
	$flatdata = [];
	$Flattener = function ( $data, $prefix='' ) use (&$flatdata,&$Flattener) {
		foreach ( $data as $k => $v ) {
			$flatkey = $prefix . ($prefix ? '.' : '') . $k; 
			if ( in_array( gettype($v), ['integer','float','double','boolean','string'] ) ) {
				$flatdata[$flatkey] = $v;
			}
			else if ( is_array($v) ) {
				// skip
			}
			else if ( gettype($v) == 'object' && $v ) {
				$Flattener($v,$flatkey);
			}
		}
	};
	$Flattener($data);
	return $flatdata;			
}

function FloatOrInt( $k, $v ) {
	if ( strpos($v,'.')!==false ) { return 'float'; }
	// certain keys should be forced into floats
	if ( in_array( $k, [
		'stats.combat.shotsPerVolley',
		'stats.exploration.diggingLuck',
		'stats.combat.collateralDamagePct',
		'stats.combat.dishoutRatio',
		'stats.hacking.hackingSkill',
		'stats.combat.accuracy',
		'stats.combat.shotsPerVolley',
		'stats.combat.criticalHitPercent',
		'stats.combat.overflowDamagePercent',
		'stats.combat.meleeFollowupPercent',
	] ) ) { return 'float'; }
	return 'integer';
}

// Database setup ------------\/-----------------------------------
function DB() {
	static $db = null;
	if ( !$db ) { 
		$db = new mysqli(DATAMINER_DB_SERVER, DATAMINER_DB_USERNAME, DATAMINER_DB_PASSWORD, DATAMINER_DB_DATABASE);
		if ( $db->connect_error ) {
			die("Connection failed: " . $db->connect_error);
		}
	}
	return $db;
}

function DBCheckForErrors( $result, $db ) {
	if ( $result !== true ) {
		print $db->error . "\n";
		exit;
	}
}

function UseIfElse( $x, $y ) {
	return $x ? $x : $y;
}

function GetIndex( $array, $i ) {
	return array_key_exists($i,$array) ? $array[$i] : null;
}

function Sanitize( $x ) {
	return $x ? preg_replace('/[^a-zA-Z0-9_\. -]/','',$x) : null;
}

function SanitizeInt( $x ) {
	return $x ? substr( preg_replace('/\D/','',$x), 0, 256 ) : 0;
}

// recursively converts numeric strings to actual number types (int, float).
function AutoCastNumbers( &$array ) { 
	return array_walk_recursive( $array, function (&$v, $k) { 
		// certain pseudo-numbers like zipcodes may have leading zeros. These are NOT numeric.
		if ( is_string($v) && strlen($v)>1 && $v[0]==='0' && $v[1]!=='.' ) { return $v; }
		// there are also certain known keys (like zipcodes) that should never be numeric.
		// if ( preg_match( '/(zip|phone)/i', $k ) ) { return $v; }
		// now check for fundamental numericality
		if ( is_string($v) && (is_numeric($v) || $v===0) ) { 
			$n = $v + 0;
			// watch out for crazy stuff like "4414E418"
			$v = ( is_nan($n) || !is_finite($n) ) ? $v : $n;
			}
		return $v;
		});
	}
	
function GetURLs() {
	$urls = [];
	$sources = [
		'https://www.gridsagegames.com/cogmind/scores/runs_by_version_patron.html',
		'https://www.gridsagegames.com/cogmind/scores/runs_by_version.html'
	];
	foreach ( $sources as $source ) {
		$html = file_get_contents($source);
		$matches = [];
		preg_match_all('/href="(versions.*?\.html)"/i', $html, $matches);
		$urls = array_merge($urls,$matches[1]);
	}
	foreach ( $urls as &$url ) {
		$url = 'https://www.gridsagegames.com/cogmind/scores/' . $url;
	}
	// we dont want beta 9 stuff
	$urls = array_filter( $urls, function($x){ return !preg_match('/beta9/i',$x); } );
	return $urls;
}

function ScrapeURL( $url ) {
	$db = DB();
	$html = file_get_contents($url);
	$matches = [];
	preg_match_all('/\<td\>(2\d{5})\<\/td\>.*?href="(https:\/\/cogmind-api\.gridsagegames\.com\/scoresheets\/.+?)"/i', $html, $matches, PREG_SET_ORDER);
	print $url . ' => ' . count($matches) . " matches \n";
	$urls = array_map( 
		function( $row ) { return $row[2] . '.json'; },
		array_filter( $matches, function($row){
			$file = SCORESHEET_DOWNLOAD_DIR . '/' . basename($row[2],'.json') . '.json';
			// $arch_file = SCORESHEET_ARCHIVE_DIR . '/' . basename($row[2],'.json') . '.json';
			$date = date( 'ymd', strtotime(SCORESHEET_LOOKBEHIND_DAYS . ' day ago') );
			// check if we already have this downloaded
			return $row[1] >= $date && !file_exists($file); // && !file_exists($arch_file);
		})
	);
	if ( $urls ) {
		print "Downloading " . count($urls)  . " new scoresheets...\n";
		foreach ( $urls as $url ) {
			$hash = preg_replace( '/[^A-Za-z0-9]/', '', basename($url,'.json') );
			// don't download anything already in DB
			$result = $db->query("SELECT 1 FROM runs WHERE filehash = '" . addslashes($hash) . "' LIMIT 1;");
			if ( $result && $result->num_rows ) { continue; }
			$file = SCORESHEET_DOWNLOAD_DIR . '/' . $hash . '.json';
			print $url . "\n";
			Download( $url, $file );
			if ( SCRAPE_FETCH_DELAY ) { sleep(SCRAPE_FETCH_DELAY); }
		}
	}
}

function Download( $url, $file ) {
	if ( function_exists('curl_init') ) { 
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url); // set the url
		curl_setopt($curl, CURLOPT_HEADER, 0); // content only
		curl_setopt($curl, CURLOPT_USERAGENT, 'Cogmind Dataminer Proxy (That guy knows everything!)'); // user agent
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1); // allow redirects
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1); // return as a string
		curl_setopt($curl, CURLOPT_FAILONERROR, 1); // don't give us false-positive garbage
		$data = curl_exec($curl);
		curl_close($curl);
		file_put_contents($file,$data);
		}
	}
	
function PrintWithTS( $msg ) {
	print PrintTS() . $msg . "\n";
}

function PrintTS() {
	static $start;
	if ( !$start ) { $start = time(); }
	return '[' . (time() - $start) . '] ';
}	