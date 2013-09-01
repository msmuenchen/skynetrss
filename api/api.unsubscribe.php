<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

if($uid==0)
  throw new PermissionDeniedException();

$q=new DB_Query("select * from user_feeds where user_id=? and feed_id=?",$uid,$feed);
if($q->numRows==0) {
  $ret["affected"]=0;
  $ret["res"]="notSubscribed";
} elseif($q->numRows==1) {
  $q=new DB_Query("delete from user_feeds where user_id=? and feed_id=?",$uid,$feed);
  $ret["affected"]=$q->affectedRows;
  $ret["res"]="unsubscribed";
} else {
  throw new Exception("SQL-Fehler: Feed mehrfach vorhanden!");
}
