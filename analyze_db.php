<?php

define('SCORESHEET_DOWNLOAD_DIR', __DIR__ . '/scoresheets/tmp');
define('SCORESHEET_ARCHIVE_DIR', __DIR__ . '/scoresheets/archive'); // set to NULL if you dont want to archive

// Database setup ------------\/-----------------------------------
function DB() {
	static $db = null;
	$servername = "127.0.0.1";
	$username = "root";
	$password = "docker";
	$dbname = "dataminer";
	if ( !$db ) { 
		$db = new mysqli($servername, $username, $password, $dbname);
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

print "Analyzing numeric stats...\n";

$db = DB();
$db->multi_query("
	TRUNCATE analysis;
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
		NULL as chartdata
	FROM
		runs,
		runstats,
		stats
	WHERE runstats.stat_id = stats.id -- runstats.stat_id = CRC32('stats.allies.totalAllies.overall')
		AND runstats.run_id = runs.id
		AND stats.type IN ('float','integer')
		-- AND runs.version = 'Beta 11 X8'
		-- AND runs.difficulty = 'DIFFICULTY_ROGUE'
		-- AND runs.mode = 'SPECIAL_MODE_NONE'
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
// flush multi_queries 
while ( $result = $db->next_result() ) { 
	DBCheckForErrors( $result, $db );
	;; 
	} 

print "Now creating sparkline graph data...\n";

$min_samples = 20;

$result = $db->query("
	SELECT
		analysis.stat_id,
		stats.label,
		analysis.version,
		analysis.difficulty,
		analysis.mode
	FROM stats, analysis
	WHERE analysis.stat_id = stats.id
	AND stats.type IN ('float','integer')
	AND analysis.samples >= $min_samples
	-- AND analysis.version >= 'Beta 11 X8' --  UPDATE FOR PRODUCTION
	");
$records = [];
while ( $row = $result->fetch_assoc() ) {
	$records []= $row;
}

// set up temporary counting table
$db->query("CREATE TEMPORARY TABLE nums (n int);");
$db->query("INSERT INTO nums VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);");

// create sparkline chart data for... all of them!
$record_count = 0;
$total = count($records);
foreach ( $records as $record ) {
	print "(" . $record_count++ .  "/$total): {$record['label']} {$record['version']} {$record['difficulty']} {$record['mode']} \n";
	$sigmas = 5;
	$db->multi_query("
		SELECT 
			COUNT( runstats.value ) as `samples`,
			COUNT( DISTINCT runstats.value ) as `uniq`,
			MIN( CAST(runstats.value as float) ) as `min`,
			MAX( CAST(runstats.value as float) ) as `max`,
			MAX( CAST(runstats.value as float) ) - MIN( CAST(runstats.value as float) ) as `range`,
			LEAST( COUNT( DISTINCT runstats.value ), 20 ) as segments,
			(MAX( CAST(runstats.value as float) ) - MIN( CAST(runstats.value as float) ))
			/ LEAST( COUNT( DISTINCT runstats.value ), 20 ) as seglen
		INTO @samples, @uniq, @min, @max, @range, @segments, @seglen
		FROM stats, runstats, runs, analysis
		WHERE runstats.run_id = runs.id
		AND stats.id = runstats.stat_id
		AND runstats.stat_id = {$record['stat_id']}
		AND stats.id = analysis.stat_id
		AND CAST(runstats.value as float) BETWEEN (analysis.avg-(analysis.std*$sigmas)) AND (analysis.avg+(analysis.std*$sigmas))
		AND runs.version = '{$record['version']}'
		AND runs.difficulty = '{$record['difficulty']}'
		AND runs.mode = '{$record['mode']}'
		AND analysis.version = runs.version
		AND analysis.difficulty = runs.difficulty
		AND analysis.mode = runs.mode;
		
		UPDATE analysis
		SET chartdata = (
			SELECT CONCAT('[', GROUP_CONCAT( CONCAT('[',sub3.val,',',sub3.num,']') ), ']') as chartdata
			FROM (
				SELECT nums.n as segment, ROUND(@min + (nums.n * @seglen), 3) as val, COALESCE(sub2.num, 0) as num 
				FROM nums LEFT OUTER JOIN (
					SELECT 
						sub.segment,
						COUNT( sub.segment ) as num
					FROM (
						SELECT 
							FLOOR( runstats.value / @seglen ) as segment,
							CAST( runstats.value as float ) as value
						FROM runstats, analysis, runs
						WHERE runs.id = runstats.run_id
						AND analysis.stat_id = {$record['stat_id']}
						AND analysis.stat_id = runstats.stat_id
						AND CAST(runstats.value as float) BETWEEN (analysis.avg-(analysis.std*$sigmas)) AND (analysis.avg+(analysis.std*$sigmas))
						AND analysis.version = '{$record['version']}'
						AND analysis.difficulty = '{$record['difficulty']}'
						AND analysis.mode = '{$record['mode']}'
						AND analysis.version = runs.version
						AND analysis.difficulty = runs.difficulty
						AND analysis.mode = runs.mode
					) as sub
					GROUP BY sub.segment
				) as sub2
				ON nums.n = sub2.segment
				WHERE nums.n < @segments
				ORDER BY nums.n
			) as sub3
		)
		WHERE analysis.stat_id = {$record['stat_id']}
		AND analysis.version = '{$record['version']}'
		AND analysis.difficulty = '{$record['difficulty']}'
		AND analysis.mode = '{$record['mode']}'
		;");
	while ( $result = $db->next_result() ) { 
		DBCheckForErrors( $result, $db );
	}
}


