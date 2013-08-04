<?
class AlreadyPresentException extends Exception {
}

$feedObj=Feed::createFromUrl($feed);
//print_r($feedObj);/*
$q=new DB_Query("select * from feeds where url=?",$feed);
if($q->numRows==0) {
  $q=new DB_Query("INSERT INTO `db_rss`.`feeds` (`id`, `url`, `title`, `desc`, `link`, `ttl`, `lastread`,`icon`) VALUES (NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?);",$feed,$feedObj->title,$feedObj->desc,$feedObj->link,$feedObj->ttl,$feedObj->icon);
  $log.="DB: Feed added to DB\n";
} elseif($q->numRows==1) {
  throw new AlreadyPresentException();
} else {
  throw new Exception("SQL-Fehler: Feed mehrfach vorhanden!");
}

$ret["id"]=$q->insertId;
//*/