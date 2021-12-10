<?php

$params = getopt( 'spac', [ 'scrape', 'process', 'analyze', 'chart' ] );

ini_set('display_errors', 1);
require_once('global.php');

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
$sigmas = 3; // moved to DB
$db = DB();

// print PrintTS() . "Analyzing numeric stats...\n";
// $result = $db->query("CALL AnalyzeNumericStats();");
// DBCheckForErrors( $result, $db );

// print PrintTS() . "Creating sparkchart data\n";
// $result = $db->query("CALL CreateChartData();");
// DBCheckForErrors( $result, $db );

function PrintTS() {
	static $start;
	if ( !$start ) { $start = time(); }
	return '[' . (time() - $start) . '] ';
}


if ( isset($params['a']) ||  isset($params['analyze']) ) {
	
	print PrintTS() . "Starting analysis \n";

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
			COUNT( CAST(runstats.value as float) ) as `samples`,
			COUNT( DISTINCT runstats.value ) as `uniq`,
			MIN( CAST(runstats.value as float) ) as `min`,
			MAX( CAST(runstats.value as float) ) as `max`,
			ROUND( AVG( CAST(runstats.value as float) ), 3) as `avg`,
			ROUND( STD( CAST(runstats.value as float) ), 3) as `std`,
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
		ORDER BY
			stats.label,
			runs.version,
			runs.difficulty,
			runs.mode
		;");
	DBCheckForErrors( $result, $db );
	


	print PrintTS() . "Doing secondary-analysis ...\n";
	$result = $db->query("
		UPDATE analysis
		SET 
			stdmax = IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`),
			stdmin = IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`),
			stdrange = IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`) - IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`),
			-- segments = IF( LEAST( uniq, 20 ) > 0 AND seglen < 1, 1, FLOOR(LEAST( uniq, 20 )) ),
			segments = GREATEST( 1, LEAST( uniq, IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`) - IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`), 20 ) ),
			seglen = (IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`) - IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`))
				/ GREATEST( 1, LEAST( uniq, IF( `max` > `avg` + std*$sigmas, `avg` + std*$sigmas, `max`) - IF( `min` < `avg` + std*-$sigmas, `avg` + std*-$sigmas, `min`), 20 ) )
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
		
	print PrintTS() . "Analysis finished\n";
}

if ( isset($params['c']) || isset($params['chart']) ) {

	// // -------------- SEGMENTS -----------------------------
	
	print PrintTS() . "Segmenting numerical stats ...\n";

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
				FLOOR( (CAST( runstats.value as float ) - analysis.stdmin) / IF(analysis.seglen,analysis.seglen,1) ) as segment,
				CAST( runstats.value as float ) as value
			FROM runstats, analysis, runs, stats
			WHERE runs.id = runstats.run_id
				AND CAST(runstats.value as float) BETWEEN analysis.stdmin AND analysis.stdmax
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
	

	// $db->query("UNLOCK TABLES;");
	// DBCheckForErrors( $result, $db );

	print PrintTS() . "Now creating sparkline graph data...\n";

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
		print "(" . ++$record_count .  "/$total): {$record['label']} {$record['version']} {$record['difficulty']} {$record['mode']} \n";
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
	print PrintTS() . "Charting finished.\n";
}

// we moved most the guts of this file directly into the database for speed
// DROP PROCEDURE IF EXISTS AnalyzeNumericStats $$
// CREATE PROCEDURE AnalyzeNumericStats () 
// COMMENT 'Calculates min, max, average, and other numerical stats.' 
// DETERMINISTIC CONTAINS SQL SQL SECURITY DEFINER 		
// BEGIN
// TRUNCATE analysis;
// INSERT INTO analysis
// SELECT
// 	runstats.stat_id,
// 	runs.version,
// 	runs.difficulty,
// 	runs.mode,
// 	COUNT( CAST(runstats.value as float) ) as `samples`,
// 	COUNT( DISTINCT runstats.value ) as `uniq`,
// 	MIN( CAST(runstats.value as float) ) as `min`,
// 	MAX( CAST(runstats.value as float) ) as `max`,
// 	ROUND( AVG( CAST(runstats.value as float) ), 3) as `avg`,
// 	ROUND( STD( CAST(runstats.value as float) ), 3) as `std`,
// 	0,
// 	0,
// 	0,
// 	0,
// 	0,
// 	NULL as chartdata
// FROM
// 	runs,
// 	runstats,
// 	stats
// WHERE runstats.stat_id = stats.id
// 	AND runstats.run_id = runs.id
// 	AND stats.type IN ('float','integer')
// GROUP BY
// 	stats.id,
// 	runs.version,
// 	runs.difficulty,
// 	runs.mode
// ;

