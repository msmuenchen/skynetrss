<?
require("orm.php");
session_start(); //only after all classes have loaded
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

if($uid==0)
  throw new PermissionDeniedException();

if(!isset($_GET["password"]) || $_GET["password"]=="")
 throw new APIWrongCallException("Kein Passwort angegeben");

$pass=$_GET["password"];

$u=User::getById($uid);
$u->password=$pass;
$u->commit();
