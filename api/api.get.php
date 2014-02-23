<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

if(isset($_GET["order"])) {
  if($_GET["order"]=="asc")
    $order="asc";
  else
    $order="desc";
} else
  $order="desc";

$start=0;
if(isset($_GET["start"])) {
  $start=(int)$_GET["start"];
}
$len=25;
if(isset($_GET["len"])) {
  $len=(int)$_GET["len"];
}
if($len<10)
 $len=10;
 
$noContent=false;
if(isset($_GET["nocontent"])) //replace content with sha1 hash
 $noContent=true;

$q=new DB_Query("select * from feeds where id=?",$feed);
if($q->numRows!=1)
  throw new Exception("Feed ID invalid");
$fdata=$q->fetch();
$fdata["icon"]=""; //save bandwidth

$q=new DB_Query("select * from user_feeds where user_id=? and feed_id=?",$uid,$feed);
if($q->numRows!=1 && false)
  throw new PermissionDeniedException();


$ret["feed"]=$fdata;

$sql="SELECT	fi.*,
                (SELECT fr.timestamp
                 FROM feed_read AS fr
                 WHERE fr.feed_id=fi.feed_id
                       AND fr.item_id=fi.id
                       AND fr.user_id=?
                ) AS `timestamp`,
                (SELECT fs.timestamp
                 FROM feed_stars AS fs
                 WHERE fs.feed_id=fi.feed_id
                       AND fs.item_id=fi.id
                       AND fs.user_id=?
                ) AS `star_timestamp`
    FROM `feed_items` as fi
    WHERE fi.feed_id=? ";
$sql.="ORDER BY `time` $order LIMIT $start,$len;";

$q=new DB_Query($sql,$uid,$uid,$feed);
$ret["items"]=array();
while($r=$q->fetch()) {
  if(isset($_GET["ignoreread"]) && $_GET["ignoreread"]=="true" && $r["timestamp"]!==null)
    continue;
  if($noContent) {
   $r["fulltext"]=sha1($r["fulltext"]);
   $r["scrape_fulltext"]=sha1($r["scrape_fulltext"]);
   $r["excerpt_copy"]=$r["excerpt"];
   $r["excerpt"]=sha1($r["excerpt"]);
  }
  $ret["items"][]=$r;
}

$q=new DB_Query("SELECT COUNT(DISTINCT id) as c
                 FROM feed_items AS fi
                 LEFT JOIN feed_read AS fr ON fr.item_id=fi.id AND fr.feed_id=fi.feed_id AND fr.user_id=?
                 WHERE fi.feed_id=?",$uid,$feed);
$r=$q->fetch();
$total=$r["c"];
$ret["total"]=$total;
if($start+$len<$total)
  $ret["next"]=$start+$len;

$ret["remain"]=$total-$start-$len;
$ret["d"]=array("total"=>$total,"start"=>$start,"len"=>$len);
