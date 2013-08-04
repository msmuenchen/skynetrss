<?
if(!isset($_GET["item"]))
  throw new Exception("Did not supply item id");
$item=(int)$_GET["item"];

if(!isset($_GET["state"]))
  throw new Exception("Did not supply state");

if($_GET["state"]!=="read" && $_GET["state"]!=="unread")
  throw new Exception("Invalid state");

$q=new DB_Query("select * from feeds where id=?",$feed);
if($q->numRows!=1)
  throw new Exception("Feed ID invalid");

if($_GET["state"]==="read")
  $q=new DB_Query("insert ignore into feed_read set feed_id=?,item_id=?,timestamp=UNIX_TIMESTAMP(NOW())",$feed,$item);
else
  $q=new DB_Query("delete ignore from feed_read where feed_id=? and item_id=?",$feed,$item);
$ret["affected"]=$q->affectedRows;
//no confirmation checking to keep down execution cost!
