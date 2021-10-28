# Cogmind Dataminer

Dataminer is an online visualizer for Cogmind scoresheet files that are created when a game run ends. It can analyze files found on gridsagegames.com or from your own machine.

The app is a client-side javascript project that uses only basic Vue.js and Bootstrap. There is no backend. It runs entirely in a web browser and can be placed on any server or viewed directly when on a PC.

## Installation

Just copy the files onto your own webserver or personal computer. If installed on gridsagegames.com, no other installation required. If installed elsewhere, CORS issues currently prevents file loading of scoresheets from gridsagegames.com. This is bypassed by using the included proxy.php file, in which case a PHP-enabled webserver is needed. The javascript will auto-detect which domain it is hosted on and use the proxy if needed.

## Usage

For general usage, just link to the index.html page. The user can select a scoresheet to view or load their own.

To link to a specific, publicly available scoresheet hosted on cogmind-api.gridsagegames.com, add "?<file_hash>" to the URL. 

See the [help file](help.html) for more info on where scores are kept and how to use them.

## Development

Dataminer uses Kyzrati's heavily documented scoresheet output format:

https://github.com/Kyzrati/cogmind-scoresheet/blob/master/scoresheet.proto

The data format is not in sync with beta game development, so newer features may not all be available in the JSON data output for non-public game builds.

## Live Samples

You can view a working installation at:

https://leiavoia.net/cogmind/dataminer/

## References

https://www.gridsagegames.com/cogmind/scores/

https://www.gridsagegames.com/cogmind/scores/versions/

https://www.gridsagegames.com/cogmind/scores/runs_by_version_patron.html

## Related Projects

https://ape3000.com/cogmindgraph/

https://github.com/Ape/cogmindgraph

https://github.com/jhoke307/cogmind-scores
	
	
	


