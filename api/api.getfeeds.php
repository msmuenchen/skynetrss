<?
$q=new DB_Query("SELECT f.*, f.title, COUNT(DISTINCT fi.id) AS total, COUNT(DISTINCT fr.item_id) AS `read` FROM `feeds` AS f LEFT JOIN feed_items AS fi ON fi.feed_id=f.id LEFT JOIN feed_read AS fr ON fr.feed_id=f.id GROUP BY f.id order by f.title asc");

$ret["items"]=array();
while($r=$q->fetch()) {

  $ret["items"][]=$r;
}
$ret["ts"]=time();
