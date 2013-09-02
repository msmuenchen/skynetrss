<?
require("config.php");
require("DB.php");
require("DB_Query.php");
require("rss.php");

$q=new DB_Query("select * from feeds where lastread<(UNIX_TIMESTAMP(NOW())-(ttl*60))");
//$q=new DB_Query("select * from feeds where scrape_elementid!=''");
echo "Got ".$q->numRows." feeds\n";

while($r=$q->fetch()) {
  echo "Updating ".$r["url"]."\n";
  $log="Feed: ".$r["url"]."\n";
  $success=0;
  try {
    updateFeed($r["id"]);
    $log.="Done\n";
    $success=1;
  } catch(Exception $e) {
    $log.="Error ".get_class($e).": ".$e->getMessage()."\n";
  }
  
  $q2=new DB_Query("insert into feed_runs set feed_id=?,timestamp=UNIX_TIMESTAMP(NOW()),data=?,success=?",$r["id"],$log,$success);
  echo "Done\n";
}
echo "Done with feeds\n";