<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

if(!isset($_GET["item"]))
  throw new Exception("Did not supply item id");
$item=$_GET["item"];

if(!isset($_GET["state"]))
  throw new Exception("Did not supply state");

if($_GET["state"]!=="read" && $_GET["state"]!=="unread")
  throw new Exception("Invalid state");

if($feed=="all") {
  list($feed,$item)=explode("-",$item);
  $feed=(int)$feed;
}
$item=(int)$item;

$q=new DB_Query("select * from feeds where id=?",$feed);
if($q->numRows!=1)
  throw new Exception("Feed ID invalid");

//set last-login time
$ts=time();
$q=new DB_Query("update users set lastlogin=? where id=?",$ts,$uid);

if($uid!=0) {
  if($_GET["state"]==="read")
    $q=new DB_Query("insert ignore into feed_stars set feed_id=?,item_id=?,timestamp=UNIX_TIMESTAMP(NOW()),user_id=?",$feed,$item,$uid);
  else
    $q=new DB_Query("delete ignore from feed_stars where feed_id=? and item_id=? and user_id=?",$feed,$item,$uid);
  $ret["affected"]=$q->affectedRows;
  //no confirmation checking to keep down execution cost!
} else {
  $ret["affected"]=0;
}