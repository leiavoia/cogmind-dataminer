-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: database:3306
-- Generation Time: Dec 12, 2021 at 12:24 AM
-- Server version: 8.0.27
-- PHP Version: 7.4.20

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dataminer`
--
CREATE DATABASE IF NOT EXISTS `dataminer` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `dataminer`;

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`%` PROCEDURE `AnalyzeNumericStats` ()  BEGIN
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
GROUP BY
	stats.id,
	runs.version,
	runs.difficulty,
	runs.mode
;

UPDATE analysis
SET 
	stdmax = IF( `max` > `avg` * 5, `avg` * 5, `max`),
	stdmin = IF( `min` < `avg` * -5, `avg` * -5, `min`),
	stdrange = IF( `max` > `avg` * 5, `avg` * 5, `max`) - IF( `min` < `avg` * -5, `avg` * -5, `min`),
	segments = LEAST( uniq, 20 ),
	seglen = (IF( `max` > `avg` * 5, `avg` * 5, `max`) - IF( `min` < `avg` * -5, `avg` * -5, `min`)) / LEAST( uniq, 20 )
;

UPDATE analysis, stats
SET seglen = IF( segments AND seglen < 1, seglen, FLOOR(seglen) ),
	segments = IF( segments AND seglen < 1, segments, segments+1 )
WHERE analysis.stat_id = stats.id
AND stats.type = 'integer'
;

END$$

CREATE DEFINER=`root`@`%` PROCEDURE `CreateChartData` ()  BEGIN
	DECLARE done BOOL DEFAULT 0;
	DECLARE _stat_id INTEGER DEFAULT 0;
	DECLARE _version varchar(32);
	DECLARE _difficulty varchar(32);
	DECLARE _mode varchar(32);
	DECLARE _seglen FLOAT DEFAULT 0;
	DECLARE _segments INTEGER DEFAULT 0;
	DECLARE _min FLOAT DEFAULT 0;
				
	-- sets up the foreach loop
	DECLARE results CURSOR FOR
		SELECT
			analysis.stat_id,
			analysis.version,
			analysis.difficulty,
			analysis.mode,
			analysis.seglen,
			analysis.segments,
			analysis.min
		FROM stats, analysis
		WHERE analysis.stat_id = stats.id
		AND stats.type IN ('float','integer')
		AND analysis.samples >= 20;
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1; -- i.e. NOT FOUND, out of results

	-- create segments as a temp table
	CREATE TEMPORARY TABLE nums (n int);
	INSERT INTO nums VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);
	START TRANSACTION;
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
			FLOOR( (CAST( runstats.value as float ) - analysis.min) / IF(analysis.seglen,analysis.seglen,1) ) as segment,
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
		) as sub
	GROUP BY sub.stat_id, sub.version, sub.difficulty, sub.mode, sub.segment;
	COMMIT;
	ALTER TABLE segments ADD PRIMARY KEY pkey (stat_id, version, difficulty, mode, segment);

	-- iterate over results and build chart data
	START TRANSACTION;
	OPEN results;
	REPEAT
		FETCH results INTO _stat_id, _version, _difficulty, _mode, _seglen, _segments, _min;
		UPDATE analysis
		SET chartdata = (
			SELECT CONCAT('[', GROUP_CONCAT( CONCAT('[',sub3.val,',',sub3.num,']') ), ']') as chartdata
			FROM (
				SELECT nums.n as segment, ROUND(_min + (nums.n * _seglen), 3) as val, COALESCE(segments.num, 0) as num 
				FROM nums LEFT OUTER JOIN segments
				ON nums.n = segments.segment
				AND segments.stat_id = _stat_id
				AND segments.version = _version
				AND segments.difficulty = _difficulty
				AND segments.mode = _mode
				WHERE nums.n < _segments
				ORDER BY nums.n
			) as sub3
		)
		WHERE analysis.stat_id = _stat_id
		AND analysis.version = _version
		AND analysis.difficulty = _difficulty
		AND analysis.mode = _mode
		;
	UNTIL done END REPEAT;
	CLOSE results;
	COMMIT;
		
	DROP TABLE nums;
	DROP TABLE segments;
END$$

CREATE DEFINER=`root`@`%` PROCEDURE `CreateChartData2` ()  BEGIN
	DECLARE done BOOL DEFAULT 0;
	DECLARE done2 BOOL DEFAULT 0;
	DECLARE _stat_id INTEGER DEFAULT 0;
	DECLARE _stat_id2 INTEGER DEFAULT 0;
	DECLARE _version varchar(32);
	DECLARE _difficulty varchar(32);
	DECLARE _mode varchar(32);
	DECLARE _seglen FLOAT DEFAULT 0;
	DECLARE _segments INTEGER DEFAULT 0;
	DECLARE _min FLOAT DEFAULT 0;
				
	-- sets up the foreach loop
	DECLARE results CURSOR FOR
		SELECT
			analysis.stat_id,
			analysis.version,
			analysis.difficulty,
			analysis.mode,
			analysis.seglen,
			analysis.segments,
			analysis.min
		FROM stats, analysis
		WHERE analysis.stat_id = stats.id
		AND stats.id = analysis.stat_id
		AND stats.type IN ('float','integer')
		AND analysis.samples >= 20;
	DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1; -- i.e. NOT FOUND, out of results
	
	-- create segments as a temp table
	CREATE TEMPORARY TABLE nums (n int);
	INSERT INTO nums VALUES (0), (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15), (16), (17), (18), (19), (20);

	-- iterate over results and build chart data
	START TRANSACTION;
	OPEN results;
	REPEAT
		FETCH results INTO _stat_id, _version, _difficulty, _mode, _seglen, _segments, _min;
		
		CREATE TEMPORARY TABLE segments
			SELECT
				sub.segment,
				COUNT( sub.segment ) as num
			FROM (
				SELECT						
					FLOOR( (CAST( runstats.value as float ) - analysis.min) / IF(analysis.seglen,analysis.seglen,1) ) as segment,
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
					AND analysis.stat_id = _stat_id
					AND analysis.version = _version
					AND analysis.difficulty = _difficulty
					AND analysis.mode = _mode
				) as sub
			GROUP BY sub.segment;
		COMMIT;
				
		UPDATE analysis
		SET chartdata = (
			SELECT CONCAT('[', GROUP_CONCAT( CONCAT('[',sub3.val,',',sub3.num,']') ), ']') as chartdata
			FROM (
				SELECT nums.n as segment, ROUND(_min + (nums.n * _seglen), 3) as val, COALESCE(segments.num, 0) as num 
				FROM nums LEFT OUTER JOIN segments
				ON nums.n = segments.segment
				WHERE nums.n < _segments
				ORDER BY nums.n
			) as sub3
		)
		WHERE analysis.stat_id = _stat_id
		AND analysis.version = _version
		AND analysis.difficulty = _difficulty
		AND analysis.mode = _mode
		;
		
		DROP TABLE segments;
	UNTIL done END REPEAT;
	CLOSE results;
	COMMIT;
		
	DROP TABLE nums;
	
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `analysis`
--

CREATE TABLE `analysis` (
  `stat_id` int UNSIGNED NOT NULL,
  `version` varchar(32) NOT NULL,
  `difficulty` varchar(32) NOT NULL,
  `mode` varchar(32) NOT NULL,
  `samples` int NOT NULL,
  `uniq` int NOT NULL DEFAULT '1',
  `min` int NOT NULL,
  `max` int NOT NULL,
  `avg` float NOT NULL,
  `std` float NOT NULL,
  `stdmin` float NOT NULL DEFAULT '0',
  `stdmax` float NOT NULL DEFAULT '0',
  `segments` int NOT NULL DEFAULT '1',
  `seglen` float NOT NULL DEFAULT '0',
  `stdrange` float NOT NULL DEFAULT '0',
  `chartdata` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `runs`
--

CREATE TABLE `runs` (
  `id` int UNSIGNED NOT NULL,
  `uuid` char(36) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  `filehash` varchar(32) DEFAULT NULL,
  `player_name` varchar(128) NOT NULL,
  `player_id` int UNSIGNED NOT NULL,
  `score` int UNSIGNED NOT NULL DEFAULT '0',
  `result` varchar(256) NOT NULL DEFAULT '',
  `final_map` char(3) NOT NULL,
  `final_depth` int NOT NULL,
  `tags` varchar(512) NOT NULL DEFAULT '',
  `version` varchar(32) NOT NULL,
  `win` tinyint(1) NOT NULL DEFAULT '0',
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `mode` varchar(32) NOT NULL DEFAULT 'SPECIAL_MODE_NONE',
  `difficulty` varchar(32) NOT NULL DEFAULT 'DIFFICULTY_ROGUE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `runstats`
--

CREATE TABLE `runstats` (
  `run_id` int NOT NULL,
  `stat_id` int UNSIGNED NOT NULL,
  `value` varchar(128) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `stats`
--

CREATE TABLE `stats` (
  `id` int UNSIGNED NOT NULL,
  `label` varchar(256) NOT NULL,
  `type` varchar(16) DEFAULT 'integer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `analysis`
--
ALTER TABLE `analysis`
  ADD UNIQUE KEY `signature` (`stat_id`,`version`,`difficulty`,`mode`);

--
-- Indexes for table `runs`
--
ALTER TABLE `runs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `filehash` (`filehash`),
  ADD KEY `version` (`version`),
  ADD KEY `player_id` (`player_id`),
  ADD KEY `mode` (`mode`),
  ADD KEY `difficulty` (`difficulty`);

--
-- Indexes for table `runstats`
--
ALTER TABLE `runstats`
  ADD KEY `run_id` (`run_id`),
  ADD KEY `stat_id` (`stat_id`);

--
-- Indexes for table `stats`
--
ALTER TABLE `stats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id` (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `runs`
--
ALTER TABLE `runs`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
