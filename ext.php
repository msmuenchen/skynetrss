<?
require("core.php");
$ok=true; //set to false and the html will output an error...
try {
  if(!isset($_GET["f"]))
    throw new Exception("Parameter f not specified");
  $f=(int)$_GET["f"];
  if(!isset($_GET["i"]))
    throw new Exception("Parameter i not specified");
  $i=(int)$_GET["i"];
  $q=new DB_Query("select * from feed_items where feed_id=? and id=?",$f,$i);
  if($q->numRows!=1)
    throw new Exception("Item not found");
  $r=$q->fetch();
  $link=$config["url"]["defaultscheme"]."://".$config["url"]["host"].$config["url"]["base"]."#feed/$f/$i";
} catch (Exception $e) {
  $ok=false;
}
function e($c) {
  return htmlentities($c,ENT_QUOTES,"UTF-8");
}
?><!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="google" value="notranslate" />
    <title><?= $config["site"]["name"] ?></title>
<?
if($ok==true) {
?>
    <meta property="og:type" content="website" />
    <meta property="og:title" content="<?=e($r["title"])?>" />
    <meta property="og:site_name" content="<?=e($config["site"]["name"])?>" />
    <meta property="og:description" content="<?=e($r["excerpt"])?>" />
    <meta property="fb:app_id" content="<?=e($config["facebook"]["app_id"])?>" />
    <meta property="og:updated_time" content="<?=e($r["time"])?>">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:url" content="<?=e($link)?>" />
    <meta name="twitter:title" content="<?=e($r["title"])?>" />
    <meta name="twitter:description" content="<?=e($r["excerpt"])?>" />
<?
}
?>
  </head>
  <body>
<?
  if($ok==true) {
?>
    You'll be redirected to the item... click <a href="<?=e($link);?>">here</a> if not.
    <script type="text/javascript">
location.href=<?=json_encode($link,JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP);?>;
    </script>
<?
  } else {
?>
    Error: <?= $e->getMessage() ?>
<?
  }
?>
  </body>
</html>