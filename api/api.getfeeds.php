<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

$q=new DB_Query("SELECT f.id, f.title, COUNT(DISTINCT fi.id) AS total, COUNT(DISTINCT fr.item_id) AS `read`
                FROM `feeds` AS f
                LEFT JOIN user_feeds AS uf ON uf.feed_id=f.id
                LEFT JOIN feed_items AS fi ON fi.feed_id=f.id
                LEFT JOIN feed_read AS fr ON fr.feed_id=f.id
                WHERE uf.user_id=?
                GROUP BY f.id
                order by f.title asc",$uid);

$ret["items"]=array();
while($r=$q->fetch()) {
  $ret["items"][]=$r;
}
$ret["ts"]=time();
