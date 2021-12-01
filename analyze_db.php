<?php

require_once('global.php');

// set these if you want to limit recalculation to a subset
$version = 'Beta 11 X8';
$difficulty = 'DIFFICULTY_ROGUE';
$mode = 'SPECIAL_MODE_NONE';
$label = '';//'stats.exploration.spacesMoved.averageSpeed';
$min_samples = 20;
$sigmas = 5;

print "Analyzing numeric stats...\n";

$db = DB();

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

print "Now creating sparkline graph data...\n";

$result = $db->query("
	SELECT
		analysis.stat_id,
		stats.label,
		analysis.version,
		analysis.difficulty,
		analysis.mode,
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

// set up temporary counting table
$db->query("CREATE TEMPORARY TABLE nums (n int);");
$db->query("INSERT INTO nums VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);");

// create sparkline chart data for... all of them!
$record_count = 0;
$total = count($records);
foreach ( $records as $record ) {
	print "(" . ++$record_count .  "/$total): {$record['label']} {$record['version']} {$record['difficulty']} {$record['mode']} \n";
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
		
		-- round segment length to integers if stat type is an integer
		"
		. ( $record['type']=='integer' ? 'SET @seglen = IF( @seglen < 1, @seglen, FLOOR(@seglen) );' : '' )
		. ( $record['type']=='integer' ? 'SET @segments = IF( @seglen < 1, @segments, @segments+1 );' : '' ) . 
		"
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
							FLOOR( (CAST( runstats.value as float ) - analysis.min) / @seglen ) as segment,
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


