<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];
if(!isset($_GET["items"]))
  throw new APIWrongCallException("items not a json");

$items=json_decode($_GET["items"]);
if($items===null)
  throw new APIWrongCallException("items not a json");

$q=new DB_Query("SELECT f.id,
                f.icon
                FROM feeds AS f
                LEFT JOIN user_feeds AS uf on uf.feed_id=f.id
                WHERE uf.user_id=?
                ORDER BY f.title ASC",$uid);

$ret["items"]=array();
while($r=$q->fetch()) {
  $h=sha1($r["icon"]);
  if(property_exists($items,$r["id"])) { //client LSO has this feed)
    $h2=$items->$r["id"];
    if($h==$h2) { //client LSO has identic hash => no retransmission
    } else { //client LSO has different icon => retransmit
      $ret["items"][]=$r;
    }
  } else { //new feed (whose icon is not in client LSO)
    $ret["items"][]=$r;
  }
}
