<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

$q=new DB_Query("select * from feeds where id=?",$feed);
if($q->numRows!=1)
  throw new Exception("Feed ID invalid");

$q=new DB_Query(
  "INSERT INTO feed_read (feed_read.user_id,feed_read.feed_id,feed_read.item_id,feed_read.timestamp) 
     SELECT ?,fi.feed_id,fi.id,UNIX_TIMESTAMP(NOW())
     FROM `feed_items` AS fi
     LEFT JOIN feed_read AS fr ON fr.feed_id=fi.feed_id AND fr.item_id=fi.id AND fr.user_id=?
     WHERE fi.feed_id=? AND fr.timestamp IS NULL",$uid,$uid,$feed);
$ret["affected"]=$q->affectedRows;
//no confirmation checking to keep down execution cost!
