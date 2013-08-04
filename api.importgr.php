<?
if(!isset($_POST["data"]))
  throw new Exception("No data given");

libxml_use_internal_errors(true);
$xml=simplexml_load_string($_POST["data"]);
if($xml===false) {
  $estr="XML-Fehler im Feed $feed:<br /><pre>";
  foreach (libxml_get_errors() as $error) {
    $estr.=print_r($error,true);
  }
  libxml_clear_errors();
  $estr.="</pre>";
  throw new Exception($estr);
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