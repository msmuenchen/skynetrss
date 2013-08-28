<?
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
$len=20;
if(isset($_GET["len"])) {
  $len=(int)$_GET["len"];
}


$q=new DB_Query("select * from feeds where id=?",$feed);
if($q->numRows!=1)
  throw new Exception("Feed ID invalid");

$fdata=$q->fetch();
$ret["feed"]=$fdata;

$sql="select fi.*,fr.timestamp FROM `feed_items` as fi left join feed_read as fr on fr.feed_id=fi.feed_id and fr.item_id=fi.id where fi.feed_id=? ";
if(isset($_GET["noshowread"]))
  $sql.="and fr.timestamp is null ";
$sql.="order by time $order limit $start,$len;";
$ret["msg"]=$sql;
$q=new DB_Query($sql,$feed);
$ret["items"]=array();
while($r=$q->fetch()) {
  $ret["items"][]=$r;
}

$q=new DB_Query("select count(id) as c from feed_items where feed_id=? order by time $order",$feed);
$r=$q->fetch();
$total=$r["c"];
$ret["total"]=$total;
if($start+$len<$total)
  $ret["next"]=$start+$len;

$ret["remain"]=$total-$start-$len;
$ret["d"]=array("total"=>$total,"start"=>$start,"len"=>$len);