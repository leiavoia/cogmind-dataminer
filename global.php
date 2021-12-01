<?php

define('SCORESHEET_DOWNLOAD_DIR', __DIR__ . '/scoresheets/tmp');
define('SCORESHEET_ARCHIVE_DIR', __DIR__ . '/scoresheets/archive'); // set to NULL if you dont want to archive
define('CACHE_DIR', __DIR__ . '/cache'); // set to NULL if you dont want to cache
define('CACHE_TTL', 86400);

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