// UPDATE analysis
// SET 
// 	stdmax = IF( `max` > `avg` * 5, `avg` * 5, `max`),
// 	stdmin = IF( `min` < `avg` * -5, `avg` * -5, `min`),
// 	stdrange = IF( `max` > `avg` * 5, `avg` * 5, `max`) - IF( `min` < `avg` * -5, `avg` * -5, `min`),
// 	segments = LEAST( uniq, 20 ),
// 	seglen = (IF( `max` > `avg` * 5, `avg` * 5, `max`) - IF( `min` < `avg` * -5, `avg` * -5, `min`)) / LEAST( uniq, 20 )
// ;

// UPDATE analysis, stats
// SET seglen = IF( segments AND seglen < 1, seglen, FLOOR(seglen) ),
// 	segments = IF( segments AND seglen < 1, segments, segments+1 )
// WHERE analysis.stat_id = stats.id
// AND stats.type = 'integer'
// ;

// END $$


// DROP PROCEDURE IF EXISTS CreateChartData $$
// CREATE PROCEDURE CreateChartData () 
// COMMENT 'Creates sparkschart data for each stat analysis.' 
// CONTAINS SQL SQL SECURITY DEFINER 	
// BEGIN
// 	DECLARE done BOOL DEFAULT 0;
// 	DECLARE _stat_id INTEGER DEFAULT 0;
// 	DECLARE _version varchar(32);
// 	DECLARE _difficulty varchar(32);
// 	DECLARE _mode varchar(32);
// 	DECLARE _seglen FLOAT DEFAULT 0;
// 	DECLARE _segments INTEGER DEFAULT 0;
// 	DECLARE _min FLOAT DEFAULT 0;
				
// 	-- sets up the foreach loop
// 	DECLARE results CURSOR FOR
// 		SELECT
// 			analysis.stat_id,
// 			analysis.version,
// 			analysis.difficulty,
// 			analysis.mode,
// 			analysis.seglen,
// 			analysis.segments,
// 			analysis.min
// 		FROM stats, analysis
// 		WHERE analysis.stat_id = stats.id
// 		AND stats.type IN ('float','integer')
// 		AND analysis.samples >= 20;
// 	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1; -- i.e. NOT FOUND, out of results

// 	-- create segments as a temp table
// 	CREATE TEMPORARY TABLE nums (n int);
// 	INSERT INTO nums VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);
// 	START TRANSACTION;
// 	CREATE TEMPORARY TABLE segments
// 		SELECT
// 		sub.stat_id, 
// 		sub.version, 
// 		sub.difficulty, 
// 			sub.mode,
// 		sub.segment,
// 		COUNT( sub.segment ) as num
// 		FROM (
// 			SELECT
// 			analysis.stat_id, 
// 			analysis.version, 
// 			analysis.difficulty, 
// 			analysis.mode,						
// 			FLOOR( (CAST( runstats.value as float ) - analysis.min) / IF(analysis.seglen,analysis.seglen,1) ) as segment,
// 			CAST( runstats.value as float ) as value
// 		FROM runstats, analysis, runs, stats
// 		WHERE runs.id = runstats.run_id
// 			AND CAST(runstats.value as float) BETWEEN analysis.stdmin AND analysis.stdmax
// 			AND analysis.stat_id = runstats.stat_id
// 			AND analysis.version = runs.version
// 			AND analysis.difficulty = runs.difficulty
// 			AND analysis.mode = runs.mode
// 			AND analysis.stat_id = stats.id
// 			AND stats.type IN ('float','integer')
// 		) as sub
// 	GROUP BY sub.stat_id, sub.version, sub.difficulty, sub.mode, sub.segment;
// 	COMMIT;
// 	ALTER TABLE segments ADD PRIMARY KEY pkey (stat_id, version, difficulty, mode, segment);

// 	-- iterate over results and build chart data
// 	START TRANSACTION;
// 	OPEN results;
// 	REPEAT
// 		FETCH results INTO _stat_id, _version, _difficulty, _mode, _seglen, _segments, _min;
// 		UPDATE analysis
// 		SET chartdata = (
// 			SELECT CONCAT('[', GROUP_CONCAT( CONCAT('[',sub3.val,',',sub3.num,']') ), ']') as chartdata
// 			FROM (
// 				SELECT nums.n as segment, ROUND(_min + (nums.n * _seglen), 3) as val, COALESCE(segments.num, 0) as num 
// 				FROM nums LEFT OUTER JOIN segments
// 				ON nums.n = segments.segment
// 				AND segments.stat_id = _stat_id
// 				AND segments.version = _version
// 				AND segments.difficulty = _difficulty
// 				AND segments.mode = _mode
// 				WHERE nums.n < _segments
// 				ORDER BY nums.n
// 			) as sub3
// 		)
// 		WHERE analysis.stat_id = _stat_id
// 		AND analysis.version = _version
// 		AND analysis.difficulty = _difficulty
// 		AND analysis.mode = _mode
// 		;
// 	UNTIL done END REPEAT;
// 	CLOSE results;
// 	COMMIT;
		
// 	DROP TABLE nums;
// 	DROP TABLE segments;
// END $$