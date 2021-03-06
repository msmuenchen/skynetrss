<?
$ts_start=microtime(true);
ini_set("zlib.output_compression","on");
header("Content-Type:application/json; charset=utf-8");

require("core.php");

$ret=array();
$log="";
try {
  if(!isset($_GET["action"]) || $_GET["action"]=="")
    throw new APIMissingParameterException("Keine Aktion angegeben");
  $action=$_GET["action"];
  switch($action) { //check for certain actions if the parameter "feed" was supplied
    case "add":
    case "update":
    case "get":
    case "setreadstate":
    case "markallasread":
    case "unsubscribe":
      if(!isset($_GET["feed"]) || $_GET["feed"]=="")
        throw new APIWrongCallException("Kein Feed angegeben");
      $feed=$_GET["feed"];
    break;
  }
  
  switch($action) {
    case "add": //add new feed to DB
    case "update": //force update/DB load
    case "get":
    case "getfeeds":
    case "importgr":
    case "setreadstate":
    case "markallasread":
    case "login":
    case "logout":
    case "getsession":
    case "unsubscribe":
    case "changepwd":
    case "discover":
    case "updatesettings":
    case "library":
    case "createaccount":
    case "getnews":
    case "getsnacks":
    case "geticons":
      require("api/api.$action.php");
    break;
    case "onlinecheck":
      //this is a dummy action used to check if we're online or on appcache
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: text/cache-manifest');

    break;
    default:
      throw new APIWrongCallException("Ungültige Aktion angegeben");
  }
  $ret["status"]="ok";
  $ret["message"]=$log;
} catch(Exception $e) {
  $ret["status"]="error";
  $ret["message"]=$e->getMessage();
  $ret["type"]=get_class($e);
}
$ts_end=microtime(true);
$ret["rt"]=$ts_end-$ts_start;
echo pretty_json(json_encode($ret,JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP));
