<?
if(!isset($_GET["lang"]))
  throw new APIWrongCallException("missing LANG parameter");

$lang=$_GET["lang"];
$q=new DB_Query("select * from news where lang=? limit 0,10;",$lang);
$ret["items"]=array();
while($r=$q->fetch()) {
  $ret["items"][]=$r;
}
