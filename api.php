<?
header("Content-Type:application/json; charset=utf-8");

require("config.php");
require("rss.php");
require("DB.php");
require("DB_Query.php");

$ret=array();
$log="";
try {
  if(!isset($_GET["feed"]) || $_GET["feed"]=="")
    throw new Exception("Kein Feed angegeben");
  if(!isset($_GET["action"]) || $_GET["action"]=="")
    throw new Exception("Keine Aktion angegeben");
  $feed=$_GET["feed"];
  $action=$_GET["action"];
  switch($action) {
    case "add": //add new feed to DB
      require("api.add.php");
    break;
    case "update": //force update/DB load
      require("api.update.php");
    break;
    case "get":
      require("api.get.php");
    break;
    case "getfeeds":
      require("api.getfeeds.php");
    break;
    case "importgr":
      require("api.importgr.php");
    break;
    case "setreadstate":
      require("api.setreadstate.php");
    break;
    case "markallasread":
      require("api.markallasread.php");
    break;
    default:
      throw new Exception("Ungültige Aktion angegeben");
  }
  $ret["status"]="ok";
  $ret["message"]=$log;
} catch(Exception $e) {
  $ret["status"]="error";
  $ret["message"]=$e->getMessage();
  $ret["type"]=get_class($e);
}
echo json_encode($ret,JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP);
