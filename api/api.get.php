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

if($feed=="all") {
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
} else if($feed=="starred") {
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
 fi_i.star_timestamp
 FROM feed_items AS fi_o
 JOIN
 (SELECT
 fs_i.feed_id AS feed_id_i,
 fs_i.item_id AS item_id_i,
 fs_i.timestamp AS star_timestamp
 FROM `feed_stars` as fs_i
 INNER JOIN feed_items
 AS fi_i2 
 ON
 fi_i2.id=fs_i.item_id AND
 fi_i2.feed_id=fs_i.feed_id
 WHERE fs_i.user_id=?
 ORDER BY fi_i2.time $order
 LIMIT $start,$len
 ) AS fi_i ON fi_i.feed_id_i=fi_o.feed_id AND fi_i.item_id_i=fi_o.id
 INNER JOIN feeds ON feeds.id=fi_o.feed_id";
 $q=new DB_Query($sql,$uid,$uid);
} else {
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
}

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
  if($feed=="all"||$feed=="starred") {
   $r["id"]=$r["id"]."-".$r["item_id"];
   unset($r["item_id"]);
  }
  $ret["items"][]=$r;
}

//get total items
if($feed=="all") {
 $q=new DB_Query("SELECT COUNT(fi.id) as c from feed_items as fi INNER JOIN user_feeds AS uf on uf.feed_id=fi.feed_id WHERE uf.user_id=?",$uid);
} else if($feed=="starred") {
 $q=new DB_Query("SELECT COUNT(item_id) as c FROM feed_stars WHERE user_id=?",$uid);
} else {
 $q=new DB_Query("SELECT COUNT(DISTINCT id) as c
                 FROM feed_items AS fi
                 LEFT JOIN feed_read AS fr ON fr.item_id=fi.id AND fr.feed_id=fi.feed_id AND fr.user_id=?
                 WHERE fi.feed_id=?",$uid,$feed);
}
$r=$q->fetch();
$total=$r["c"];
$ret["total"]=$total;
if($start+$len<$total)
  $ret["next"]=$start+$len;

$ret["remain"]=$total-$start-$len;
$ret["d"]=array("total"=>$total,"start"=>$start,"len"=>$len);

if($feed=="all")
 $ret["feed"]=array("id"=>"all","url"=>"","title"=>"_all","desc"=>"","link"=>"","icon"=>"","ttl"=>0,"scrape_data"=>"","lastread"=>time(),"mostrecent_ts"=>0);
else if($feed=="starred")
 $ret["feed"]=array("id"=>"starred","url"=>"","title"=>"_starred","desc"=>"","link"=>"","icon"=>"","ttl"=>0,"scrape_data"=>"","lastread"=>time(),"mostrecent_ts"=>0);
