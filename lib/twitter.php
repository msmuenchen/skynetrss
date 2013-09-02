<?
require("twitteroauth/twitteroauth/twitteroauth.php");
require("../config.php");
require("../orm.php");
session_start();

$step=(isset($_GET["step"]))?((int)$_GET["step"]):0;
$myurl = (isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/lib/twitter.php";

switch($step) {
  case 0:
    $toa=new TwitterOAuth($config["twitter"]["consumer_key"],$config["twitter"]["consumer_secret"]);
    $request_token = $toa->getRequestToken($myurl."?step=1");
    $_SESSION['oauth_token'] = $request_token['oauth_token'];
    $_SESSION['oauth_token_secret'] = $request_token['oauth_token_secret'];
    if($toa->http_code==200) {
      $url = $toa->getAuthorizeURL($request_token['oauth_token']);
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: $url");
    } else {
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
    }
  break;
  case 1:
    if(empty($_GET['oauth_verifier']) || empty($_SESSION['oauth_token']) || empty($_SESSION['oauth_token_secret'])) {
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: $myurl?step=0");
      break;
    }
    $toa=new TwitterOAuth($config["twitter"]["consumer_key"],$config["twitter"]["consumer_secret"],$_SESSION['oauth_token'],$_SESSION['oauth_token_secret']);
    $access_token = $toa->getAccessToken($_GET['oauth_verifier']);
    $_SESSION['access_token'] = $access_token;
    $user_info = $toa->get('account/verify_credentials');
    if(property_exists($user_info,"errors")) {
      header("HTTP/1.1 307 Temporary Redirect");
      header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
      exit(1);
    }
    //we trust twitter to not inject us with shit
    $u=User::getByFilter("WHERE source='twitter' and ext_uid='".$user_info->id."'");
    if(sizeof($u)==0) { //create
      $u=User::fromScratch();
      $u->source="twitter";
      $u->name="Twitter @".$user_info->screen_name;
      $u->ext_uid=$user_info->id;
      $u->ext_data=serialize(array("token"=>$access_token["oauth_token"],"token_secret"=>$access_token["oauth_token_secret"]));
      $u->is_active=0;
      $u->commit();
    } else { //update
      $u=$u[0];
      $u->ext_data=serialize(array("token"=>$access_token["oauth_token"],"token_secret"=>$access_token["oauth_token_secret"]));
      $u->commit();
    }
    $q=new DB_Query("select * from users where id=?",$u->id);
    $_SESSION["user"]=$q->fetch();
    header("HTTP/1.1 307 Temporary Redirect");
    header("Location: ".(isset($_SERVER['HTTPS']) ? "https://" : "http://") . $config["url"]["host"] . $config["url"]["base"] . "/index.php");
  break;
}
