<?

session_start();

if(isset($_SESSION["user"]))
  $ret["user"]=$_SESSION["user"];

$ret["sid"]=session_id();
