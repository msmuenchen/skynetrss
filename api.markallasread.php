<?
$q=new DB_Query("select * from feeds where id=?",$feed);
if($q->numRows!=1)
  throw new Exception("Feed ID invalid");

$q=new DB_Query("INSERT INTO feed_read (feed_read.user_id,feed_read.feed_id,feed_read.item_id,feed_read.timestamp) SELECT ?,fi.feed_id,fi.id,UNIX_TIMESTAMP(NOW()) FROM `feed_items` as fi left join feed_read as fr on fr.feed_id=fi.feed_id and fr.item_id=fi.id WHERE fi.feed_id=? and fr.timestamp IS NULL",$feed,$feed);
$ret["affected"]=$q->affectedRows;
//no confirmation checking to keep down execution cost!
