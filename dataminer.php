<?php

define('SCORESHEET_DOWNLOAD_DIR', __DIR__ . '/scoresheets/tmp');
define('SCORESHEET_ARCHIVE_DIR', __DIR__ . '/scoresheets/archive'); // set to NULL if you dont want to archive
define('CACHE_DIR', __DIR__ . '/cache'); // set to NULL if you dont want to cache
define('CACHE_TTL', 86400);

$mode = Sanitize( isset($_REQUEST['mode']) ? $_REQUEST['mode'] : null );
$difficulty = Sanitize( isset($_REQUEST['difficulty']) ? $_REQUEST['difficulty'] : null );
$version = Sanitize( isset($_REQUEST['version']) ? $_REQUEST['version'] : null );
$label = Sanitize( isset($_REQUEST['label']) ? $_REQUEST['label'] : null );
$player = SanitizeInt( isset($_REQUEST['player']) ? $_REQUEST['player'] : null );
$skipcache = SanitizeInt( isset($_REQUEST['skipcache']) ? $_REQUEST['skipcache'] : null );
$f = Sanitize( isset($_REQUEST['f']) ? $_REQUEST['f'] : 'stats' );

$cache_hash = md5( implode(':',[$mode,$difficulty,$version,$label,$player] ) );
$cache_file = CACHE_DIR . '/' . $cache_hash . '.json';

$json = null;

// look for a cached file
if ( !$skipcache ) {
	if ( is_readable($cache_file) && filemtime($cache_file) < CACHE_TTL ) {
		$json = file_get_contents($cache_file);
	}
}

if ( !$json ) {
	$hooks = [];
	$records = [];
	$db = DB();
	
	// graph data	
	if ( $f == 'graph' && $label ) {
		if ( $mode ) { $hooks []= " AND runs.mode = '" . addslashes($mode) . "' "; }
		if ( $difficulty ) { $hooks []= " AND runs.difficulty = '" . addslashes($difficulty) . "' "; }
		if ( $version ) { $hooks []= " AND runs.version = '" . addslashes($version) . "' "; }
		if ( $player ) { $hooks []= " AND runs.player = '" . addslashes($player) . "' "; }
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
	}
	
	// default numerical stats mode
	else {
		if ( $mode ) { $hooks []= " AND analysis.mode = '" . addslashes($mode) . "' "; }
		if ( $difficulty ) { $hooks []= " AND analysis.difficulty = '" . addslashes($difficulty) . "' "; }
		if ( $version ) { $hooks []= " AND analysis.version = '" . addslashes($version) . "' "; }
		if ( $label ) { $hooks []= " AND stats.label = '" . addslashes($label) . "' "; }
		if ( $player ) { $hooks []= " AND analysis.player = '" . addslashes($player) . "' "; }
		$q = "SELECT stats.label, analysis.* 
			FROM stats, analysis
			WHERE stats.id = analysis.stat_id
			" . implode(' ', $hooks);
		$result = $db->query($q);
		if ( $result->num_rows ) {
			while( $row = $result->fetch_assoc() ) {
				$row['chartdata'] = json_decode($row['chartdata'],true); // JSON stored as string in DB
				unset($row['stat_id']); // probably never need this... yet
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
	}
	
	// fetch records
	// // if only one record, objectify it
	// if ( count($records)===1 ) {
	// 	$records = $records[0];
	// }
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
	print $json;
}
else {
	header('HTTP/1.1 204 No Content');
}
ob_flush();

// cache the result for future queries
if ( CACHE_DIR && $json ) {
	file_put_contents( $cache_file, $json );	
}
					
					
					
					
// UTILITY ------------\/-----------------------------------

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