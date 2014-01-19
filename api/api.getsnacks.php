<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

$q=new DB_Query("SELECT f.id,
                        f.title,
                        f.desc,
                        f.mostrecent_ts,
                        (SELECT COUNT(DISTINCT fi.id)
                          FROM feed_items AS fi
                          WHERE fi.feed_id=f.id)
                        AS `total`,
                        (SELECT COUNT(DISTINCT fr.item_id) AS `read`
                          FROM feed_items as fi
                          LEFT JOIN feed_read AS fr ON fi.id=fr.item_id AND fi.feed_id=fr.feed_id
                          WHERE fi.feed_id=f.id AND fr.user_id=?)
                        AS `read`
                FROM feeds AS f
                LEFT JOIN user_feeds AS uf on uf.feed_id=f.id
                WHERE uf.user_id=?
                ORDER BY f.mostrecent_ts DESC
                LIMIT 0,10",$uid,$uid);

$ret["feeds"]=array();
while($r=$q->fetch()) {
  $sql="SELECT	fi.id,fi.excerpt,fi.title,
                (SELECT fr.timestamp
                 FROM feed_read AS fr
                 WHERE fr.feed_id=fi.feed_id
                       AND fr.item_id=fi.id
                       AND fr.user_id=?
                ) AS `timestamp`
    FROM `feed_items` as fi
    WHERE fi.feed_id=? 
    HAVING timestamp IS NULL
    ORDER BY `time` DESC LIMIT 0,3;";
  $q2=new DB_Query($sql,$uid,$r["id"]);
  $r["items"]=array();
  while($r2=$q2->fetch())
    $r["items"][]=$r2;
  $r["unread"]=$r["total"]-$r["read"];
  if(sizeof($r["items"])>0) //dont include feeds where there are no unread items
    $ret["feeds"][]=$r;
  if(sizeof($ret["feeds"])>=5) //max output 5 feeds
    break;
}
$ret["ts"]=time();
