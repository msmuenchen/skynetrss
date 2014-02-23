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

$ret["feed"]=$fdata;
$sql="SELECT
	fi_o.id AS item_id,
	fi_o.feed_id AS id,
	fi_o.guid,
	fi_o.title,
	fi_o.time,
	fi_o.author,
	fi_o.link,
	fi_o.fulltext,
	fi_o.scrape_fulltext,
	fi_o.excerpt,
	feeds.title AS feed_title,
	(SELECT fr.timestamp
        	FROM feed_read AS fr
	        WHERE fr.feed_id=fi_o.feed_id
        	AND fr.item_id=fi_o.id
	        AND fr.user_id=?
	) AS `timestamp`,
	(SELECT fs.timestamp
		FROM feed_stars AS fs
		WHERE fs.feed_id=fi_o.feed_id
		AND fs.item_id=fi_o.id
		AND fs.user_id=?
	) AS `star_timestamp`
FROM feed_items AS fi_o
JOIN
	(SELECT
		feeds.id AS feed_id_i,
		fi.id AS item_id_i 
	FROM `user_feeds`
	INNER JOIN feeds ON feeds.id=user_feeds.feed_id
	INNER JOIN feed_items AS fi ON fi.feed_id=user_feeds.feed_id
	WHERE user_id=?
	ORDER BY `time` $order
	LIMIT $start,$len) AS fi_i ON fi_i.feed_id_i=fi_o.feed_id AND fi_i.item_id_i=fi_o.id
INNER JOIN feeds ON feeds.id=fi_o.feed_id";

$q=new DB_Query($sql,$uid,$uid,$uid);
$ret["items"]=array();
while($r=$q->fetch()) {
// $r["timestamp"]=null;
  if(isset($_GET["ignoreread"]) && $_GET["ignoreread"]=="true" && $r["timestamp"]!==null)
    continue;
  if($noContent) {
   $r["fulltext"]=sha1($r["fulltext"]);
   $r["scrape_fulltext"]=sha1($r["scrape_fulltext"]);
   $r["excerpt_copy"]=$r["excerpt"];
   $r["excerpt"]=sha1($r["excerpt"]);
  }
  $r["id"]=$r["id"]."-".$r["item_id"];
  unset($r["item_id"]);
  $ret["items"][]=$r;
}

$q=new DB_Query("SELECT COUNT(fi.id) as c from feed_items as fi INNER JOIN user_feeds AS uf on uf.feed_id=fi.feed_id WHERE uf.user_id=?",$uid);
$r=$q->fetch();
$total=$r["c"];
$ret["total"]=$total;
if($start+$len<$total)
  $ret["next"]=$start+$len;

$ret["remain"]=$total-$start-$len;
$ret["d"]=array("total"=>$total,"start"=>$start,"len"=>$len);

$ret["feed"]=array("id"=>"all","url"=>"","title"=>"all","desc"=>"","link"=>"","icon"=>"","ttl"=>0,"scrape_data"=>"","lastread"=>time(),"mostrecent_ts"=>0);