<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

if($uid==0)
  throw new PermissionDeniedException();

class AlreadyPresentException extends Exception {
}

$feedObj=Feed::createFromUrl($feed);
$q=new DB_Query("select * from feeds where url=?",$feed);

if($q->numRows==0) {
  $q=new DB_Query("INSERT INTO `db_rss`.`feeds` (`id`, `url`, `title`, `desc`, `link`, `ttl`, `lastread`,`icon`) VALUES (NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?);",$feed,$feedObj->title,$feedObj->desc,$feedObj->link,$feedObj->ttl,$feedObj->icon);
  $log.="DB: Feed added to DB\n";
  if($q->insertId==0)
    throw new Exception("SQL-Fehler: INSERT fehlgeschlagen");
  $ret["id"]=$q->insertId;
  $q=new DB_Query("select * from feeds where id=?",$q->insertId);
  $ret["feed"]=$q->fetch();
} elseif($q->numRows==1) {
  $r=$q->fetch();
  $ret["id"]=$r["id"];
  $ret["feed"]=$r;
  //OK
} else {
  throw new Exception("SQL-Fehler: Feed mehrfach vorhanden!");
}

//So, we now have the feed in the database, lets see if the *user* has subscribed to this feed yet
$q=new DB_Query("select * from user_feeds where user_id=? and feed_id=?",$uid,$ret["id"]);
if($q->numRows==0) {
  $q=new DB_Query("insert into user_feeds set user_id=?,feed_id=?",$uid,$ret["id"]);
} elseif($q->numRows==1) {
  $r=$q->fetch();
  throw new AlreadyPresentException();
} else {
  throw new Exception("SQL-Fehler: Feed mehrfach vorhanden!");
}
