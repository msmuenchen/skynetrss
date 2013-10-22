<?
require("core.php");

if(!isset($argv[1]))
  die("did not specify feed id\n");

$q=new DB_Query("select * from feeds where id=?",(int)$argv[1]);
echo "Got ".$q->numRows." feeds\n";
if($q->numRows!=1)
  die("feed not found\n");

$r=$q->fetch();
echo "Updating ".$r["url"]."\n";
$log="Feed: ".$r["url"]."\n";
$success=0;
try {
  $log.=updateFeed($r["id"]);
  $log.="Done\n";
  $success=1;
} catch(Exception $e) {
  $log.="Error ".get_class($e).": ".$e->getMessage()."\n";
}
echo $log;
echo "Done with feeds\n";