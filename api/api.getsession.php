<?

session_start();

//get the default settings
$q=new DB_Query("select * from user_settings where user_id=0");
$ret["default_settings"]=array();
$skeys=array();
while($r=$q->fetch()) {
  $skeys[]=$r["settings_key"];
  $ret["default_settings"][$r["settings_key"]]=$r["settings_val"];
}

if(isset($_SESSION["user"])) {
  $ret["user"]=$_SESSION["user"];

  $q=new DB_Query("select * from user_settings where user_id=?",$_SESSION["user"]["id"]);
  $ret["user_settings"]=array();
  while($r=$q->fetch())
    $ret["user_settings"][$r["settings_key"]]=$r["settings_val"];
  foreach($skeys as $k) {
    if(!isset($ret["user_settings"][$k]))
      $ret["user_settings"][$k]=$ret["default_settings"][$k];
  }
} else {
  $ret["user_settings"]=$ret["default_settings"];
}
$ret["sid"]=session_id();

