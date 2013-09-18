<?
require("orm.php");
session_start(); //only after all classes have loaded

if(!isset($_GET["username"]) || $_GET["username"]=="")
 throw new APIWrongCallException("Kein Benutzername angegeben");
if(!isset($_GET["password"]) || $_GET["password"]=="")
 throw new APIWrongCallException("Kein Passwort angegeben");

$user=$_GET["username"];
$pass=$_GET["password"];

try {
  $q=new DB_Query("select * from users where name=?",$user);
  if($q->numRows!=0)
    throw new LoginException("Benutzername existiert bereits");

  $u=User::fromScratch();
  $u->name=$user;
  $u->is_active=1;
  $u->password=$pass;
  $u->commit();
  $id=$u->id;
  if(!$id)
    throw new LoginException("Konnte Account nicht anlegen");
  
  $q=new DB_Query("select * from users where id=?",$id);
  if($q->numRows!=1)
    throw new LoginException("Konnte Account nicht anlegen");
  $row=$q->fetch();
  $_SESSION["user"]=$row;
  $ret["user"]=$row;
  $ret["sid"]=session_id();
  $ret["login"]="ok";
} catch(LoginException $e) {
  $ret["login"]="error";
  $ret["msg"]=$e->getMessage();
}