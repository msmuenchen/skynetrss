
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Datenbank: `db_rss`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `feeds`
--

CREATE TABLE IF NOT EXISTS `feeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` text NOT NULL,
  `title` text NOT NULL,
  `desc` text NOT NULL,
  `link` text NOT NULL,
  `icon` text NOT NULL,
  `ttl` int(11) NOT NULL,
  `lastread` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `feed_items`
--

CREATE TABLE IF NOT EXISTS `feed_items` (
  `feed_id` int(11) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guid` text NOT NULL,
  `title` text NOT NULL,
  `time` int(11) NOT NULL,
  `author` text NOT NULL,
  `link` text NOT NULL,
  `fulltext` text NOT NULL,
  PRIMARY KEY (`feed_id`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 ;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `feed_read`
--

CREATE TABLE IF NOT EXISTS `feed_read` (
  `feed_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  PRIMARY KEY (`feed_id`,`item_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `feed_runs`
--

CREATE TABLE IF NOT EXISTS `feed_runs` (
  `feed_id` int(11) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` int(11) NOT NULL,
  `data` text NOT NULL,
  `success` int(11) NOT NULL,
  PRIMARY KEY (`feed_id`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 ;
