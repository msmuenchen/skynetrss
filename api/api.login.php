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
if($q->numRows!=1)
  throw new LoginException("Benutzername existiert nicht");

$row=$q->fetch();
if(strpos($row["password"],":")===FALSE)
  $p="0:1:md5:".$row["password"].":";
else
  $p=$row["password"];

list($version,$iterations,$alg,$hash,$salt)=explode(":",$p);
//check password
if($hash!=hash($alg,$pass.$salt))
  throw new LoginException("Passwort falsch");
//check if account is active
if($row["is_active"]!=1)
  throw new LoginException("Account nicht aktiv");

$_SESSION["user"]=$row;

//check if the password is a md5-only password (reset by directly editing the DB)
if($p!=$row["password"]) {
  $u=User::getById($row["id"]);
  $u->password=$pass;
  $u->commit();
}

//set last-login time
$ts=time();
$q=new DB_Query("update users set lastlogin=? where id=?",$ts,$row["id"]);

$ret["user"]=$row;
$ret["sid"]=session_id();
$ret["login"]="ok";
} catch(LoginException $e) {
  $ret["login"]="error";
  $ret["msg"]=$e->getMessage();
}
