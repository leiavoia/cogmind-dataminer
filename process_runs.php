<?php

require_once('global.php');


// Scan files ------------\/-----------------------------------
$counter = 0;
$num_scanned = 0;
foreach ( glob(SCORESHEET_DOWNLOAD_DIR . '/*.json') as $file ) {
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
		rename( $file, SCORESHEET_ARCHIVE_DIR . '/' . basename($file) );
	}
}
print "$counter files scanned, $num_scanned runs added\n";



// UTILITY ------------\/-----------------------------------

function AddRun( $hash, $data ) {
	static $known_stats = []; // caches results when running large batches
	$db = DB();
	
	// check for duplicates
	$result = $db->query("SELECT 1 FROM runs WHERE filehash = '" . addslashes($hash) . "' LIMIT 1;");
	if ( $result && $result->num_rows ) { return false; }
	
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
	// if ( $result !== true ) { print $hash;}
	DBCheckForErrors( $result, $db );
	
	// precompute some stuff:
	
	// digging luck
	$data['stats.exploration.diggingLuck'] = 100 * $data['stats.exploration.spacesMoved.caveInsTriggered'] 
		/ UseIfElse( $data['stats.exploration.spacesDug'], 1 );
	
	// collateral dmg pct
	$data['stats.combat.collateralDamagePct'] = 100 * $data['performance.valueDestroyed.count'] 
		/ UseIfElse( $data['stats.combat.damageInflicted.overall'], 1 );
			
	// dishout ratio % - be careful if player took zero damage
	$data['stats.combat.dishoutRatio'] = 100 * $data['stats.combat.damageInflicted.overall'] 
		/ UseIfElse( $data['stats.combat.damageTaken.overall'], 1 );
	
	// failed hacks
	$data['stats.hacking.failed'] = $data['stats.hacking.totalHacks.overall'] - $data['stats.hacking.totalHacks.successful'];
	
	// hacking skill %
	$data['stats.hacking.hackingSkill'] = 100 * $data['stats.hacking.totalHacks.successful'] 
		/ UseIfElse($data['stats.hacking.totalHacks.overall'], 1);
	
	// accuracy %
	$data['stats.combat.accuracy'] = 100 * $data['stats.combat.shotsHitRobots.overall']
		/ UseIfElse( ($data['stats.combat.shotsFired.overall'] + $data['stats.combat.meleeAttacks.overall']), 1);
		
	// shots per volley						
	$data['stats.combat.shotsPerVolley'] = $data['stats.combat.shotsFired.overall'] 
		/ UseIfElse($data['stats.combat.volleysFired.overall'], 1 );
						
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
	$playtimeInMinutes = $timeParts[1] + ($timeParts[0]*60);
	$data['stats.actions.cadence'] = ( $data['stats.actions.total.overall'] - $data['stats.actions.total.wait'] ) / $playtimeInMinutes;
		
	// add stats
	foreach ( $data as $k => $v ) {
		if ( !isset($known_stats[$k]) ) {
			$result = $db->query("SELECT 1 FROM stats WHERE id = CRC32('" . addslashes($k) . "') LIMIT 1;");
			if ( $result && !$result->num_rows ) {
				$type = is_numeric($v) ? 'integer' : 'string';
				if ( $type == 'integer' && strpos($v,'.')!==false ) { $type = 'float'; }
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
