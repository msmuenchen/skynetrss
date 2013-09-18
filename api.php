<?
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
      require("api/api.add.php");
    break;
    case "update": //force update/DB load
      require("api/api.update.php");
    break;
    case "get":
      require("api/api.get.php");
    break;
    case "getfeeds":
      require("api/api.getfeeds.php");
    break;
    case "importgr":
      require("api/api.importgr.php");
    break;
    case "setreadstate":
      require("api/api.setreadstate.php");
    break;
    case "markallasread":
      require("api/api.markallasread.php");
    break;
    case "login":
      require("api/api.login.php");
    break;
    case "logout":
      require("api/api.logout.php");
    break;
    case "getsession":
      require("api/api.getsession.php");
    break;
    case "unsubscribe":
      require("api/api.unsubscribe.php");
    break;
    case "changepwd":
      require("api/api.changepwd.php");
    break;
    case "discover":
      require("api/api.discover.php");
    break;
    case "updatesettings":
      require("api/api.updatesettings.php");
    break;
    case "library":
      require("api/api.library.php");
    break;
    case "createaccount":
      require("api/api.createaccount.php");
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
echo json_encode($ret,JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP);
