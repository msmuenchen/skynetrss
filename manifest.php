<?
//Prevent caching
header('Cache-Control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-Type: text/cache-manifest');

?>
CACHE MANIFEST

CACHE:

<?
$v=array();
exec("git ls-files js/*",$v);
exec("git ls-files assets/*",$v);
exec("git ls-files i18n/*",$v);
$v[]="index.php";
$v[]="app.css";
$v[]="js/sprintf.js/src/sprintf.js";

foreach($v as $f) {
  if(!is_file($f))
    continue;
  printf("#%s\n%s\n",md5_file($f),$f);
}
?>
SETTINGS:
prefer-online
NETWORK:
*
