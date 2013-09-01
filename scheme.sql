
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `feed_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feed_items` (
  `feed_id` int(11) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guid` text NOT NULL,
  `title` text NOT NULL,
  `time` int(11) NOT NULL,
  `author` text NOT NULL,
  `link` text NOT NULL,
  `fulltext` text NOT NULL,
  PRIMARY KEY (`feed_id`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `feed_read`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feed_read` (
  `user_id` int(11) NOT NULL,
  `feed_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  PRIMARY KEY (`feed_id`,`item_id`,`user_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `feed_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feed_runs` (
  `feed_id` int(11) NOT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` int(11) NOT NULL,
  `data` text NOT NULL,
  `success` int(11) NOT NULL,
  PRIMARY KEY (`feed_id`,`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `feeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feeds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` text NOT NULL,
  `title` varchar(200) NOT NULL,
  `desc` text NOT NULL,
  `link` text NOT NULL,
  `icon` text NOT NULL,
  `ttl` int(11) NOT NULL,
  `lastread` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_getfeedsquery` (`id`,`title`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_feeds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_feeds` (
  `user_id` int(11) NOT NULL,
  `feed_id` int(11) NOT NULL,
  UNIQUE KEY `user_id` (`user_id`,`feed_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `password` text NOT NULL,
  `is_active` int(11) NOT NULL DEFAULT '1',
  `source` varchar(30) NOT NULL,
  `type` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

