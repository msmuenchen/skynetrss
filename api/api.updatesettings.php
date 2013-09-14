<?
session_start();
if(!isset($_SESSION["user"]))
  $uid=0;
else
  $uid=$_SESSION["user"]["id"];

if($uid==0)
  throw new PermissionDeniedException();

$settings=$_GET;
unset($settings["action"]);

foreach($settings as $k=>$v) {
  $q=new DB_Query("insert into user_settings (user_id,settings_key,settings_val) values (?,?,?) on duplicate key update settings_val=?",$uid,$k,$v,$v);
}