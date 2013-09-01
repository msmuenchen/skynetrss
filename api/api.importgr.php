<?
if(!isset($_POST["data"]))
  throw new Exception("No data given");
$ret["xmldata"]=$_POST["data"];

libxml_use_internal_errors(true);
$xml=simplexml_load_string($_POST["data"]);
if($xml===false) {
  $estr="";
  foreach (libxml_get_errors() as $error) {
    $estr.=print_r($error,true);
  }
  libxml_clear_errors();
  $ret["sxml_return"]=$estr;
  throw new Exception("XML-Fehler");
}


if(!property_exists($xml,"body") || !property_exists($xml->body,"outline"))
  throw new Exception("XML-Formatfehler");

$log="Starting XML read\n";

$ret["feeds"]=array();
$invalid=0;
$i=0;
foreach($xml->body->outline as $feed) {
  $i++;
  $attrs=$feed->attributes();
  $log.="Feed $i (".$attrs->xmlUrl."):\n";
  if($attrs->type!="rss") {
    $log.="Skipped, format invalid(".$attrs->type.")\n";
    $invalid++;
    continue;
  }
  $feedUrl=(string)$attrs->xmlUrl;
  $ret["feeds"][]=$feedUrl;
  
}

$log.="Total $i feeds, invalid $invalid\n";
$ret["total"]=$i;
$ret["invalid"]=$invalid;