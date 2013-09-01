<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

$q=new DB_Query("SELECT f.id,
                        f.title,
                        f.icon,
                        f.desc,
                        (SELECT COUNT(DISTINCT fi.id)
                          FROM feed_items AS fi
                          WHERE fi.feed_id=f.id)
                        AS `total`,
                        (SELECT COUNT(DISTINCT fr.item_id) AS `read`
                          FROM feed_items as fi
                          LEFT JOIN feed_read AS fr ON fi.id=fr.item_id AND fi.feed_id=fr.feed_id
                          WHERE fi.feed_id=f.id)
                        AS `read`
                FROM feeds AS f
                LEFT JOIN user_feeds AS uf on uf.feed_id=f.id
                WHERE uf.user_id=?
                ORDER BY f.title ASC",$uid);

$ret["items"]=array();
while($r=$q->fetch()) {
  $ret["items"][]=$r;
}
$ret["ts"]=time();
