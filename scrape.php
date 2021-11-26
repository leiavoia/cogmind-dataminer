<?php

define('SCRAPE_FETCH_DELAY', 2);
define('SCORESHEET_LOOKBEHIND_DAYS', 365);
define('SCORESHEET_DOWNLOAD_DIR', __DIR__ . '/scoresheets/tmp');
define('SCORESHEET_ARCHIVE_DIR', __DIR__ . '/scoresheets/archive');

$urls = GetURLs();
foreach ( $urls as $url ) {
	$sheets = ScrapeURL($url);
} 

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
	$html = file_get_contents($url);
	$matches = [];
	preg_match_all('/\<td\>(2\d{5})\<\/td\>.*?href="(https:\/\/cogmind-api\.gridsagegames\.com\/scoresheets\/.+?)"/i', $html, $matches, PREG_SET_ORDER);
	print $url . ' => ' . count($matches) . " matches \n";
	$urls = array_map( 
		function( $row ) { return $row[2] . '.json'; },
		array_filter( $matches, function($row){
			$file = SCORESHEET_DOWNLOAD_DIR . '/' . basename($row[2],'.json') . '.json';
			$arch_file = SCORESHEET_ARCHIVE_DIR . '/' . basename($row[2],'.json') . '.json';
			$date = date( 'ymd', strtotime(SCORESHEET_LOOKBEHIND_DAYS . ' day ago') );
			return $row[1] >= $date && !file_exists($file) && !file_exists($arch_file);
		})
	);
	if ( $urls ) {
		print "Downloading " . count($urls)  . " new scoresheets...\n";
		foreach ( $urls as $url ) {
			// check if we already have this downloaded
			$hash = basename($url);
			$file = SCORESHEET_DOWNLOAD_DIR . '/' . $hash;
			print $url . "\n";
			Download( $url, $file );
			if ( SCRAPE_FETCH_DELAY ) { sleep(SCRAPE_FETCH_DELAY); }
		}
	}
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