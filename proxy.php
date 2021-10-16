<?php
// http_response_code(404);exit;
$logfile = './request_log.txt';
$api_url = 'https://cogmind-api.gridsagegames.com/scoresheets/';

function Download( $url ) {
	if ( function_exists('curl_init') ) { 
		$curl = curl_init();
		curl_setopt($curl, CURLOPT_URL, $url); // set the url
		curl_setopt($curl, CURLOPT_HEADER, 0); // content only
		curl_setopt($curl, CURLOPT_USERAGENT, 'Cogmind Dataminer Proxy (That guy knows everything!)'); // user agent
		curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1); // allow redirects
		curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1); // return as a string
		// curl_setopt($curl, CURLOPT_BINARYTRANSFER, 1); // required for videos, etc
		curl_setopt($curl, CURLOPT_FAILONERROR, 1); // don't give us false-positive garbage
		$data = curl_exec($curl);
		curl_close($curl);
		return $data;
		}
	return null;
	}
	
try {
	$hash = isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : null;
	$hash = preg_replace('/\.json$/i','',$hash);
	if ( $hash && preg_match('/^[A-Za-z0-9{17,18}$]/',$hash) ) {
		$url = $api_url . $hash . '.json';
		$json = Download($url);
		if ( $json ) {
			header("Content-type: application/json");
			header("Content-Length: " . strlen($json) );
			print $json;
			ob_flush();
			// log, because we can
			try {
				if ( file_exists($logfile) ) {
					$file = fopen($logfile, 'a');
					fwrite( $file, $hash . "\t" . date('Y-m-d H:i:s') . "\t" . $_SERVER['REMOTE_ADDR'] . PHP_EOL );
					fclose($file);
				}
			}
			catch ( Exception $ex ) { ;; }
			exit;
		}
	}
}
catch ( Exception $ex ) { ;; }

http_response_code(404);

