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
exec("git ls-files css/*",$v);
$v[]="index.php";
$v[]="js/sprintf.js/src/sprintf.js";
$v[]="config.js";
$v[]="js/polyfill.js/srcdoc-polyfill.js";
$v[]="js/IndexedDBShim/dist/IndexedDBShim.js";
$v[]="js/jquery-indexeddb/dist/jquery.indexeddb.js";
$v[]="js/rusha.js/rusha.js";
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
