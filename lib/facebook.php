<?
require("../config.php");
require("../orm.php");
session_start();

$step=(isset($_GET["step"]))?((int)$_GET["step"]):0;
$myurl = (isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/lib/facebook.php";

switch($step) {
  case 0:
    $url=sprintf("https://facebook.com/dialog/oauth?client_id=%s&redirect_uri=%s&display=page",$config["facebook"]["app_id"],urlencode($myurl."?step=1"));
    header("HTTP/1.1 307 Temporary Redirect");
    header("Location: $url");
  break;
  case 1:
    if(!isset($_GET["code"])) { //user clicked cancel
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    //verify the codetoken
    $req=@file_get_contents(sprintf("https://graph.facebook.com/oauth/access_token?client_id=%s&redirect_uri=%s&client_secret=%s&code=%s",$config["facebook"]["app_id"],urlencode($myurl."?step=1"),$config["facebook"]["app_secret"],urlencode($_GET["code"])));
    if($req===false) { //fb error
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    $vals=array();
    parse_str($req,$vals);
    if(!isset($vals["access_token"])) {
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    $clientAccessToken=$vals["access_token"];
    
    //get an app token
    $req=@file_get_contents(sprintf("https://graph.facebook.com/oauth/access_token?client_id=%s&client_secret=%s&grant_type=client_credentials",$config["facebook"]["app_id"],$config["facebook"]["app_secret"]));
    if($req===false) { //fb error
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    $vals=array();
    parse_str($req,$vals);
    if(!isset($vals["access_token"])) {
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    $appAccessToken=$vals["access_token"];
    
    //inspect if the token is valid
    $req=@file_get_contents(sprintf("https://graph.facebook.com/debug_token?input_token=%s&access_token=%s",urlencode($clientAccessToken),urlencode($appAccessToken)));
    if($req===false) { //fb error
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    $clientTokenData=json_decode($req);
    if($clientTokenData==false) { //fb error
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    //now, check if the data embedded in the token tells that it belongs to our app
    if(!property_exists($clientTokenData,"data") || !property_exists($clientTokenData->data,"app_id") || $clientTokenData->data->app_id!=$config["facebook"]["app_id"]) {
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    
    //now, get the user details
    $req=@file_get_contents(sprintf("https://graph.facebook.com/%s?access_token=%s",urlencode($clientTokenData->data->user_id),urlencode($clientAccessToken)));
    if($req===false) { //fb error
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    $userData=json_decode($req);
    if($userData==false) { //fb error
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }

    //we trust FB to not inject us with shit
    $u=User::getByFilter("WHERE source='facebook' and ext_uid='".$userData->id."'");
    if(sizeof($u)==0) { //create
      $u=User::fromScratch();
      $u->source="facebook";
      $u->name="FB ".$userData->name;
      $u->ext_uid=$userData->id;
      $u->ext_data=serialize(array("token"=>$clientAccessToken));
      $u->is_active=0;
      $u->commit();
    } else { //update
      $u=$u[0];
      $u->ext_data=serialize(array("token"=>$clientAccessToken));
      $u->commit();
    }
    $q=new DB_Query("select * from users where id=?",$u->id);
    $_SESSION["user"]=$q->fetch();
    header("HTTP/1.1 307 Temporary Redirect");
    header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
  break;
}
