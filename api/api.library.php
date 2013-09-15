<?
$q=new DB_Query("select feeds.id,feeds.title,feeds.desc,feeds.url,feed_tags.tag,(select count(distinct user_id) from user_feeds where user_feeds.feed_id=feeds.id) as subscriber_count from feed_tags left join feeds on feeds.id=feed_id");
$tags=array();
$tags_size=array();

while($r=$q->fetch()) {
  if(!isset($tags[$r["tag"]])) {
    $tags[$r["tag"]]=array();
    $tags_size[$r["tag"]]=0;
  }
  $tags[$r["tag"]][]=$r;
  $tags_size[$r["tag"]]++;
}

arsort($tags_size);
$ret["tags"]=array();
foreach($tags_size as $tag=>$els) {
  usort($tags[$tag],function($a,$b) {
    if($a["subscriber_count"]>$b["subscriber_count"])
      return -1;
    elseif($a["subscriber_count"]==$b["subscriber_count"])
      return 0;
    elseif($a["subscriber_count"]<$b["subscriber_count"])
      return 1;
  });
  $ret["tags"][$tag]=$tags[$tag];
}
