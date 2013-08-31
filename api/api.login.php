<?
require("orm.php");
session_start(); //only after all classes have loaded

if(!isset($_GET["username"]) || $_GET["username"]=="")
 throw new APIWrongCallException("Kein Benutzername angegeben");
if(!isset($_GET["password"]) || $_GET["password"]=="")
 throw new APIWrongCallException("Kein Passwort angegeben");

$user=$_GET["username"];
$pass=$_GET["password"];

$q=new DB_Query("select * from users where name=?",$user);
if($q->numRows!=1)
  throw new Exception("Benutzername existiert nicht");

$row=$q->fetch();
if(strpos($row["password"],":")===FALSE)
  $p="0:1:md5:".$row["password"].":";
else
  $p=$row["password"];

list($version,$iterations,$alg,$hash,$salt)=explode(":",$p);
//check password
if($hash!=hash($alg,$pass.$salt))
  throw new Exception("Passwort falsch");
//check if account is active
if($row["is_active"]!=1)
  throw new Exception("Account nicht aktiv");

$_SESSION["user"]=$row;

//check if the password is a md5-only password (reset by directly editing the DB)
if($p!=$row["password"]) {
  $u=User::getById($row["id"]);
  $u->password=$pass;
  $u->commit();
}

$ret["user"]=$row;
$ret["sid"]=session_id();